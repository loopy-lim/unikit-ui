// ui-sdk 계약 프로브 — «다 go» 로드맵 M0 산출물(상시 검증).
// 실행: packages/unikit에서 `bun run probe:ui-sdk`
//
// 목적: @ui-sdk/core를 고정 버전(package.json 0.1.0-beta.6 — caret 금지,
// beta churn은 renderer 비공개 API를 바꿀 수 있어 수동 승급 + 이 프로브
// 재실행이 계약이에요)에서 소비하는 RN 어댑터(src/behaviors/
// ui-sdk-renderer.ts)가 세운 가정 3종이 여전히 성립하는지 매번 검증한다.
//
//   1. renderer 비공개 진입점이 어댑터가 쓰는 심볼 10종(attrs·handlers·
//      present·partState·subscribe·commit·ref·keep·release·unwatched)을
//      export하는가.
//   2. toggle 상태 기계가 DOM 없는 런타임(bun)에서 파트 계약으로 완전
//      동작하는가 — 스파이크(이슈 #17)가 기기로 실증한 흐름의 상시 재현.
//   3. checkbox root+indicator(+input) 슬롯 bind·press — 슬롯 전부를 소비해야
//      닿는 indicator bind의 toggleAttribute 경로와 hidden input bind의
//      ownerDocument 리스너까지 (M1 기기 회귀 2건 재현 + input 보강).
//   4. M2-① 상태기계+press 슬라이스(이슈 #37)의 전 슬롯 소비 — button(root)·
//      switch(root·input·thumb)·radio(group·root·input·indicator)·
//      segmented-control(root·item·input·indicator). "요소 표면은 슬롯
//      전부를 소비해야 측정된다"(M1 회귀 교훈) — root만 검사하면 hidden input
//      bind(associate→ownerDocument 리스너)·그룹 bind(bindRadioGroup)·thumb
//      상태·indicator bind(bindIndicator→style 쓰기) 경로가 아예 실행되지
//      않는다. 슬롯 멤버 실측 근거는 이슈 #37 PR 본문.
//
// bun 런타임에는 MutationObserver가 없어 RN 0.88 폴리필과의 충돌 경로
// (followId 마스킹 — 어댑터 참조)가 원래 발생하지 않는다. 반대로 RN·웹에
// 항상 있는 requestAnimationFrame이 bun에는 없어(checkbox indicator의
// animateIn이 사용) 타이머 기반 최소 폴리필을 깔고 시작한다 — 어댑터 쪽에는
// 불필요하다(RN·웹 런타임이 모두 네이티브 제공). 기기 쪽 계약은
// apps/expo uisdk-toggle 화면이 담당한다.
const globalScope = globalThis as {
  requestAnimationFrame?: unknown;
  cancelAnimationFrame?: unknown;
};
globalScope.requestAnimationFrame ??= (cb: (t: number) => void) =>
  setTimeout(() => cb(Date.now()), 16) as unknown as number;
globalScope.cancelAnimationFrame ??= (id: unknown) =>
  clearTimeout(id as number);
import {
  attrs,
  commit,
  handlers,
  keep,
  partState,
  present,
  ref,
  release,
  subscribe,
  unwatched,
} from "@ui-sdk/core/renderer";
import { toggle } from "@ui-sdk/core/toggle";
import { checkbox } from "@ui-sdk/core/checkbox";
import { switchPrimitive } from "@ui-sdk/core/switch";
import { button } from "@ui-sdk/core/button";
import { radioGroup } from "@ui-sdk/core/radio";
import { segmentedControl } from "@ui-sdk/core/segmented-control";
import { input } from "@ui-sdk/core/input";
import { field } from "@ui-sdk/core/field";
// 제품 에이전트 진입점을 직접 소비한다(섹션 8) — 프로브는 계약을 검증하는
// 소비자 역할.
import { createSdkAgent, installSdkAgentDom } from "../src/behaviors/ui-sdk-agent";
// M2-③ 폼 글로벌 설치 — 제품 렌더러 export(화면과 같은 경로로 소비).
import { installSdkFormGlobals, typeSdkValue } from "../src/behaviors/ui-sdk-renderer";

/** hidden input bind(associate)·그룹 bind(bindRadioGroup)가 리스너를 붙이는
 *  최소 문서 — reset·pointerdown 이벤트는 bun·RN 런타임에 오지 않아요. */
const FakeDocument = {
  addEventListener() {},
  removeEventListener() {},
};

/** 어댑터가 요소 계약으로 세운 최소 형태 — ui-sdk-renderer.ts SdkElement와 같은 명세 */
class FakeElement {
  isConnected = false;
  tagName: string;
  parentElement: FakeElement | undefined = undefined;
  ownerDocument = FakeDocument;
  /** segmented-control indicator bind의 CSS 변수 쓰기(write) — 측정이
   *  없으면(isConnected false → 활성 항목 없음) 제거 경로만 와요. */
  style = {
    setProperty() {},
    removeProperty() {},
  };
  private attributes = new Map<string, string>();
  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
  }
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
  matches() {
    return false;
  }
  closest() {
    return null;
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
  getAnimations() {
    return [];
  }
  focus() {}
  click() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
  /** 에이전트 브리지 미러 — 제품 SdkElement(ui-sdk-renderer) agent 모드와
   *  같은 명세: checkVisibility(isShown)·getBoundingClientRect(0 직사각형)·
   *  빈 자식 순회(childNodes/children — Node/Element 글로벌 없이 통과).
   *  isConnected는 섹션 8에서 true로 바꿔 bound() 필터를 통과시킨다. */
  checkVisibility() {
    return !this.hasAttribute("hidden") && this.getAttribute("aria-hidden") !== "true";
  }
  getBoundingClientRect() {
    return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
  childNodes: unknown[] = [];
  children: unknown[] = [];
}

/** 프레임워크 렌더러 선언 — 비-attaches 이벤트를 요소에 직접 붙이지 않는다 */
const host = { by: "framework", attaches: ["click", "keydown", "keyup"] } as const;

let failed = 0;
function hard(name: string, ok: boolean, detail = "") {
  if (!ok) failed += 1;
  console.log(`  [${ok ? "OK" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

/** core 핸들러가 읽는 이벤트 최소형(defaultPrevented·preventDefault) */
function syntheticClick() {
  const event = { defaultPrevented: false } as {
    defaultPrevented: boolean;
    preventDefault(): void;
  };
  event.preventDefault = () => {
    event.defaultPrevented = true;
  };
  return event as unknown as Event;
}

type Attrs = Record<string, string | undefined>;

// --- 1. renderer 심볼 10종 -------------------------------------------------
console.log("(1) renderer 비공개 심볼 10종");
const symbols = { attrs, commit, handlers, keep, partState, present, ref, release, subscribe, unwatched };
for (const [name, fn] of Object.entries(symbols)) {
  hard(`renderer.${name}`, typeof fn === "function");
}

// --- 2. toggle 완전 흐름(헤드리스) ------------------------------------------
console.log("(2) toggle 파트 계약 — 스파이크 흐름 재현");
{
  const instance = unwatched(() => toggle({ id: "probe-toggle" }));
  keep(instance);
  const part = instance.part("root", {}, true);
  commit(part, {});
  hard("instance.part('root')·commit", true);

  const state = instance.get();
  hard("present(root) === true", present(part, {}, state) === true);

  const domAttrs = attrs(part, {}, state) as Attrs;
  hard("attrs aria-pressed='false'", domAttrs["aria-pressed"] === "false", JSON.stringify(domAttrs));

  const snapshot = partState(part, {}, state) as { pressed: boolean };
  hard("partState.pressed === false", snapshot.pressed === false);

  // 바인딩 요소는 어댑터(ui-sdk-renderer.ts useSdkPart)와 동일하게 인스턴스
  // 상태에서 시작 — 초기값 "unknown"이라 buttonElement(el)의 el.matches
  // 경로(foundation/platform/button.js 8:17)를 반드시 지나가요. M1 첫 리로드에
  // 이 멤버가 없어 화면이 죽던 회귀(2026-11-21 기기 실측)의 상시 재현 지점.
  const bindElement = ref(part, host);
  const elementBefore = (instance.get() as { element?: string }).element ?? "unknown";
  hard("초기 state.element === 'unknown'", elementBefore === "unknown", elementBefore);
  bindElement(new FakeElement(elementBefore) as unknown as HTMLElement);
  // matches 거짓 → "other" 분류 → 역할 합성(role="button") 계약.
  const elementAfter = (instance.get() as { element?: string }).element;
  hard("bind 후 element === 'other'", elementAfter === "other", String(elementAfter));

  let notified = 0;
  const unsubscribe = subscribe(part, () => {
    notified += 1;
  });
  const events = handlers(part);
  hard("handlers.click 존재", typeof events.click === "function");

  events.click?.(syntheticClick());
  const after = instance.get();
  const afterAttrs = attrs(part, {}, after) as Attrs;
  hard("click → pressed 전환", (partState(part, {}, after) as { pressed: boolean }).pressed === true);
  hard("전환 후 attrs aria-pressed='true'", afterAttrs["aria-pressed"] === "true");
  hard("구독 통지 1회 이상", notified >= 1, `notified=${notified}`);

  events.click?.(syntheticClick());
  hard("재클릭 → idle 복귀", (partState(part, {}, instance.get()) as { pressed: boolean }).pressed === false);

  unsubscribe();
  bindElement(null);
  release(instance);
  let destroyed = false;
  try {
    instance.destroy();
    destroyed = true;
  } catch {
    destroyed = false;
  }
  hard("release·destroy 무예외", destroyed);
}
{
  const instance = unwatched(() => toggle({ id: "probe-disabled", disabled: true }));
  keep(instance);
  const part = instance.part("root", {}, true);
  commit(part, {});
  handlers(part).click?.(syntheticClick());
  hard("disabled 클릭 억제", (partState(part, {}, instance.get()) as { pressed: boolean }).pressed === false);
  release(instance);
  instance.destroy();
}

// --- 3. checkbox root+indicator 이중 슬롯 — M1 기기 회귀의 상시 재현 ----------
// 위 (2)가 unknown 요소의 matches 경로(회귀 1)를 잡으면요, 여기는 indicator
// bind의 store.subscribe 콜백 el.toggleAttribute("data-checked"…) 경로(회귀 2,
// checkbox.js — press 시 화면 사망)를 잡아요. root만 소비하면 이 경로가
// 아예 실행되지 않아 기기에서만 발견됐어요.
console.log("(3) checkbox root+indicator 이중 슬롯");
{
  let checkedSeen: unknown;
  const instance = unwatched(() =>
    checkbox({
      id: "probe-checkbox",
      onCheckedChange: (checked: unknown) => (checkedSeen = checked),
    }),
  );
  keep(instance);
  const rootPart = instance.part("root", {}, true);
  const indicatorPart = instance.part("indicator", {}, true);
  const inputPart = instance.part("input", {}, true);
  commit(rootPart, {});
  commit(indicatorPart, {});
  commit(inputPart, {});

  const rootBind = ref(rootPart, host);
  const indicatorBind = ref(indicatorPart, host);
  const inputBind = ref(inputPart, host);
  rootBind(new FakeElement("unknown") as unknown as HTMLElement);
  indicatorBind(new FakeElement("unknown") as unknown as HTMLElement);
  // hidden input bind — associate가 ownerDocument에 reset 리스너를 붙여요.
  inputBind(new FakeElement("unknown") as unknown as HTMLElement);
  hard("root+indicator+input 슬롯 bind 무예외", true);

  const beforeAttrs = attrs(rootPart, {}, instance.get()) as Attrs;
  hard("bind 후 aria-checked='false'", beforeAttrs["aria-checked"] === "false", JSON.stringify(beforeAttrs));

  subscribe(indicatorPart, () => {});
  handlers(rootPart).click?.(syntheticClick());

  const afterAttrs = attrs(rootPart, {}, instance.get()) as Attrs;
  hard("click → aria-checked='true'", afterAttrs["aria-checked"] === "true", JSON.stringify(afterAttrs));
  hard("onCheckedChange(true) 발화", checkedSeen === true, String(checkedSeen));
  const indicatorAttrs = attrs(indicatorPart, {}, instance.get()) as Attrs;
  hard("indicator data-checked", indicatorAttrs["data-checked"] === "", JSON.stringify(indicatorAttrs));

  rootBind(null);
  indicatorBind(null);
  inputBind(null);
  release(instance);
  instance.destroy();
}

// --- 4. M2-① button — press가 실행하는 action 상태기계(pending·error·억제) ----
console.log("(4) button root — action pending·error·disabled");
{
  let resolveAction!: () => void;
  const actionPromise = new Promise<void>((resolve) => {
    resolveAction = resolve;
  });
  const instance = unwatched(() =>
    button({ id: "probe-button", action: () => actionPromise }),
  );
  keep(instance);
  const part = instance.part("root", {}, true);
  commit(part, {});
  ref(part, host)(new FakeElement("unknown") as unknown as HTMLElement);

  const beforeAttrs = attrs(part, {}, instance.get()) as Attrs;
  hard("bind 후 role='button' 합성", beforeAttrs.role === "button", JSON.stringify(beforeAttrs));
  hard("bind 후 tabindex='0'", beforeAttrs.tabindex === "0");
  hard("초기 pending=false", (partState(part, {}, instance.get()) as { pending: boolean }).pending === false);

  const events = handlers(part);
  events.click?.(syntheticClick());
  const midAttrs = attrs(part, {}, instance.get()) as Attrs;
  hard("click → pending 진입", (partState(part, {}, instance.get()) as { pending: boolean }).pending === true);
  hard("pending 중 aria-busy='true'", midAttrs["aria-busy"] === "true", JSON.stringify(midAttrs));
  hard("pending 중 aria-disabled·data-pending", midAttrs["aria-disabled"] === "true" && midAttrs["data-pending"] === "");

  const pendingEvent = syntheticClick();
  events.click?.(pendingEvent);
  hard("pending 중 재클릭 억제(defaultPrevented)", pendingEvent.defaultPrevented === true);

  // runAction의 .then 핸들러가 이 대기보다 먼저 큐에 들어가 해제도 보장한다.
  resolveAction();
  await actionPromise;
  const doneAttrs = attrs(part, {}, instance.get()) as Attrs;
  hard("resolve → pending 해제", (partState(part, {}, instance.get()) as { pending: boolean }).pending === false);
  hard("해제 후 aria-busy 제거", doneAttrs["aria-busy"] === undefined, JSON.stringify(doneAttrs));
  release(instance);
  instance.destroy();
}
{
  const instance = unwatched(() =>
    button({
      id: "probe-button-error",
      action: () => {
        throw new Error("boom");
      },
    }),
  );
  keep(instance);
  const part = instance.part("root", {}, true);
  commit(part, {});
  ref(part, host)(new FakeElement("unknown") as unknown as HTMLElement);
  handlers(part).click?.(syntheticClick());
  hard("동기 실패 → error 상태", (partState(part, {}, instance.get()) as { error?: unknown }).error instanceof Error);
  release(instance);
  instance.destroy();
}
{
  let ran = false;
  const instance = unwatched(() =>
    button({
      id: "probe-button-disabled",
      disabled: true,
      action: () => {
        ran = true;
      },
    }),
  );
  keep(instance);
  const part = instance.part("root", {}, true);
  commit(part, {});
  ref(part, host)(new FakeElement("unknown") as unknown as HTMLElement);
  const disabledEvent = syntheticClick();
  handlers(part).click?.(disabledEvent);
  hard("disabled 클릭 억제·action 미실행", disabledEvent.defaultPrevented === true && ran === false);
  hard("disabled aria-disabled='true'", (attrs(part, {}, instance.get()) as Attrs)["aria-disabled"] === "true");
  release(instance);
  instance.destroy();
}

// --- 5. M2-① switch — root+input+thumb 전 슬롯 -------------------------------
console.log("(5) switch root+input+thumb 전 슬롯");
{
  let checkedSeen: unknown;
  const instance = unwatched(() =>
    switchPrimitive({
      id: "probe-switch",
      onCheckedChange: (checked: unknown) => (checkedSeen = checked),
    }),
  );
  keep(instance);
  const rootPart = instance.part("root", {}, true);
  const inputPart = instance.part("input", {}, true);
  const thumbPart = instance.part("thumb", {}, true);
  commit(rootPart, {});
  commit(inputPart, {});
  commit(thumbPart, {});

  const rootBind = ref(rootPart, host);
  const inputBind = ref(inputPart, host);
  const thumbBind = ref(thumbPart, host);
  rootBind(new FakeElement("unknown") as unknown as HTMLElement);
  // hidden input bind — associate의 ownerDocument 리스너 + checked 프로퍼티 쓰기.
  inputBind(new FakeElement("unknown") as unknown as HTMLElement);
  thumbBind(new FakeElement("unknown") as unknown as HTMLElement);
  hard("3슬롯 bind 무예외", true);

  const rootAttrs = attrs(rootPart, {}, instance.get()) as Attrs;
  hard("root role='switch'", rootAttrs.role === "switch", JSON.stringify(rootAttrs));
  hard("root aria-checked='false'", rootAttrs["aria-checked"] === "false");
  const inputAttrs = attrs(inputPart, {}, instance.get()) as Attrs;
  hard("input type='checkbox'·aria-hidden", inputAttrs.type === "checkbox" && inputAttrs["aria-hidden"] === "true", JSON.stringify(inputAttrs));
  hard("thumb data-unchecked", (attrs(thumbPart, {}, instance.get()) as Attrs)["data-unchecked"] === "");

  subscribe(thumbPart, () => {});
  handlers(rootPart).click?.(syntheticClick());
  hard("click → aria-checked='true'", (attrs(rootPart, {}, instance.get()) as Attrs)["aria-checked"] === "true");
  hard("onCheckedChange(true) 발화", checkedSeen === true, String(checkedSeen));
  hard("thumb data-checked", (attrs(thumbPart, {}, instance.get()) as Attrs)["data-checked"] === "");

  rootBind(null);
  inputBind(null);
  thumbBind(null);
  release(instance);
  instance.destroy();
}

// --- 6. M2-① radio — group+root(item)+input+indicator 전 슬롯 ----------------
// 항목 파트는 props.value 키로 분리돼요(keyOf). indicator의 value prop은
// 슬롯 스키마가 "from: root" 선언 — 명시적 전달이 이 진입점의 소비 계약.
console.log("(6) radio group+item+input+indicator 전 슬롯");
{
  const propsA = { value: "a" };
  const propsB = { value: "b" };
  const propsC = { value: "c", disabled: true };
  let valueSeen: unknown;
  const instance = unwatched(() =>
    radioGroup({
      id: "probe-radio",
      defaultValue: "a",
      onValueChange: (value: unknown) => (valueSeen = value),
    }),
  );
  keep(instance);
  const groupPart = instance.part("group", {}, true);
  const itemA = instance.part("root", propsA, true);
  const itemB = instance.part("root", propsB, true);
  const itemC = instance.part("root", propsC, true);
  const inputPart = instance.part("input", propsA, true);
  const indicatorA = instance.part("indicator", propsA, true);
  const indicatorB = instance.part("indicator", propsB, true);
  for (const [part, props] of [
    [groupPart, {}],
    [itemA, propsA],
    [itemB, propsB],
    [itemC, propsC],
    [inputPart, propsA],
    [indicatorA, propsA],
    [indicatorB, propsB],
  ] as const) {
    commit(part, props);
  }

  const groupEl = new FakeElement("unknown");
  const itemAEl = new FakeElement("unknown");
  const itemBEl = new FakeElement("unknown");
  const itemCEl = new FakeElement("unknown");
  const indicatorAEl = new FakeElement("unknown");
  const indicatorBEl = new FakeElement("unknown");
  ref(groupPart, host)(groupEl as unknown as HTMLElement);
  // 그룹 bind — bindRadioGroup의 ownerDocument 리스너(pointerdown 캡처).
  ref(itemA, host)(itemAEl as unknown as HTMLElement);
  ref(itemB, host)(itemBEl as unknown as HTMLElement);
  ref(itemC, host)(itemCEl as unknown as HTMLElement);
  ref(inputPart, host)(new FakeElement("unknown") as unknown as HTMLElement);
  ref(indicatorA, host)(indicatorAEl as unknown as HTMLElement);
  ref(indicatorB, host)(indicatorBEl as unknown as HTMLElement);
  hard("7파트 bind 무예외(roving·bindRadioGroup·bindHiddenInput 경유)", true);

  hard("group role='radiogroup'", (attrs(groupPart, {}, instance.get()) as Attrs).role === "radiogroup");
  const aBefore = attrs(itemA, propsA, instance.get()) as Attrs;
  hard("itemA 초기 aria-checked='true'", aBefore["aria-checked"] === "true", JSON.stringify(aBefore));
  const cAttrs = attrs(itemC, propsC, instance.get()) as Attrs;
  hard("itemC disabled aria-disabled·data-disabled", cAttrs["aria-disabled"] === "true" && cAttrs["data-disabled"] === "", JSON.stringify(cAttrs));
  hard("indicatorA present(초기값 a)", present(indicatorA, propsA, instance.get()) === true);
  hard("indicatorB 미표시", present(indicatorB, propsB, instance.get()) === false);

  subscribe(indicatorA, () => {}, propsA);
  subscribe(indicatorB, () => {}, propsB);
  handlers(itemB).click?.(syntheticClick());
  hard("click → onValueChange('b')", valueSeen === "b", String(valueSeen));
  hard("itemB aria-checked='true'", (attrs(itemB, propsB, instance.get()) as Attrs)["aria-checked"] === "true");
  hard("itemA aria-checked='false' 복귀", (attrs(itemA, propsA, instance.get()) as Attrs)["aria-checked"] === "false");
  // roving 정차(stop)는 order.list()가 el.isConnected로 항목을 걸러 문서
  // 순서를 계산하는데(core order.js sorted), RN 표면 요소엔 연결 개념이 없어
  // 목록이 비면 check()가 no-op예요 — stop은 null을 유지해요. tabindex는
  // 브리지 번역표가 버리는 웹 전용 속성이고 roving 키보드 이동은 하드웨어
  // 키 경로(이슈 #19 벽 뒤)라 이 슬라이스의 소비 계약에 영향이 없어요.
  hard("roving stop null 유지 — 문서 순서(isConnected) 계약 없음", (instance.get() as { stop: string | null }).stop === null);
  hard("indicatorB 표시 전환", present(indicatorB, propsB, instance.get()) === true);
  hard("indicatorA 미표시 전환", present(indicatorA, propsA, instance.get()) === false);
  hard("indicator 요소 표면 — B data-checked·A data-unchecked", indicatorBEl.hasAttribute("data-checked") && indicatorAEl.hasAttribute("data-unchecked"));

  const disabledEvent = syntheticClick();
  handlers(itemC).click?.(disabledEvent);
  hard("disabled 항목 클릭 억제", valueSeen === "b" && disabledEvent.defaultPrevented === true);

  release(instance);
  instance.destroy();
}

// --- 7. M2-① segmented-control — root(group)+item+input+indicator 전 슬롯 ---
// indicator bind는 bindIndicator → el.style.setProperty/removeProperty 쓰기.
// RN 표면은 측정(isConnected)이 없어 write(undefined) 제거 경로가 온다.
console.log("(7) segmented-control root+item+input+indicator 전 슬롯");
{
  const propsA = { value: "a" };
  const propsB = { value: "b" };
  let valueSeen: unknown;
  const instance = unwatched(() =>
    segmentedControl({
      id: "probe-segmented",
      defaultValue: "a",
      onValueChange: (value: unknown) => (valueSeen = value),
    }),
  );
  keep(instance);
  const rootPart = instance.part("root", {}, true);
  const itemA = instance.part("item", propsA, true);
  const itemB = instance.part("item", propsB, true);
  const inputPart = instance.part("input", propsA, true);
  const indicatorPart = instance.part("indicator", {}, true);
  for (const [part, props] of [
    [rootPart, {}],
    [itemA, propsA],
    [itemB, propsB],
    [inputPart, propsA],
    [indicatorPart, {}],
  ] as const) {
    commit(part, props);
  }

  ref(rootPart, host)(new FakeElement("unknown") as unknown as HTMLElement);
  ref(itemA, host)(new FakeElement("unknown") as unknown as HTMLElement);
  ref(itemB, host)(new FakeElement("unknown") as unknown as HTMLElement);
  ref(inputPart, host)(new FakeElement("unknown") as unknown as HTMLElement);
  const indicatorEl = new FakeElement("unknown");
  ref(indicatorPart, host)(indicatorEl as unknown as HTMLElement);
  hard("5파트 bind 무예외(bindIndicator style 쓰기 경유)", true);

  const rootAttrs = attrs(rootPart, {}, instance.get()) as Attrs;
  hard("root role='radiogroup'", rootAttrs.role === "radiogroup", JSON.stringify(rootAttrs));
  hard("root data-orientation='horizontal'", rootAttrs["data-orientation"] === "horizontal");
  hard("itemA 초기 aria-checked='true'", (attrs(itemA, propsA, instance.get()) as Attrs)["aria-checked"] === "true");
  const indicatorAttrs = attrs(indicatorPart, {}, instance.get()) as Attrs;
  hard("indicator role='presentation'·data-orientation", indicatorAttrs.role === "presentation" && indicatorAttrs["data-orientation"] === "horizontal", JSON.stringify(indicatorAttrs));

  subscribe(indicatorPart, () => {});
  handlers(itemB).click?.(syntheticClick());
  hard("click → onValueChange('b')", valueSeen === "b", String(valueSeen));
  const indicatorState = partState(indicatorPart, {}, instance.get()) as { value: string | null };
  hard("indicator 상태 value='b'", indicatorState.value === "b", JSON.stringify(indicatorState));
  hard("itemB aria-checked='true'", (attrs(itemB, propsB, instance.get()) as Attrs)["aria-checked"] === "true");

  release(instance);
  instance.destroy();
}

// --- 8. 에이전트 브리지 — 제품 진입점 ui-sdk-agent --------------------------
// «DOM을 얇게» 방향(2026-11-22)의 제품화 상시 검증. 제품 진입점을 직접
// 소비하는 것으로 검증한다: 스텁 설치 → createSdkAgent(문서 스텁 시 커널
// 감시자 install이 걸린다) → 이후 생성 인스턴스 자동 등록 → 접근명 라벨
// 탐색 → act 실행 → subscribe 통지. 요소는 FakeElement(제품 SdkElement와
// 같은 명세)로, useSdkPart의 접근명 시딩(aria-label ← accessibilityLabel)은
// 여기서 setAttribute로 미러한다. React 훅 경로는 기기 화면
// (apps/expo uisdk-agent)이 담당한다.
console.log("(8) 에이전트 브리지 — ui-sdk-agent 제품 진입점");
{
  if (typeof (globalThis as Record<string, unknown>).document !== "undefined") {
    hard("사전조건: 런타임에 document 부재(스텁 설치 전)", false);
  } else {
    installSdkAgentDom();
    const doc = (globalThis as Record<string, unknown>).document as Record<string, unknown>;
    hard(
      "document 스텁 5멤버(addEventListener·getElementById·createTreeWalker·documentElement·hidden)",
      [doc.addEventListener, doc.getElementById, doc.createTreeWalker, doc.documentElement, doc.hidden].every(
        (member) => member !== undefined,
      ),
    );
    const win = (globalThis as Record<string, unknown>).window as Record<string, unknown>;
    hard("window addEventListener 멤버 패치(modality blur 등록)", typeof win.addEventListener === "function");
    hard("NodeFilter 상수(marks 텍스트 순회)", (globalThis as Record<string, unknown>).NodeFilter !== undefined);

    const agent = createSdkAgent();
    hard("에이전트 생성·도구 3종(snapshot·query·act)", typeof agent.snapshot === "function" && typeof agent.query === "function" && typeof agent.act === "function");

    // 에이전트 생성 «이후» 만들어지는 인스턴스 — 커널 감시자가 자동 등록한다.
    const instance = unwatched(() => toggle({ id: "agent-probe-toggle" }));
    keep(instance);
    const part = instance.part("root", {}, true);
    commit(part, {});
    const el = new FakeElement("unknown");
    el.setAttribute("aria-label", "알림");
    el.isConnected = true; // agent 모드 SdkElement 계약 미러(bound 필터 통과)
    ref(part, host)(el as unknown as HTMLElement);
    subscribe(part, () => {});

    const list = agent.snapshot();
    const mine = list.find((c) => c.label === "알림");
    hard("인스턴스 자동 등록·접근명 라벨 노출", mine !== undefined, JSON.stringify(list));
    // toggle의 agent api는 setPressed(button 계열의 press와 다르다 — 실측).
    hard("actions에 setPressed", mine?.actions.includes("setPressed") === true);

    const events: unknown[] = [];
    agent.subscribe((change) => events.push(change));
    const result = await agent.act({ steps: [{ ref: "알림", action: "setPressed", args: [true] }] });
    hard("act(ref 라벨 → setPressed) ok", result.ok === true, JSON.stringify(result.error ?? result.steps));
    const after = partState(part, {}, instance.get()) as { pressed?: boolean };
    hard("act 후 pressed=true", after.pressed === true);
    hard("subscribe 통지 source='agent'", events.length >= 1 && (events[0] as Record<string, unknown>).source === "agent");

    release(instance);
    instance.destroy();
  }
}

// --- 9. M2-② 팝업 슬라이스 — popover 전 슬롯·createPopup 비공개 커널 경로 ---
// 이슈 #39. popover의 createPopup이 커널 Context(store·element·props·parts)를
// 소비해 RN(=DOM 없는 런타임)에서 개폐·배치까지 도는지 검증한다. 요소는
// 제품 SdkElement의 팝업 표면과 같은 명세(rect 캐시·SdkStyle observer·
// nodeType·querySelectorAll 등 — ui-sdk-renderer.ts M2-②). 전역은 window·
// document 최소 스텁(position()의 뷰포트 판정·getComputedStyle·bind 정리의
// activeElement 읽기)을 «멤버 단위 패치»로 깐다(ui-sdk-dom installDomStubs와
// 같은 원칙 — bun은 react-native 의존 프로브가 import할 수 없어 여기서 미러).
// isBrowser(env.js)는 최상위 import 시점에 이미 false로 평가됐다 — 기기(RN)도
// 마찬가지(문서 스텁은 컴포넌트 몸통에서 늦게 설치)므로 프로브와 기기가 같은
// 경로를 검증한다. 이 섹션의 요소는 isConnected true(팝업 모드 미러).
console.log("(9) M2-② popover 전 슬롯 — createPopup 커널 경로");
{
  // 전역 멤버 패치 — «미존재 시에만» 설치(다른 스텁과 같은 가드).
  const g = globalThis as Record<string, unknown>;
  const probeDocElement = {
    clientWidth: 390,
    clientHeight: 844,
  };
  if (typeof g.window !== "object" || g.window === null) g.window = {};
  const probeWin = g.window as Record<string, unknown>;
  if (typeof probeWin.addEventListener !== "function") probeWin.addEventListener = () => {};
  if (typeof probeWin.removeEventListener !== "function") probeWin.removeEventListener = () => {};
  if (probeWin.visualViewport === undefined) probeWin.visualViewport = null;
  if (typeof probeWin.getComputedStyle !== "function") {
    probeWin.getComputedStyle = (el?: { style?: unknown }) => (el?.style ?? {});
  }
  if (typeof g.getComputedStyle !== "function") {
    g.getComputedStyle = (el?: { style?: unknown }) => (el?.style ?? {});
  }
  if (typeof g.document !== "object" || g.document === null) g.document = {};
  const probeDoc = g.document as Record<string, unknown>;
  // 선행 섹션(8 — installSdkAgentDom)이 documentElement를 0×0 스텁으로
  // 이미 설치했을 수 있어요 — «미존재 시에만» 가드로는 두면 뷰포트가 0×0으로
  // 남아 배치가 전부 플립/클램프돼요. 프로브 런타임의 뷰포트는 여기서
  // 결정한다(기기 화면은 installDomStubs의 Dimensions live getter가 같은
  // 역할을 해요 — 에이전트 선행 설치와 공존할 때 치수 멤버 교정 필요,
  // 이슈 #39 문서에 기록).
  probeDoc.documentElement = probeDocElement;
  if (typeof probeDoc.addEventListener !== "function") probeDoc.addEventListener = () => {};
  if (typeof probeDoc.removeEventListener !== "function") probeDoc.removeEventListener = () => {};
  // moves.js(watchMoves → listen)가 가드 없이 `new MutationObserver(...)`로
  // 생성해요 — bun에는 없으므로 no-op 클래스를 설치(제품 렌더러의 바인딩
  // 마스크과 같은 명세, ui-sdk-dom installDomStubs과 같은 가드).
  if (typeof g.MutationObserver !== "function") {
    g.MutationObserver = class {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  }
  hard("전역 스텁 — window(documentElement 390×844·getComputedStyle)·document", true);

  // 팝업 표면 요소 — 제품 SdkElement(ui-sdk-renderer M2-②)와 같은 명세.
  class PopupElement extends FakeElement {
    nodeType = 1;
    isConnected = true;
    nextElementSibling: PopupElement | undefined = undefined;
    previousElementSibling: PopupElement | undefined = undefined;
    style = new (class {
      [key: string]: unknown;
      transformOrigin = "0px 0px";
      transform = "none";
      observer?: (key: string, value: string) => void;
      setProperty(key: string, value: string) {
        if (this[key] !== value) this.observer?.(key, value);
        this[key] = value;
      }
      getPropertyValue(key: string) {
        return typeof this[key] === "string" ? (this[key] as string) : "";
      }
      removeProperty(key: string) {
        delete this[key];
      }
    })();
    rect = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 };
    showPopover() {}
    hidePopover() {}
    querySelectorAll() {
      return [] as unknown[];
    }
    contains() {
      return false;
    }
    getRootNode() {
      return this.ownerDocument;
    }
    scrollTo() {}
    getBoundingClientRect() {
      const left = parseFloat(this.style.left as string) || 0;
      const top = parseFloat(this.style.top as string) || 0;
      const x = this.style.left !== undefined ? left : this.rect.x;
      const y = this.style.top !== undefined ? top : this.rect.y;
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
  }
  const fill = (
    el: PopupElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    Object.assign(el.rect, { x, y, width, height, top: y, left: x, right: x + width, bottom: y + height });
  };

  const { popover } = await import("@ui-sdk/core/popover");
  const openChanges: Array<{ open: boolean; reason: string }> = [];
  const instance = unwatched(() =>
    popover({
      id: "probe-popover",
      onOpenChange: (open: boolean, closed?: { reason: string }) =>
        openChanges.push({ open, reason: closed?.reason ?? "" }),
    }),
  );
  keep(instance);
  hard("popover 인스턴스 생성 — createPopup 비공개 커널 경로 무예외", true);

  const api = (instance as { api?: Record<string, unknown> }).api as Record<
    string,
    (arg?: unknown) => unknown
  >;
  hard("api setOpen·close·toggle 노출", typeof api?.setOpen === "function" && typeof api?.close === "function" && typeof api?.toggle === "function");

  // 전 슬롯 part 확보 — popover는 trigger·content·viewport·title·description·
  // close·arrow·shortcut·backdrop. 소비 표면 6종(trigger·content·title·
  // description·close·arrow)을 bind한다(viewport는 sheet 전용·shortcut는
  // 장식·backdrop는 popover가 렌더하지 않는 경로).
  const triggerPart = instance.part("trigger", {}, true);
  const contentPart = instance.part("content", {}, true);
  const titlePart = instance.part("title", {}, true);
  const descriptionPart = instance.part("description", {}, true);
  const closePart = instance.part("close", {}, true);
  const arrowPart = instance.part("arrow", {}, true);
  for (const part of [triggerPart, contentPart, titlePart, descriptionPart, closePart, arrowPart]) {
    commit(part, {});
  }

  const triggerEl = new PopupElement("button");
  // P2 실측 수치 — 앵커 (100, 200)·120×40, side bottom·offset 8 → top 248.
  fill(triggerEl, 100, 200, 120, 40);
  const contentEl = new PopupElement("div");
  fill(contentEl, 100, 200, 224, 124);
  const titleEl = new PopupElement("h2");
  const descriptionEl = new PopupElement("p");
  const closeEl = new PopupElement("button");
  const arrowEl = new PopupElement("span");
  fill(arrowEl, 150, 240, 12, 12);
  const styleWrites: Array<[string, string]> = [];
  contentEl.style.observer = (key, value) => styleWrites.push([key, value]);

  ref(triggerPart, host)(triggerEl as unknown as HTMLElement);
  hard("trigger bind 무예외(bindTrigger·adoptPlatform·shortcut 경유)", true);
  const state1 = instance.get() as { trigger: string | null };
  hard("bind 후 store.trigger 설정", state1.trigger !== null, JSON.stringify(state1.trigger));

  const triggerAttrs = attrs(triggerPart, {}, instance.get()) as Attrs;
  hard("trigger aria-haspopup='dialog'", triggerAttrs["aria-haspopup"] === "dialog", JSON.stringify(triggerAttrs));
  hard("trigger type='button'", triggerAttrs.type === "button");
  hard("trigger 초기 aria-expanded='false'", triggerAttrs["aria-expanded"] === "false");

  // 개방 — trigger press(pressOpening.press → control.show → createOpenSteps).
  subscribe(triggerPart, () => {});
  handlers(triggerPart).click?.(syntheticClick());
  const opened = instance.get() as { open: boolean; mounted: boolean; presentation: string };
  hard("press → open=true", opened.open === true);
  hard("open → mounted=true(콘텐츠 렌더 계약)", opened.mounted === true);
  hard("onOpenChange(true) 통지", openChanges.some((c) => c.open));
  const triggerAttrsOpen = attrs(triggerPart, {}, instance.get()) as Attrs;
  hard("열림 중 trigger aria-expanded='true'", triggerAttrsOpen["aria-expanded"] === "true");
  hard("trigger aria-controls 노출", typeof triggerAttrsOpen["aria-controls"] === "string");

  // 콘텐츠 bind — attach 경로(position() 호출·layer push·animateIn·
  // initialFocus 크마이크로태스크)가 여기서 돈다.
  ref(contentPart, host)(contentEl as unknown as HTMLElement);
  ref(titlePart, host)(titleEl as unknown as HTMLElement);
  ref(descriptionPart, host)(descriptionEl as unknown as HTMLElement);
  ref(closePart, host)(closeEl as unknown as HTMLElement);
  ref(arrowPart, host)(arrowEl as unknown as HTMLElement);
  hard("content·title·description·close·arrow bind 무예외(attach·position 경유)", true);

  const contentAttrs = attrs(contentPart, {}, instance.get()) as Attrs;
  hard("content role='dialog'", contentAttrs.role === "dialog", JSON.stringify(contentAttrs));
  hard("content aria-labelledby=«id»-title(titled 플래그)", contentAttrs["aria-labelledby"] === "probe-popover-title");
  hard("content aria-describedby=«id»-description", contentAttrs["aria-describedby"] === "probe-popover-description");

  // position() 수치 검증 — P2 실측과 같은 앵커(100,200·120×40)·side bottom
  // 기본·sideOffset 4 기본 → top=200+40+4=244. align은 popover 슬롯 기본
  // «center»(bindPopupContent가 placement.options에 넘기는 기본값) →
  // left=100+120/2−224/2=48(클램프 대역 [8,58] 안).
  await new Promise((resolve) => setTimeout(resolve, 60));
  const left = contentEl.style.left as string | undefined;
  const top = contentEl.style.top as string | undefined;
  hard("position() left='48px'(앵커 중심 정렬)", left === "48px", String(left));
  hard("position() top='244px'(앵커 y+높이+sideOffset)", top === "244px", String(top));
  const side = contentEl.getAttribute("data-side");
  hard("data-side='bottom'", side === "bottom", String(side));
  const availableHeight = contentEl.style.getPropertyValue("--available-height");
  hard("--available-height 기록(뷰포트 844 클램프)", availableHeight === `${844 - 244 - 8}px`, String(availableHeight));
  hard("style observer 통지(left 쓰기)", styleWrites.some(([key]) => key === "left"));

  // close press — popupClose.press → control.hide → mounted 해제.
  handlers(closePart).click?.(syntheticClick());
  await new Promise((resolve) => setTimeout(resolve, 30));
  const closed = instance.get() as { open: boolean; mounted: boolean };
  hard("close press → open=false", closed.open === false);
  hard("close → mounted=false", closed.mounted === false);
  hard("onOpenChange(false, close-press) 통지", openChanges.some((c) => !c.open && c.reason === "close-press"), JSON.stringify(openChanges));

  // api.setOpen(true) 재개방 — 공개 api 경로.
  api.setOpen(true);
  const reopened = instance.get() as { open: boolean };
  hard("api.setOpen(true) → 재개방", reopened.open === true);
  api.close({ reason: "outside-press" });
  const reclosed = instance.get() as { open: boolean };
  hard("api.close({reason:'outside-press'}) — RN 바깥누름 소비 경로", reclosed.open === false);

  release(instance);
  let destroyed = true;
  try {
    instance.destroy();
  } catch {
    destroyed = false;
  }
  hard("release·destroy 무예외", destroyed);
}

console.log("(10) M2-③ 입력·폼 — input·field 전 슬롯");
{
  // 폼 글로벌 — 제품 렌더러의 설치 함수(이 슬라이스 산출)를 소비한다(기기
  // 화면과 같은 경로). HTML* 브랜드 9종·Node·Event를 «미존재 시에만» 깐다.
  installSdkFormGlobals();
  const g = globalThis as Record<string, unknown>;
  const brands = [
    "HTMLInputElement", "HTMLSelectElement", "HTMLTextAreaElement",
    "HTMLLabelElement", "HTMLButtonElement", "HTMLMeterElement",
    "HTMLOutputElement", "HTMLProgressElement", "Node",
  ];
  hard(
    "폼 글로벌 설치(브랜드 9종·Node·Event)",
    brands.every((name) => typeof g[name] === "function") && typeof g.Event === "function",
    brands.filter((name) => typeof g[name] !== "function").join("·") || "ok",
  );

  // createElement — valueMissingMessage 캐시가 문서 존재 시 생성(toggle-control
  // 등 검증 메시지 경로 — 입력 슬라이스 예비 계약).
  const probeDoc10 = g.document as Record<string, unknown>;
  if (typeof probeDoc10.createElement !== "function") {
    probeDoc10.createElement = (tag: string) => ({
      tagName: tag.toUpperCase(),
      type: "text",
      name: "",
      required: true,
      validationMessage: "",
    });
  }
  hard("document.createElement 스텁", typeof probeDoc10.createElement === "function");

  /** 폼 표면 요소 — 제품 SdkElement의 폼 모드와 같은 명세: value 프로토타입
   *  접근자(intercept 재정의·writeValue asUser 경로), 실동작 이벤트
   *  레지스트리(on(el,"input") → typed), id 속성 동기, 폼 멤버. */
  class FormElement extends FakeElement {
    /** 폼 모드(setSdkElementFormMode) — elements()의 bound 필터가 요소를
     *  찾도록 «연결됨»으로 보고해요(field의 element("control") 경로). */
    isConnected = true;
    #value = "";
    defaultValue = "";
    id = "";
    form: unknown = null;
    name = "";
    type = "text";
    required = false;
    willValidate = false;
    validity = { valid: true };
    validationMessage = "";
    setCustomValidity() {}
    private listeners = new Map<string, Set<(event: unknown) => void>>();
    constructor(tag: string) {
      super(tag);
    }
    get value() {
      return this.#value;
    }
    set value(next: string) {
      this.#value = String(next);
    }
    setAttribute(name: string, value = "") {
      super.setAttribute(name, value);
      if (name === "id") this.id = String(value);
    }
    removeAttribute(name: string) {
      super.removeAttribute(name);
      if (name === "id") this.id = "";
    }
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
  hard(
    "instanceof 브랜드 — 정확히 false(«네이티브 아님» 의미)",
    !(new FormElement("input") instanceof (g.HTMLInputElement as never)),
  );

  // --- input: 비제어 왕복(타이핑 → change → state) --------------------------
  const changes: { value: string; reason: string }[] = [];
  const inputInstance = unwatched(() =>
    input({
      id: "probe-input",
      onValueChange: (value: string, details: { reason: string }) =>
        changes.push({ value, reason: details.reason }),
    }),
  );
  keep(inputInstance);
  const inputPart = inputInstance.part("root", {}, true);
  commit(inputPart, {});
  const bindInput = ref(inputPart, host);
  const inputEl = new FormElement("input");
  let inputBound = true;
  try {
    bindInput(inputEl as unknown as HTMLElement);
  } catch {
    inputBound = false;
  }
  hard("input root bind 무예외(watchValue intercept 재정의 포함)", inputBound);
  hard(
    "비제어 초기 — state.value ''",
    (inputInstance.get() as { value: string }).value === "",
  );

  const inputState = () => inputInstance.get() as { value: string; filled: boolean };
  const inputAttrs = () => attrs(inputPart, {}, inputInstance.get()) as Attrs;
  hard("초기 data-filled 없음", inputAttrs()["data-filled"] === undefined, JSON.stringify(inputAttrs()["data-filled"]));

  // 타이핑 — native 입력 등가 경로(프레임워크 attrs 적용 후): 프로토타입
  // setter + input 이벤트 → typed → change. 직접 value 쓰기는 intercept가
  // «스크립트 쓰기»로 분류해 change가 오지 않아요(제품 typeSdkValue 주석).
  typeSdkValue(inputEl as never, "안녕");
  hard(
    "타이핑 → onValueChange(input-change)",
    changes.at(-1)?.value === "안녕" && changes.at(-1)?.reason === "input-change",
    JSON.stringify(changes.at(-1)),
  );
  hard("비제어 — state.value 반영", inputState().value === "안녕");
  hard("filled → data-filled ''", inputAttrs()["data-filled"] === "");

  // api 경로 — setValue(asUser → 프로토타입 setter + input 이벤트)·clear.
  const inputApi = (inputInstance as { api: { getValue: () => string; setValue: (v: string) => boolean; clear: () => boolean } }).api;
  hard("api 노출(getValue·setValue·clear·focus)",
    typeof inputApi?.getValue === "function" && typeof inputApi?.setValue === "function" && typeof inputApi?.clear === "function");
  inputApi.setValue("프로그램");
  hard("api.setValue → 요소 value 동기", inputEl.value === "프로그램", inputEl.value);
  hard("api.setValue → onValueChange(imperative)", changes.at(-1)?.reason === "imperative", JSON.stringify(changes.at(-1)));
  inputApi.clear();
  hard("api.clear → value ''", inputEl.value === "" && inputState().value === "");

  // 제어 모드 — value 고정 시 typed는 change만 통지(state는 유지).
  const controlledChanges: string[] = [];
  const controlled = unwatched(() =>
    input({ id: "probe-controlled", value: "고정", onValueChange: (v: string) => controlledChanges.push(v) }),
  );
  keep(controlled);
  const controlledPart = controlled.part("root", {}, true);
  commit(controlledPart, {});
  const bindControlled = ref(controlledPart, host);
  const controlledEl = new FormElement("input");
  bindControlled(controlledEl as unknown as HTMLElement);
  typeSdkValue(controlledEl as never, "바꿈");
  hard("제어 — onValueChange 통지", controlledChanges.at(-1) === "바꿈", JSON.stringify(controlledChanges));
  hard("제어 — state.value 유지(화면이 prop을 갱신)", (controlled.get() as { value: string }).value === "고정");
  release(controlled);
  controlled.destroy();

  release(inputInstance);
  inputInstance.destroy();

  // --- field: 5슬롯 해부 + 외부 invalid 에러 상태기계 ------------------------
  const fieldInstance = unwatched(() => field({ id: "probe-field", invalid: true }));
  keep(fieldInstance);
  const rootPart = fieldInstance.part("root", {}, true);
  const labelPart = fieldInstance.part("label", {}, true);
  const descriptionPart = fieldInstance.part("description", {}, true);
  const errorPart = fieldInstance.part("error", {}, true);
  const controlPart = fieldInstance.part("control", {}, true);
  for (const part of [rootPart, labelPart, descriptionPart, errorPart, controlPart]) commit(part, {});
  const bindRoot = ref(rootPart, host);
  const bindLabel = ref(labelPart, host);
  const bindDescription = ref(descriptionPart, host);
  const bindError = ref(errorPart, host);
  const bindControl = ref(controlPart, host);
  const rootEl = new FormElement("div");
  const labelEl = new FormElement("label");
  const descriptionEl = new FormElement("p");
  const errorEl = new FormElement("p");
  const controlEl = new FormElement("input");
  // 제품 useSdkPart는 바인딩 전에 계산된 domAttrs를 요소에 심어요 —
  // registerById가 bind 시점의 el.id를 읽어요. 같은 순서를 미러.
  const applyAttrs = (
    part10: never,
    el10: FormElement,
  ) => {
    for (const [name, value] of Object.entries(attrs(part10, {}, fieldInstance.get()) as Attrs)) {
      if (value !== undefined && value !== null) el10.setAttribute(name, String(value));
    }
  };
  applyAttrs(rootPart as never, rootEl);
  applyAttrs(labelPart as never, labelEl);
  applyAttrs(descriptionPart as never, descriptionEl);
  applyAttrs(errorPart as never, errorEl);
  applyAttrs(controlPart as never, controlEl);
  let fieldBound = true;
  try {
    bindRoot(rootEl as unknown as HTMLElement);
    bindLabel(labelEl as unknown as HTMLElement);
    bindDescription(descriptionEl as unknown as HTMLElement);
    bindError(errorEl as unknown as HTMLElement);
    bindControl(controlEl as unknown as HTMLElement);
  } catch {
    fieldBound = false;
  }
  hard("field 5슬롯 bind 무예외(bindRoot·registerById·announce·adopt 경유)", fieldBound);

  // 마이크로태스크 등록(register·adopt·bound)이 흐른 뒤 판정.
  await new Promise((resolve) => setTimeout(resolve, 20));
  const fieldState10 = () => fieldInstance.get() as {
    bound: boolean;
    controlId: string | null;
    labels: string[];
    descriptions: string[];
    errors: string[];
    revealed: boolean;
    external?: boolean;
  };
  hard("bound=true 마이크로태스크", fieldState10().bound === true);
  hard("labels·descriptions·errors id 등록", fieldState10().labels.length === 1 && fieldState10().descriptions.length === 1 && fieldState10().errors.length === 1, JSON.stringify({ l: fieldState10().labels, d: fieldState10().descriptions, e: fieldState10().errors }));
  hard("control adopt → controlId", fieldState10().controlId === "probe-field-control");

  const labelAttrs10 = attrs(labelPart, {}, fieldInstance.get()) as Attrs;
  hard("label attrs id 조립(«probe-field-label»)", labelAttrs10.id === "probe-field-label", JSON.stringify(labelAttrs10.id));
  hard("label for 생랴 — isLabelable 경계(브랜드 없음 → 활성화는 press 경로)", labelAttrs10.for === undefined, JSON.stringify(labelAttrs10.for));

  // 외부 invalid → 에러 표시 상태기계.
  const errorAttrs10 = attrs(errorPart, {}, fieldInstance.get()) as Attrs;
  hard("error attrs id 조립(«probe-field-error»)", errorAttrs10.id === "probe-field-error");
  hard("외부 invalid → error present", present(errorPart, {}, fieldInstance.get()) === true);
  const controlAttrs10 = attrs(controlPart, {}, fieldInstance.get()) as Attrs;
  hard(
    "control aria-describedby = description+error",
    controlAttrs10["aria-describedby"] === "probe-field-description probe-field-error",
    JSON.stringify(controlAttrs10["aria-describedby"]),
  );
  hard("control aria-invalid='true'", controlAttrs10["aria-invalid"] === "true");
  const rootAttrs10 = attrs(rootPart, {}, fieldInstance.get()) as Attrs;
  hard("root data-invalid=''", rootAttrs10["data-invalid"] === "");

  // label press → activate — 커널 파트 레지스트리 경로(element('control')).
  let focused = 0;
  controlEl.focus = () => {
    focused += 1;
  };
  handlers(labelPart).click?.(syntheticClick());
  hard("label press → control focus(activate 경로)", focused === 1, `focused=${focused}`);

  // 외부 invalid 해제 → 에터 소거.
  (fieldInstance as { setOptions: (next: Record<string, unknown>) => void }).setOptions({ id: "probe-field", invalid: false });
  await new Promise((resolve) => setTimeout(resolve, 20));
  hard("invalid=false → error 미표시", present(errorPart, {}, fieldInstance.get()) === false);
  hard("해제 후 control aria-invalid 없음", !((attrs(controlPart, {}, fieldInstance.get()) as Attrs)["aria-invalid"]));

  for (const part of [rootPart, labelPart, descriptionPart, errorPart, controlPart]) {
    release(fieldInstance);
    break;
  }
  let fieldDestroyed = true;
  try {
    fieldInstance.destroy();
  } catch {
    fieldDestroyed = false;
  }
  hard("field release·destroy 무예외", fieldDestroyed);
}

console.log(failed === 0 ? "probe:ui-sdk PASS" : `probe:ui-sdk FAIL — 위반 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
