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
//   - installSdkAgentDom(): 제품 문서·창(installSdkEventGlobals — ui-sdk-renderer
//     M2-④⑤⑥: 실 이벤트 대상·가상 포커스·documentElement 뷰포트·브랜드
//     글로벌)을 깔고, 그 위에 에이전트 경로만이 필요한 rAF 가드를
//     «미존재 시에만» 더해요. 웹은 실제 document가 있어 전부 가드 우회돼요
//     (아무것도 바꾸지 않아요). 되돌리기는 없어요 — 앱 수명 동안 유지하는
//     설치예요.
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
import { installSdkEventGlobals, setSdkElementAgentMode } from "./ui-sdk-renderer";

export type SdkAgentOptions = Parameters<typeof createAgent>[0];
export type SdkAgent = ReturnType<typeof createAgent>;

/** 에이전트 브리지가 읽는 DOM 표면을 깔아요 — 제품 문서·창(installSdkEventGlobals:
 *  문서 5멤버·window 이벤트 대상·NodeFilter·브랜드 글로벌)을 먼저, 그 위에
 *  에이전트 경로만이 필요한 rAF 가드를 «미존재 시에만». 실브라우저(웹)은
 *  아무것도 바꾸지 않아요(설치자가 네이티브 문서를 그대로 두고 rAF도 있어요). */
export function installSdkAgentDom(): void {
  installSdkEventGlobals();
  const g = globalThis as Record<string, unknown>;

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
