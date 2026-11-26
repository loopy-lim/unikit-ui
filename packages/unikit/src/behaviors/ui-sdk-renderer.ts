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
//     M2-①(이슈 #37)에서 두 계약을 보강했어요 — ① attrs·present·partState을
//     커밋된 props로 계산(radio 항목·indicator 슬롯의 attrs/present가
//     props.value를 읽어요. 슬롯 스키마의 "from: root" 상속은 소비자가
//     명시적으로 넘기는 방식으로 소비해요), ② SdkElement에 ownerDocument·
//     style 최소 멤버(hidden input bind의 associate·그룹 bind의
//     bindRadioGroup이 문서 리스너를, segmented-control indicator bind가
//     CSS 변수 쓰기를 요구).
//     M2-②(이슈 #39)에서 팝업 표면을 추가했어요 — SdkElement에 rect 캐시
//     ·SdkStyle(observer)·nodeType·client/offset 치수·querySelectorAll
//     ·contains·getRootNode·showPopover no-op·nextElementSibling, 문서 스텁에
//     activeElement·getSelection. 팝업 모드 플래그(setSdkElementPopupMode)가
//     isConnected를 켜고, useSdkPart 출력이 바인딩된 요소(sdkElement)를
//     노출해요 — 화면이 measureInWindow로 rect를 주입하고 style observer로
//     position() 계산 결과를 RN 화면으로 옮겨요(P2/P3 FakeElement 패턴의
//     렌더러 이식).
//     M2-④⑤⑥(이슈 #19 «문서 벽»의 물리적 정체) — 지금까지 문서·창의
//     addEventListener이 noop이라 커널이 문서에 등록하는 리스너(modality의
//     키·포인터 추적, layers의 바깥누름·ESC, bindDrag의 포인터 추적)가
//     «등록만 성립»했어요. 이제 installSdkEventGlobals()가 문서·창을 실
//     이벤트 대상(캡처/버블 레지스트리)으로 만들고 SdkElement는 가상 포커스
//     레지스트리(document.activeElement)·focus/blur 이벤트·문서 순서
//     (compareDocumentPosition)·부모 체인 contains를 갖춰요. 화면은 RN 입력
//     (onPress·onKeyDown·터치 추적)을 fire/dispatchSdkDocumentEvent/
//     dispatchSdkWindowEvent로 넣고, 트랙·트리 치수는 rect 주입(setSdkRect)과
//     parentElement 연결로 대신해요(동기 레이아웃 읽기 없음).
//   - id 전파(followId·MutationObserver)는 웹 전용 계약이라 RN에서 소유하지
//     않아요. RN 0.88 내장 MutationObserver(childList 전용 폴리필)는 커널
//     followId의 attributeFilter 관찰과 계약이 안 맞아 바인딩 동안만 전역을
//     마스킹해요(#17 스파이크 기기 실측 — 아래 SdkElement 바인딩 참조).
//   - 하드웨어 키보드 경로 — sdkKeyHostProps(하드웨어 키 마일스톤)가 브리지
//     View/Pressable의 focusable·onKeyDown을 커널 keydown으로 잇아요.
//     Android는 RN 0.88 W3C 규격 View onKeyDown(MainApplication의
//     enableKeyEvents 플래그 — 이슈 #19 §1.2), iOS는 브리지 계약 부재로
//     이 경로가 없어요(#19 §1.3). 터치는 click 경로(onPress → fire("click"))
//     가 1차 UX예요.
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
  /** 팩토리가 만든 공개 api(createPopup 계열은 setOpen·close·toggle 등) —
   *  커널이 인스턴스 생성 시 이미 구축했어요(wake 경계). */
  readonly api?: Record<string, unknown>;
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
 *  프레임워크 렌더러 선언 — 웹 use-primitive와 같은 모양. 이 세 종만 요소
 *  부착에서 빠지므로 발송 엔진이 커널 핸들러(handlers(part))를 대신
 *  불러요(나머지 on.* 이벤트는 bind가 요소 리스너로 붙임 — 두 번 부르면
 *  이중 발송). */
const HOST = { by: "framework", attaches: ["click", "keydown", "keyup"] } as const;

// ---------------------------------------------------------------------------
// 이벤트 최소형 — 커널 핸들러가 읽는 표면(defaultPrevented·preventDefault·
// stopPropagation·stopImmediatePropagation·composedPath)과 키·포인터 계열
// 필드(init에서 그대로 복사). M2-③에서 Event 글로벌(SdkEvent)로 깔렸고,
// M2-④⑤⑥에서 발송 경로(캡처→대상→버블)를 갖췄어요.
// ---------------------------------------------------------------------------
/** 화면이 fire·dispatchSdk*에 넣는 이벤트 필드. target·isTrusted만 렌더러
 *  계약이고 나머지는 커널이 읽는 DOM 이벤트 필드 그대로예요. */
export type SdkSyntheticEventInit = {
  key?: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
  detail?: number;
  button?: number;
  buttons?: number;
  clientX?: number;
  clientY?: number;
  pointerId?: number;
  pointerType?: string;
  isPrimary?: boolean;
  /** 이벤트 대상 — 기본은 발송 파트의 요소. 목록(list) 파트가 항목(tab)을
   *  대상으로 한 키 이벤트를 보낼 때 항목 요소를 넣어요(커널이
   *  event.target으로 항목을 찾고, 목록 파트 핸들러는 버블 단계에서 받아요).
   *  문서·창 발송의 바깥 누름은 null. */
  target?: unknown;
  /** 신뢰 여부 — fire·dispatchSdk*는 RN onPress/onKeyDown/터치 추적에서
   *  불리는 사용자 입력의 전달이므로 기본 true(커널의 trusted()·sourceOf가
   *  소스를 판별 — 터치 개방의 초점 계획 등). 프로그램 발송은 false로. */
  isTrusted?: boolean;
  bubbles?: boolean;
};

type SdkListener = (event: SdkEvent) => void;

/** 커널이 new Event(...)·instanceof 브랜드 양쪽으로 쓰는 이벤트 클래스. */
export class SdkEvent {
  type: string;
  bubbles: boolean;
  composed: boolean;
  cancelable: boolean;
  defaultPrevented = false;
  isTrusted: boolean;
  target: unknown = null;
  currentTarget: unknown = null;
  /** stopPropagation 이후 전파 중단 플래그(같은 노드의 다른 리스너는 계속). */
  cancelBubble = false;
  /** stopImmediatePropagation — 같은 노드의 남은 리스너·커널 핸들러도 중단. */
  immediateStopped = false;
  [key: string]: unknown;
  constructor(
    type: string,
    init: { bubbles?: boolean; composed?: boolean; cancelable?: boolean; isTrusted?: boolean } = {},
  ) {
    this.type = type;
    this.bubbles = init.bubbles === true;
    this.composed = init.composed === true;
    this.cancelable = init.cancelable === true;
    this.isTrusted = init.isTrusted === true;
  }
  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }
  stopPropagation() {
    this.cancelBubble = true;
  }
  stopImmediatePropagation() {
    this.cancelBubble = true;
    this.immediateStopped = true;
  }
  /** layers.js가 `composedPath()[0]`으로 누름 대상을 읽어요 — 가상 트리의
   *  대상→조상 경로(document·window 포함), 대상 없음은 [null]. */
  composedPath(): unknown[] {
    return composedPathOf(this.target);
  }
}

/** 버블하지 않는 DOM 이벤트(focus·blur·enter·leave 계열) */
const NON_BUBBLING = /^(focus|blur|mouse(enter|leave)|pointer(enter|leave))$/;

/** 합성 이벤트 조립 — 키·포인터 필드는 init 그대로, 신뢰는 기본 true. */
export function sdkSyntheticEvent(type: string, init: SdkSyntheticEventInit = {}): SdkEvent {
  const { target, isTrusted = true, bubbles, ...fields } = init;
  const event = new SdkEvent(type, {
    bubbles: bubbles ?? !NON_BUBBLING.test(type),
    composed: true,
    cancelable: true,
    isTrusted,
  });
  Object.assign(event, fields);
  event.target = target ?? null;
  return event;
}

// ---------------------------------------------------------------------------
// 가상 포커스 레지스트리 — document.activeElement. RN에 문서 포커스 개념은
// 없지만 커널(roving의 focusOn·popup의 initialFocus/returnFocus·slider의
// thumbInput)은 «focus() 뒤 activeElement가 그 요소인가»로 포커스를 판정해요.
// 화면은 SdkElement.focusObserver/blurObserver로 실제 RN 포커스(TextInput
// 등)에 반영해요(선택).
// ---------------------------------------------------------------------------
let sdkActiveElement: SdkElement | null = null;

function sdkSetFocus(next: SdkElement | null) {
  const previous = sdkActiveElement;
  if (previous === next) return;
  sdkActiveElement = null;
  // focus·blur은 브라우저에서 focus() 호출로 일어나도 isTrusted true — 커널의
  // trusted() 분기(소스 판별)와 같은 편이 되도록 기본(신뢰)으로 보내요.
  if (previous) {
    previous.dispatchEvent(sdkSyntheticEvent("blur", { target: previous }));
    previous.dispatchEvent(sdkSyntheticEvent("focusout", { target: previous }));
    previous.blurObserver?.();
  }
  sdkActiveElement = next;
  if (next) {
    next.dispatchEvent(sdkSyntheticEvent("focus", { target: next }));
    next.dispatchEvent(sdkSyntheticEvent("focusin", { target: next }));
    next.focusObserver?.();
  }
}

// ---------------------------------------------------------------------------
// 모드 플래그 — 에이전트(ui-sdk-agent)·팝업(M2-②)·폼(M2-③)·포커스(M2-④)가
// 켜는 옵트인. 커널 감시자의 bound()가 파트 요소의 isConnected를 읽어
// «연결되지 않음» 파트를 등록에서 걸러요(roving order.list()·elements()·
// element("list") 조회가 모두 이 필터 뒤에 있어요). 기본 false여야
// segmented-control indicator bind가 «측정 없음» 제거 경로로 안전하게 흘러요
// — 측정 경로는 isConnected true일 때 getBoundingClientRect를 읽는데,
// 팝업·포커스 모드에서 그 읽기는 «주입된 rect 캐시»로 성립해요(동기 레이아웃
// 읽기가 아니라 화면이 measureInWindow로 채운 값).
// ---------------------------------------------------------------------------
let sdkElementAgentMode = false;
let sdkElementPopupMode = false;
let sdkElementFormMode = false;
let sdkElementFocusMode = false;

/** 에이전트 브리지 모드 토글 — ./behaviors/ui-sdk-agent의 createSdkAgent가
 *  true로 켜요. 일반 렌더러 소비자는 호출하지 않아요. */
export function setSdkElementAgentMode(enabled: boolean): void {
  sdkElementAgentMode = enabled;
}

/** 팝업 모드 토글 — createPopup 계열(popover·dialog·menu·select·tooltip…)
 *  화면이 켜요. 바인딩된 요소가 «연결됨»으로 보고 요소 조회·layer bind가
 *  성립하며, rect 캐시·SdkStyle(observer)로 position() 배치가 구동돼요.
 *  화면 마운트에서 켜고 언마운트에서 끄는 경계를 권장해요(다른 모드
 *  화면과의 전역 공유를 피하기 위해). */
export function setSdkElementPopupMode(enabled: boolean): void {
  sdkElementPopupMode = enabled;
}

/** 폼 모드 토글 — 입력·폼 계열(field·input 등 — M2-③ 이슈 #40) 화면이
 *  켜요. 요소 조회(elements()의 bound 필터 — field의 element("control")·
 *  input의 control())가 성립해야 label press → activate·api 값 동기가
 *  실동작해요. 팝업 모드와 같은 마운트 경계를 권장해요. */
export function setSdkElementFormMode(enabled: boolean): void {
  sdkElementFormMode = enabled;
}

/** 포커스 모드 토글 — 키·포커스 계열(tabs·toolbar·radio roving — M2-④)과
 *  제스처 계열(slider — M2-⑤, dispatchChange의 연결 검사·thumb-input 조회)
 *  화면이 켜요. roving의 order.list()가 항목을 걸러 내고 stop을 정하며,
 *  focus()가 가상 포커스 레지스트리에 기록돼요. 마운트 경계를 권장해요. */
export function setSdkElementFocusMode(enabled: boolean): void {
  sdkElementFocusMode = enabled;
}

/** 타이핑 주입 — native 입력 등가(M2-③ 이슈 #40). value.js의 intercept가
 *  인스턴스 value 쓰기를 «스크립트 쓰기»로 분류해요(notify("write") →
 *  read만 오고 change는 오지 않아요) — 웹에서 사람 타이핑은 JS setter를
 *  지나지 않아요. 이 헬퍼는 프로토타입 setter로 값을 심고(writeValue의
 *  asUser 경로와 같은 기법) input 이벤트를 발송해요 → kernel typed()가
 *  change("input-change")를 일으켜요. */
export function typeSdkValue(element: SdkElement, text: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    "value",
  );
  descriptor?.set?.call(element, text);
  element.dispatchEvent(new SdkEvent("input", { bubbles: true, composed: true }));
}

/** 폼 계열(field·input 등 — 이슈 #40)이 참조하는 전역을 «미존재 시에만»
 *  깐다: HTML* 브랜드 클래스 9종·Node — instanceof가 정확히 false여야
 *  («네이티브 아님» 분기 — 존재하지 않으면 TypeError) — 그리고 Event
 *  (SdkEvent). 커널의 브랜드 검사는 queueMicrotask에서도 흘러요(field의
 *  adopt) — passive useEffect보다 먼저 실행될 수 있으므로 화면 모듈 스코프
 *  에서 호출하는 것이 권장 모양이에요(기기 실측 2026-11-23). 되돌리지
 *  않아요. */
export function installSdkFormGlobals(): void {
  const g = globalThis as Record<string, unknown>;
  for (const name of [
    "HTMLInputElement",
    "HTMLSelectElement",
    "HTMLTextAreaElement",
    "HTMLLabelElement",
    "HTMLButtonElement",
    "HTMLMeterElement",
    "HTMLOutputElement",
    "HTMLProgressElement",
    "Node",
  ]) {
    if (typeof g[name] !== "function") g[name] = class {};
  }
  if (typeof g.Event !== "function") g.Event = SdkEvent;
}

/** position() 계산 결과(style 쓰기)를 RN 화면으로 옮기는 관찰 훅 계약 —
 *  ui-sdk-dom의 FakeStyle과 같은 모양(P3 실증). setProperty가 값이 실제로
 *  바뀔 때마다 불려요. */
export type SdkStyleObserver = (key: string, value: string) => void;

/** CSSStyleDeclaration 모양 최소형 — position()의 계산 결과가 흘러와요.
 *  일반 슬롯의 CSS 변수 쓰기(segmented indicator)도 같은 표면을 써요.
 *  lockScroll의 setStyle(modal.js)이 getPropertyPriority·3인자 setProperty를
 *  읽어요(M2-⑥). */
export class SdkStyle {
  [key: string]: unknown;
  transformOrigin = "0px 0px";
  transform = "none";
  observer?: SdkStyleObserver;
  setProperty(key: string, value: string) {
    if (this[key] !== value) {
      this.observer?.(key, value);
    }
    this[key] = value;
  }
  getPropertyValue(key: string) {
    return typeof this[key] === "string" ? (this[key] as string) : "";
  }
  getPropertyPriority() {
    return "";
  }
  removeProperty(key: string) {
    delete this[key];
  }
}

/** rect 캐시를 제자리에서 갱신 — 같은 객체를 getter가 계속 읽게 해요(추종 입력).
 *  ui-sdk-dom의 updateRect와 같은 계약이에요(react-native 의존 없이). */
export function setSdkRect(
  element: SdkElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const rect = element.rect;
  rect.x = x;
  rect.y = y;
  rect.width = width;
  rect.height = height;
  rect.top = y;
  rect.left = x;
  rect.right = x + width;
  rect.bottom = y + height;
}

// ---------------------------------------------------------------------------
// 발송 엔진 — 가상 트리의 경로(대상 → parentElement 체인 → document →
// window)로 캡처→대상→버블. 요소 노드마다 등록된 파트(M2-④ bindSdkPart)의
// 커널 핸들러 중 HOST.attaches 종(click·keydown·keyup)을 대신 불러요.
// ---------------------------------------------------------------------------
type SdkNode = SdkElement | SdkDocumentClass | SdkWindowClass;

type SdkPartRecord = { part: unknown };

/** 바인딩된 요소 → 커널 파트(bindSdkPart가 기록, 언바인딩에 삭제). */
const sdkParts = new WeakMap<SdkElement, SdkPartRecord>();

class SdkEventTarget {
  private capturing = new Map<string, Set<SdkListener>>();
  private bubbling = new Map<string, Set<SdkListener>>();
  private setFor(type: string, capture: boolean): Set<SdkListener> {
    const map = capture ? this.capturing : this.bubbling;
    let set = map.get(type);
    if (!set) {
      set = new Set();
      map.set(type, set);
    }
    return set;
  }
  addEventListener(
    type: string,
    listener: SdkListener,
    options?:
      | boolean
      | {
          capture?: boolean;
          signal?: {
            aborted?: boolean;
            addEventListener?: (type: string, listener: () => void) => void;
            removeEventListener?: (type: string, listener: () => void) => void;
          } | null;
        },
  ) {
    if (typeof listener !== "function") return;
    const signal = typeof options === "object" && options !== null ? options.signal : undefined;
    if (signal?.aborted) return;
    this.setFor(type, sdkCapture(options)).add(listener);
    // AbortSignal 옵션(moves.js listen의 `signal: listening.signal`) — abort되면
    // 리스너를 떼요. 커널은 abort()로만 정리하므로 이것이 없으면 position()마다
    // 창·문서에 wakeOutside가 쌓여요.
    if (signal && typeof signal.addEventListener === "function") {
      const abort = () => {
        this.removeEventListener(type, listener);
        signal.removeEventListener?.("abort", abort);
      };
      signal.addEventListener("abort", abort);
    }
  }
  removeEventListener(
    type: string,
    listener: SdkListener,
    _options?: boolean | { capture?: boolean },
  ) {
    // DOM은 capture 플래그가 맞아야 제거하지만 커널 on()은 같은 options로
    // 제거해요 — 양쪽 집합에서 지우는 관대한 제거(안전 쪽).
    this.setFor(type, true).delete(listener);
    this.setFor(type, false).delete(listener);
  }
  private run(set: Set<SdkListener> | undefined, event: SdkEvent) {
    if (!set) return;
    for (const listener of [...set]) {
      listener(event);
      if (event.immediateStopped) return;
    }
  }
  runCapture(event: SdkEvent) {
    this.run(this.capturing.get(event.type), event);
  }
  runBubble(event: SdkEvent) {
    this.run(this.bubbling.get(event.type), event);
  }
  /** 대상 단계 — 캡처·버블 리스너 모두(DOM 대상 단계와 같이). */
  runTarget(event: SdkEvent) {
    this.run(this.capturing.get(event.type), event);
    if (!event.immediateStopped) this.run(this.bubbling.get(event.type), event);
  }
}

function sdkCapture(options?: boolean | { capture?: boolean }): boolean {
  return options === true || (typeof options === "object" && options !== null && options.capture === true);
}

function isSdkElement(node: unknown): node is SdkElement {
  return node instanceof SdkElement;
}

/** 대상→조상 경로(가상 트리). 요소는 parentElement 체인 뒤 document·window. */
function composedPathOf(target: unknown): SdkNode[] {
  if (!isSdkElement(target) && target !== SdkDocument && target !== SdkWindow) return [];
  const path: SdkNode[] = [target as SdkNode];
  if (isSdkElement(target)) {
    let at: SdkElement | undefined = target;
    while (at?.parentElement) {
      at = at.parentElement;
      path.push(at);
    }
    path.push(SdkDocument, SdkWindow);
  } else if (target === SdkDocument) {
    path.push(SdkWindow);
  }
  return path;
}

function runKernelHandlers(node: SdkNode, event: SdkEvent) {
  if (!isSdkElement(node) || event.immediateStopped) return;
  if (!HOST.attaches.includes(event.type as (typeof HOST.attaches)[number])) return;
  const record = sdkParts.get(node);
  if (!record) return;
  const map = handlers(record.part as never) as Record<string, ((event: SdkEvent) => void) | undefined>;
  map[event.type]?.(event);
}

/** 발송 — container는 «발송 파트의 요소»가 대상과 다를 때(목록 파트가
 *  항목을 대상으로 발송) 버블 첫 자리에 끼워 넣는 노드예요(가상 트리에
 *  연결돼 있으면 자연 위치에서 한 번만 — includes로 걸러요). stopPropagation은
 *  같은 노드의 남은 리스너는 계속 돌고(DOM), stopImmediatePropagation은
 *  그 노드의 커널 핸들러도 멈춰요. */
function sdkDispatch(target: SdkNode, event: SdkEvent, container?: SdkElement): SdkEvent {
  if (event.target == null) event.target = target;
  const path = composedPathOf(target);
  const finish = () => {
    event.currentTarget = null;
    return event;
  };
  for (let i = path.length - 1; i >= 1; i--) {
    event.currentTarget = path[i];
    path[i].runCapture(event);
    // 캡처 단계의 stopPropagation은 다음 노드(결국 target) 전달을 막아요(DOM
    // 그대로) — 커널의 click 삼킴(layers의 swallowClick·드래그 뒤
    // swallowNextClick)이 창·문서 캡처에서 소비를 끝내는 경로예요.
    if (event.immediateStopped || event.cancelBubble) return finish();
  }
  event.currentTarget = target;
  target.runTarget(event);
  if (!event.immediateStopped) runKernelHandlers(target, event);
  if (!event.bubbles || event.cancelBubble || event.immediateStopped) return finish();
  const ancestors = path.slice(1);
  if (container && container !== target && !ancestors.includes(container)) {
    ancestors.unshift(container);
  }
  for (const node of ancestors) {
    event.currentTarget = node;
    node.runBubble(event);
    if (!event.immediateStopped) runKernelHandlers(node, event);
    if (event.immediateStopped || event.cancelBubble) break;
  }
  return finish();
}

/** 요소 발송 — RN 입력(onPress·onKeyDown)을 파트 요소에 넣어요. init.target가
 *  다른 요소(목록 파트가 항목을 대상으로 보내는 키)면 그 요소가 대상이고
 *  발송 파트 요소는 버블 첫 자리에 들어가요(웹에서 항목 keydown이 목록
 *  요소로 버블하는 것과 같은 경로). 반환값은 이벤트(defaultPrevented 판독). */
export function fireSdkEvent(
  element: SdkElement,
  type: string,
  init: SdkSyntheticEventInit = {},
): SdkEvent {
  const target = isSdkElement(init.target) ? init.target : element;
  return sdkDispatch(target, sdkSyntheticEvent(type, init), target === element ? undefined : element);
}

/** 문서 발송 — 드래그 추적(bindDrag의 pointermove/pointerup/pointercancel)·
 *  누름 기록(modality)이 듣는 경로. init.target 요소가 있으면 그 요소에서
 *  시작해 문서·창으로 버블, 없으면 문서가 대상이에요(바깥 누름 등). */
export function dispatchSdkDocumentEvent(type: string, init: SdkSyntheticEventInit = {}): SdkEvent {
  return sdkDispatch(isSdkElement(init.target) ? init.target : SdkDocument, sdkSyntheticEvent(type, init));
}

/** 창 발송 — layers의 창 캡처 pointerdown/pointerup/click(바깥누름·ESC)이
 *  듣는 경로. 대상 요소는 composedPath로 안쪽 판정에 쓰여요(null은 바깥). */
export function dispatchSdkWindowEvent(type: string, init: SdkSyntheticEventInit = {}): SdkEvent {
  return sdkDispatch(isSdkElement(init.target) ? init.target : SdkWindow, sdkSyntheticEvent(type, init));
}

/** 파트 바인딩 본체 — useSdkPart의 레이아웃 이펙트가 하는 일을 React 밖에서
 *  같은 순서로: MutationObserver 마스크 → 요소 생성 → aria-label·계산된
 *  attrs 심기 → ref 바인딩(커널 bind). sdkParts에 등록해 발송 엔진이 커널
 *  핸들러(click·keydown·keyup)를 대신 불러요. 언바인딩은 가상 포커스를
 *  내려놓고(요소가 떠나면 포커스도 떠나요) 등록을 지우고 ref(null)로 풀어요.
 *  프로브(계약 11~13)와 useSdkPart가 같은 본체를 써요. */
export function bindSdkPart(
  part: unknown,
  props: Record<string, unknown>,
  domAttrs: Attrs,
  tag = "unknown",
): { element: SdkElement; unbind: () => void } {
  const globalScope = globalThis as { MutationObserver?: unknown };
  const saved = globalScope.MutationObserver;
  // RN 0.88 내장 MutationObserver(childList 전용 폴리필)과 커널 followId의
  // attributeFilter 계약 충돌을 피해 바인딩 동안만 전역을 교체한다 — undefined
  // 대신 no-op 클래스로(M2-② #39): moves.js(position()의 추적 등록)가 가드
  // 없이 `new MutationObserver(...)`로 생성하기 때문. no-op도 «아무것도 발화
  // 하지 않는다»는 마스킹의 효과를 그대로 유지해요(RN 가상 요소는 DOM 변이를
  // 일으키지 않아요). 바인딩이 없는 런타임(bun 등)은 typeof 가드로 그냥 통과.
  globalScope.MutationObserver = SilentObserver;
  let element: SdkElement;
  let bindRef: (el: unknown) => void;
  try {
    element = new SdkElement(tag);
    // agent 브리지의 접근명 계약 — accessibleName은 aria-label을 최우선으로
    // 읽어요. RN 표면은 accessibilityLabel이므로 커밋된 props에서 aria-label을
    // 심어 두면 snapshot의 label·act의 «라벨로 대상 찾기»가 성립해요.
    const agentLabel = props["aria-label"] ?? props.accessibilityLabel;
    if (typeof agentLabel === "string" && agentLabel !== "") {
      element.setAttribute("aria-label", agentLabel);
    }
    // 프레임워크 렌더러의 «host에 attrs 적용» 등가 — registerById(field)가
    // bind 시점의 el.id를 읽고 isRequired 등이 요소 속성을 읽어요. 계산된
    // domAttrs(id·role·data-*)를 바인딩 전에 심어요(웹과 같은 순서).
    for (const [name, value] of Object.entries(domAttrs)) {
      if (value !== undefined && value !== null) {
        element.setAttribute(name, value);
      }
    }
    sdkParts.set(element, { part });
    bindRef = ref(part as never, HOST) as (el: unknown) => void;
    bindRef(element);
  } finally {
    globalScope.MutationObserver = saved;
  }
  return {
    element,
    unbind() {
      if (sdkActiveElement === element) sdkSetFocus(null);
      sdkParts.delete(element);
      bindRef(null);
    },
  };
}

class SilentObserver {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

// ---------------------------------------------------------------------------
// SdkElement — 커널이 읽는 요소 표면. M2-①·②·③ 멤버(연결·rect·style·속성·폼)에
// M2-④⑤⑥가 문서 순서·부모 체인(parentNode/contains)·가상 포커스(focus/blur)·
// 포인터 캡처 no-op·스크롤 멤버를 더해요. 요소 생성 순서 = 문서 순서
// (compareDocumentPosition) — 화면이 화면 순서대로 useSdkPart를 부르는 한
// roving의 정렬 계약이 성립해요(동기 트리 순회 없음).
// ---------------------------------------------------------------------------
let sdkSequence = 0;

/** CSS.escape 등가 — labelsOf가 `#${CSS.escape(id)}` 셀렉터를 조립해요. */
function sdkCssEscape(value: string): string {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

/** 간단 셀렉터 매처 — 커널이 closest·matches에 쓰는 형태만: 태그·[attr]·
 *  [attr="value"]·:not([attr="value"])·:focus·:disabled, 쉼표 목록. 그 밖의
 *  의사류(:hover·:popover-open …)는 그 그룹을 불일치로 해요(트리·상태 없는
 *  런타임의 정직한 답). ownsEvent(popup — `closest('[data-slot="…"]') === el`)·
 *  inPopupElement·closest("form"·"label"·"[inert]")·tabbable이 이 경로예요. */
function sdkMatchesSelector(element: SdkElement, selector: string): boolean {
  return selector.split(",").some((group) => {
    const text = group.trim();
    const parts = text.match(/[a-zA-Z][\w-]*|\[[^\]]*\]|:[\w-]+(?:\([^)]*\))?/g) ?? [];
    if (parts.map((part) => part.replace(/\s+/g, "")).join("") !== text.replace(/\s+/g, "")) {
      return false;
    }
    let index = 0;
    const first = parts[0];
    if (first !== undefined && /^[a-zA-Z]/.test(first)) {
      if (first.toUpperCase() !== element.tagName) return false;
      index = 1;
    }
    for (; index < parts.length; index++) {
      const part = parts[index];
      if (part === ":focus") {
        if (sdkActiveElement !== element) return false;
        continue;
      }
      if (part === ":disabled") {
        if (!element.hasAttribute("disabled")) return false;
        continue;
      }
      let negate = false;
      let inner = part;
      if (part.startsWith(":not(") && part.endsWith(")")) {
        negate = true;
        inner = part.slice(5, -1);
      }
      const attribute = inner.match(/^\[\s*([\w-]+)\s*(?:=\s*["']?([^"'\]]*?)["']?\s*)?\]$/);
      if (!attribute) return false;
      const has =
        element.hasAttribute(attribute[1]) &&
        (attribute[2] === undefined || element.getAttribute(attribute[1]) === attribute[2]);
      if (has === negate) return false;
    }
    return true;
  });
}

export class SdkElement extends SdkEventTarget {
  /** bound() 필터가 읽는 연결 사실 — agent·popup·form·focus 모드에서만 true. */
  get isConnected() {
    return (
      sdkElementAgentMode ||
      sdkElementPopupMode ||
      sdkElementFormMode ||
      sdkElementFocusMode
    );
  }
  /** position()이 앵커 판별에 쓰는 노드 종류("nodeType" in anchor). */
  nodeType = 1;
  tagName: string;
  /** idOf(part.js)·isTextField(live.js)가 읽는 소문자 태그. */
  localName: string;
  /** 화면이 가상 트리를 잇는 고리 — composedHops(layers의 안쪽 판정)·발송
   *  경로·contains가 걷는 부모 체인(콘텐츠 ↔ 제목·닫기 버튼 등 내부 슬롯). */
  parentElement: SdkElement | undefined = undefined;
  nextElementSibling: SdkElement | undefined = undefined;
  previousElementSibling: SdkElement | undefined = undefined;
  /** 문서 순서 비교용 생성 일련번호(compareDocumentPosition). */
  readonly #sequence = ++sdkSequence;
  /** ownerDocument getter — drag·modal·layers가 `el.ownerDocument.defaultView`
   *  로 창에 닿고, 문서 싱글턴이 자기 요소(body·documentElement)를 만들 때는
   *  아직 초기화 전일 수 있어(TDZ) 필드 대신 getter. */
  get ownerDocument(): SdkDocumentClass {
    return SdkDocument;
  }
  /** composedHops가 걷는 체인 — DOM처럼 부모가 없으면 null. */
  get parentNode(): SdkElement | null {
    return this.parentElement ?? null;
  }
  /** layout.js·position.js의 좌표 누적(트리 없음 → 0). */
  offsetLeft = 0;
  offsetTop = 0;
  /** presentation.js의 hide()/show()가 속성 대신 프로퍼티로 써요. */
  hidden = false;
  /** modal.js가 형제에 inert를 세지만 body.children이 비어 닿지 않아요. */
  inert = false;
  /** tabbable.js가 읽는 프로퍼티 — tabindex 속성과 동기. */
  tabIndex = -1;
  /** roving reveal()·스크롤 경로 — 트리 측정 없음(동기 레이아웃 읽기 없음). */
  scrollWidth = 0;
  scrollHeight = 0;
  scrollLeft = 0;
  scrollTop = 0;
  /** 가상 포커스를 실제 RN 포커스(TextInput 등)에 비추는 훅(선택). */
  focusObserver?: () => void;
  blurObserver?: () => void;
  /** position()의 계산 결과·CSS 변수 쓰기가 흐르는 표면(관찰 훅 동반). */
  style = new SdkStyle();
  /** 측정 주입 캐시 — 화면이 measureInWindow로 채워요(기본 0). */
  rect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };
  private attributes = new Map<string, string>();
  constructor(tag: string) {
    super();
    this.tagName = tag.toUpperCase();
    this.localName = tag.toLowerCase();
  }
  /** 속성 저장소 — toggleAttribute·starting/ending-style이 읽고 쓰는 계약.
   *  id는 registerById(field-set.js)가 el.id 속성으로 읽어요 — 동기 유지. */
  setAttribute(name: string, value = "") {
    this.attributes.set(name, String(value));
    if (name === "id") this.id = String(value);
    if (name === "tabindex") this.tabIndex = Number(value);
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
    if (name === "id") this.id = "";
    if (name === "tabindex") this.tabIndex = -1;
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
  /** order.js의 정렬 계약(& 4 = 뒤따름) — 생성 순서로 답해요. */
  compareDocumentPosition(other: unknown): number {
    if (!isSdkElement(other) || other === this) return 0;
    return other.#sequence > this.#sequence ? 4 : 2;
  }
  /** layers의 안쪽 판정·composedContains — 자신 또는 parentElement 체인. */
  contains(other: unknown): boolean {
    let at: SdkElement | undefined = isSdkElement(other) ? other : undefined;
    while (at) {
      if (at === this) return true;
      at = at.parentElement;
    }
    return false;
  }
  /** buttonElement(el)·opensElsewhere·isDisabledElement의 셀렉터 판별 —
   *  자기 요소 하나에 대해 간단 매처(태그·속성·:focus·:disabled). */
  matches(selector: string): boolean {
    return sdkMatchesSelector(this, selector);
  }
  /** 웹 popover top layer 계약 — RN에는 없으므로 no-op(try/catch 대신 정직). */
  showPopover() {}
  hidePopover() {}
  /** 자신 → parentElement 체인에서 처음 맞는 요소(ownsEvent의
   *  `closest('[data-slot="…"]') === el`·closest("form"·"label"·"[inert]")). */
  closest(selector: string): SdkElement | null {
    let at: SdkElement | undefined = this;
    while (at) {
      if (sdkMatchesSelector(at, selector)) return at;
      at = at.parentElement;
    }
    return null;
  }
  querySelector() {
    return null;
  }
  /** tabbables(root)(initialFocus 경로) — 빈 목록이 «포커스 대상 없음»의
   *  정직한 번역이에요(제거 경로가 content 자신으로 흘러요). */
  querySelectorAll() {
    return [] as unknown[];
  }
  /** focusedFrom(el)(닫힘 포커스 경로) — 문서 루트 모양으로 통과. */
  getRootNode() {
    return this.ownerDocument;
  }
  /** position()의 스크롤 경로 — no-op(추종은 rect 주입이 담당). */
  scrollTo() {}
  /** presence(애니메이션 종료 대기) — RN에서 애니메이션은 없음 */
  getAnimations() {
    return [];
  }
  /** 포인터 캡처 — drag 커널이 설정하지만 추적은 문서 리스너가 하므로 no-op. */
  setPointerCapture() {}
  releasePointerCapture() {}
  hasPointerCapture() {
    return false;
  }
  cloneNode() {
    return new SdkElement(this.localName);
  }
  /** 가상 포커스 — roving focusOn·popup initialFocus/returnFocus·slider
   *  thumb-input이 «focus() 뒤 activeElement가 그 요소인가»로 판정해요. */
  focus() {
    sdkSetFocus(this);
  }
  blur() {
    if (sdkActiveElement === this) sdkSetFocus(null);
  }
  /** 스크립트 클릭(DOM el.click() — isTrusted false·detail 0). */
  click() {
    this.dispatchEvent(sdkSyntheticEvent("click", { detail: 0, isTrusted: false }));
  }
  /** agent 브리지(2026-11-22): marks textOf가 childNodes를, svg 접근성 이름
   *  경로가 children을 순회해요 — 심어둔 텍스트가 없어 빈 배열이면 순회
   *  본문이 돌지 않아 RN에 없는 Node/Element 글로벌을 건드리지 않아요. */
  childNodes: unknown[] = [];
  children: unknown[] = [];
  /** agent isShown — hidden(속성·프로퍼티)·aria-hidden 마크가 없으면 보이는 것으로. */
  checkVisibility() {
    return (
      !this.hidden &&
      !this.hasAttribute("hidden") &&
      this.getAttribute("aria-hidden") !== "true"
    );
  }
  /** 동기 레이아웃 읽기 — 팝업·포커스 모드는 주입된 rect 캐시를 돌려줘요
   *  (팝업: «스타일이 곧 위치» web 의미 — P3 실증: 고정 rect를 돌려주면 추종
   *  마다 원점이 누적 드리프트해요. 포커스: slider 트랙이 누름 좌표를 값으로
   *  바꿀 때 트랙 rect를 읽어요). agent 모드와 측정 없는 일반 모드는 0
   *  직사각형이 정직한 답이에요. */
  getBoundingClientRect() {
    if (!sdkElementPopupMode && !sdkElementFocusMode) {
      return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
    const styleLeft = this.style.left;
    const styleTop = this.style.top;
    const left = typeof styleLeft === "string" ? parseFloat(styleLeft) || 0 : 0;
    const top = typeof styleTop === "string" ? parseFloat(styleTop) || 0 : 0;
    const x = styleLeft !== undefined ? left : this.rect.x;
    const y = styleTop !== undefined ? top : this.rect.y;
    return {
      x,
      y,
      width: this.rect.width,
      height: this.rect.height,
      top: y,
      left: x,
      right: x + this.rect.width,
      bottom: y + this.rect.height,
    };
  }
  /** renderedRect(position.js) — rect 목록이 있으면 «렌더됨» 판정. */
  getClientRects() {
    return [this.getBoundingClientRect()];
  }
  get clientLeft() {
    return 0;
  }
  get clientTop() {
    return 0;
  }
  get clientWidth() {
    return this.rect.width;
  }
  get clientHeight() {
    return this.rect.height;
  }
  get offsetWidth() {
    return this.rect.width;
  }
  get offsetHeight() {
    return this.rect.height;
  }
  /** 요소 발송 — 가상 트리 경로로 캡처→대상→버블. 반환값은 DOM과 같이
   *  «취소되지 않음»(!defaultPrevented). */
  dispatchEvent(event: SdkEvent): boolean {
    sdkDispatch(this, event);
    return !(event.cancelable && event.defaultPrevented);
  }
  // --- M2-③ 폼 표면(이슈 #40) — input 계열의 요소 계약 ---------------------
  /** watchValue(value.js)의 intercept가 «own ?? prototype» 서술자를 읽어요
   *  — 프로토타입 접근자여야 writeValue의 asUser 경로(prototypeValue.set)
   *  도 통과해요. 인스턴스 필드로 두면 own 서술자가 먼저 잡혀 그 경로가
   *  죽어요(실측 — HTMLInputElement.value도 프로토타입 접근자예요). */
  #value = "";
  get value() {
    return this.#value;
  }
  set value(next: unknown) {
    this.#value = String(next);
  }
  /** input bind의 비제어 초기 판정(el.value === "" && el.defaultValue === ""). */
  defaultValue = "";
  /** registerById(field-set.js)가 el.id를 읽고 attrs가 id를 써요 — 속성과
   *  속성이 같은 값을 보게 동기. */
  id = "";
  /** reset 리스너의 event.target !== el.form 판정 — 폼 요소는 없으니 null. */
  form: unknown = null;
  name = "";
  type = "text";
  required = false;
  /** validityOf(field-control.js)가 읽는 검증 표면 — willValidate가 거짓이면
   *  커널이 건너뛰어요(DOM 발견 기반 검증은 가상 트리가 없어 항상 비어요 —
   *  외부 invalid가 구동해요). */
  willValidate = false;
  validity = { valid: true };
  validationMessage = "";
  setCustomValidity() {}
}

// ---------------------------------------------------------------------------
// 가상 문서·창 — 커널이 글로벌 document·window·`el.ownerDocument.defaultView`로
// 닿는 표면. 둘 다 실 이벤트 대상(SdkEventTarget)이라 modality 설치·layers
// listen()·bindDrag의 문서 리스너가 «등록만»이 아니라 실제로 불려요. 화면이
// 뷰포트를 setSdkViewport로 제공해요(RN: Dimensions, 프로브: 고정값).
// ---------------------------------------------------------------------------
type SdkViewportReader = () => { width: number; height: number };

let sdkViewport: SdkViewportReader = () => ({ width: 0, height: 0 });

/** 뷰포트 제공자 — documentElement.clientWidth/Height·window.innerWidth/Height
 *  이 이 값을 돌려줘요(position()의 배치 판정·lockScroll의 스크롤바 폭 계산). */
export function setSdkViewport(read: SdkViewportReader): void {
  sdkViewport = read;
}

export class SdkDocumentClass extends SdkEventTarget {
  /** modal.js의 inert 대상(body.children는 비어 no-op)·문서 루트 마커. */
  readonly body: SdkElement = new SdkElement("body");
  /** lockScroll의 setStyle 대상(overflow·--scrollbar-width) — 치수는 뷰포트 제공자. */
  readonly documentElement: SdkElement = new SdkElement("html");
  pointerLockElement: unknown = null;
  exitPointerLock() {}
  constructor() {
    super();
    for (const key of ["clientWidth", "offsetWidth", "scrollWidth"] as const) {
      Object.defineProperty(this.documentElement, key, {
        get: () => sdkViewport().width,
        configurable: true,
      });
    }
    for (const key of ["clientHeight", "offsetHeight", "scrollHeight"] as const) {
      Object.defineProperty(this.documentElement, key, {
        get: () => sdkViewport().height,
        configurable: true,
      });
    }
  }
  get defaultView(): SdkWindowClass {
    return SdkWindow;
  }
  /** 가상 포커스 레지스트리 — roving focusOn·popup 초점 계획의 판정 기준. */
  get activeElement(): SdkElement | null {
    return sdkActiveElement;
  }
  get hidden() {
    return false;
  }
  hasFocus() {
    return true;
  }
  /** focusedFrom(el) 등의 선택 판정 — 트리가 없어 «선택 없음». */
  getSelection() {
    return null;
  }
  getElementById(): SdkElement | null {
    return null;
  }
  querySelector(): SdkElement | null {
    return null;
  }
  querySelectorAll(): SdkElement[] {
    return [];
  }
  /** valueMissingMessage 캐시 등이 요소를 만들어요(문서 존재 시). */
  createElement(tag: string): SdkElement {
    return new SdkElement(tag);
  }
  /** marks 텍스트 순회 — SdkElement는 childNodes가 비어 빈 순회로 충분해요. */
  createTreeWalker() {
    return { nextNode: () => null };
  }
  dispatchEvent(event: SdkEvent): boolean {
    sdkDispatch(this, event);
    return !(event.cancelable && event.defaultPrevented);
  }
}

export class SdkWindowClass extends SdkEventTarget {
  visualViewport: unknown = null;
  get document(): SdkDocumentClass {
    return SdkDocument;
  }
  /** position()·scrollbar.js가 읽는 계산 스타일 — 요소가 가진 style 객체
   *  그대로(SdkElement면 SdkStyle, 소비자 표면이면 그 표면의 style). 커널은
   *  자기가 쓴 left/top을 getComputedStyle로 되읽어 원점을 잡아요
   *  (position.js `origin`) — 빈 객체를 돌려주면 갱신마다 0px로 덮어써요. */
  getComputedStyle(element: unknown): SdkStyle {
    if (isSdkElement(element)) return element.style;
    const style = (element as { style?: unknown } | null | undefined)?.style;
    return typeof style === "object" && style !== null && "setProperty" in style
      ? (style as SdkStyle)
      : new SdkStyle();
  }
  get innerWidth() {
    return sdkViewport().width;
  }
  get innerHeight() {
    return sdkViewport().height;
  }
  scrollY = 0;
  scrollX = 0;
  /** bindDrag의 rAF flush — 글로벌 rAF(RN·bun 폴리필)에 위임, 없으면 타이머. */
  requestAnimationFrame(callback: (time: number) => void): number {
    if (typeof requestAnimationFrame === "function") {
      return requestAnimationFrame(callback);
    }
    return setTimeout(() => callback(Date.now()), 16) as unknown as number;
  }
  cancelAnimationFrame(handle: number) {
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(handle);
    else clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
  }
  /** 커널이 `view.setTimeout`으로 지연 정리를 건다(swallowNextClick·frames 등). */
  setTimeout(callback: (...args: unknown[]) => void, ms?: number, ...args: unknown[]): number {
    return (setTimeout as (...a: unknown[]) => number)(callback, ms, ...args);
  }
  clearTimeout(handle: unknown) {
    (clearTimeout as (h: unknown) => void)(handle);
  }
  dispatchEvent(event: SdkEvent): boolean {
    sdkDispatch(this, event);
    return !(event.cancelable && event.defaultPrevented);
  }
}

export const SdkDocument: SdkDocumentClass = new SdkDocumentClass();
export const SdkWindow: SdkWindowClass = new SdkWindowClass();

/** 정의 가능하면 defineProperty(읽기 전용 getter 교체), 아니면 대입. */
function sdkDefine(target: Record<string, unknown>, key: string, value: unknown): void {
  try {
    Object.defineProperty(target, key, { value, configurable: true, writable: true });
  } catch {
    target[key] = value;
  }
}

function sdkDefineGetter(target: Record<string, unknown>, key: string, get: () => number): void {
  try {
    Object.defineProperty(target, key, { get, configurable: true });
  } catch {
    // 읽기 전용이면 포기 — 설치자의 창 싱글턴이 여전히 정답.
  }
}

let sdkEventGlobalsInstalled = false;

/** 문서·창·브랜드 글로벌 설치 — «코어 import 뒤·인스턴스 생성 전» 모듈 스코프에서
 *  한 번. env.js의 isBrowser는 import 시점에 확정되므로(RN·bun: false) 뒤늦은
 *  설치가 플래그를 바꾸지 않고, 커널 감시자(modality install — 한 번만)·
 *  layers listen()은 살아 있는 레지스트리에 등록돼요. 실브라우저(Expo web·
 *  Next.js)는 네이티브 문서가 정답이라 아무것도 바꾸지 않아요. 되돌리지 않아요. */
export function installSdkEventGlobals(): void {
  const g = globalThis as Record<string, unknown>;
  if (sdkEventGlobalsInstalled) return;
  sdkEventGlobalsInstalled = true;
  if (typeof g.Document === "function" && g.document instanceof g.Document) return;

  installSdkFormGlobals();
  // instanceof 브랜드 — pressedScrollbar(Element)·raiseAbovePopups(HTMLElement)·
  // opensElsewhere(MouseEvent)·toolbar(KeyboardEvent) 등 «네이티브 아님» 분기가
  // TypeError 없이 false로 흐르게. 이벤트 브랜드는 SdkEvent 그 자체(합성 이벤트가
  // 통과해야 하는 분기 — tab press의 opensElsewhere).
  for (const name of [
    "Element",
    "HTMLElement",
    "ShadowRoot",
    "Document",
    "HTMLFormElement",
    "HTMLFieldSetElement",
    "HTMLDialogElement",
    "HTMLAnchorElement",
  ]) {
    if (typeof g[name] !== "function") g[name] = class {};
  }
  for (const name of ["MouseEvent", "KeyboardEvent", "PointerEvent"]) {
    if (typeof g[name] !== "function") g[name] = SdkEvent;
  }
  // 커널이 직접 만드는 이벤트(form.js·value.js의 `new Event("input")`, events.js의
  // selectEvent)도 발송 엔진을 지나야 해요 — bun의 네이티브 Event는 target가
  // 읽기 전용이라 대입이 터져요. 비브라우저 런타임에서는 SdkEvent로 통일해요.
  g.Event = SdkEvent;
  if (typeof g.InputEvent !== "function") g.InputEvent = SdkEvent;
  if (typeof g.NodeFilter === "undefined") g.NodeFilter = { SHOW_TEXT: 4 };
  if (typeof g.CSS !== "object" || g.CSS === null) {
    g.CSS = { escape: sdkCssEscape, supports: () => false };
  }

  g.document = SdkDocument;
  if (typeof g.window === "undefined") {
    // bun 등 창이 없는 런타임 — 싱글턴을 그대로.
    g.window = SdkWindow;
  } else {
    // RN: window === globalThis. noop 스텁이 먼저 왔을 수 있으니 «교체»로 깔아요.
    const win = g.window as Record<string, unknown>;
    for (const name of ["addEventListener", "removeEventListener", "dispatchEvent"] as const) {
      sdkDefine(win, name, (SdkWindow[name] as (...args: unknown[]) => unknown).bind(SdkWindow));
    }
    if (typeof win.getComputedStyle !== "function") {
      sdkDefine(win, "getComputedStyle", SdkWindow.getComputedStyle.bind(SdkWindow));
    }
    if (typeof win.innerWidth !== "number") {
      sdkDefineGetter(win, "innerWidth", () => SdkWindow.innerWidth);
    }
    if (typeof win.innerHeight !== "number") {
      sdkDefineGetter(win, "innerHeight", () => SdkWindow.innerHeight);
    }
    if (win.visualViewport === undefined) sdkDefine(win, "visualViewport", null);
  }
  // scrollbar.js가 전역 getComputedStyle를 읽어요(창 경유 없이).
  if (typeof g.getComputedStyle !== "function") {
    g.getComputedStyle = SdkWindow.getComputedStyle.bind(SdkWindow);
  }
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

// ---------------------------------------------------------------------------
// 하드웨어 키 호스트 계약 — 브리지 View/Pressable의 focusable·onKeyDown을
// 커널 발송으로 잇는 어댑터(«다 go» 하드웨어 키 마일스톤). Android는 RN 0.88
// W3C 규격 View onKeyDown(MainApplication의 enableKeyEvents 레시피 — 이슈
// #19 §1.2), 웹은 DOM keydown이 BridgeKeyEvent 형태로 그대로 와요. iOS는
// 브리지 계약 부재(#19 §1.3)로 이 어댑터가 불리지 않아요.
//
// 소유권 계약(«컨테이너 전략»): 키를 받는 뷰는 «목록 파트 하나»를 focusable로
// 두고 항목 뷰는 포커스 불가로 유지해요 — 네이티브 화살표 탐색이 항목 사이를
// 움직이지 않으므로(움직일 focusable이 없음) 방향키 소유권이 커널 roving에
// 단독으로 남아요. 이슈 #19 스파이크 §2.2의 실측(방향키를 JS 루빙과 네이티브
// 탐색이 함께 움직여 끝 항목에서 갈림)을 우회하는 계약이에요. 항목 활성화는
// 커널 keydown이 처리해요(Enter/Space — 파트 요소 태그가 BUTTON이 아니라
// 커널이 preventDefault 후 직접 선택).
// ---------------------------------------------------------------------------
/** 브리지 onKeyDown(BridgeKeyEvent — 구조적 타이핑)에서 쓰는 필드. */
export type SdkHostKeyEvent = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
};

export type SdkKeyHostProps = {
  /** 브리지 View/Pressable에 그대로 펼쳐요 — 키 수신 조건(Android)·웹 tabIndex */
  focusable: true;
  onKeyDown: (event: SdkHostKeyEvent) => void;
  onKeyUp: (event: SdkHostKeyEvent) => void;
  /** 실 포커스 진입 — focusElement() 요소를 가상 포커스로 만들어요(판독·
   *  커널의 activeElement 판정 동기). */
  onFocus: () => void;
  /** 실 포커스 이탈 — 가상 포커스가 그 요소에 있으면 내려놔요. */
  onBlur: () => void;
};

export function sdkKeyHostProps(options: {
  /** 키 발송 대상 — 매 입력마다 읽어요(stop은 커널이 바꾸므로 발송 시점 값). */
  event: () => { element: unknown; target?: unknown };
  /** 실 포커스 진입 시 가상 포커스로 만들 요소(생략하면 동기화하지 않아요). */
  focusElement?: () => unknown;
}): SdkKeyHostProps {
  const send = (type: "keydown" | "keyup", source: SdkHostKeyEvent) => {
    const { element, target } = options.event();
    if (!isSdkElement(element)) return;
    fireSdkEvent(element, type, {
      key: source.key,
      ctrlKey: source.ctrlKey === true,
      altKey: source.altKey === true,
      metaKey: source.metaKey === true,
      shiftKey: source.shiftKey === true,
      repeat: source.repeat === true,
      ...(target !== undefined ? { target } : {}),
    });
  };
  return {
    focusable: true,
    onKeyDown: (event) => send("keydown", event),
    onKeyUp: (event) => send("keyup", event),
    onFocus: () => {
      const el = options.focusElement?.();
      if (isSdkElement(el)) el.focus();
    },
    onBlur: () => {
      const el = options.focusElement?.();
      if (isSdkElement(el) && el === SdkDocument.activeElement) el.blur();
    },
  };
}

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
  /** 바인딩된 가상 요소(SdkElement) — 팝업 계열 화면이 rect 주입·style
   *  observer 설치·속성 판독에, 키·제스처 화면이 parentElement 연결·
   *  focusObserver 설치에 써요(M2-② #39·#41). 바인딩 생명주기와 1:1. */
  sdkElement: SdkElement;
  /** 브리지 프리미티브로 번역된 props */
  bridgeProps: SdkBridgeProps;
  /** 합성 이벤트 발송 — 가상 트리 경로(캡처→대상→버블)로. init.target에
   *  다른 요소(목록 파트가 항목을 대상으로 하는 키)를 넣을 수 있어요.
   *  반환값은 defaultPrevented */
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

  const sdkElementRef = React.useRef<SdkElement | null>(null);
  // 바인딩은 layout effect에서 일어나지만 sdkElement는 렌더 시 캡처돼요.
  // 마운트 외 상태 변화가 없으면(비제어 input 등) 바인딩 후 재렌더가
  // 없어 sdkElement가 영구 null로 보여요(기기 실측 — 타이핑 주입이 요소를
  // 못 찾음). 바인딩이 요소를 노출하면 한 번 흔들어 구독 렌더에 반영한다.
  const [, shakeElement] = React.useReducer((c: number) => c + 1, 0);
  const elementSeenRef = React.useRef(false);
  React.useLayoutEffect(() => {
    const bound = bindSdkPart(
      kernel,
      props,
      compute().domAttrs,
      String((instance.get() as Record<string, unknown>).element ?? "unknown"),
    );
    sdkElementRef.current = bound.element;
    if (!elementSeenRef.current) {
      elementSeenRef.current = true;
      shakeElement();
    }
    return () => {
      sdkElementRef.current = null;
      elementSeenRef.current = false;
      bound.unbind();
    };
  }, [instance]);

  const current = compute();
  lastRef.current = current;

  const fire = React.useCallback(
    (eventName: string, init: SdkSyntheticEventInit = {}) => {
      const element = sdkElementRef.current;
      if (element) return fireSdkEvent(element, eventName, init).defaultPrevented;
      // 바인딩 전(레이아웃 이펙트 이전) — 커널 핸들러 직행(옛 경로).
      const event = sdkSyntheticEvent(eventName, init);
      const map = handlers(kernel) as Record<
        string,
        ((event: SdkEvent) => void) | undefined
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
    sdkElement: sdkElementRef.current as SdkElement,
    bridgeProps: sdkBridgeProps(current.domAttrs, current.element),
    fire,
    press: () => fire("click"),
  };
}

/**
 * React Compiler 환경에서도 `instance.get()` 변이가 누락되지 않도록
 * `useSyncExternalStore`로 커널 상태를 구독하고 직전 파생값과 동등하면 참조를 유지한다.
 */
export function useSdkSnapshot<T>(
  instance: SdkPrimitiveInstance,
  selector: (state: unknown) => T,
  slot = "root",
): T {
  const part = instance.part(slot, EMPTY_PROPS, true);
  const kernel = part as never;
  const selectorRef = React.useRef(selector);
  React.useLayoutEffect(() => {
    selectorRef.current = selector;
    commit(kernel, EMPTY_PROPS);
  });

  const cacheRef = React.useRef<{ hasValue: boolean; value: T }>({
    hasValue: false,
    value: undefined as T,
  });

  const subscribeSnapshot = React.useCallback(
    (onStoreChange: () => void) => subscribe(kernel, onStoreChange),
    [kernel],
  );

  const getSnapshot = React.useCallback((): T => {
    const next = selectorRef.current(instance.get());
    if (cacheRef.current.hasValue && sameSnapshot(cacheRef.current.value, next)) {
      return cacheRef.current.value;
    }
    cacheRef.current = { hasValue: true, value: next };
    return next;
  }, [instance]);

  return React.useSyncExternalStore(
    subscribeSnapshot,
    getSnapshot,
    getSnapshot,
  );
}

function sameSnapshot<T>(a: T, b: T): boolean {
  if (sameValue(a, b)) return true;
  if (
    a !== null &&
    b !== null &&
    typeof a === "object" &&
    typeof b === "object" &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    return sameSlotState(
      a as Record<string, unknown>,
      b as Record<string, unknown>,
    );
  }
  return false;
}

function attrsEqual(a: Attrs, b: Attrs): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!sameValue(a[key], b[key])) return false;
  }
  return true;
}
