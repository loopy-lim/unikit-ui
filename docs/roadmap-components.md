# UniKit UI 컴포넌트 로드맵 — shadcn 카탈로그 전량 이식 완료

shadcn/ui(new-york-v4)의 `registry:ui` 61종을 UniKit UI 유니버설(한 벌 소스 → 웹·네이티브 동일 렌더)로 가져오는 작업이 **2026-11-10에 61/61 전량 완료**됐어요. 이 문서는 완료 이력, 브리지 계약상 아직 재현하지 못한 **미지원 기능 로드맵**, 그리고 **경쟁 현황**을 정리해요. 수치의 기준일: 2026-11-10.

## 현재 상태: 61 / 61종 완료

| 단계 | 수량 | 컴포넌트 | 상태 |
|---|---|---|---|
| v0.1 기초 | 5 | button, card, input, label, badge | 완료 |
| 1차 배치 (사이클 30) | 23 | accordion, alert, aspect-ratio, avatar, breadcrumb, button-group, checkbox, collapsible, empty, field, item, kbd, pagination, progress, radio-group, separator, skeleton, switch, table, tabs, textarea, toggle, toggle-group | 완료 |
| 2차 배치 (사이클 40) | 33 | 아래 티어 표 전체 | **완료 (2026-11-10)** |

- `packages/unikit/src/components/` 61종 · `packages/unikit/registry/ui/` 61종 · `registry.json` 67 아이템(UI 61 + utils 1 + theme 4 + animations 1).
- `chart`는 index.ts 배럴에서 제외되고 `@unikit-bridge/ui/chart` 단독 진입점이에요(react-native-svg 선택 peer — 웹 번들 오염 방지). `form`은 react-hook-form 선택 peer. 아이콘은 브리지 primitives가 lucide(`lucide-react` / `lucide-react-native`)를 감싸요.

## 완료 이력 — 티어별 구현 방식

계획 당시에는 잔여 33종을 필요한 브리지 기능별 3개 티어로 나눴었어요. 실제로는 티어 2(오버레이)를 먼저 풀면서 브리지가 한 번에 확장됐고(사이클 40 Wave 0), 전 티어가 같은 사이클에 완성됐어요.

### 티어 2 — 오버레이·포털 13종 (완료)

**구현**: `src/lib/overlay.tsx` 통합 오버레이 훈이 포털(웹 createPortal / 네이티브 Modal)·백드롭·바깥 눌림 감지·ESC 닫기·포커스 이동/트랩/복귀·measure 기반 앵커 위치 계산(side/align/offset 12방 배치 + 뷰포트 클램프)을 담당해요. dialog 계열은 `ModalOverlay`(포털+백드롭만), popover 계열은 `AnchoredOverlay`(앵커 위치 계산까지)를 소비해요.

| 컴포넌트 | 구현 요점 |
|---|---|
| `dialog` | React state+context 관리, 배경 스크롤 잠금 포함 |
| `alert-dialog` | dialog 계열 공유, 원본 grid 레이아웃은 flex 근사 |
| `sheet` | ModalOverlay 방향별 배치(side 4방향) |
| `drawer` | useDrag 아래 드래그 닫기 |
| `popover` | 앵커 위치 계산, 열림 중 스크롤·리사이즈 재계산(웹) |
| `hover-card` | 웹 지연 개방, 네이티브 탭 토글 |
| `tooltip` | 트리거 aria-describedby 연결 |
| `dropdown-menu` | popover 패턴 + 하위 메뉴 1단계 캐스케이드 |
| `context-menu` | 웹 onContextMenu / 네이티브 길게 누르기 매핑 |
| `combobox` | popover + command 조립 |
| `command` | 자체 필터 + 키보드 탐색 통합 입력 모델 |
| `menubar`·`navigation-menu` | dropdown-menu 소비 조립 |

### 티어 3 — 입력 확장·제스처 9종 (완료)

**구현**: 브리지 프리미티브가 확장됐어요 — `Select`(웹 진짜 `<select>`), `ScrollView`(웹 overflow div), `useDrag`(웹 PointerEvent / 네이티브 PanResponder), measure ref 계약.

| 컴포넌트 | 구현 요점 |
|---|---|
| `native-select` | Select 프리미티브 소비(네이티브 폴백 포함) |
| `select` | popover 기반 목록(role combobox/listbox/option) |
| `slider` | useDrag, 웹 방향키 값 조정 |
| `resizable` | useDrag 드래그 리사이즈 |
| `scroll-area` | ScrollView 프리미티브 |
| `calendar` | 순수 날짜 그리드 직접 구현(role grid/gridcell) |
| `input-otp` | 숨은 TextInput 하나로 값 분배·포커스 이동 |
| `input-group` | 기존 input·field 조립형 |
| `form` | react-hook-form 선택 peer 연동 유지 |

### 티어 4 — 데이터 시각화·복합 11종 (완료)

| 컴포넌트 | 구현 요점 |
|---|---|
| `chart` | recharts 제거 — 선언형 시리즈(막대·선·영역) + 전용 렌더러 진입점(`@unikit-bridge/ui/chart`), 시리즈 색은 `--chart-1..5` 토큰 순환 |
| `carousel` | 네이티브 ScrollView paging / 웹 scroll-snap |
| `sidebar` | sheet+collapsible 조립(쿠키·컨테이너 쿼리 제거) |
| `sonner` | 모듈 저장소 전역 큐 + `toast()` 함수, role=status 라이브 영역 |
| `spinner` | View 원호 조형 — 웹 CSS `web:animate-spin`·네이티브 브리지 `LoopRotate`(RN Animated) 회전 |
| `message`·`message-scroller`·`bubble`·`attachment`·`marker` | 기존 패턴 그대로(채팅 계열), message-scroller는 하단 고정 |
| `direction` | useDirection 재노출 래퍼 |

## 미지원 기능 로드맵

완료된 61종에도 브리지 계약상 아직 표현하지 못한 것이 있어요. 각 컴포넌트 소스 파일 머리 주석의 "로드맵" 기록을 계열별로 묶은 목록이에요.

### 1차 배치 한계의 해소·유지 (사이클 40 브리지 확장으로)

- **해소** — 표 시맨틱(`table`·`row`·`cell` 등 BridgeRole 추가), `progress`의 `aria-valuemin/max/now`, `pagination`의 `aria-current="page"`, `toggle`의 네이티브 `aria-pressed`(accessibilityState 매핑).
- **유지** — 표·빈상태 셀 children은 문자열 권장(내부 Text 래핑). `alert` destructive 테두리 대비(3:1 미달)는 shadcn 원본과 같은 값이라 유지 — 글리프 ⚠·글자색이 상태의 주 신호예요.

### 오버레이·애니메이션

- **측정 캐시 무효화** — slider(트래크 폭)·resizable(컨테이너 크기)가 최초 1회만 측정값을 캐시해요. 화면 회전·리사이즈 후 드래그 수치가 이전 크기 기준으로 남아요(G3 리뷰 제기). 로드맵: 측정 훈에 무효화 신호(bridge onLayout 재구독) 도입 검토.
- **등장/퇴장 애니메이션** — dialog·sheet·drawer·popover·tooltip·dropdown-menu·select·command·sonner·tabs·accordion·calendar 등 오버레이·전개 계열 전반이 마운트/언마운트 **즉시 전환**이에요(`data-[state]` 셀렉터가 없는 네이티브에서 재현 불가). 로드맵: 웹 전용 애니메이션 클래스(`web:` 접두) 도입 검토.
- **네이티브 애니메이션 계약(1차 해소 2026-11-10)** — 루프 계열(회전·펄스)은 브리지 `LoopRotate`·`LoopPulse`(RN Animated useNativeDriver — UI 스레드)로 네이티브도 구동해요. 잔여: 오버레이 등장/퇴장 슬라이드(제스처 연동은 Reanimated optional peer 도입 검토 — chart의 react-native-svg 패턴 준용).
- **hover 개방** — `navigation-menu`(hover 지연 개방)·`menubar`(인접 트리거 hover 전환) 미지원 — 브리지 onHoverIn 계약 부재, 눌림 전환만. `hover-card`는 웹 지연·네이티브 탭 토글로 근사.
- **포인터 이벤트 계약** — `popover` 충돌 감지(avoidCollisions·sticky) 미지원(뷰포트 클램프 8px로 근사), `hover-card` 콘텐츠 이탈 닫힘 미지원, `tooltip` 웹 키보드(focus) 진입 미지원.
- **asChild** — radix Slot 상당 기능이 없어 popover·tooltip·hover-card 트리거와 sidebar 일부 요소는 Pressable/View 고정 렌더예요.

### 키보드·포커스

- **select·메뉴 키보드 탐색** — 화살표키·타입어헤드·루프 탐색이 `select`·`dropdown-menu`·`context-menu`·`command`(네이티브)에 미지원이에요. command는 웹 방향키·엔터를 지원하지만 네이티브 onKeyPress 래핑 한계로 IME 조합 키는 발화되지 않아요. 항목 자동 스크롤(scrollIntoView)도 측정 계약 부재로 미지원.
- **resizable 키보드 리사이즈** — 포커서블 계약(tabIndex) 부재로 화살표 리사이즈 미지원.
- **slider** — 수직 방향 미지원(수평 전용), 썸별 포커스·썸별 aria 미지원(트랙 전체 드래그 조작).

### 차트·데이터

- **chart 반응형 크기** — 뷰포트 비례 높이는 BridgeStyle 퍼센트 계약이 없어 고정 근사예요.
- **chart 다크 전환** — 스킴 조회 계약이 없어 `config.theme`의 light 값만 써요.
- **recharts 고급 차트** — 스택·극좌표·방사형·브러시·줌·참조선 등 미지원(막대·선·영역 기본 시리즈만).
- **calendar 다중 선택** — 다중 선택·범위 선택(range_*)·matcher prop 미지원(단일 선택만), 선택 애니메이션·RTL 화살표 회전도 미지원.
- **carousel 스크롤 오프셋 읽기** — 계약상 오프셋·콘텐츠 폭 읽기가 불가해 페이지 표시(페이지니스)가 자체 추정이에요.

### 입력·폼

- **form RN 전파** — `aria-invalid`·`aria-describedby`가 웹 전용 계약이라 RN 입력창에는 미전달돼요(nativeID·accessibilityLabelledBy는 양쪽 동작).
- **input-otp** — 캐럿 깜빡임: 웹은 keyframes 하드 온오프, 네이티브는 `LoopPulse` 부드러운 맥동 근사(1.25s 주기). 미포커스 상태에도 캐럿이 보일 수 있어요.
- **input-group** — 원본의 파일 셀 focus 링(data-attribute 셀렉터)이 컨트롤 자체 슬림 링으로 근사돼 있어요.
- **scroll-area** — 커스텀 스크롤바는 미지원 셀(항상 null 렌더), 기본 스크롤 동작만 제공해요.
- **combobox** — 자동 필터 변경 훅 미지원(▾ 트리거 개방), 팝업 폭 w-72 고정(앵커 폭 추종 불가).

## 경쟁 현황 (2026-11-10 실측 — docs/sdd/51-research.md §4)

| 항목 | shadcn/ui | Astryx | react-native-reusables | UniKit UI |
|---|---|---|---|---|
| 카탈로그 | 61종(ui 디렉터리)·66(문서) | 코어 122 디렉터리 | 32종(+인증 폼 14) | **61종 — 전량 유니버설** |
| 플랫폼 범위 | 웹(3엔진) | 웹 안정 + SwiftUI 실험(canary) | RN 중심 | **웹+RN 단일 소스** |
| 레지스트리 | 커뮤니티 디렉터리 548 | npm+CLI | 공개 r/ 2엔진(nativewind·uniwind) | 공개 호스팅 <https://ui.ll3.kr/r/registry.json>（shadcn 디렉터리 등재는 과제） |
| AI 계층 | MCP 7도구·skills/ | "agent ready"·AGENTS.md | — | llms.txt·AGENTS.md(이번 사이클) → MCP 과제 |

- **shadcn/ui** — 2026-10 Trace·Code Block 추가, AI Elements 21 패턴. RN 공식 지원은 여전히 없어요.
- **Astryx**(Meta) — ★20,252·주간 다운로드 약 66만. `@astryxdesign/native` v0.1.0(canary)은 SwiftUI 네이티브 뷰 + JS 코어(JSON 브리지) 실험 — "React Native and Android bindings are not built yet". UniKit UI(React 단일 소스 + RN 브리지)과는 접근 자체가 달라요.
- **react-native-reusables** — ★8,720, 마지막 푸시 2026-09-27(약 6주 공백). nativewind·uniwind 이중 발행, 인증 폼 패턴 14항목이 컴포넌트와 혼재.
- **@aniui·@tetra-ui**(신규 확인) — shadcn 커뮤니티 디렉터리에 등재된 RN 전용 경쟁자예요. @aniui는 93종(uniwind/NativeWind)이지만 현재 디렉터리 헬스 unavailable(30일 가용성 3%)·숨김 처리, @tetra-ui는 45종 healthy예요. 둘 다 RN 전용이라 웹+RN 단일 소스 포지션엔 영향이 없어요(2026-11-10 실측 — docs/sdd/51-research.md §4.6).
- **UniKit UI 위치** — "shadcn 카탈로그 전량 + 웹·네이티브 단일 소스" 주장이 카탈로그 규모(61/61)에서 실제로 성립하는 시점이 됐어요. 레지스트리 공개 호스팅은 <https://ui.ll3.kr>에 올라가 있어요. 남은 갭은 shadcn 디렉터리 등재·AI 계층·게시 물량(npm 0.2.0은 1차 28종)이에요.

## 다음 사이클 제안

1. **패키지 재게시(61종)** — npm 0.2.0 게시분은 1차 28종 시점이에요. 레지스트리 공개 호스팅·`homepage`(`https://ui.ll3.kr/r/registry.json`)는 반영됨. 다음 게시에 61종 상태를 npm에 맞추면 돼요.
2. **쇼케이스 전시 확장** — 웹 `/showcase`는 61종 카탈로그·사이드바 TOC·컴포넌트별 Preview/Code/설치 스니펫(`/showcase/[name]`)으로 전환했어요. Expo는 기존 전체 스크롤 데모를 유지하고, 웹 kitchen-sink(`/showcase/kitchen-sink`)가 그와 같은 구성을 보존해요.
3. **AI 계층** — llms.txt·AGENTS.md는 이번 사이클에 정비됐어요. shadcn MCP(7도구) 대응 MCP 서버 착수 여부 결정.
4. **미지원 기능 중 수요 상위** — 오버레이 애니메이션(웹 한정 `web:` 클래스), select·메뉴 키보드 탐색, chart 반응형 크기.
5. **shadcn 2026-10 신규(trace·code-block)·문서 전용 항목**의 편성 결정(카탈로그 61종은 완료 — 신규 항목은 별도 티어 판단).
