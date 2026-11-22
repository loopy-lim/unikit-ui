// @unikit-bridge/ui/behaviors/ui-sdk-renderer — @ui-sdk/core 프리미티브를
// RN(및 웹) 브리지 프리미티브로 구동하는 파트 렌더러 코어. «다 go» 로드맵 M1.
//
// 위치: 이슈 #17 스파이크(apps/expo/app/uisdk-toggle.tsx — toggle 1종 전용
// 최소형)을 임의 프리미티브에 성립하는 일반형으로 성장시킨 것. 소비자는
// @ui-sdk/core의 프리미티브 팩토리(toggle·checkbox·switchPrimitive·button …
// 51종)를 그대로 넘기고, 이 진입점이 수명·구독·DOM 속성 번역을 담당해요.
// @ui-sdk/core는 선택 peer(미설치 소비자는 이 진입점을 import하지 않는 한
// 영향 없음)이며 버전은 package.json에서 정확히 고정(0.1.0-beta.6) —
// renderer 진입점은 «프레임워크 렌더러 전용·비공개·릴리스마다 변경 가능»을
// 스스로 선언해요. 승급은 bun install 후 `bun run probe:ui-sdk`(계약
// 프로브) 재실행이 계약이에요(scripts/ui-sdk-contract-probe.ts).
//
// 웹 use-primitive(@ui-sdk/react) 대비 설계 판단:
//   - 수명(unwatched 생성 → keep → setOptions 전파 → 해제 시 release·
//     destroy)과 파트 계약(commit → ref 바인딩 → subscribe)은 같은 모양.
//   - 좁은 구독: 웹은 «읽은 상태 키»를 추적해 해당 변경만 반영하지만, 이
//     구현은 출력 기반 축소예요 — 구독 통지마다 attrs·partState·present를
//     재계산하고 sameSlotState·sameValue(renderer 재수출 비교기)로 직전
//     렌더 출력과 같으면 재렌더를 건너뛰어요. 읽기 추적 없이 누락 렌더가
//     원천적으로 없는 대신, 출력에 영향 없는 상태 변화도 한 번은 계산해요.
//   - lazy resolve·mergeProps·HandleScope·takeOwnId/yieldToAuthor·
//     schemaOf 기반 슬롯 해석은 미구현 — M2 슬라이스에서 필요해질 때
//     이 진입점에 추가해요(잔여 기능 목록은 docs/sdd 이슈 문서 참조).
//     M2-①(이슈 #37)에서 두 계약을 보강했어요 — ① attrs·present·partState를
//     커밋된 props로 계산(radio 항목·indicator 슬롯의 attrs/present가
//     props.value를 읽어요. 슬롯 스키마의 "from: root" 상속은 소비자가
//     명시적으로 넘기는 방식으로 소비해요), ② SdkElement에 ownerDocument·
//     style 최소 멤버(hidden input bind의 associate·그룹 bind의
//     bindRadioGroup이 문서 리스너를, segmented-control indicator bind가
//     CSS 변수 쓰기를 요구).
//   - id 전파(followId·MutationObserver)는 웹 전용 계약이라 RN에서 소유하지
//     않아요. RN 0.88 내장 MutationObserver(childList 전용 폴리필)는 커널
//     followId의 attributeFilter 관찰과 계약이 안 맞아 바인딩 동안만 전역을
//     마스킹해요(#17 스파이크 기기 실측 — 아래 SdkElement 바인딩 참조).
//   - keydown/keyup은 하드원 키보드 경로(이슈 #19 — Android는 플래그 뒤
//     W3C View onKeyDown 계약, iOS·소프트키보드는 폐기). 터치는 click
//     경로(onPress → fire("click"))가 1차 UX예요.
//   - 에이전트 브리지(ui-sdk-agent)가 켜는 옵트인 모드: SdkElement가
//     isConnected·checkVisibility·getBoundingClientRect를 갖추고 커밋된
//     props에서 aria-label을 심어요(accessibilityLabel → 접근명 계약).
//     아래 sdkElementAgentMode 참조.
import {
  attrs,
  commit,
  handlers,
  keep,
  partState,
  present,
  ref,
  release,
  sameSlotState,
  sameValue,
  subscribe,
  unwatched,
} from "@ui-sdk/core/renderer";
import * as React from "react";

// ---------------------------------------------------------------------------
// 비공개 경계의 구조적 최소형 — renderer.d.ts가 «공개 API 없음·릴리스마다
// 변경 가능»을 선언하는 영역이라, 필요한 멤버만 구조 타입으로 세우고
// 팩토리 매개변수는 any 경계를 감수해요(계약 프로브가 이 가정을 상시 검증).
// ---------------------------------------------------------------------------
export type SdkPrimitiveInstance = {
  id: string;
  /** 인스턴스 전체 상태 — 실제 프리미티브의 정밀 타입을 그대로 돌려줘요 */
  get(): unknown;
  setOptions(options: Record<string, unknown>): void;
  part(
    slot: string,
    props?: Record<string, unknown>,
    acquire?: boolean,
  ): SdkPart;
  destroy(): void;
};

export type SdkPart = {
  readonly slot: string;
  readonly key: string;
  readonly id: string;
};

type Attrs = Record<string, string | undefined>;

/** bind(part, el, host)가 비-attaches 이벤트를 요소에 직접 붙이지 않게 하는
 *  프레임워크 렌더러 선언 — 웹 use-primitive와 같은 모양. */
const HOST = { by: "framework", attaches: ["click", "keydown", "keyup"] } as const;

/** 프리미티브 root가 실제로 읽는 요소 멤버만 갖춘 가짜 요소. #17 실측
 *  (tagName·isConnected 즉시 읽힘·parentElement는 watchFieldsets 마이크로태스크
 *  지연 읽기)에 M1 기기 재실측 두 돋을 추가했어요 —
 *  1. 초기 element는 "unknown"이라 bind 직후 buttonElement(el)이 tagName 분류를
 *     마치지 못하고 el.matches("a[href]")를 호출해요(foundation/platform/
 *     button.js — 첫 리로드에 화면이 죽던 회귀). matches 거짓은 «RN 뷰는 링크가
 *     아니다»의 정직한 번역이고, 분류 결과 "other"가 역할 합성(buttonRole →
 *     role="button")으로 이어져 계약상 옳아요.
 *  2. checkbox indicator bind는 구독 콜백에서 el.toggleAttribute("data-checked"…)
 *     를 쓰고(checkbox.js — press 시 "undefined is not a function" 회귀),
 *     animateIn/animateOut(foundation/motion/presence.js)이 data-starting/
 *     ending-style 속성과 el.getAnimations()를 읽어요. 속성은 소형 저장소로
 *     실제처럼 일관되게 유지하고 애니메이션은 «없음»([])을 돌려줘요 — 종료
 *     콜백(finishExit)은 즉시 경로로 자연스럽게 흘러요.
 *  M2-①(이슈 #37) 전 슬롯 소비에서 두 멤버가 더 필요해졌어요 —
 *  3. ownerDocument: hidden input bind(associate)가 reset 리스너를, 그룹
 *     bind(bindRadioGroup)가 pointerdown 캡처 리스너를 문서에 붙여요. RN에
 *     문서가 없어 이벤트는 오지 않고 리스너 등록만 성립하면 돼요.
 *  4. style: segmented-control indicator bind(bindIndicator)가 CSS 변수
 *     setProperty/removeProperty를 써요. RN 표면은 측정(활성 항목의
 *     isConnected)이 없어 write(undefined)의 제거 경로만 와요.
 *  나머지 멤버는 watchFormDisabled·press(roving)·keyClick이 도달할 수 있는 방어
 *  경로예요. instanceof 브랜드 검사(HTMLFieldSetElement 등)는 parentElement
 *  순환 전에 끝나 RN에 없는 글로벌 참조 없이 통과해요. */
const SdkDocument = {
  addEventListener() {},
  removeEventListener() {},
};

// ---------------------------------------------------------------------------
// 에이전트 모드 — ./behaviors/ui-sdk-agent가 켜는 옵트인 플래그(2026-11-22).
// 커널 감시자의 bound()가 파트 요소의 isConnected를 읽어 «연결되지 않음»
// 파트를 등록에서 걸러요. 기본 false여야 segmented-control indicator bind가
// «측정 없음» 제거 경로(removeProperty)로 안전하게 흘러요 — 측정 경로는
// isConnected true일 때 getBoundingClientRect를 동기로 읽어 RN 3벽 중
// «동기 레이아웃 읽기»와 정면충돌해요. agent 진입점은 문서 스텁과 함께 이
// 플래그만 true로 바꾸고, getBoundingClientRect는 0 직사각형을 돌려주게
// 해서 측정이 안전하게 실패하도록 지켜요.
// ---------------------------------------------------------------------------
let sdkElementAgentMode = false;

/** 에이전트 브리지 모드 토글 — ./behaviors/ui-sdk-agent의 createSdkAgent가
 *  true로 켜요. 일반 렌더러 소비자는 호출하지 않아요. */
export function setSdkElementAgentMode(enabled: boolean): void {
  sdkElementAgentMode = enabled;
}

class SdkElement {
  /** bound() 필터가 읽는 연결 사실 — 에이전트 모드에서만 true. */
  get isConnected() {
    return sdkElementAgentMode;
  }
  tagName: string;
  parentElement: SdkElement | undefined = undefined;
  ownerDocument = SdkDocument;
  style = {
    setProperty() {},
    removeProperty() {},
  };
  private attributes = new Map<string, string>();
  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
  }
  /** 속성 저장소 — toggleAttribute·starting/ending-style이 읽고 쓰는 계약 */
  setAttribute(name: string, value = "") {
    this.attributes.set(name, String(value));
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
  toggleAttribute(name: string, force?: boolean) {
    const present = force ?? !this.attributes.has(name);
    if (present) this.setAttribute(name, "");
    else this.removeAttribute(name);
    return present;
  }
  hasAttribute(name: string) {
    return this.attributes.has(name);
  }
  getAttribute(name: string) {
    return this.attributes.has(name) ? this.attributes.get(name) ?? "" : null;
  }
  /** buttonElement(el)·opensElsewhere·isDisabledElement의 셀렉터 판별 */
  matches() {
    return false;
  }
  /** watchFormDisabled·label 탐색 — 값이 없으면 무시하는 경로 */
  closest() {
    return null;
  }
  querySelector() {
    return null;
  }
  /** presence(애니메이션 종료 대기) — RN에서 애니메이션은 없음 */
  getAnimations() {
    return [];
  }
  /** press(roving)·keyClick(Space/Enter)이 쓰는 경로 — RN에서는 no-op */
  focus() {}
  click() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
  /** agent 브리지(2026-11-22): marks textOf가 childNodes를, svg 접근성 이름
   *  경로가 children을 순회해요 — 심어둔 텍스트가 없어 빈 배열이면 순회
   *  본문이 돌지 않아 RN에 없는 Node/Element 글로벌을 건드리지 않아요. */
  childNodes: unknown[] = [];
  children: unknown[] = [];
  /** agent isShown — hidden·aria-hidden 마크가 없으면 보이는 것으로. */
  checkVisibility() {
    return !this.hasAttribute("hidden") && this.getAttribute("aria-hidden") !== "true";
  }
  /** 동기 레이아웃 읽기(indicator 측정 등) — RN은 0 직사각형이 정직한 답 */
  getBoundingClientRect() {
    return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
}

/** core 핸들러가 읽는 이벤트 최소형(defaultPrevented·preventDefault·
 *  stopPropagation, 키 계열은 key·수정자 — isTypeaheadKey 호환). */
export type SdkSyntheticEventInit = {
  key?: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

export function sdkSyntheticEvent(init: SdkSyntheticEventInit = {}) {
  const event = {
    ...init,
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
    stopPropagation() {},
  };
  return event as typeof event & { defaultPrevented: boolean };
}

// ---------------------------------------------------------------------------
// DOM attrs → 브리지 props 번역표 — 웹 use-primitive가 class·tabindex·이벤트
// 번역을 DOM에 하듯, 이쪽은 브리지 계약(bridge/types.ts aria-* 관용 별칭)으로
// 옮겨요. RN에 없는 것(tabindex·data-*·type)은 버려요.
// ---------------------------------------------------------------------------
const ELEMENT_ROLES: Record<string, string | undefined> = {
  // 웹은 native 요소가 역할을 대신하지만 RN Pressable는 View라 렌더러가 합성.
  button: "button",
};

export type SdkBridgeProps = {
  className: string | undefined;
  accessibilityRole: string | undefined;
  accessibilityLabel: string | undefined;
  disabled: boolean | undefined;
  "aria-pressed"?: boolean;
  "aria-checked"?: boolean;
  "aria-selected"?: boolean;
  "aria-expanded"?: boolean;
  "aria-invalid"?: boolean;
};

const ariaFlag = (value: string | undefined) =>
  value === undefined ? undefined : value === "true";

export function sdkBridgeProps(domAttrs: Attrs, element: unknown): SdkBridgeProps {
  const role = domAttrs.role ?? ELEMENT_ROLES[String(element)];
  return {
    className: domAttrs.class,
    accessibilityRole: role,
    accessibilityLabel: domAttrs["aria-label"],
    disabled:
      domAttrs["aria-disabled"] === "true" || domAttrs.disabled !== undefined
        ? true
        : undefined,
    "aria-pressed": ariaFlag(domAttrs["aria-pressed"]),
    "aria-checked": ariaFlag(domAttrs["aria-checked"]),
    "aria-selected": ariaFlag(domAttrs["aria-selected"]),
    "aria-expanded": ariaFlag(domAttrs["aria-expanded"]),
    "aria-invalid": ariaFlag(domAttrs["aria-invalid"]),
  };
}

// ---------------------------------------------------------------------------
// useSdkPrimitive — 인스턴스 수명. 옵션 변경은 setOptions로 매 렌더 전파.
// ---------------------------------------------------------------------------
/** 어댑터가 항상 주입하는 필드 — 실제 팩토리 옵션은 id를 필수로 요구해요.
 *  소비자 옵션 타입은 이 키를 소거한 나머지로 노출해요. */
type SdkInjectedOptions = { id: string; controller?: unknown };

export function useSdkPrimitive<
  FactoryOptions extends object,
  Instance extends SdkPrimitiveInstance,
>(
  create: (options: FactoryOptions) => Instance,
  options: Omit<FactoryOptions, keyof SdkInjectedOptions>,
  idPrefix = "ui-sdk",
): Instance {
  const reactId = React.useId();
  const id = `${idPrefix}-${reactId}`;
  const [instance] = React.useState(() =>
    unwatched(() =>
      create({
        ...options,
        controller: undefined,
        id,
      } as FactoryOptions),
    ),
  );
  React.useLayoutEffect(() => keep(instance), [instance]);
  React.useLayoutEffect(() => {
    instance.setOptions({ ...options, id });
  });
  React.useEffect(
    () => () => {
      release(instance);
      instance.destroy();
    },
    [instance],
  );
  return instance;
}

// ---------------------------------------------------------------------------
// useSdkPart — 파트 1개의 commit·바인딩·구독·출력. 같은 인스턴스의 여러
// 슬롯은 이 훅을 슬롯별로 호출해요(예: checkbox root + indicator).
// ---------------------------------------------------------------------------
export type SdkPartOutput = {
  /** 이 파트가 그려야 하는가(present 계약 — false면 렌더하지 않는다) */
  showing: boolean;
  /** 렌더러가 산출한 DOM 속성 원본(계측·디버그용) */
  domAttrs: Attrs;
  /** 파트 상태 계약 — 슬롯이 선언한 상태만 돌아와요 */
  snapshot: Record<string, unknown>;
  /** 인스턴스 전체 상태에서 읽은 element 이름(역할 합성용) */
  element: string;
  /** 브리지 프리미티브로 번역된 props */
  bridgeProps: SdkBridgeProps;
  /** 합성 이벤트 발송 — press()는 click의 약자. 반환값은 defaultPrevented */
  fire(eventName: string, init?: SdkSyntheticEventInit): boolean;
  press(): boolean;
};

/** props 생략 호출의 안정 기본값 — 효과 의존성 [part, props]이 매 렌더
 *  재실행되는 churn을 막아요(props 객체가 새로 만들어지면 commit·subscribe가
 *  다시 걸려요). props를 넘기는 쪽이 안정성을 책임져요. */
const EMPTY_PROPS: Record<string, unknown> = {};

export function useSdkPart(
  instance: SdkPrimitiveInstance,
  slot: string,
  props: Record<string, unknown> = EMPTY_PROPS,
): SdkPartOutput {
  const part = instance.part(slot, props, true);
  // 비공개 Part 경계 — 커널 함수군이 요구하는 전체 형태를 우리 구조형이
  // 대신하지 못해 경계에서 한 번만 좁힌다(계약 프로브가 상시 검증).
  const kernel = part as never;
  const [, rerender] = React.useReducer((count: number) => count + 1, 0);

  const compute = React.useCallback((): {
    showing: boolean;
    domAttrs: Attrs;
    snapshot: Record<string, unknown>;
    element: string;
  } => {
    const state = instance.get() as Record<string, unknown>;
    return {
      // 커밋된 props로 계산한다 — radio 항목(attrs가 props.value·disabled를
      // 읽음)·indicator(present가 props.value를 읽음) 슬롯의 계약(M2-① #37).
      showing: present(kernel, props, state),
      domAttrs: attrs(kernel, props, state) as Attrs,
      snapshot: partState(kernel, props, state) as Record<string, unknown>,
      element: String(state.element ?? "unknown"),
    };
    // kernel은 part와 같은 심볼(슬롯별 안정)이라 의존성에 포함하지 않는다.
  }, [instance, part, props]);

  const lastRef = React.useRef<{
    showing: boolean;
    domAttrs: Attrs;
    snapshot: Record<string, unknown>;
  } | null>(null);

  React.useLayoutEffect(() => {
    commit(kernel, props);
    // 출력 기반 축소 구독 — 통지마다 재계산해 직전 출력과 같으면 건너뛴다.
    return subscribe(kernel, () => {
      const next = compute();
      const last = lastRef.current;
      if (
        last &&
        last.showing === next.showing &&
        attrsEqual(last.domAttrs, next.domAttrs) &&
        sameSlotState(last.snapshot, next.snapshot)
      ) {
        return;
      }
      rerender();
    });
  }, [part, props]);

  const bindElement = React.useMemo(() => ref(kernel, HOST), [part]);
  React.useLayoutEffect(() => {
    // RN 0.88 내장 MutationObserver( childList 전용 폴리필)과 커널 followId의
    // attributeFilter 계약 충돌을 피해 바인딩 동안만 전역을 마스킹한다.
    // 바인딩이 없는 런타임(bun 등)은 typeof 가드로 그냥 통과.
    const globalScope = globalThis as { MutationObserver?: unknown };
    const saved = globalScope.MutationObserver;
    if (typeof saved === "function") globalScope.MutationObserver = undefined;
    try {
      const element = new SdkElement(
        String((instance.get() as Record<string, unknown>).element ?? "unknown"),
      );
      // agent 브리지의 접근명 계약 — accessibleName은 aria-label을 최우선으로
      // 읽어요. RN 표면은 accessibilityLabel이므로 커밋된 props에서 aria-label을
      // 심어 두면 snapshot의 label·act의 «라벨로 대상 찾기»가 성립해요.
      const agentLabel = props["aria-label"] ?? props.accessibilityLabel;
      if (typeof agentLabel === "string" && agentLabel !== "") {
        element.setAttribute("aria-label", agentLabel);
      }
      bindElement(element as never);
    } finally {
      if (typeof saved === "function") globalScope.MutationObserver = saved;
    }
    return () => bindElement(null);
  }, [bindElement, instance]);

  const current = compute();
  lastRef.current = current;

  const fire = React.useCallback(
    (eventName: string, init: SdkSyntheticEventInit = {}) => {
      const event = sdkSyntheticEvent(init);
      const map = handlers(kernel) as Record<
        string,
        ((event: unknown) => void) | undefined
      >;
      map[eventName]?.(event);
      return event.defaultPrevented;
    },
    [part],
  );

  return {
    showing: current.showing,
    domAttrs: current.domAttrs,
    snapshot: current.snapshot,
    element: current.element,
    bridgeProps: sdkBridgeProps(current.domAttrs, current.element),
    fire,
    press: () => fire("click"),
  };
}

function attrsEqual(a: Attrs, b: Attrs): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!sameValue(a[key], b[key])) return false;
  }
  return true;
}
