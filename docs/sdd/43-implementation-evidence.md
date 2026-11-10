# 사이클 40 구현 증거 (G2)

- 작성: 오케스트레이터(System Architect 직군 겸) + 병렬 Frontend/UI Engineer 태스크 12건 · 2026-11-10
- 계획: `docs/sdd/42-design-plan.md` · 요구: `docs/sdd/40-requirements.md`
- 목표: shadcn/ui 카탈로그 잔여 33종 전량 이식 → **61종 완성** + 브리지 확장 + 레지스트리·문서·쇼케이스 통합

## 태스크 수행 (병렬 분할 — 파일 소유권 무교집합)

| T | 범위 | 산출 | typecheck |
|---|---|---|---|
| T-0 (직접) | 브리지 계약 확장·lib/overlay·chart 렌더러 골격·소급 3종(table·progress·pagination) | types.ts 381줄·web.tsx·native.tsx·overlay.tsx·chart/{types,web,native}.tsx | exit 0 |
| T-1a | dialog·alert-dialog·sheet·drawer | 4파일 export 34종, ModalOverlay 소비·useDrag 드래그 닫기 | exit 0 |
| T-1b | popover(+계열 기초) | popover.tsx export 7종, AnchoredOverlay 소비 | exit 0 |
| T-1c | dropdown-menu·context-menu 등 메뉴 | 15+15 export, 우클릭·길게 누르기 매핑 | exit 0 |
| T-1d | command·scroll-area·resizable·slider·hover-card·tooltip | 6파일, 키보드 탐색·드래그 리사이즈 | exit 0 |
| T-1e | combobox·menubar·navigation-menu | 16+16+9 export, popover+command·dropdown 조합 | exit 0 |
| T-2a | native-select·select·input-otp·input-group | 4파일, SSR 스모크 14항목 통과 | exit 0 |
| T-2b | 사전 조사·기반(선행) | — | — |
| T-2c | calendar·form | 월 격자 직접 구현·react-hook-form 연동 유지 | exit 0 |
| T-3a | chart.tsx + 렌더러 포인터 계약 보강 | recharts 제거·선언형 시리즈·5색 토큰 순환 | exit 0 |
| T-3b | carousel·sidebar·sonner | ScrollView 페이징·Sheet 소비·모듈 저장소 toast | exit 0 |
| T-3c | spinner·direction | View 원호 조형·순수 컨텍스트 | exit 0 |
| T-3d | message·bubble·attachment·marker·message-scroller | ScrollView 직접 소비·자동 하단 | exit 0 |
| R-1 (조사) | 경쟁 갭 재확인·Astryx | 51-research.md §4 (실측: shadcn 61종·MCP 7도구·Astryx Swift 실험·RNR 6주 공백) | — |

## T-4 통합 (진행·순차)

- **index.ts 배럴**: 60종 export 완료(chart 제외 — `@unikit-bridge/ui/chart` 단독 진입점, Metro 오염 방지 §0.1)
- **registry/ui**: 사본 61종 완성 · **registry.json**: 66 아이템(신규 33 + utils + theme 4), 기존 28종 deps에서 react-native·uniwind 제거(P2⑦), form→react-hook-form·chart→react-native-svg peer 안내
- **audit names**: 61종 갱신 · scanPattern 주석 라인 제외 확장(오탐 154건 해소 — 포팅 판단 주석의 원본 클래스 인용)
- **실제 위반 2건 수정**: attachment `web:has-[>a,>button]:hover:…` → `web:hover:…`, bubble `web:has-[button]:p-0` 제거(has 임의값 셀렉터 — 표준 계단 근사)
- **문서(T-4.4)·쇼케이스(T-4.6)**: 병렬 진행 중

## 자식 제기 → 오케스트레이터 브리지 반영 (전부 내 소유 파일)

| 제기 | 반영 |
|---|---|
| T-1a aria-labelledby 부재 | ModalOverlayProps에 `"aria-labelledby"` 전달 + dialog·alert-dialog 연결 |
| T-1a AlertDialog 백드롭 닫힘 | ModalOverlay `dismissOnBackdrop`(기본 true) — alert-dialog는 false로 원본 radix 동작 복원 |
| T-1b 우클릭 기본 메뉴 함께 뜸 | web.tsx Pressable onContextMenu preventDefault 래핑 |
| T-1d 앵커 팝업 바깥 클릭 | Portal onBackdropPress={onClose} 연결(AnchoredOverlay) |
| T-1c/d ViewProps aria 확장 | aria-modal·describedby·value*·expanded·controls·labelledby 추가 |
| T-3b 네이티브 토스트 배경 조작 차단 | Portal `modal` 옵션(기본 true) — false면 RN Modal 대신 절대 배치 View, sonner가 소비 |
| T-2a BridgeRole group 부재 | `"group"`·`"region"` 추가 + input-group에 role="group" 즉시 적용 |
| T-2a TextProps aria-hidden 부재 | 추가(웹 그대로·네이티브 accessibilityElementsHidden 치환) |
| T-2a TextInputProps onFocus/onBlur·accessibilityLabel 부재 | 추가(양측 표준 prop) |
| 로드맵 유지 | ScrollView 오프셋 읽기·ViewProps.onKeyDown 정식화·optgroup(그룹 라벨 상실) |

## apps 의존 (T-4 경계 — 설계 §4.1)

- apps/expo: `react-native-svg ~15.12.0`·`react-hook-form ~7.65.0` 추가
- apps/web: `react-hook-form ~7.65.0` 추가 · `bun install` 완료(루트 hoisted 해석 확인)

## V-* 실행

| ID | 명령 | cwd | 결과 |
|---|---|---|---|
| V-1 | `bun run typecheck` | packages/unikit | exit 0 · 에러 0 (61종+배럴 포함) |
| V-2 | `bun run audit:design` | packages/unikit | **8/8 PASS** (b 원색 0·c 임의값 0·d 사본 62종 동일·e 66항목 경로 실재·f tokens 4034B 일치) |
| V-5 | registry 정합 python 검증 | packages/unikit | UI 61 = registry 파일 61 (차집합 ∅) · registryDependencies 전부 실존 · deps 금지 의존 잔존 0 |
| V-6 | `grep -riE '@unikit/core|nativewind|react-native-web|tailwind *3'` | packages/unikit (설계 기준 루트 재실행: docs 매치는 과거 SDD·경쟁자 서술로 전부 수동 제외 대상) | 코드 사용 0건 |
| V-1(web) | `bun run typecheck` | apps/web | exit 0 · 에러 0 (루트 typecheck 3패키지 일괄, 최종 소스 기준) |
| V-1(expo) | `bun run typecheck` | apps/expo | exit 0 · 에러 0 (상동) |
| V-3 | `bun run build` | apps/web | exit 0 ×2(수정 전후) — `/showcase` 정적 프리렌더 성공(G3 수정본 재검증 포함) |
| V-4 | `bun run export:web` | apps/expo | exit 0 ×2(수정 전후) — 웹 번들 6개 + 정적 라우트 3개 export. G3 수정본은 index 번들 145KB(차트 섹션 포함), ChartSurface가 번들에 컴파일됨(**AC-7 입증**), fill-chart-1..3 클래스 생성(@theme 토큰 경로 실증) — **AC-8 양측 충족** |
| V-7 | 쇼케이스 정적 렌더 대조 | apps/web + apps/expo | 실증 — 웹 /showcase HTML(127KB): 차트 SVG 2개(막대·선, aria-label 접근성 포함)·Toaster·Command·Dropdown·Tooltip 섹션 확인. expo dist/index.html(141KB): 차트 SVG 2개 + fill #f54900×6(막대)·stroke 2색(선) — 색상 전달 경로 실증. **한계**: 상호작용(첫 오픈·ESC·바깥 클릭) 실물 관찰은 이 세션의 프리뷰 도구 불능으로 코드 인과 검증(F-1 deps·F-6 스택·F-3 백드롭 조건 — 수정 논리는 두 리뷰 렌즈 교차 확정)으로 대체 |

## G3 관문 — 3렌즈 독립 리뷰(Staff Code Reviewer·Security & Reliability·Task QA)와 결함 처리

세 렌즈 모두 읽기 전용 병렬 리뷰로 **총판정 FAIL** — 교차 확정 결함 15건을 아래와 같이 수정했다(기각 오탐 19건·조사 질문 9건은 리뷰 기록대로 분리).

| 결함 | 등급 | 처리 |
|---|---|---|
| AnchoredOverlay 첫 오픈 콘텐츠 영구 투명(2렌즈 확정) | P0 | 측정 이펙트 deps에 `ready` 추가 — 앵커 측정 완료 후 Portal 마운트 시점에 콘텐츠 크기 재측정(overlay.tsx) |
| ModalOverlay 웹 absolute 좌표계 — 스크롤 시 카드 뷰포트 밖 | P1 | 래퍼를 `style position:fixed`로(네이티브는 브리지가 absolute 치환, RN Modal 좌표계와 동일하게 유지) |
| AlertDialog 웹에서 딤·바깥 클릭 차단 부재 | P1 | Portal 백드롭 렌더 조건을 `onBackdropPress ∥ backdropClassName`으로(닫기 핸들러 없는 백드롭은 클릭 삼킴 — radix 동작) |
| 기존 파일 주석 훼손(전각 치환·`·` 소실) | P1 | HEAD 라인 매칭으로 106라인/30파일 복원(괄호는 전각·`...` 제거 유지 — uniwind 오염 방지 규칙) |
| ESC 중첩 오버레이 동시 닫힘(2렌즈 확정) | P2 | useDismiss에 열림 스택 오너십(최상위만 발화) — web.tsx |
| useReposition 리스너 해제 불일치·무스로틀 | P2/P3 | 안정 래퍼 add/remove + rAF 스로틀 — web.tsx |
| audit (g) 정규식이 인용부호 경계 미탐지(12클래스 누락) | P1 | 라인 스캔·경계 확장·주석 제외·원본 인용 허용 목록(slider bg-white·sonner richColors) — 허용 24건 정합 처리 |
| chart 양측 데모 미충족·react-native-svg 미사용 | P1 | expo 네이티브 차트 섹션 추가(소비자 사본 chart.tsx + global.css @theme --color-chart-1..5) — AC-7/AC-8 충족 |
| registry chart description이 recharts 서술 인용 | P2 | 실구현 기준 재작성(react-native-svg 명시) |
| CommandDialog 미이식(설계 §3 명시 위반) | P2 | 이식(Dialog+DialogContent 조합, sr-only 헤더는 accessibilityLabel 근사 — DialogContent에 접근성 이름 전달 보강) |
| Sheet 기본 side "bottom" 변경 | P2 | 원본 기본값 "right" 복원 |
| AlertDialog ESC 닫힘 유지 | P3 | ModalOverlay `dismissOnEscape` 옵션 추가, alert-dialog는 false(원본 radix 동작) |
| sonner getServerSnapshot 모듈 상태 반환·promise 4000 하드코딩 | P3 | 불변 EMPTY 상수·duration undefined 전환 |
| ChartAreaSeries 활성 점 fill 누락 | P3 | stroke 색으로 보강 |
| 네이티브 Select 비제어 라벨 미갱신 | P3 | 내부 uncontrolled state로 commit 반영 |
| Sheet·Drawer aria-labelledby 미전달·주석-코드 불일치(popover·dropdown·context-menu) | P3 | 전달·머리주석 정합 갱신 |

- 유지 판단(문서화된 설계 선택): DialogOverlay/Portal export 제거(구조 통합), SidebarMenuSkeleton Math.random(원본 동일), 앵커 팝업 투명 백드롭 일관 처리, Calendar 비제어 미지원, slider/resizable 회전 후 재측정(로드맵), wrapTextChildren 등 유틸 중복(별도 리팩터 사이클).
- deps 정책 편차 기록: 설계 §1.5 "deps 5종 통일"에서 실제로는 실제 import 기준 최소화(4그룹)로 시행 — README에 최종 문서화 완료(G3 QA P2-3).

## 운영 사고와 대응

- **types.ts 2차 원복**(174줄로 복귀, 외부 원인 미상): 재작성 + inotifywait 백그라운드 감시. 이후 재발 없음(감시 로그 MODIFY는 전부 작업분). 최종 400줄 — 381줄은 사고 직후 기준이고 이후 사이클 40 확장 편집으로 증가(정상 경과).
- **API 429 3태스크 실패**(9개 동시 스폰): 완료 통지마다 1~2개 순차 재스폰으로 해소(동시 ≤5 유지).
- **감시 셸 2시간 한도 종료 1회**: 로그 확인(원복 징후 없음) 후 재가동.
- **uniwind CSS 오염(V-4 3단계 실패)**: expo `@source '../../packages/unikit/src'` 스캔이 소스 주석의 임의값 클래스 예시를 CSS 생성 후보로 삼음 — ① 유니코드 `…`가 `Ident("…")` 파싱 실패 → `...`로 교체 ② 연속 마침표가 `Delim('.')` 실패 → `...` 제거 ③ 빈 함수 잔여(`calc()` 등)가 `Unexpected end of input` 실패 → **주석 라인(//·\*·/\*·{/* 시작)의 괄호만 전각(［］（）) 치환**으로 후보 생성 자체를 차단해 해결(3507곳, typecheck 0 유지). 중간에 `...`→`·` 전체 sed가 JS spread까지 침범(에러 2790개)한 사고가 있었으나 즉시 복구(typecheck 0). registry 사본 재동기화 후 audit (d) 재통과.
