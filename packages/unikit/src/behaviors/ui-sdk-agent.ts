// @unikit-bridge/ui/behaviors/ui-sdk-agent — @ui-sdk/core의 에이전트 브리지를
// RN에서 여는 얇은 가상 DOM 진입점. «다 go» 로드맵(M2-① 후속, 2026-11-22).
//
// 배경: ui-sdk가 «AI에 잘 되는» 런타임 층은 @ui-sdk/core 안의 "./agent"
// export(createAgent·agentTools)예요 — 페이지에 등록된 프리미티브를
// 발견하고(snapshot·query), 접근명·라벨로 대상을 찾아 act로 상태를
// 바꾸고, subscribe로 변화를 듣는 계약이에요. 이 계약은 DOM을 렌더링하지
// 않고 DOM «표면»을 읽기만 해서, 최소 스텁을 깔면 RN에서도 같은 기계가
// 돌아요(2026-11-22 임시 프로브 6/6 PASS — docs/sdd/100 §7 실측 기록).
//
// 설계(«DOM을 얇게» — 사용자 방향):
//   - installSdkAgentDom(): document가 없는 런타임(RN·bun)에서만 최소
//     스텁을 깔아요 — 문서 5멤버(addEventListener·getElementById·
//     createTreeWalker·documentElement·hidden), window 멤버 패치(modality의
//     blur 등록), NodeFilter 상수, rAF 가드. 웹은 실제 document가 있어
//     전부 가드 우회돼요(아무것도 바꾸지 않아요). 되돌리기는 없어요 —
//     앱 수명 동안 유지하는 설치예요.
//   - createSdkAgent(): 설치 + SdkElement 에이전트 모드(isConnected·
//     checkVisibility·getBoundingClientRect — ui-sdk-renderer) + core
//     createAgent를 묶은 팩토리. createAgent가 스스로 registry install()을
//     불러 커널 감시자를 걸고, 이후 만들어지는 프리미티브 인스턴스가
//     자동 등록돼요 — 그래서 «렌더 전에 만들라»는 core 문서 계약 그대로,
//     모듈 스코프에서 한 번 호출하는 것이 권장 모양이에요.
//   - agentTools는 그대로 재수출해요(도구 3종 — snapshot·query·act).
//
// 경계와 주의:
//   - 플랫폼 판별 부작용: 설치 뒤 전역에 document가 생겨서 «document 유무
//     = 웹»으로 판별하는 다른 라이브러리가 영향받을 수 있어요. 그래서 이
//     진입점의 설치는 앱이 명시적으로 호출할 때만 일어나요(옵트인).
//   - RN에서 도구를 모델에 노출하는 일(WebMCP registerTools의
//     document.modelContext는 RN에 없음)은 이 계층의 범위가 아니에요 —
//     소비자(인앱 AI·로컬 MCP 서버)가 agentTools/에이전트 메서드를
//     가져가서 호출하는 모양이에요.
//   - 업스트림 제기는 하지 않아요(2026-11-22 사용자 결정) — 이 진입점은
//     UniKit 경계 안의 소비측 어댑터예요.
import { agentTools, createAgent } from "@ui-sdk/core/agent";
import { setSdkElementAgentMode } from "./ui-sdk-renderer";

export type SdkAgentOptions = Parameters<typeof createAgent>[0];
export type SdkAgent = ReturnType<typeof createAgent>;

const noop = () => {};

/** 에이전트 브리지가 읽는 DOM 표면을 최소로 깔아요. document가 이미 있는
 *  런타임(웹)은 아무것도 바꾸지 않아요. */
export function installSdkAgentDom(): void {
  const g = globalThis as Record<string, unknown>;

  if (typeof g.document === "undefined") {
    // 감시자 install()과 modality install()이 만지는 문서 멤버 전부.
    // createTreeWalker는 빈 순회(과거 인스턴스 재생 탐색), documentElement는
    // 치수 읽기(뷰포트 추론) — 등록만 성립하면 돼요.
    g.document = {
      hidden: false,
      addEventListener: noop,
      removeEventListener: noop,
      getElementById: () => null,
      createTreeWalker: () => ({ nextNode: () => null }),
      documentElement: { clientWidth: 0, clientHeight: 0 },
    };
  } else {
    const doc = g.document as Record<string, unknown>;
    if (typeof doc.addEventListener !== "function") doc.addEventListener = noop;
    if (typeof doc.removeEventListener !== "function") doc.removeEventListener = noop;
    if (typeof doc.getElementById !== "function") doc.getElementById = () => null;
    if (typeof doc.createTreeWalker !== "function") {
      doc.createTreeWalker = () => ({ nextNode: () => null });
    }
    if (doc.documentElement === undefined || doc.documentElement === null) {
      doc.documentElement = { clientWidth: 0, clientHeight: 0 };
    }
    if (doc.hidden === undefined) doc.hidden = false;
  }

  // RN의 window는 globalThis와 같은 객체에 DOM 멤버가 없어요 — 멤버별로
  // 패치해요(modality의 blur 리스너 등록 등). bun처럼 window 자체가 없는
  // 런타임은 최소 객체를 만들어요.
  if (typeof g.window === "undefined") {
    g.window = { addEventListener: noop, removeEventListener: noop };
  } else {
    const win = g.window as Record<string, unknown>;
    if (typeof win.addEventListener !== "function") win.addEventListener = noop;
    if (typeof win.removeEventListener !== "function") win.removeEventListener = noop;
  }

  // marks의 텍스트 순회가 참조하는 상수(SHOW_TEXT). SdkElement는
  // childNodes가 빈 배열이라 순회 본문이 돌지 않지만, 상수 참조 자체가
  // 일어나면 ReferenceError라 안전장치로 깔아요.
  if (typeof g.NodeFilter === "undefined") {
    g.NodeFilter = { SHOW_TEXT: 4 };
  }

  // frames() 스케줄(rAF) — RN·웹에는 있고 헤드리스(bun 등) 대비 가드.
  if (typeof g.requestAnimationFrame !== "function") {
    g.requestAnimationFrame = (callback: (time: number) => void) =>
      setTimeout(() => callback(Date.now()), 0) as unknown as number;
  }
  if (typeof g.cancelAnimationFrame !== "function") {
    g.cancelAnimationFrame = (handle: number) => {
      clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
    };
  }
}

/** 가상 DOM 설치 + SdkElement 에이전트 모드 + core createAgent를 묶은
 *  팩토리. 컴포넌트가 만들어지기 전(권장: 모듈 스코프)에 한 번 호출해요.
 *  반환값은 core 에이전트 그대로(snapshot·query·act·subscribe…). */
export function createSdkAgent(options?: SdkAgentOptions): SdkAgent {
  installSdkAgentDom();
  setSdkElementAgentMode(true);
  return createAgent(options);
}

export { agentTools };
