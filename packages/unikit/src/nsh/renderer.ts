/// <reference path="./nsh-rt.d.ts" />
/**
 * React-on-nsh 렌더러 — React 19(react-reconciler)를 nsh(Native Shell)의
 * 네이티브 뷰 트리로 구동하는 호스트 설정. `@unikit-bridge/ui/nsh` 진입점의
 * 심장이고, 브리지(src/bridge/nsh.tsx)가 내는 소문자 호스트 태그
 * (view·text·input·image·scroll·canvas·overlay)를 nsh 호스트 노드로 만든다.
 *
 * 아키텍처 판단(2026-11 사이클 — docs/sdd 참조):
 * - nsh는 Solid형 자체 런타임(시그널)이라 React 컴포넌트가 직접 돌지 않는다.
 *   대신 nsh:rt(내부 렌더 프리미티브 — element/append/insert/prop)가 앱 코드에도
 *   열려 있어(실측) react-reconciler의 호스트 설정을 얹을 수 있다. React와
 *   react-reconciler는 순수 JS라 QuickJS에서 그대로 돈다(실측 — 렌더·이벤트·
 *   상태 갱신·조건부 언마운트까지 헤드리스 통과).
 * - nsh 번들러는 package.json exports에서 `default` 조건만 본다(브리지 조건
 *   분기 불가 — 실측). 그래서 이 진입점은 사전 번들(dist/nsh.mjs)로 배포되고,
 *   앱은 `@unikit-bridge/ui/nsh`로 소비한다. 컴포넌트 62종 소스는 그대로 한 벌.
 *
 * 호스트 연산의 nsh 대응(전부 longbridge/nsh 0.6.1 소스 기준):
 * - createInstance → rt.element(태그) + prop 적용
 * - appendChild/insertBefore → rt.append / rt.insert(이미 부모가 있으면 이동 —
 *   insert가 기존 부모에서 떼어 낸다)
 * - removeChild → rt.append(GRAVEYARD, 자식): nsh:rt에 제거 연산이 없어(공개
 *   exports에 remove 없음) 떨어진 뷰(graveyard)로 이동시켜 트리에서 뗀다. 노드는
 *   GC가 회수하고 네이티브 뷰가 해제된다(dom.rs — 재삽입도 안전).
 * - commitTextUpdate → 텍스트 노드 교체: 텍스트 내용을 다시 쓰는 공개 연산이
 *   없어(동적 텍스트는 반응형이 담당) 새 텍스트 노드를 만들어 옆에 끼우고 옛
 *   것을 graveyard로 보낸다. 부모는 우리 호스트 메서드가 모두 거치므로
 *   WeakMap으로 추적한다.
 * - commitUpdate → 바뀐 prop만 rt.prop(즉시 적용 — set_prop이 이벤트 핸들러와
 *   class·role·상태 prop을 모두 소비).
 *
 * 한계(로드맵 — 머리 주석 계약):
 * - React 개발 빌드가 흘리는 내부 prop(_debugTask 등)은 경고를 끄기 위해
 *   이름으로 걸러낸다. 프로덕션 번들에서는 아예 발생하지 않는다.
 * - ConcurrentRoot 승급·전환 우선순위는 로드맵. 현재 LegacyRoot(실측 통과 값).
 */
import * as React from "react";
import Reconciler from "react-reconciler";
import { Canvas, mount as nshMount } from "nsh";
import { append, component, element, insert, prop, text, type NshNode } from "nsh:rt";

/** React 개발 빌드가 호스트 인스턴스에 흘리는 내부 prop — 호스트에 내려가면
 *  nsh가 "unsupported prop" 경고를 냈다(실측). 이름으로 거른다. */
const REACT_INTERNAL_PROPS = new Set([
  "key",
  "ref",
  "children",
  "_debugTask",
  "_debugNeedsRemount",
  "_debugHookTypes",
  "_owner",
  "_store",
  "__self",
  "__source",
]);

/** 이 뷰에서 떨어진 노드를 모으는 무명 뷰 — 트리에 붙지 않는다(제거 연산 대체).
 *  `componentSlot` 표시는 교체된 텍스트 노드가 여기로 옮겨질 때 nsh가 “view에
 *  문자열” 경고를 내지 않게 하는 것다(dom.rs places 비트 — 슬롯 컨테이너가
 *  자식을 스스로 배치한다는 표시, 등록 컴포넌트를 요구하지 않는다). */
const GRAVEYARD: NshNode = element("view");
prop(GRAVEYARD, "componentSlot", "unikit-graveyard");

/** 텍스트 노드 교체에 쓰는 부모 추적 — 호스트 메서드가 부모를 모두 거친다. */
const PARENT = new WeakMap<object, NshNode>();

/** 같은 텍스트 fiber의 반복 갱신 추적 — reconciler는 매 갱신마다 최초
 *  인스턴스(node)를 다시 전달하고 반환값을 못 쓴다(번들 호출부 실측 —
 *  stateNode가 그대로다). 교체 후에는 원본이 이미 graveyard에 있으므로,
 *  현재 살아 있는 노드를 별도로 기억해 before 자리에 넣는다(카운터 2회
 *  press 등 텍스트 fiber당 갱신 2회 이상에서 발화 — 독립 리뷰 P2 지적). */
const LIVE = new WeakMap<object, NshNode>();

/** 노드의 현재 생존 인스턴스 — 갱신 이력이 없으면 자기 자신. reconciler는
 *  텍스트 fiber의 stateNode를 교체 후에도 최초 인스턴스로 유지하므로(실측),
 *  이동·제거·앵커 삽입은 모두 이 값으로 라우팅해야 retired 노드가 트리에
 *  남거나 앵커로 쓰이지 않는다(독립 리뷰 2차 P2). */
function liveOf(node: NshNode): NshNode {
  return LIVE.get(node) ?? node;
}

/** rt.prop 채널로 못 내리는 prop — 생성 시에만 소비된다(canvas의 draw). */
const COMPONENT_ONLY_PROPS = new Set(["draw"]);

/** prop을 node에 즉시 반영한다. undefined는 null로(nsh는 null을 해제로 본다). */
function applyProps(
  node: NshNode,
  next: Record<string, unknown>,
  prev: Record<string, unknown>,
): void {
  for (const key of Object.keys(next)) {
    if (REACT_INTERNAL_PROPS.has(key) || COMPONENT_ONLY_PROPS.has(key)) continue;
    const value = next[key];
    if (value === prev[key]) continue;
    prop(node, key, value === undefined ? null : value);
  }
  for (const key of Object.keys(prev)) {
    if (
      REACT_INTERNAL_PROPS.has(key) ||
      COMPONENT_ONLY_PROPS.has(key) ||
      key in next
    )
      continue;
    prop(node, key, null);
  }
}
// 호스트 설정 — 멤버 구조의 유일한 진실은 이 객체다(타입 계약은 nsh-env.d.ts의
// react-reconciler 선언, 근거는 각 판단의 주석).

const hostConfig = {
  getRootHostContext: () => ({} as Record<string, never>),
  getChildHostContext: (context: Record<string, never>) => context,
  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  preparePortalMount: () => {},
  createInstance: (type: string, hostProps: Record<string, unknown>) => {
    // canvas의 draw는 rt.prop이 못 내린다("unsupported prop draw" — 실측).
    // nsh/canvas의 Canvas 컴포넌트가 생성 시에 소비한다(기록형 컨텍스트로
    // 그림을 기록 → 네이티브가 재생). 그래서 draw가 있는 canvas는 컴포넌트로
    // 만들고, 이후 갱신은 class·style만 prop 채널로 간다.
    if (type === "canvas" && typeof hostProps.draw === "function") {
      return component(
        Canvas as unknown as (props: Record<string, unknown>) => NshNode,
        hostProps,
      );
    }
    const node = element(type);
    applyProps(node, hostProps, {});
    return node;
  },
  createTextInstance: (content: string) => text(content),
  appendInitialChild: (parent: NshNode, child: NshNode) => {
    PARENT.set(child, parent);
    append(parent, child);
  },
  finalizeInitialChildren: () => false,
  // React 19.3 reconciler는 prepareUpdate를 호출하지 않는다(커밋 시점 props diff —
  // dist/nsh.mjs 번들 내 prepareUpdate 호출부 부재로 실측). 타입 계약상 존재만 유지.
  prepareUpdate: () => [],
  shouldSetTextContent: () => false,
  getPublicInstance: (instance: NshNode) => instance,
  prepareScopeUpdate: () => {},
  getInstanceFromScope: () => null,
  getInstanceFromNode: () => null,
  scheduleTimeout: (callback: () => void, ms: number) =>
    setTimeout(callback, ms) as unknown as number,
  cancelTimeout: (handle: number) => clearTimeout(handle),
  noTimeout: -1,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  appendChild: (parent: NshNode, child: NshNode) => {
    const live = liveOf(child);
    PARENT.set(live, parent);
    append(parent, live);
  },
  appendChildToContainer: (container: NshNode, child: NshNode) => {
    const live = liveOf(child);
    PARENT.set(live, container);
    append(container, live);
  },
  insertBefore: (parent: NshNode, child: NshNode, before: NshNode) => {
    const live = liveOf(child);
    PARENT.set(live, parent);
    insert(parent, live, liveOf(before));
  },
  insertInContainerBefore: (container: NshNode, child: NshNode, before: NshNode) => {
    const live = liveOf(child);
    PARENT.set(live, container);
    insert(container, live, liveOf(before));
  },
  removeChild: (_parent: NshNode, child: NshNode) => {
    // reconciler는 stateNode(최초 인스턴스)만 넘긴다 — 갱신 이력이 있으면
    // live 노드가 별도로 존재하므로 둘 다 graveyard로 보내 트리에 남지
    // 않게 한다(독립 리뷰 2차 P2 — getHostSibling 앵커 잔류와 같은 근원).
    append(GRAVEYARD, liveOf(child));
    append(GRAVEYARD, child);
    LIVE.delete(child);
  },
  removeChildFromContainer: (_container: NshNode, child: NshNode) => {
    append(GRAVEYARD, liveOf(child));
    append(GRAVEYARD, child);
    LIVE.delete(child);
  },
  resetTextContent: () => {},
  commitTextUpdate: (node: NshNode, oldText: string, newText: string) => {
    if (oldText === newText) return;
    const parent = PARENT.get(node);
    if (!parent) return;
    const anchor = LIVE.get(node) ?? node;
    const next = text(newText);
    insert(parent, next, anchor);
    append(GRAVEYARD, anchor);
    PARENT.set(next, parent);
    LIVE.set(node, next);
  },
  commitMount: () => {},
  // React 19.3 계약: commitUpdate(instance, type, oldProps, newProps, finishedWork) —
  // updatePayload 인자가 없다(번들 내 호출부 `commitUpdate, finishedWork.stateNode,
  // finishedWork.type, oldProps, newProps, finishedWork` 실측). legacy 5인자
  // (instance, payload, type, old, new)로 읽으면 finishedWork(fiber)가 newProps
  // 자리에 들어와 fiber 내부 필드가 props로 세팅되어 호스트가 오염된다.
  commitUpdate: (
    node: NshNode,
    _type: string,
    oldProps: Record<string, unknown>,
    newProps: Record<string, unknown>,
    _finishedWork?: unknown,
  ) => {
    applyProps(node, newProps, oldProps);
  },
  hideInstance: () => {},
  hideTextInstance: () => {},
  unhideInstance: () => {},
  unhideTextInstance: () => {},
  clearContainer: () => {},
  // ── React 19 스케줄러·우선순위 계약(최소 안정 구성 — 실측 통과 값) ──
  getCurrentEventPriority: () => 32,
  resolveUpdatePriority: () => 32,
  setCurrentUpdatePriority: () => {},
  getCurrentUpdatePriority: () => 32,
  trackSchedulerEvent: () => {},
  resolveEventType: () => null,
  resolveEventTimeStamp: () => -1.1,
  shouldAttemptEagerTransition: () => false,
  scheduleMicrotask: (callback: () => void) => queueMicrotask(callback),
  detachDeletedInstance: () => {},
  maySuspendCommit: () => false,
  preloadInstance: () => {},
  startSuspendingCommit: () => {},
  suspendInstance: () => {},
  waitForCommitToBeReady: () => null,
  NotPendingTransition: null,
  HostTransitionContext: null,
};

const reconciler = Reconciler(hostConfig);

/**
 * React 엘리먼트를 nsh 뷰 노드로 구운다 — nsh 앱의 루트 컴포넌트에서 호출한다.
 *
 * ```tsx
 * import { el, renderNsh, Button } from "@unikit-bridge/ui/nsh";
 * import { mount } from "nsh";
 * function App() {
 *   return renderNsh(el(Button, { onPress: () => {} }, "누르기"));
 * }
 * mount(App);
 * ```
 *
 * 반환 노드를 nsh 컴포넌트가 그대로 돌려주면 React 트리 전체가 그 자리에
 * 렌더된다(마운트 시 flushSync로 초기 트리를 동기 완성한다 — open() 직후
 * app.texts() 동기 조회가 성립하는 근거). 상태 갱신·이벤트는 React 스케줄러가
 * 반영한다(실측).
 */
export function renderNsh(app: React.ReactElement): NshNode {
  const container: NshNode = element("view");
  const fiberRoot = reconciler.createContainer(
    container,
    0, // LegacyRoot — 안정 구성(실측). ConcurrentRoot 승급은 로드맵.
    null,
    false,
    null,
    "",
    (error: unknown) => {
      console.error(error);
    },
    null,
  );
  reconciler.updateContainer(app, fiberRoot, null, null);
  // react-reconciler 0.34 공개면에는 flushSync가 없다(react-dom 소유) — 보류
  // 작업의 동기 배수는 flushSyncWork로, 없으면 스케줄러 틱에 맡긴다(프로브
  // 실측 통과 경로 — LegacyRoot 업데이트는 즉시 태스크로 스케줄된다).
  reconciler.flushSyncWork?.();
  return container;
}

/**
 * React 엘리먼트를 nsh 앱으로 올린다 — 소비 앱의 마지막 줄(`mountNsh(() => el(...))`).
 * nsh의 mount에 () => renderNsh(build) 컴포넌트를 넘긴다(앱 소스가 nsh의
 * Component·Element 타입과 직접 마주하지 않게 — 진입점 단일 계약). */
export function mountNsh(build: () => React.ReactElement): void {
  nshMount(() => renderNsh(build()));
}

/**
 * nsh 앱에서 React 엘리먼트를 조립하는 createElement — nsh JSX 컴파일러가 앱
 * 소스의 소문자 태그를 거부하므로(실측), React 트리는 이 함수로 짠다.
 */
export const el = React.createElement;

/** 앱이 진입점 하나로 React 훅을 쓸 수 있게 한 재수출 — react는 사전 번들에
 *  포함되므로, 소비 앱이 react를 따로 import하면 별도 인스턴스가 되어 훅이
 *  깨진다(React 단일 인스턴스 계약). 반드시 이 재수출을 쓸 것. */
export const {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  memo,
  forwardRef,
  isValidElement,
  Children,
} = React;
