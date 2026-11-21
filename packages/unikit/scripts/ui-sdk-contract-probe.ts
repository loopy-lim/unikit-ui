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
//   3. checkbox root+indicator 이중 슬롯 bind·press — 두 슬롯을 모두 소비해야
//      닿는 indicator bind의 toggleAttribute 경로까지 (M1 기기 회귀 2건 재현).
//   4. (참고·비치명) M2 1유형 슬라이스 후보(checkbox·switch·button)의
//      최소 소비가 성립하는가 — 실패는 M2 설계 입력이지 프로브 실패가 아니다.
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

/** 어댑터가 요소 계약으로 세운 최소 형태 — ui-sdk-renderer.ts SdkElement와 같은 명세 */
class FakeElement {
  isConnected = false;
  tagName: string;
  parentElement: FakeElement | undefined = undefined;
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
function soft(name: string, err?: unknown) {
  console.log(
    `  [${err ? "보류" : "OK"}] ${name}${err ? ` — ${String(err).split("\n")[0]}` : ""}`,
  );
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
  commit(rootPart, {});
  commit(indicatorPart, {});

  const rootBind = ref(rootPart, host);
  const indicatorBind = ref(indicatorPart, host);
  rootBind(new FakeElement("unknown") as unknown as HTMLElement);
  indicatorBind(new FakeElement("unknown") as unknown as HTMLElement);
  hard("이중 슬롯 bind 무예외", true);

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
  release(instance);
  instance.destroy();
}

// --- 4. M2 후보 최소 소비(참고) ----------------------------------------------
console.log("(4) M2 슬라이스 후보 최소 소비(비치명)");
for (const [name, factory] of [
  ["checkbox", checkbox],
  ["switch", switchPrimitive],
  ["button", button],
] as const) {
  try {
    const instance = unwatched(() => (factory as (o: object) => never)({ id: `probe-${name}` }));
    keep(instance);
    const part = instance.part("root", {}, true);
    commit(part, {});
    const state = instance.get();
    const ok = present(part, {}, state) === true && typeof attrs(part, {}, state) === "object";
    soft(`${name} root 파트 소비`, ok ? undefined : "present/attrs 계약 불일치");
    release(instance);
    instance.destroy();
  } catch (err) {
    soft(`${name} root 파트 소비`, err);
  }
}

console.log(failed === 0 ? "probe:ui-sdk PASS" : `probe:ui-sdk FAIL — 위반 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
