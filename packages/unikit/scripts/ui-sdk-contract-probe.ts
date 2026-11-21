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

console.log(failed === 0 ? "probe:ui-sdk PASS" : `probe:ui-sdk FAIL — 위반 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
