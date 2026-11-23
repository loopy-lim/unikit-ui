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
//     M2-②(이슈 #39)에서 팝업 표면을 추가했어요 — SdkElement에 rect 캐시
//     ·SdkStyle(observer)·nodeType·client/offset 치수·querySelectorAll
//     ·contains·getRootNode·showPopover no-op·nextElementSibling, 문서 스텁에
//     activeElement·getSelection. 팝업 모드 플래그(setSdkElementPopupMode)가
//     isConnected를 켜고, useSdkPart 출력이 바인딩된 요소(sdkElement)를
//     노출해요 — 화면이 measureInWindow로 rect를 주입하고 style observer로
//     position() 계산 결과를 RN 화면으로 옮겨요(P2/P3 FakeElement 패턴의
//     렌더러 이식).
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
 *  M2-②(이슈 #39) 팝업 표면 — createPopup 계열이 요구하는 나머지 멤버예요:
 *  5. rect 캐시·SdkStyle(observer)·nodeType·client/offset 치수·
 *     getClientRects·querySelectorAll([])·contains(false)·getRootNode·
 *     showPopover/hidePopover no-op·nextElementSibling — position() 배치와
 *     popup layer attach가 읽는 전부. rect는 화면이 measureInWindow로
 *     주입하고(팝업 모드), getBoundingClientRect는 «스타일이 곧 위치»
 *     web 의미로 style.left/top에서 x/y를 유도해요(P3 origin-drift 방어).
 *  나머지 멤버는 watchFormDisabled·press(roving)·keyClick이 도달할 수 있는 방어
 *  경로예요. instanceof 브랜드 검사(HTMLFieldSetElement 등)는 parentElement
 *  순환 전에 끝나 RN에 없는 글로벌 참조 없이 통과해요. */
const SdkDocument = {
  addEventListener() {},
  removeEventListener() {},
  /** popup layer의 focus 경로(activeElement 읽기) — 항상 «없음»이 정직해요.
   *  RN에는 문서 포커스 개념이 없어요(가상 포커스는 M2-⑥ 과제). */
  activeElement: null,
  /** returnFocus의 caret 복원 경로 — 선택 영역 없음으로 통과해요. */
  getSelection: () => null,
  /** valueMissingMessage(forms/form.js) 캐시 — 문서가 있으면 생성해요.
   *  검증 메시지는 빈 문자열로 정직해요(가상 요소의 검증은 외부 구동). */
  createElement(tag: string) {
    return {
      tagName: String(tag).toUpperCase(),
      type: "text",
      name: "",
      required: true,
      validationMessage: "",
    };
  },
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
// 팝업 모드(M2-② 이슈 #39) — 같은 옵트인 방식의 별도 플래그예요. createPopup
// 계열의 요소 조회(context.element·elements()·popup layer의 bind 시작
// 조건)가 el.isConnected를 요구해요. 팝업 모드에서는 측정이 «주입된 rect
// 캐시»로 성립해요(아래 SdkElement.rect — FakeElement 패턴, P2/P3 실증) —
// 동기 읽기가 아니라 화면이 measureInWindow(비동기)로 채운 캐시를 읽어요.
// ---------------------------------------------------------------------------
let sdkElementAgentMode = false;
let sdkElementPopupMode = false;
let sdkElementFormMode = false;

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

/** 폼 슬라이스(M2-③ 이슈 #40)가 읽는 이벤트 최소형 — writeValue의 asUser
 *  경로가 `new Event("input")`로 발송해요. dispatchEvent(SdkElement)가
 *  요소 리스너로 전달해요. */
export class SdkEvent {
  type: string;
  bubbles: boolean;
  composed: boolean;
  cancelable: boolean;
  defaultPrevented = false;
  isTrusted = false;
  target: unknown = null;
  constructor(type: string, init: { bubbles?: boolean; composed?: boolean; cancelable?: boolean } = {}) {
    this.type = type;
    this.bubbles = init.bubbles === true;
    this.composed = init.composed === true;
    this.cancelable = init.cancelable === true;
  }
  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }
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
 *  (SdkEvent). 커널의 브랜드 검사는 queueMicrotask에서도 흐러요(field의
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
 *  일반 슬롯의 CSS 변수 쓰기(segmented indicator)도 같은 표면을 써요. */
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

export class SdkElement {
  /** bound() 필터가 읽는 연결 사실 — agent·popup 모드에서만 true. */
  get isConnected() {
    return sdkElementAgentMode || sdkElementPopupMode || sdkElementFormMode;
  }
  /** position()이 앵커 판별에 쓰는 노드 종류("nodeType" in anchor). */
  nodeType = 1;
  tagName: string;
  parentElement: SdkElement | undefined = undefined;
  nextElementSibling: SdkElement | undefined = undefined;
  previousElementSibling: SdkElement | undefined = undefined;
  ownerDocument = SdkDocument;
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
    this.tagName = tag.toUpperCase();
  }
  /** 속성 저장소 — toggleAttribute·starting/ending-style이 읽고 쓰는 계약.
   *  id는 registerById(field-set.js)가 el.id 속성으로 읽어요 — 동기 유지. */
  setAttribute(name: string, value = "") {
    this.attributes.set(name, String(value));
    if (name === "id") this.id = String(value);
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
    if (name === "id") this.id = "";
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
  /** 웹 popover top layer 계약 — RN에는 없으므로 no-op(try/catch 대신 정직). */
  showPopover() {}
  hidePopover() {}
  /** watchFormDisabled·label 탐색 — 값이 없으면 무시하는 경로 */
  closest() {
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
  /** 레이어 트리 판정(composedContains·findLayer) — RN 요소 트리가 없어
   *  «포함하지 않음»으로 흘러요. */
  contains() {
    return false;
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
  /** press(roving)·keyClick(Space/Enter)이 쓰는 경로 — RN에서는 no-op */
  focus() {}
  click() {}
  /** agent 브리지(2026-11-22): marks textOf가 childNodes를, svg 접근성 이름
   *  경로가 children을 순회해요 — 심어둔 텍스트가 없어 빈 배열이면 순회
   *  본문이 돌지 않아 RN에 없는 Node/Element 글로벌을 건드리지 않아요. */
  childNodes: unknown[] = [];
  children: unknown[] = [];
  /** agent isShown — hidden·aria-hidden 마크가 없으면 보이는 것으로. */
  checkVisibility() {
    return !this.hasAttribute("hidden") && this.getAttribute("aria-hidden") !== "true";
  }
  /** 동기 레이아웃 읽기 — 팝업 모드는 «스타일이 곧 위치» web 의미(P3 실증:
   *  고정 rect를 돌려주면 추종마다 원점이 누적 드리프트해요). agent 모드와
   *  측정 없는 일반 모드는 0 직사각형이 정직한 답이에요. */
  getBoundingClientRect() {
    if (!sdkElementPopupMode) {
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
  /** 요소 이벤트 레지스트리 — kernel on(el, "input", typed)가 등록해요.
 *  화면은 value 쓰기 + dispatchEvent(new SdkEvent("input"))로 타이핑을
   *  주입해요(part.fire은 커널 파트 핸들러 경로로, 이 채널과 별개예요). */
  private listeners = new Map<string, Set<(event: unknown) => void>>();
  addEventListener(type: string, listener: (event: unknown) => void) {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: (event: unknown) => void) {
    this.listeners.get(type)?.delete(listener);
  }
  dispatchEvent(event: { type: string }) {
    for (const listener of this.listeners.get(event.type) ?? []) {
      (listener as (e: unknown) => void)(event);
    }
    return true;
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
  /** 바인딩된 가상 요소(SdkElement) — 팝업 계열 화면이 rect 주입·style
   *  observer 설치·속성 판독에 써요(M2-② #39). 바인딩 생명주기와 1:1. */
  sdkElement: SdkElement;
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
  const sdkElementRef = React.useRef<SdkElement | null>(null);
  // 바인딩은 layout effect에서 일어나지만 sdkElement는 렌더 시 캡처돼요.
  // 마운트 외 상태 변화가 없으면(비제어 input 등) 바인딩 후 재렌더가
  // 없어 sdkElement가 영구 null로 보여요(기기 실측 — 타이핑 주입이 요소를
  // 못 찾음). 바인딩이 요소를 노출하면 한 번 흔들어 구독 렌더에 반영한다.
  const [, shakeElement] = React.useReducer((c: number) => c + 1, 0);
  const elementSeenRef = React.useRef(false);
  React.useLayoutEffect(() => {
    // RN 0.88 내장 MutationObserver(childList 전용 폴리필)과 커널 followId의
    // attributeFilter 계약 충돌을 피해 바인딩 동안만 전역을 교체한다 —
    // undefined 대신 no-op 클래스로(M2-② #39): moves.js(position()의 추적
    // 등록)가 가드 없이 `new MutationObserver(...)`로 생성하기 때문. no-op도
    // «아무것도 발화하지 않는다»는 마스킹의 효과를 그대로 유지해요(RN 가상
    // 요소는 DOM 변이를 일으키지 않아요). 바인딩이 없는 런타임(bun 등)은
    // typeof 가드로 그냥 통과.
    const globalScope = globalThis as { MutationObserver?: unknown };
    const saved = globalScope.MutationObserver;
    class SilentObserver {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    globalScope.MutationObserver = SilentObserver;
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
      // 프레임워크 렌더러의 «host에 attrs 적용» 등가 — registerById(field)가
      // bind 시점의 el.id를 읽고 isRequired 등이 요소 속성을 읽어요. 계산된
      // domAttrs(id·role·data-*)를 바인딩 전에 심어요(웹과 같은 순서).
      for (const [name, value] of Object.entries(compute().domAttrs)) {
        if (value !== undefined && value !== null) {
          element.setAttribute(name, value);
        }
      }
      sdkElementRef.current = element;
      bindElement(element as never);
      if (!elementSeenRef.current) {
        elementSeenRef.current = true;
        shakeElement();
      }
    } finally {
      globalScope.MutationObserver = saved;
    }
    return () => {
      sdkElementRef.current = null;
      elementSeenRef.current = false;
      bindElement(null);
    };
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
    sdkElement: sdkElementRef.current as SdkElement,
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
