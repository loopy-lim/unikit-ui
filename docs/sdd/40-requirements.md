# 사이클 40 요구 정의 (G0)

작성: Product Manager(오케스트레이터 role-perspective self-execution) · 2026-11-10
원 요청: "현재 부족한 component가 너무 많아 이전에 연구를 하기도 해서 그거 확인도 같이 해주고, 부족한 점들을 모두 개선해줘. Shad/cn의 형태를 가져가주는게 좋고 astryx 확인도 해줘. /sdd를 진행해보자"
개정 이력: G0 1차 평가(독립 Requirements Auditor) FAIL 반영 — F-1~F-13 보완(AC-9 신설, AC-1/3/5/7/8 보강, 범위·제외·판단 기록 보완). 판정 근거는 평가 보고와 함께 G5 원장에 보존.

## 목표

UniKit(@unikit-bridge/ui)의 잔여 shadcn 컴포넌트 33종을 전량 이식해 카탈로그 61종을 완성하고, 이전 경쟁 조사(2026-11-09~10)에서 확인된 갭 중 코드·문서로 해결되는 것을 함께 개선한다. 컴포넌트 API·스타일은 shadcn/ui(new-york-v4) 형태를 유지하며, 차이는 기존 관행대로 파일 머리 주석에 판단을 기록한다.

## 범위

### 포함

1. **잔여 33종 전량 이식** (docs/roadmap-components.md 기준)
   - 티어 2 오버레이 13종: dialog, alert-dialog, sheet, drawer, popover, hover-card, tooltip, dropdown-menu, context-menu, combobox, command, menubar, navigation-menu — 신규 브리지 `Portal`·오버레이 위치 계산 선행(B-1)
   - 티어 3 입력 확장 9종: native-select, select, slider, resizable, scroll-area, calendar, input-otp, input-group, form
   - 티어 4 복합 11종: chart, carousel, sidebar, sonner, spinner, message, message-scroller, bubble, attachment, marker, direction
2. **브리지 프리미티브 확장(B-1/B-2)**: Portal, ScrollView, Select(네이티브 폴백 포함), 앵커 위치 계산(`measure` ref 계약), 드래그 공통 추상화, SVG 렌더러 플랫폼 분기 경로(chart용). **오버레이 상태 전파 방식(원본 `data-[state=…]`·그룹 셀렉터의 조건부 클래스 전개 규칙)과 애니메이션 계약(uniwind 네이티브 애니메이션 지원 확인 — spinner 선행, roadmap 명시)을 B-1 설계에 포함**한다. 미지원 판정 시 웹 전용 애니메이션(`web:` 접두사)+네이티브 정적 렌더로 폴백하고 그 한계를 머리 주석·roadmap에 기록한다.
3. **1차 배치에서 기록된 알려진 한계 중 계약 수준 개선**: 표 role 시맨틱, `aria-valuenow/min/max`(progress·slider), `aria-current`(pagination) — 신규 컴포넌트가 요구하는 aria 계약 확장과 함께. **선정 기준**: BridgeRole·aria 프롭 확장으로 해소 가능한 것만. `aria-pressed`(네이티브)는 RN `accessibilityState`에 pressed 값이 없어 계약 확장으로도 해소 불가(웹은 이미 지정됨)라 제외 — 시각 상태 유지.
4. **레지스트리 정합**: registry.json 61종 항목·registry/ui 사본·audit (d) names 배열 갱신, **의존성 오염 해소(P2⑦)** — 아이템 `dependencies`에서 `react-native`·`uniwind` 제거(웹 전용 소비자 불필요 설치 방지), 네이티브 필요 의존은 설명으로 안내
5. **문서 최신화(P1②)**: 루트 README·docs/components.md가 현 아키텍처(@unikit-bridge/ui, Tailwind v4 브리지)와 61종 상태를 반영. roadmap-components.md 완료 상태로 갱신. 실효 잔여: 61종 표기 갱신, README의 v0.1.0 버전 표기 드리프트(실제 0.2.0) 수정, roadmap 완료 전환 (구아키텍처 잔여 기술은 실측 grep 0건 — 이미 충족, AC-5는 실효 잔여 중심으로 검증)
6. **AI 계층 1단계(P2④ 일부)**: `llms.txt`(레지스트리·컴포넌트 안내) + `AGENTS.md`(에이전트 설치·사용 안내 — Astryx `--features agents` 관행 참고) 추가
7. **경쟁 확인 보고(원 요청 ②④의 수용 창구)**: shadcn·Astryx 재확인 + 신규 경쟁자(@aniui·@tetra-ui) 발견 내용을 **docs/sdd/51-research.md(재확인 기록)와 docs/roadmap-components.md(경쟁 현황 섹션 — 포지션·차별점)**에 반영한다. 산출 위치를 이 둘로 특정한다.
8. **쇼케이스 갱신**: apps/web·apps/expo 데모에 신규 컴포넌트 대표 데모 추가(양 플랫폼 동일 섹션·문구 관행 유지). 대표 선정 기준: 티어별 상호작용 특성이 관찰되는 것 — 티어 2 dialog·popover(오버레이), 티어 3 select·slider(입력·드래그), 티어 4 chart·sonner(시각화·전역 큐)를 최소 포함.

### 제외(사용자 결정·외부 환경 필요 — BLOCKED 항목)

- 레지스트리 공개 호스팅(P1①)·shadcn 디렉터리 등재(P2⑧) — 배포 계정·권한 필요. registry.json `homepage`는 배포 후 갱신 예정인 상태 유지
- npm 게시·버전 올림·커밋 — 사용자 요청 시에만
- F-11(네이티브 Pressable onPress 실물 미검증, P1③) — 에뮬레이터 가용하면 G4에서 기회적 재확인(선택), 실기기는 대기
- MCP 서버(P2④ 후속) — 호스팅 선행이 비용 대비 효율 순서(이전 조사 결론 유지)
- **문서사이트·블록(P2⑥) — 사이클 50(docs/sdd/50-requirements.md)이 별도 다루는 범위**라 이번 제외(50이 40 산출물을 보존 대상으로 명시해 충돌 없음)
- **갭 P3(테마 도구·OKLCH 색공간·영어 문서) — 우선순위 낮아 이번 비대상**. 후속 사이클 후보로만 기록

## 수락 조건 (AC-*)

- **AC-1 컴포넌트 완성**: `packages/unikit/src/components/`에 잔여 33종 파일이 존재하고 index.ts에서 export된다. **예외 — chart는 `@unikit-bridge/ui/chart` 단독 진입점으로 export한다(G1 확정, 42-design-plan §0.1: 네이티브 그래프에 react-native-svg가 유입되지 않게 index.ts re-export 배제)**. registry.json `registry:ui` 아이템이 61종(기존 28 + 신규 33), 전체 items는 66(registry:lib 1 + registry:ui 61 + registry:theme 4)이다.
- **AC-2 유니버설 렌더**: 모든 신규 컴포넌트는 한 벌 소스로 web(DOM 브리지)·native(RN 브리지) 양쪽에 컴파일된다. `bun run typecheck`(패키지·web·expo 3종) 전부 exit 0.
- **AC-3 shadcn 형태·계약 소급**: 컴포넌트명·export API·변형·토큰 클래스는 shadcn new-york-v4 원본(`shadcn-ref/ui/`)을 기준으로 하고, 유니버설 제약상의 차이(랙스 제거·셀렉터 치환 등)는 각 파일 머리 주석에 기록한다. **알려진 한계 소급 개선(포함 3)이 코드에 나타난다: `table.tsx`의 role="table"/"row"/"cell"/"columnheader" 지정, `progress.tsx`의 aria-valuenow/min/max 지정, `pagination.tsx`의 aria-current="page" 지정(코드 grep으로 확인).** spinner의 머리 주석은 애니메이션 계약 판단(웹 animate-spin·네이티브 지원 여부와 폴백)을 기록한다. 감사 `bun run audit:design` 8/8 PASS(신규 파일 임의값 클래스 금지 (c) 포함).
- **AC-4 레지스트리 정합·의존성**: audit (d)가 names 배열 갱신 후 61+1종 전부 동일 판정. 모든 `registry:ui` 아이템의 `dependencies`에 `react-native`·`uniwind`가 없다(웹 소비자 오염 해소). `form` 아이템은 `react-hook-form`, chart는 **G1 확정 방향(42-design-plan §0.1 — react-native-svg 선택적 peer + 별도 export 경로)**에 따라 네이티브 렌더러 필요 의존을 안내 문구로 명시한다.
- **AC-5 문서(실효 잔여 중심)**: README·docs/components.md가 61종 완료 상태·브리지 사용법을 반영하고 README의 버전 표기 드리프트(v0.1.0 표기 잔존)가 없다. roadmap-components.md가 완료 상태 전환·한계 항목 갱신(표 role·aria-value·aria-current 해소, 애니메이션 계약 판단 기록)을 반영한다. 구아키텍처 용어(@unikit/core·NativeWind·Tailwind 3.4) 잔여 0건(grep 유지).
- **AC-6 AI 계층**: 저장소 루트에 `llms.txt`(레지스트리 엔드포인트·컴포넌트 목록·설치법)와 `AGENTS.md`(에이전트 작업 안내)가 있고 컴포넌트 목록이 61종과 일치한다.
- **AC-7 빌드·번들**: `bun run build`(apps/web, next build) exit 0, `bun x expo export --platform android`(apps/expo) exit 0(신규 컴포넌트가 네이티브 그래프에서 컴파일됨).
- **AC-8 쇼케이스·오버레이 실물 관찰**: web·expo 데모에 포함 8의 대표 선정 기준 컴포넌트(dialog·popover·select·slider·chart·sonner 최소 포함)가 양측 동일 섹션으로 존재한다. 웹에서 portal 프리미티브가 실제 최상위(document.body 직계)로 오버레이를 렌더함을 G4 관찰로 확인한다(포함 2의 직접 증거).
- **AC-9 경쟁 확인 보고(원 요청 ②④)**: docs/sdd/51-research.md에 shadcn·Astryx 재확인 내용과 신규 경쟁자(@aniui·@tetra-ui) 발견 기록이 있고, docs/roadmap-components.md에 경쟁 현황(웹+RN 단일 소스 포지션·유사 엔진 경쟁 심화) 섹션이 반영된다(열람·grep으로 확인).

## 제약

- 패키지 매니저 bun(pnpm 금지). 커밋 규칙: 한국어 Conventional Commits, attribution 금지(커밋은 요청 시).
- 기준 리비전 ee37765. "미커밋 변경 없음"은 코드 기준이며 이 사이클의 산출물 문서(docs/sdd/40·42·51)과 원본 참조 사본 `shadcn-ref/`(커밋 대상 아님)는 제외다.
- 기존 28종·토큰·테마 시스템은 외부 계약 유지(파괴 변경 금지) — 단, aria 계약 확장과 소급 개선(포함 3)은 추가 전용.
- 임의값 클래스(`x-[…]`) 금지(audit (c)), RN Pressable 문자열 children 직접 금지(내부 Text 래핑 필수 — 사이클 30 교훈).

## 차단 질문 (사용자 결정 필요 없음 — 자체 판단 기록)

1. ~~chart 네이티브 렌더러: G1에서 확정~~ → **G1 확정 완료(42-design-plan §0.1)**: react-native-svg 선택적 peer + `@unikit-bridge/ui/chart` 별도 export 조건분기. 웹은 순수 SVG(하드 의존 0). AC-4는 이 방향 기준.
2. sonner·command 등 shadcn이 외부 패키지(sonner·cmdk)를 쓰는 것은 유니버설 자체 구현로 대체하고 API 형태만 shadcn 유지.
3. form은 react-hook-form을 레지스트리 의존으로 추가(플랫폼 무관 라이브러리, optional peer).
