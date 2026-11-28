# UniKit UI 컴포넌트 로드맵 — shadcn 카탈로그 전량 이식 완료

shadcn/ui(new-york-v4)의 `registry:ui` 61종을 UniKit UI 유니버설(한 벌 소스 → 웹·네이티브 동일 렌더)로 가져오는 작업이 **2026-11-10에 61/61 전량 완료**됐어요. 이 문서는 완료 이력, 브리지 계약상 아직 재현하지 못한 **미지원 기능 로드맵**, 그리고 **경쟁 현황**을 정리해요. 수치의 기준일: 2026-11-10.

## 현재 상태: 61 / 61종 완료

| 단계 | 수량 | 컴포넌트 | 상태 |
|---|---|---|---|
| v0.1 기초 | 5 | button, card, input, label, badge | 완료 |
| 1차 배치 (사이클 30) | 23 | accordion, alert, aspect-ratio, avatar, breadcrumb, button-group, checkbox, collapsible, empty, field, item, kbd, pagination, progress, radio-group, separator, skeleton, switch, table, tabs, textarea, toggle, toggle-group | 완료 |
| 2차 배치 (사이클 40) | 33 | 아래 티어 표 전체 | **완료 (2026-11-10)** |

- shadcn 카탈로그 이식 61종(61/61 완료)에 자작 editor-toolbar가 더해져 `packages/unikit/src/components/` 62종 · `packages/unikit/registry/ui/` 62종 · `registry.json` 71 아이템(UI 62 + lib 3(utils·overlay·menu-nav) + theme 4 + style 2(animations·editor-prose)).
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

완료된 61종에도 브리지 계약상 아직 표현하지 못한 것이 있어요. 각 컴포넌트 소스 파일 머리 주석의 "로드맵" 기록(2026-11-28 주석 전면 소거까지 유지)을 계열별로 묶은 목록이에요 — 소거 후에는 이 문서가 로드맵의 근거 원본이에요. 2026-11-27 사이클에서 RN 갭 감사 잔여 대량 해소(아래 각 항목 표시 — 검증: 워크스페이스 typecheck·audit 10/10(당시 기준 — 2026-11-28 주석 소거 후에는 11/11)·테스트 통과·웹 빌드 — 최종 수치는 최근 커밋 시점 기준).

### 1차 배치 한계의 해소·유지 (사이클 40 브리지 확장으로)

- **해소** — 표 시맨틱(`table`·`row`·`cell` 등 BridgeRole 추가), `progress`의 `aria-valuemin/max/now`, `pagination`의 `aria-current="page"`, `toggle`의 네이티브 `aria-pressed`(accessibilityState 매핑).
- **유지** — 표·빈상태 셀 children은 문자열 권장(내부 Text 래핑). `alert` destructive 테두리 대비(3:1 미달)는 shadcn 원본과 같은 값이라 유지 — 글리프 ⚠·글자색이 상태의 주 신호예요.

### 오버레이·애니메이션

- **측정 캐시 무효화（사이클 90 정정 — 이미 해소）** — slider·resizable은 드래그 시작 시점마다 재측정해요(slider.tsx·resizable.tsx의 드래그 시작 재측정). 회전·리사이즈 후 드래그 수치가 이전 크기에 묶이는 문제는 발생하지 않아요. 과거 "최초 1회 캐시" 기술은 오류였고 이 문서에서 정정해요.
- **등장/퇴장 애니메이션(2차 해소)** — dialog·sheet·drawer·popover·tooltip 등 오버레이 계열이 웹에서 `animations.css` keyframes로 전환되며, 네이티브에서는 `UnikitThemeProvider` `<PortalHost>` + RN 0.88 코어 `Animated`(`Portal` 180ms 퇴장 유예·`CoreMotionBackdrop`·`MotionView`)로 UI 스레드 등장/퇴장을 기본 제공해요.
- **네이티브 애니메이션 계약(1차 해소 2026-11-10 → 2차 확장)** — 루프 계열(회전·펄스)은 `LoopRotate`·`LoopPulse`(`AccessibilityInfo.isReduceMotionEnabled` 준수 포함)로 구동하며, 선택 진입점 `@unikit-bridge/ui/motion`(`installReanimatedMotion()`)을 호출하면 `react-native-reanimated` 4.x CSS Animations/Transitions 드라이버(Uniwind `cubicBezier` 빈 문자열 정제 포함)로 오버레이·`transition-*`(`switch`·`progress`·`drawer`·`sonner`)까지 확장돼요. `drawer`(4방향 실시간 손가락 추적·속도 dismiss·스냅백)와 `sonner`(실시간 Y 추적·고무줄 저항·스냅백)도 네이티브 제스처 연동이 반영됐어요. 높이 접힘 애니메이션도 해소됐어요(2026-11-27): `accordion`·`collapsible`·`tabs`는 웹에서 onLayout 측정 높이 기반 `transition-all` 접힘(존 presence 패턴, `prefers-reduced-motion` 우회), 네이티브는 기존 `LayoutAnimation` 유지.
- **hover 개방（사이클 90 해소 — 브리지 onHoverIn/onHoverOut 계약 추가）** — `navigation-menu`는 트리거 hover 200ms 지연 개방·다른 메뉴 열림 시 즉시 전환·닫힘 뒤 300ms 재진입 즉시 열림(radix delayDuration·skipDelayDuration 기본값), `menubar`는 열린 상태에서 인접 트리거 hover 즉시 전환, `dropdown-menu`·`context-menu` 서브메뉴는 진입 100ms 열림·이탈 300ms grace 닫힘(radix Menu 원본값), `tooltip`은 hover·focus 진입, `hover-card`는 openDelay/closeDelay(200/300) 실측 동작 + 카드 진입 유지. 터치 기기에서는 hover 계열이 발화하지 않아 기존 눌림 폴백이 담당해요. 잔여: nav-menu 원본의 다항형 진행 의도(pointer grace intent) 판정은 재현하지 않아 형제 항목 전환은 grace 만료 뒤 닫힘으로 근사.
- **포인터 이벤트 계약** — `popover` 충돌 감지(avoidCollisions)는 사이드 반전으로 지원돼요(커밋 9b50fd0 — 반대편 잔여 공간이 크면 bottom↔top·right↔left 전환, 교차축 이동·남는 오버플로는 8px 뷰포트 클램프). sticky는 웹에서 충족(`useReposition`이 rAF 스로틀 scroll·resize 재계산), 네이티브는 모달이 하위 스크롤을 차단해 구조적으로 무의미해요(2026-11-27 코드 경로 검증·문서 정정). `hover-card` 콘텐츠 이탈 닫힘과 `tooltip` 웹 키보드(focus) 진입은 사이클 90에 해소됐어요.
- **asChild(2026-11-27 해소)** — 브리지 `Slot`(bridge/slot.ts — radix `mergeProps` 시맨틱 실측 재현: className cn 병합·핸들러 이중 실행·style 1단 병합(RN 배열은 평탄화)·aria-describedby 목록 결합·ref 결합·ref별 React 19 cleanup)으로 popover·tooltip·hover-card 트리거와 sidebar 5곳이 asChild를 지원해요. 미지원: Slottable 다중 자식 재배치·lazy 언래핑.

### 키보드·포커스

- **select·메뉴 키보드 탐색（사이클 90 해소 — 웹·Android HW 키 확장）** — `select`·`dropdown-menu`·`context-menu` 카드에서 ArrowDown/Up(양 끝 루프)·Home/End 항목 이동, ArrowRight 서브 개방·ArrowLeft 서브 복귀, 닫힌 트리거의 ArrowDown/Up 열림을 지원해요(lib/menu-nav 공유 골격 — 항목 DOM 포커스 이동 방식이라 엔터 선택·포커스 스크롤 따라가기는 브라우저 기본 동작). 타입어헤드(글자 입력 점프)도 radix Menu `getNextMatch` 원본 이식으로 지원해요(반복 글자 순환·버퍼 1초 초기화·disabled 제외·ctrl/alt/meta 수정자 키 제외 — 사이클 90 후속). Android에서는 카드·항목에 `focusable`과 `typeof document === "undefined"` 분기 `Enter`/`Space` 활성화를 연결해 `enableKeyEvents` 활성 환경에서 선택까지 동작해요(실기 미검증: `navigation-menu` 화살표키 트리거 순회·iOS 하드웨어 키보드 탐색은 RN 코어 계약 부재로 미지원). `command`는 웹 방향키·엔터를 지원하지만 네이티브 onKeyPress 래핑 한계로 IME 조합 키는 발화되지 않아요(상세 docs/sdd/issue-19-keyboard-modality-wall.md).
- **resizable 키보드 리사이즈(2026-11-27 해소)** — 핸들이 `focusable`+`onKeyDown`을 갖고 화살표 키로 basis를 조정해요(수평 Left/Right·수직 Up/Down, 스텝 2%·Shift 10% 실용값, 제약 클램프 공유). 웹 focus-visible 링 포함. iOS는 View 키 계약 부재, Android HW 키는 `enableKeyEvents` 플래그(기본 off) 뒤에서만 발화해요.
- **slider** — 수평·수직(`orientation="vertical"`) 및 트랙 `measureInWindow` 보정·위아래 화살표 키 조절을 지원해요. 다중 썸별 개별 포커스·썸별 aria도 해소됐어요(2026-11-27): 루트는 role=group, 각 썸이 `focusable`+`role="slider"`+썸별 `aria-valuenow/min/max`·`aria-label`+자체 화살표 조정. iOS는 썸 포커스 계약 부재(트랙 드래그는 유지), `aria-orientation`은 브리지 계약 부재로 미지원이에요.

### 차트·데이터

- **chart 반응형 크기** — 유동 폭(width="fluid")은 사이클 90 브리지 onLayout 계약으로 웹·네이티브 양측 지원해요(기존 웹 전용 ResizeObserver 직접 사용 제거). 뷰포트 비례 높이도 해소됐어요(2026-11-27): `height="fluid"` 및 상위 박스 기준 `style` 퍼센트(BridgeStyle 퍼센트 계약 — vh/vw는 RN 미지원 제외, 자동 높이 붕괴 방지 임계값 40px).
- **chart 다크 전환·음수 스케일(해소)** — 브리지 `useColorScheme()`를 통해 `config.theme[colorScheme]` 다크 팔레트 자동 전환과 `buildChartScale` 음수·0 기준선 스케일링을 지원해요.
- **recharts 고급 차트(2026-11-27 대량 해소)** — 참조선(`ChartReferenceLine` — x/y·점선·라벨 위치), 다중 y축(시리즈 `yAxisId`+축 `orientation`), 스택 막대(`stackId` — 양·음 누적, 도메인 확장, 툴팁/범례 스택 멤버), 극좌표(`ChartPieSeries` — 파이/도넛 `innerRadius`, 중심 라벨), 방사형(`ChartRadialSeries`), 브러시·드래그 줌(영역 선택 + 리셋, `useDrag` 공유 계약), 툴팁 카드 실측 폭 클램프(onLayout)를 지원해요(순수 함수 14종 export — test/chart-logic.test.ts 40개 케이스로 검증). 잔여: 시리즈 등장 애니메이션, 라인/영역 스택, 웹 휠 줌.
- **calendar 다중·범위 선택(해소)** — `mode="single" | "multiple" | "range"`, `showOutsideDays`, `CalendarDateMatcher` 기반 `disabled` 매처(`Date[]`·`{ from, to }`·`{ before, after }`·`{ dayOfWeek }`·술어 함수)를 지원해요. 선택 전환 애니메이션(장식 레이어 scale 0.75→1 + 페이드 — 웹 transition·네이티브 MotionView)과 RTL 화살표 회전(direction 컨텍스트)도 해소됐어요(2026-11-27).
- **carousel 스크롤 오프셋·페이지 상태(해소)** — `BridgeScrollEvent`(`contentOffset`·`contentSize`·`layoutMeasurement`)와 초기 항목 수 동기화로 `canScrollPrev`/`canScrollNext`와 페이지 상태를 실시간 갱신해요.

### 입력·폼

- **form RN 전파** — `aria-describedby`와 네이티브 `aria-invalid` 속성은 웹 전용 계약이지만, `Pressable`·`TextInput`에서는 `aria-invalid` 시 `accessibilityHint="유효하지 않은 입력"`으로 보조 힌트를 전달하고 `View`의 `accessibilityLiveRegion` 및 `aria-pressed`·`aria-current`도 네이티브 브리지에 매핑됐어요(`nativeID`·`accessibilityLabelledBy`는 양쪽 동작).
- **input-otp** — 숨김 `TextInput`의 `onFocus`/`onBlur` 추적으로 포커스 시에만 활성 슬롯·캐럿(`LoopPulse`)이 표시돼요. 웹은 keyframes 하드 온오프, 네이티브는 `LoopPulse` 부드러운 맥동 근사(1.25s 주기). `autoComplete`도 소비자 지정으로 전달돼요(브리지 TextInput 계약 — SMS OTP `"one-time-code"`, 2026-11-27).
- **input** — `type="file"`와 원본 `file:*` 변형 토큰이 웹에서 지원돼요(브리지 rest 전달 + 조건부 변형 전개, 2026-11-27). RN에 파일 입력 계약은 없어 웹 전용이에요.
- **input-group** — 원본의 파일 셀 focus 링(data-attribute 셀렉터)이 컨트롤 자체 슬림 링으로 근사돼 있어요.
- **scroll-area** — 커스텀 스크롤바를 웹에서 지원해요(2026-11-27): `BridgeScrollEvent` 백분율로 썸 크기·위치 계산, 원본 룩 트랙+썸, 스크롤 프레임마다 ScrollBar만 재렌더, 브라우저 바는 숨김. 네이티브는 RN ScrollView 인디케이터 API가 show/hide 불리언뿐이라 OS 기본 인디케이터 유지(커스텀 바 없음 — 문서화된 한계). 첫 스크롤 전 콘텐츠 크기 계약 부재로 썸은 첫 스크롤 이후 나타나요.
- **combobox** — `onValueChange` 입력 시 자동 개방과 트리거/인풋 `onLayout` 폭 측정 기반 `ComboboxContent` `minWidth` 추종을 지원해요.

## A2UI 렌더러 (2026-11-28 — docs/sdd/100-design-plan.md)

에이전트→사용자 UI 프로토콜 [A2UI v1.0](https://a2ui.org) 메시지를 UniKit 62종으로 웹·RN 같은 코드로 렌더하는 계층이에요. `@a2ui/react` 없이 헤드리스 `@a2ui/web_core` 서브패스(processing·resolution·reactivity·catalog 영역)만으로 자체 렌더러를 구성했어요.

**구성** — 진입점 4종(`@unikit-bridge/ui/a2ui`·`/a2ui/catalog-basic`·`/a2ui/optional`·`/a2ui/demo`). 유니킷 카탈로그는 직작 54종(표현 Tier A 18·제어 Tier B 18·오버레이·조합 Tier C 18)과 기본 카탈로그 재사용 6종(Button·Card·CheckBox·Divider·Slider·Tabs), A2UI 프리미티브 12종(Row·Column·Text·Image·Icon·Video·AudioPlayer·List·Modal·TextField·ChoicePicker·DateTimeInput)을 합친 72 엔트리예요. 기본 카탈로그 재선언 18종은 vendored 공식 catalog.json과 byte 패리티 테스트가 지켜요.

**옵트인 계약** — chart·form 두 종은 `/a2ui/optional` 진입점의 `createUnikitCatalogWithExtras`로만 들어가요(form이 react-hook-form peer를 끌어당기고 chart는 react-native-svg peer라 기본 번들 오염 방지). 실증: 기본 진입점만 번들한 산물에 react-hook-form 심볼 부재, optional 포함 산물에만 존재(2026-11-28 bun build 실측).

**전경색 계약(2026-11-28 수립)** — 유니킷 컴포넌트는 문자열 children만 variant별 전경 클래스로 감싸고 element children을 그대로 통과해요. A2UI 텍스트 노드는 `A2uiMarkdown`(마크다운 뷰)로 렌더되므로 진한 배경 컨테이너에 직접 넣으면 전경이 `text-foreground`로 고정되어 글자가 배경에 묻혔어요(bg-primary 위 text-foreground 실측 대비 1.05:1). 계약:

- 렌더러가 `A2uiTextForegroundContext`·`A2uiTextForeground`·`useA2uiTextForeground`를 내보내고, `A2uiMarkdown`·`MarkdownLine`은 컨텍스트 전경을 우선 적용해요.
- `Button` 뷰는 `buttonTextVariants({ variant })`(컴포넌트 cva 재사용)를 하위 텍스트에 공급해요.
- `Tooltip` 뷰는 `tooltipContentTextVariants`(bg-foreground 배경용 text-background)를 써요.
- `Bubble` 뷰는 `context.childrenText("children")`로 하위 Text 노드를 평문으로 추출해 `BubbleContent`의 variant별 전경을 그대로 받게 해요(BubbleContent 내부 Text에 View를 넣을 수 없는 RN 구조 제약도 함께 해결).
- ContextMenu·DropdownMenu·Menubar의 destructive 항목은 `item.destructive ? "text-destructive" : "text-foreground"` 조건부 전경을 써요(RN은 CSS 상속이 없어 웹과 색이 갈라지는 불일치 해결).
- 밝은/투명 배경 컨테이너(Card·Item·Empty·Message·Sheet·Dialog·Popover 등)는 `text-foreground` 짝이 유지돼요.
- 회귀 방지: `test/a2ui-foreground.test.ts` 9건이 진한 배경 컨테이너(Button·BubbleContent·TooltipContent·AlertDialogAction)의 직접 child 렌더에 전경 공급 동반을 정적으로 검사해요.
- 실측: 에뮬레이터(RN) + playwright(웹 정적 서빙) 모두 보내기·증감 버튼 17.72:1, 감소 버튼 13.73~14.61:1, 시뮬레이션 버튼 19.90:1로 WCAG AAA 충족.

**축소 계약(미노출 프롭·기능)** — 직렬화가 안 되는 함수형 prop(onValueChange·렌더 프롭 등)은 전부 값 바인딩(`{"@path": ...}`) + action 치환으로 대체했어요. 그 외 계약상 노출하지 않은 것:

- 미디어: Video·AudioPlayer는 콘텐츠 표시만 — 공식 v1.0 스키마가 url·posterUrl·weight뿐이라 자막·재생 제어 프롭 자체가 프로토콜에 없어요(재생 제어는 소비자 앱 계층 과제).
- chart: line·bars 두 도형만 — 참조선·다중 y축·스택·파이 등 컴포넌트 쪽 고급 기능은 미노출.
- calendar: 단일 날짜 ISO `YYYY-MM-DD`만 — multiple·range 모드, disabled 매처(DATE 배열·범위·요일), showOutsideDays 미노출.
- carousel: 스와이프/스크롤 탐색만 — 이전/다음 버튼·페이지 인디케이터 미노출.
- resizable: 정확히 2패널 고정 — 3패널 이상·중앙 핸들 외 변형 미노출.
- sonner: title·description·variant·position 토스트만 — promise 로딩→성공/실패 전환, 액션 버튼 미노출.
- editor-toolbar: formats 식별자 목록 전달 + 단일 onCommand 액션 — 서식 상태 역방향 표시 미지원.
- command: shouldFilter·loop 등 동작 튜닝 프롭 미노출(자체 필터·탐색 기본값으로 동작).
- sidebar: 접기/펼침은 내부 관리 — side·collapsible 등 레이아웃 변형 미노출.
- breadcrumb: 이동(navigate) 미연결 — 링크 표시만(경로 이동은 액션으로 조립).

**게이트(2026-11-28 실측)** — 워크스페이스 typecheck ✓ · audit:design 11/11 ✓ · bun test 126건(카탈로그 구성 4 + 런타임 혼합 서피스·Select 바인딩 환류 + 전경색 계약 9 포함) ✓ · apps/web build(`/a2ui` 라우트) ✓ · expo export android + 소스맵 검증: lit 패키지 0소스·`@a2ui/react` 0소스·web_core는 헤드리스 영역만 ✓.

**데모** — apps/web `/a2ui`(서피스 재생·에이전트 업데이트 시뮬레이션·액션 로그·카탈로그 62종 rosters), apps/expo `/demo/a2ui`(같은 메시지로 네이티브 렌더).

## 경쟁 현황 (2026-11-10 실측 — docs/sdd/51-research.md §4)

| 항목 | shadcn/ui | Astryx | react-native-reusables | UniKit UI |
|---|---|---|---|---|
| 카탈로그 | 61종(ui 디렉터리)·66(문서) | 코어 122 디렉터리 | 32종(+인증 폼 14) | **61종 — 전량 유니버설** |
| 플랫폼 범위 | 웹(3엔진) | 웹 안정 + SwiftUI 실험(canary) | RN 중심 | **웹+RN 단일 소스** |
| 레지스트리 | 커뮤니티 디렉터리 548 | npm+CLI | 공개 r/ 2엔진(nativewind·uniwind) | 공개 호스팅 <https://ui.ll3.kr/r/registry.json>（shadcn 디렉터리 등재는 과제） |
| AI 계층 | MCP 7도구·skills/ | "agent ready"·AGENTS.md | — | llms.txt·AGENTS.md·`@unikit-bridge/mcp`(도구 4종·데이터 동봉, 사이클 100) |

- **shadcn/ui** — 2026-10 Trace·Code Block 추가, AI Elements 21 패턴. RN 공식 지원은 여전히 없어요.
- **Astryx**(Meta) — ★20,252·주간 다운로드 약 66만. `@astryxdesign/native` v0.1.0(canary)은 SwiftUI 네이티브 뷰 + JS 코어(JSON 브리지) 실험 — "React Native and Android bindings are not built yet". UniKit UI(React 단일 소스 + RN 브리지)과는 접근 자체가 달라요.
- **react-native-reusables** — ★8,720, 마지막 푸시 2026-09-27(약 6주 공백). nativewind·uniwind 이중 발행, 인증 폼 패턴 14항목이 컴포넌트와 혼재.
- **@aniui·@tetra-ui**(신규 확인) — shadcn 커뮤니티 디렉터리에 등재된 RN 전용 경쟁자예요. @aniui는 93종(uniwind/NativeWind)이지만 현재 디렉터리 헬스 unavailable(30일 가용성 3%)·숨김 처리, @tetra-ui는 45종 healthy예요. 둘 다 RN 전용이라 웹+RN 단일 소스 포지션엔 영향이 없어요(2026-11-10 실측 — docs/sdd/51-research.md §4.6).
- **Vercel UI SDK(vercel-labs/ui, 신규 확인 2026-11-17)** — 2026-11-13 공개 베타(Apache 2.0)의 행동(behavior) 라이브러리예요. 무스타일 행동 코어(`@ui-sdk/core`, 카탈로그 헬퍼 263개) + react·vue·svelte·solid·웹 컴포넌트 어댑터 + 완성 컴포넌트 51종·npm 의존 모델. **RN 어댑터가 없고 DOM·ARIA를 전제**해요(모바일 문서도 브라우저 visual viewport 한정). 촛점은 우리 `behaviors` 진입점과 같은 영역이지만 접근이 달라요 — 무스타일/npm 의존 vs 토큰 스타일/소비자 복사, 웹 5프레임워크 vs 웹+RN 단일 계약. 의존성·이식 대상이 아니라 참조 이웃이에요. 현행 반영(2026-11-18): 순수 헬퍼 11종·`toSdkKeyEvent`는 사이클 101 P1 `@unikit-bridge/ui/behaviors/ui-sdk` 진입점으로 선별 이식했고, `position()` 계열은 P2·P3 기기 실증을 마쳤어요(아래 제안 7·docs/sdd/100-vercel-ui-sdk-research.md §7). 다중 선택 상태 기계(`createSelection`)·`labelOf`는 재평가 후 보류(docs/sdd/issue-22-ui-sdk-excluded-helpers.md). 층 3 완성 컴포넌트 51종의 RN 범위는 이슈 #18에서 A(층 1 헬퍼+position() 경계)로 확정(2026-11-18 — 아래 제안 7·[docs/sdd/issue-18-layer3-scope-redefine.md](sdd/issue-18-layer3-scope-redefine.md)).
- **UniKit UI 위치** — "shadcn 카탈로그 전량 + 웹·네이티브 단일 소스" 주장이 카탈로그 규모(61/61)에서 실제로 성립하는 시점이 됐어요. 레지스트리 공개 호스팅은 <https://ui.ll3.kr>에 올라가 있고, MCP 서버 `@unikit-bridge/mcp`(도구 4종·레지스트리 스냅샷 동봉)와 행동 훈 진입점 `@unikit-bridge/ui/behaviors`가 사이클 100(2026-11-16)에 추가됐어요. MCP 서버 소스는 같은 날 제품군 포털 저장소(loopy-lim/unikit)의 packages/mcp로 이관됐어요(scriptca·rustra까지 아우르는 제품군 서버). 남은 갭은 shadcn 디렉터리 등재예요(게시 물량은 npm 0.4.0이 62종·editor 진입점까지 반영 — 2026-11-16 게시).

## 다음 사이클 제안

1. **패키지 재게시(62종) — 완료(0.4.0, 2026-11-16)** — npm 게시분은 0.2.0(28종)을 거쳐 0.3.0에서 shadcn 카탈로그 61종(2026-11-14 실측), 0.4.0에서 62종(EditorToolbar 포함)과 에디터 엔진 진입점 `@unikit-bridge/ui/editor`까지 반영했어요. 레지스트리 공개 호스팅·`homepage`(`https://ui.ll3.kr/r/registry.json`)는 반영됨.
2. **쇼케이스 전시 확장** — 웹 `/showcase`는 62종 카탈로그·사이드바 TOC·컴포넌트별 Preview/Code/설치 스니펫(`/showcase/[name]`)으로 전환했어요. Expo는 기존 전체 스크롤 데모를 유지하고, 웹 kitchen-sink(`/showcase/kitchen-sink`)가 그와 같은 구성을 보존해요. → 2026-11-15 폐지: 카탈로그가 그 역할을 대신하게 되어 `/components/kitchen-sink` 페이지와 내비게이션·문서 링크를 삭제했어요(전체 구성 데모는 Expo 쇼케이스가 유지).
3. **AI 계층 — 완료(사이클 100, 2026-11-16)** — `@unikit-bridge/mcp` stdio 서버를 만들었어요. 도구 4종(search_items·view_item·get_install_command·get_docs)이 레지스트리 스냅샷(71아이템 전문 — UI·lib 소스와 theme 토큰·style CSS)과 llms.txt를 패키지에 동봉해 런타임 네트워크 0으로 동작해요(데이터는 sync:data 생성 — ui.ll3.kr 정적 JSON과 동일 원천). 서버는 제품군 포털 저장소(loopy-lim/unikit)의 packages/mcp에 있어요 — unikit-ui에서 만들어 같은 날 이관했고, 포털의 sync:data가 이 저장소의 레지스트리·llms.txt를 읽어요(get_docs는 제품 구분 지원). 행동 훈 재노출 진입점 `@unikit-bridge/ui/behaviors`(overlay·menu-nav·브리지 훈)도 같은 사이클에 추가. (참고: `@ui-sdk/core` 제외 헬퍼 `labelOf`·`createSelection` 재평가는 소비자 수요 부재·RN 접근성 트리 동기 조회 불가·`createKeySelection` 미공개 계약 사유로 보류 결정 — [docs/sdd/issue-22-ui-sdk-excluded-helpers.md](sdd/issue-22-ui-sdk-excluded-helpers.md))
4. **미지원 기능 중 수요 상위** — 오버레이 애니메이션(웹 한정 `web:` 클래스), 네이티브 카드 키보드 탐색(사이클 90 잔여). select·메뉴 화살표키 탐색·타입어헤드·chart 유동 폭은 사이클 90과 그 후속에서 해소됐어요.
5. **shadcn 2026-10 신규(trace·code-block)·문서 전용 항목**의 편성 결정(카탈로그 61종은 완료 — 신규 항목은 별도 티어 판단).
6. **AI 계층 후속(Vercel UI SDK 분석 반영 — docs/sdd/100-vercel-ui-sdk-research.md §6)** — (a) npm 패키지에 llms.txt 동봉(files 목록에 추가 — 저비용 고가치, prepack 복사 단계 동반), (b) 에이전트 스킬(`.agents/skills/` + skills.sh 등록) 배포 검토, (c) behaviors 진입점 확장 후보(undo 스택·단축키 매처 등 순수 로직 — RN 무관 이식 가능. fuzzy 매칭·타입어헤드·트리 데이터 엔진은 P1에서 이미 편입, 다중 선택 상태 기계는 보류 — docs/sdd/issue-22-ui-sdk-excluded-helpers.md).
7. **«ui-sdk를 쓰는데 RN도» 연동 경로(docs/sdd/100 §7 실측)** — 3층 판정: 순수 로직 헬퍼는 Metro(Android 프로덕션 번들)·DOM 없는 런타임에서 실증 통과(단, 공개 계약이 DOM KeyboardEvent 모양 — BridgeKeyEvent 래퍼 필요), parts 렌더러 RN 어댑터는 구조적 선례 있으나 비공개 renderer API 추적 리스크(#17), 완성 컴포넌트 51종은 업스트림 지원 전 불가(#18). **사이클 101: P1+P2 완료(기기 실증)** — P1 `@unikit-bridge/ui/behaviors/ui-sdk` 진입점(순수 헬퍼 11종 + toSdkKeyEvent 래퍼, 선택 peer). P2 `position()` 기기 구동 슬라이스(measureInWindow → FakeElement 계약 어댑터 → 동기 계산 → RN style 적용): 앵커 실측 x16 y184·160×44에 `top:236px` = 184+44+8 정확, 아래쪽 앵커는 ui-sdk가 스스로 플립 판정(`data-side=top`, `top:616px` = 748−8−124 정확). 계약 정정: RN은 window === globalThis라 window가 존재하지만 멤버가 없어 «멤버 단위 패치»가 필요(«없으면 설치» 가드는 크래시 — apps/expo/uisdk-adapter.ts). 스파이크 부속: apps/expo `uisdk-spike.tsx`·`uisdk-adapter.ts`·`uisdk-position.tsx`·`@ui-sdk/core` 의존(실험, 철회 가능 — 계약 프로브 `uisdk-probe.mts`는 실측 기록 후 제거). **같은 사이클 P3 완료(기기 실증)** — `position()` 전체 API 상시 구동(apps/expo `uisdk-popup.tsx`): VirtualAnchor getter로 rAF 루프 유지(unwatched — 이벤트 주입 없이 추종), 옵션 getter로 열린 채 side/align 전환, arrow 계산, onScroll→measureInWindow→updateRect 제자리 갱신으로 스크롤 추종(raw y188==캐시 y188 → top 236), 메인 축 비클램프 + `--available-width/height` 리사이즈 계약 발견·소비(w123 = 390−8−250.5−8 → 팝업 온전히 화면 내). **2026-11-18 수정(스크롤 추종 회귀 복구)** — `getComputedStyle` 스텁이 빈 FakeStyle을 돌려주면 left가 항상 0이라 style.left가 절대값이 아니라 델타로 기록돼 팝업이 화면 밖으로 나갔던 것을 `getComputedStyle(el)→el.style` 치환과 VirtualAnchor `{getBoundingClientRect}` 형태 전달로 복구 — 추종 재성립(Δy 오차 0. 되먹임 함정: 줄어든 시각 크기를 rect에 되먹이면 available이 0으로 붕괴 — 고유 측정 크기 유지로 해결). createPopup은 비공개 커널 API(primitiveContext) 요구로 포크/업스트림 경계(#16). 비결정적 앱 동결의 정체는 OS 프리저(logcat oneway-to-frozen-process). 스파이크 부속에 `uisdk-popup.tsx` 추가. 잔여는 에픽 #11 자식으로 추적: 열린 채 side 전환 모서리 겹침(#12)·BridgeKeyEvent.shiftKey(#13 — 완료: PR #26, 2026-11-18)·어댑터 제품화(#14)·overlay/popover의 position() 소비(#15)·키보드·모달리티 벽(#19) — v1의 «1회 계산 후 stop» 한계·스크롤 추종은 P3로 해소됐어요. 실험 화면 3종(spike·position·popup)의 keep/graduate/delete 정책과 디버그 텔레메트리(쓰기 N회·앵커 y→top)의 제품/스파이크 경계는 docs/sdd/100 §7 «실험 화면 정책»에 기록(2026-11-18, #21). **2026-11-18 범위 고정(이슈 #18 — A 판정)** — «모두 되도록»의 제품 정의를 층 1 순수 헬퍼 11종+`toSdkKeyEvent`(`@unikit-bridge/ui/behaviors/ui-sdk`)와 `position()` 계열 어댑터(`@unikit-bridge/ui/behaviors/ui-sdk-dom`)로 확정했어요. 층 3 완성 컴포넌트 51종은 웹 전용·비이식 제외(사유: 3벽 — 명령형 변경·동기 레이아웃 읽기·키 이벤트, 전량 이식 시 DOM API 26종·약 1,200 지점 — docs/sdd/100 §7), 층 2는 #17로 추적. 51종 중 34종이 UniKit 카탈로그와 동명(29종)·기능 대응(5종 — menu→dropdown-menu·context-menu, radio→radio-group, toast→sonner, otp-input→input-otp, toolbar→editor-toolbar)이라 이식의 한계 이익이고(2026-11-18 실측), 나머지 17종(autocomplete·color-picker·date-input·date-picker·file-input·image-cropper·listbox·meter·number-input·password-input·rating·segmented-control·timeline·token-input·tree·trigger-menu·waterfall)은 수요 확인 시 UniKit 자체 컴포넌트 후보(이식 9조 관례) — 층 3 RN 이식 경로가 아니에요. B(층 2 소수 primitive)·C(업스트림 대기) 기각 사유와 재평가 트리거(업스트림 RN 어댑터·#17 성립·17종 수요): [docs/sdd/issue-18-layer3-scope-redefine.md](sdd/issue-18-layer3-scope-redefine.md).
