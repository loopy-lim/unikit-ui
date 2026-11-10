# 설계·계획 — 사이클 30: shadcn 카탈로그 1차 배치 이식

- 작성 직군: System Architect (role-perspective) · 검토: Architecture & Plan Reviewer(독립) — 판정 원장은 33-implementation-evidence.md
- 기준: main 84f65e6 이후 작업 트리(미커밋, 시작 시 clean). 브리지 확장(T-2)은 본 문서 작성 전 이미 적용·typecheck 통과 — 아래에 사후 기록.

## 1차 배치 선정 (23종)

shadcn registry:ui 61종 중 기존 구현 5종(button·card·input·label·badge) 제외, **브리지 프리미티브만으로 충실하게 이식 가능한 23종**:

skeleton, separator, textarea, alert, checkbox, radio-group, switch, toggle, toggle-group, tabs, accordion, collapsible, progress, breadcrumb, kbd, pagination, table, aspect-ratio, avatar, empty, field, item, button-group

제외 33종 사유(후속 티어, docs/roadmap-components.md 참조 — 61종 완전 분배):
- **포털·위치결정 필요(13종)**: dialog, alert-dialog, sheet, popover, tooltip, hover-card, dropdown-menu, context-menu, navigation-menu, menubar, select, combobox, command
- **제스처·드래그(4종)**: slider, drawer, carousel, resizable
- **스크롤·레이아웃 인프라(2종)**: scroll-area, sidebar
- **외부 라이브러리 의존(3종)**: chart(recharts), form(react-hook-form 등), sonner(toast 런타임)
- **애니메이션(1종)**: spinner
- **2차 검토 대상(10종)**: input-group, input-otp, native-select, calendar, direction, attachment, bubble, marker, message, message-scroller

npm 패키지(`@unikit-bridge/ui`) 신규 23종 반영 재게시는 **후속 사이클** 과제다(커밋·게시는 사용자 요청 시에만 — 본 사이클 AC-6은 로컬 레지스트리 공급까지 검증).

## 포팅 규칙 (모든 컴포넌트 공통 — 기존 5종 패턴 준수)

1. radix/base 엔진 의존 제거 — 상태는 React state/context로 직접 관리. **`data-[state=...]`·`group-data-[...]` 셀렉터 금지**(네이티브에 data 속성 없음) → 상태값에 따른 조건부 클래스로 전개.
2. cva 변형·토큰 클래스 문자열은 shadcn 원본을 최대한 보존(토큰 체계 동일). 웹 전용 효과(shadow-\*, transition-\*, peer, ::)는 `web:` 접두 또는 제거.
3. 아이콘 없음 — 글리프 Text 대체(✓ › ‹ ⌄ + − … ⋯ 등), 아이콘 인프라는 후속.
4. children은 문자열(이중 지정 원칙: 배경·테두리 컨테이너, 전경색 내부 Text), forwardRef + displayName, `@unikit-bridge/ui/primitives` import.
5. src/components와 registry/ui 본문은 byte 동일(`../lib/utils` ↔ `@/lib/utils` 예외 — audit (d)가 검증).
6. 신규 접근성 계약 사용 가능: `accessibilityRole`(tab·switch·checkbox·radio·separator·progressbar 등), `aria-checked`·`aria-selected`·`aria-expanded`(네이티브 accessibilityState로 자동 매핑).

## 태스크 분해 (T-* ↔ AC-* ↔ V-*)

| 태스크 | 담당 직군 | 수정 허용 경계 | AC | 선행 |
|---|---|---|---|---|
| T-1 문서 최신화 | Skill/Prompt Engineer(단일, 오케스트레이터 수행) | README.md, docs/components.md, docs/expo-go.md | AC-1 | — |
| T-2 브리지 확장 — Image 프리미티브·BridgeRole·aria 상태 매핑 | Backend/Core Engineer(오케스트레이터 수행, **완료·typecheck 통과**) | src/bridge/{types,native,web}.tsx | AC-3 전제 | — |
| T-3a 조A 폼컨트롤: checkbox·radio-group·switch·toggle·toggle-group | Frontend/UI Engineer #A | src/components + registry/ui의 해당 5종 신규 파일만 | AC-3 | T-2 |
| T-3b 조B 공개/전개: tabs·accordion·collapsible·progress·aspect-ratio | Frontend/UI Engineer #B | 상동 5종 | AC-3 | T-2 |
| T-3c 조C 표시: skeleton·separator·alert·kbd·table·breadcrumb·pagination | Frontend/UI Engineer #C | 상동 7종 | AC-3 | T-2 |
| T-3d 조D 복합: textarea·avatar·empty·field·item·button-group | Frontend/UI Engineer #D | 상동 6종 | AC-3 | T-2 |
| T-4 통합 — registry.json 23종·src/index.ts·audit names(F-26)·docs/components.md 절·양쪽 쇼케이스·docs/roadmap-components.md 신규·README 컴포넌트 수 | Frontend/UI Engineer(오케스트레이터 수행, 공유 파일 순차) | packages/unikit/registry.json, src/index.ts, scripts/audit-design.ts, docs/components.md, docs/roadmap-components.md, README.md, apps/expo/app/index.tsx, apps/web/app/page.tsx | AC-2·AC-3 | T-3a~d |
| T-5 검증 스위트 실행 | Verification(오케스트레이터) | 읽기·검증만 | AC-4~6 | T-4 |

병렬성: T-3a~d는 파일 소유권 무교집합(신규 파일 각 조별 분리)으로 4조 동시 스폰. 공유 파일(registry.json·index.ts·audit·문서·쇼케이스)은 T-4에서 단일 컨텍스트 순차 편집. **순서: T-1(문서 최신화)이 먼저 완료된 뒤 T-3a~d 스폰, T-4는 4조 완료 후** — README.md·docs/components.md는 T-1에서 전면 갱신하고 T-4는 신규 컴포넌트 절·수치만 **추가(additive)** 편집으로 소유권 충돌을 없앤다(F-43 대응).

## 검증 계획 (V-*)

| ID | 검증 | 명령/절차 (cwd) | 기대 |
|---|---|---|---|
| V-1 | 문서 정합성 | `grep -rn "@unikit/core\|nativewind\|NativeWind\|Tailwind 3.4\|tailwindcss@^3.4" README.md docs/components.md docs/expo-go.md packages/unikit/README.md` + 문서 언급 경로 실존 확인 | 잔존 0건·경로 전부 실존 |
| V-2 | 패키지 타입 | `bun x tsc --noEmit` (packages/unikit) | exit 0 |
| V-3 | 전체 타입 3종 | `bun run typecheck` (루트) | exit 0 ×3 |
| V-4 | 디자인 감사 | `bun run audit:design` (루트) | 8/8 PASS — (d) names 28종(기존5+신규23) 검증 |
| V-5 | 웹 빌드 | `bun run build` (apps/web) | exit 0 |
| V-6 | 네이티브 번들 | `bun x expo export --platform android` (apps/expo) | exit 0 (Hermes 컴파일) |
| V-7 | 웹 렌더 증거 | `bun x expo export --platform web` + 정적 서빙 + 스크린샷(라이트·다크) | 23종 렌더 확인 |
| V-8 | 레지스트리 공급 | apps/web `next dev` 기동 후 `curl /r/<23종>.json` + `curl /r/registry.json` | 전종 200 + files[].content 포함, 아이템 수 33(기존10+23) |

## 리스크와 대응

- uniwind 미지원 클래스(shadow·일부 변형) → `web:` 접두로 네이티브 제외, 시각 차이는 문서화.
- field(248줄)·item(193줄) 분량 → 조D 과부하 시 button-group을 조C로 이동(소유권 조정은 T-4 전에만).
- 쇼케이스 페이지 비대 → 컴포넌트별 1~2 대표 상태만 전시, 전 변형은 문서에 기록.

## 관문 평가 계획

- G2: Task QA Validator(독립 스폰) — T-3a~d·T-4 diff 대 AC-3 대조.
- G3: Staff Code Reviewer(독립 스폰) — 전체 diff 품질·브리지 계약 일관성.
- G4: UX/Design Auditor(독립 스폰) — V-7 스크린샷·상호작용 관찰.
- G5: Release Gatekeeper(독립 스폰) — AC-1~6 최종 판정.

## 관문 감사 기록 (2026-11-10)

- **G0 요구: PASS** · **G1 계획: FAIL → 수정 후 재검 PASS** — 평가 직군: independent Requirements Auditor + Architecture & Plan Reviewer(결합, 클린 컨텍스트 스폰).
- 감사 결함과 처리: F-40(P1·pagination 조 미배정) → T-3c에 배정(7종) · F-41(P2·alert-dialog·hover-card 분배 누락) → 제외 33종 재목록화 · F-42(P3·비존재 항목 언급) → date-picker·typography 삭제, 2차 검토 10종으로 정정 · F-43(P3·T-1/T-4 경계 중복) → T-1 선완료·T-4 추가 편집(additive) 원칙 명시 · F-44(P3·npm 재게시 미명시) → 후속 사이클 과제로 명시.
- 재검: 61종 완전 분배(기존5+1차23+잔여33)·23종 참조 소스 전수 존재를 스크립트로 기계 검증(PASS — 본문 분배표 참조). 문서 수정 자체는 오케스트레이터 role-perspective self-review 한계 — 태스크 실제 결과(28종 파일·registry 아이템 33개)는 G2 Task QA Validator가 독립 대조한다.
- 기타 감사 관찰(조치 불요): skeleton의 animate-pulse는 규칙 2의 `web:` 접두 처리 대상(제약과 모순 아님).
