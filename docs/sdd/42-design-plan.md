# 사이클 40 설계·계획 — 잔여 shadcn 33종 이식·브리지 확장 (G1)

전제: docs/sdd/40-requirements.md(AC-1~8) · 조사 docs/sdd/51-research.md(제목을 '조사 요약 — 사이클 40 경쟁 재확인·사이클 50 소개 사이트'로 갱신해 두 사이클 조사를 병기). 작성: System Architect + Product/UX Designer 관점(오케스트레이터 role-perspective — 조사 지식이 편성 본인에 집중돼 있어 브리프 전달 비용이 더 큰 편성. 판정은 독립 스폰 유지). 기준 리비전: ee37765(working tree clean, shadcn-ref/ 참조 사본 제외 — 커밋 대상 아님).

## 0. G0 이월 결정 확정 (40-requirements §차단질문)

1. **chart 렌더러 이원화(F-1 확정)**: `@unikit-bridge/ui/chart` **단독 진입점**(package.json exports 조건분기 추가) — 웹 `src/chart/web.tsx`(JSX `<svg>`), 네이티브 `src/chart/native.tsx`(react-native-svg 정적 import). **chart는 index.ts에서 re-export하지 않는다**(Metro의 네이티브 그래프에 react-native-svg가 항상 유입되는 것을 차단 — 미사용 네이티브 소비자는 설치 불필요 유지). 차트 스케일·축·포맷 로직은 공유 `src/components/chart.tsx` 한 벌이며, 이 파일 역시 `@unikit-bridge/ui/chart` 경유로만 로드된다(index 미포함). react-hook-form·react-native-svg는 **기존 관행(peer + devDependencies 이중)으로 추가** — peer는 optional 표기, dev는 로컬·CI의 tsc 해석·번들용(자동 설치 아님 방어). 쇼케이스가 chart·form 데모를 포함하므로 apps/expo에 react-native-svg, apps/web·expo에 react-hook-form 실행 의존 추가(T-4 경계).
2. **sonner·command·calendar·carousel** 자체 구현(외부 패키지 sonner·cmdk·react-day-picker·embla 미사용), API·클래스 토큰만 shadcn 형태 유지. 파일 머리 주석에 판단 기록.
3. **form**: react-hook-form optional peer + registry `form` 아이템 dependencies에 명시. zod는 포함하지 않는다(shadcn 원본 의존이 react-hook-form뿐, 스키마는 소비자 선택).

## 1. 설계 원칙

1. **원본 대조 이식** — shadcn new-york-v4 원본 33종을 `shadcn-ref/ui/`에 확보(gh api로 다운로드 완료, 5,348줄). export 이름·변형·토큰 클래스를 원본 기준으로 하고, 유니버설 제약상 차이는 파일 머리 주석에 기록(기존 28종 관행).
2. **한 벌 소스 원칙 유지** — 모든 컴포넌트는 플랫폼 분기 없이 `@unikit-bridge/ui/primitives` 계약만 사용. 플랫폼 차이는 전부 브리지 계층(types.ts 계약 + web.tsx/native.tsx 구현 + exports 조건분기)이 흡수.
3. **브리지 확장은 추가 전용** — 기존 28종·테마의 외부 계약 불변. BridgeRole·aria 프롭은 추가만(기존 값 변경 금지). 예외 없음.
4. **임의값 클래스 금지·web: 접두사·내부 Text 래핑·dark: 미사용** — 기존 감사·관행 그대로 신규 33종에 적용(audit (c)(g)가 기계 검증).
5. **registry 의존성 정책(P2⑦)** — 모든 신규 `registry:ui` 아이템 dependencies = `["@unikit-bridge/ui", "class-variance-authority", "clsx", "tailwind-merge", "tailwindcss"]`. react-native·uniwind 미포함. 네이티브 필요 의존(react-native-svg 등)은 아이템 description에 안내. 기존 28종 아이템도 전수 동일 정책으로 교정(AC-4).
6. **레지스트리 생성 관계** — generate:design은 registry.json items 중 theme 항목만 재생성(컴포넌트 아이템은 보존). 신규 61종 아이템은 registry.json에 수작성하고 audit (d)(e)가 기계 검증. 사본(src/components → registry/ui)은 cp+치환으로 생성, (d)가 byte 대조.

## 2. 브리지 확장 계약 (Wave 0 — 전 태스크의 선행)

### 2.1 계약 확장 (src/bridge/types.ts)

| 확장 | 내용 | 웹 구현 | 네이티브 구현 |
|---|---|---|---|
| BridgeRole 추가 | `dialog` `alertdialog` `menu` `menubar` `tooltip` `table` `row` `cell` `columnheader` `grid` `gridcell` `listbox` `slider` `toolbar` `tree` | 그대로 role 속성 | 전달만(RN이 모르는 role은 무시 — 한계 주석) |
| aria-value (PressableProps·ViewProps) | `aria-valuenow/min/max?: number` | DOM 속성 그대로 | `accessibilityValue: {min, now, max}` |
| aria-current (PressableProps) | `"page"\|"step"\|"date"\|"time"\|boolean` | DOM 속성 그대로 | 미지원(RN 계약 없음) — 시각 강조만, 한계 기록 |
| aria-describedby (PressableProps·ViewProps) | `string`(nativeID) | DOM 속성 그대로 — tooltip 내용·form 오류 메시지·dialog 설명 연결 | 미지원(RN 계약 없음) — 한계 기록 |
| aria-invalid (PressableProps·TextInputProps) | `boolean` | DOM 속성 그대로 — form 오류 상태 | 미지원(RN accessibilityState에 invalid 없음) — 한계 기록 |
| aria-modal (ViewProps) | `boolean` — 모달성 선언(스크린리더 가상 커서의 배경 읽기 차단, 포커스 트랩과 보완) | DOM 속성 그대로 — dialog·alert-dialog·sheet·drawer·command 팔레트 | `accessibilityViewIsModal` 매핑(지원 확인 후 미지원 시 한계 기록) |
| onContextMenu (PressableProps) | `() => void` | onContextMenu 그대로 | onLongPress로 매핑 |
| onLongPress (PressableProps) | `() => void` | 무시(웹 롱프레스 없음) | onLongPress 그대로 |
| onKeyDown (PressableProps) | `(e: {key: string, preventDefault(): void}) => void` | DOM onKeyDown 래핑 | 미호출(네이티브 무시) |
| onKeyDown (TextInputProps) | 동일 시그니처 — command 입력창 방향키·엔터, slider 계열 키 조정 소비 | DOM onKeyDown 래핑 | RN `onKeyPress`({key})를 onKeyDown 시그니처로 래핑(변환 불가 키는 미발화 — 주석) |
| Portal (신규 프리미티브) | `PortalProps {children, visible, onBackdropPress?, onRequestClose?}` | `createPortal(body)` + visible=false 언마운트, 백드롭 div(onPointerDown) | RN `Modal`(transparent, animation="fade", onRequestClose) |
| ScrollView (신규) | `ScrollViewProps = ViewProps + contentContainerClassName?, pagingEnabled?, horizontal?` / ref `scrollTo({x,y,animated?})` | div overflow + scrollLeft/Top 조작 | RN ScrollView 그대로 |
| Select/SelectOption (신규) | `SelectProps {value?, onValueChange?, children}` / `SelectOptionProps {value, disabled?}` | `<select>/<option>` — onChange→onValueChange | Pressable 트리거 + Modal 목록 폴백(native-select 전용) |
| measure (BridgeViewRef·BridgePressableRef) | `measure(cb: (x,y,w,h,pageX,pageY)=>void)` — **뷰포트(창) 좌표계** | getBoundingClientRect 그대로(이미 뷰포트 좌표 — scrollX/Y 가산 없음) | RN ref.measure 그대로(pageX/pageY 창 기준 — 동일 시맨틱) |
| useDrag (신규 훅, primitives export) | `useDrag(opts: {onBegin?, onMove(e:{x,y,dy,dx}), onEnd?}) → {dragHandlers, dragging}` | PointerEvent 세트 | PanResponder |

**오버레이 좌표계·포커스 관리 확정(F-G1-1·7 반영)** — 포털 콘텐츠는 **웹 `position: fixed`(뷰포트 좌표) / RN Modal(창 좌표)** 로 통일하고 measure는 스크롤 오프셋 가산 없이 뷰포트 좌표 그대로 소비한다(absolute 배치·문서 좌표 아님). 웹 포털은 다음 포커스 관리를 구현한다: ① 열림 시 오버레이 내 첫 포커서블로 포커스 이동 ② Tab 순환을 오버레이 안에 가두기(focus trap) ③ 닫힘 시 트리거로 포커스 복귀. RN Modal은 운영체제 수준에서 유사 동작(웹 전용 명시 사양).

### 2.2 chart export 경로 (package.json exports + peer)

```
"./chart": { "react-native": "./src/chart/native.tsx", "default": "./src/chart/web.tsx" }
```

- `src/chart/web.tsx`·`src/chart/native.tsx`: 동일 인터페이스의 최소 SVG 렌더러(`ChartSurface {width,height,children}`·선·사각·텍스트·path 프록시). 구체 형상은 chart 컴포넌트 구현 시 확정하되 **양측 동일 props 인터페이스**가 계약.
- peerDependencies에 `react-hook-form`·`react-native-svg` 추가(둘 다 peerDependenciesMeta optional).

### 2.3 내부 공유 오버레이 모듈 (src/lib/overlay.tsx 신규 — 인덱스 미노출)

티어 2 전반이 공유: `measure` 기반 앵커 위치 계산(side/align/offset 12방 배치, 뷰포트 클램프 — §2.1 뷰포트 좌표계), 바깥 눌림 감지, ESC 닫기(웹 onKeyDown), 포털 래핑 + §2.1 포커스 관리(이동·트랩·복귀). **dialog 계열은 열림 중 배경 스크롤 잠금(웹 body overflow hidden, 네이티브 Modal 기본 차단), popover 계열은 열림 중 스크롤·창 크기 변화 시 앵커 재계산(웹 이벤트 리스너; 네이티브는 Modal 내 고정이라 한계 기록)** 을 포함한다. z-index 중첩 순서: 오버레이 기본 `z-50`, 중첩(드롭다운 위 툴팁 등)은 열림 순서대로 상위 단계 적용 — 컴포넌트 클래스 토큰으로 규칙화. dialog 계열(중앙)은 위치 계산 없이 포털+백드롭만 소비. 이 모듈이 measure 계약의 1차 소비자 — Wave 0에서 브리지와 함께 구현해 계약을 실증한다.

### 2.4 기존 컴포넌트 계약 소급 적용 (알려진 한계 해소 — AC-3)

- `table.tsx`: BridgeRole 확장으로 role="table"/"row"/"cell"/"columnheader" 부여(스타일 불변).
- `progress.tsx`: `aria-valuemin/max/now` 지정(값·min/max props 이미 존재).
- `pagination.tsx`: 현재 페이지에 `aria-current="page"`.
- 셋 다 머리 주석의 "알려진 한계" 항목 갱신. roadmap-components.md 한계 목록도 갱신(Wave 4).
- **registry/ui 사본 3종(table·progress·pagination)도 원본 수정 즉시 재동기화**(cp+import 치환) — T-0 완료 기준에 audit (d) 회귀 포함해 Wave 4까지 드리프트가 남지 않게 한다(F-2).

## 3. 컴포넌트 이식 공통 규칙 + 특이 전략

공통(전 33종, 자식 브리프에 포함): 원본(shadcn-ref/ui/{name}.tsx)의 export 명·변형(cva)·토큰 클래스 유지. radix/외부 엔진 제거 후 상태는 React state+context. `data-[state=…]`·그룹 셀렉터는 조건부 클래스 전개. 전경색은 내부 Text 이중 지정. 웹 전용 효과는 `web:` 접두사. children 문자열 권장 곳 주석 표기. 파일 머리 주석에 포팅 판단.

| 컴포넌트 | 전략 요점 |
|---|---|
| dialog 계열 4종 | `lib/overlay.tsx` 포털+백드롭. 애니메이션(web: 전용 클래스)은 웹만, 네이티브 즉시 전환. drawer는 useDrag로 아래 드래그 닫기 |
| popover·hover-card·tooltip | 앵커 위치 계산 소비. hover-card 지연(웹 setTimeout, 네이티브 탭 토글). tooltip 트리거 aria-describedby로 내용 연결 |
| command | 자체 필터+키보드 탐색(CommandInput TextInput onKeyDown — 웹 방향키·엔터, 네이티브 onKeyPress 래핑). shadcn API 9종 전부 유지(Command, CommandDialog, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty, CommandSeparator, CommandShortcut). CommandDialog의 화면 밖 제목(sr-only)은 accessibilityLabel/웹 aria-label 부여로 대체(유니버설 sr-only 유틸 부재) |
| dropdown-menu·context-menu | popover 패턴 + 하위 메뉴(1단계 캐스케이드만, 다단계는 한계 기록). context-menu는 onContextMenu(웹)/onLongPress(네이티브) |
| combobox | command + popover 조립(원본도 조립형 demo 컴포넌트) |
| menubar·navigation-menu | dropdown-menu 소비 — 수평 트리거 바/내비게이션 링크+전개 패널 조립(원본 API 이름 유지) |
| select | popover 기반 목록, 방향키·엔터(웹), Pressable 선택(네이티브). Select 프리미티브 아님(자체 구현). 목록 role listbox |
| native-select | Select 프리미티브 소비(웹 진짜 select / 네이티브 폴백) |
| slider·resizable | useDrag 소비. slider는 트랙 View+thumb, value→aria-value 계약, **웹 방향키 값 조정(onKeyDown 소비)**. resizable도 **웹 방향키 크기 조정**(미구현 시 머리 주석 한계 기록) |
| scroll-area | ScrollView 프리미티브 |
| calendar | 순수 날짜 그리드(월 이동·선택 상태), 그리드는 role grid/gridcell·요일 헤더. **웹 방향키 날짜 이동(onKeyDown)**. react-day-picker 미사용 |
| input-otp | TextInput ref focus 이동, maxLength 1 셀, **붙여넣기 전체 분배·백스페이스 이전 셀 후퇴**(웹 onChange 값 길이 분배, 네이티브 paste 제약 시 머리 주석 한계 기록) |
| input-group | 기존 input·field 조립형(원본 API 이름 유지) |
| form | react-hook-form Controller 래핑(Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage). FormControl이 aria-describedby(오류 메시지)·aria-invalid 연결 |
| chart | 공유 스케일 로직 + `@unikit-bridge/ui/chart` 렌더러. ChartContainer/ChartTooltip API 유지, 툴팁은 웹 hover/네이티브 탭. **접근성 최소 사양: 시리즈 단위 role="image"(계약 존재)+accessibilityLabel 요약 라벨**(recharts accessibilityLayer 대체) |
| carousel | ScrollView horizontal+pagingEnabled(네이티브), 웹 scroll-snap(overflow-x) — 동일 프리미티브 |
| sidebar | sheet+collapsible 조립. 쿠키·컨테이너 쿼리 제거(주석), API 이름 유지 |
| sonner | Portal+전역 큐(toast 함수·Toaster). richColors·position 등 props 유지. **라이브 영역 role="status"(계약 존재)로 새 toast 알림 갱신, 스와이프 닫기는 useDrag 시도 후 미실용 시 한계 기록** |
| spinner | lucide svg 대신 View 원호 렌더. 웹 web:animate-spin, 네이티브 정적(uniwind 애니메이션 미지원 — 한계 기록. 구현 중 동작 확인) |
| 채팅 5종(message, message-scroller, bubble, attachment, marker) | 지금 패턴 그대로. message-scroller는 ScrollView+하단 고정 |
| direction | ms-/me- 논리 토큰(uniwind 지원 확인, 미지원 시 left/right 폴백+주석) |

## 4. 배치 — Wave 0~4 (병렬 태스크 파일 교집합 = ∅)

기존 미커밋 변경 없음. 공유 파일(types.ts·web.tsx·native.tsx·package.json·index.ts·registry.json·audit-design.ts·쇼케이스·문서)은 **전부 Wave 0/4에서 오케스트레이터 직접 수행** — 병렬 자식은 `src/components/*.tsx`(신규 파일만)와 `src/lib/overlay.tsx`를 제외한 소유 파일만 생성.

### Wave 0 — 브리지·기반 (직접, 순차) — T-0

types.ts 계약 확장 → web.tsx·native.tsx 구현 → lib/overlay.tsx → chart 렌더러 경로 + package.json exports/peer → 기존 3종 소급 적용(table·progress·pagination). 완료 기준: 기존 상태에서 typecheck 3종 exit 0(확장이 기존 컴파일을 깨뜨리지 않음) + 오버레이 모듈이 measure 계약을 타입 수준에서 소비.

### Wave 1 — 티어 2 오버레이 13종 (T-1a~T-1e)

| 태스크 | 컴포넌트(파일) | 선행 | 병렬 |
|---|---|---|---|
| T-1a | dialog.tsx, alert-dialog.tsx, sheet.tsx, drawer.tsx | T-0 | ⬦ T-1b~d |
| T-1b | popover.tsx, hover-card.tsx, tooltip.tsx | T-0 | ⬦ T-1a,c,d |
| T-1c | command.tsx | T-0 | ⬦ T-1a,b,d |
| T-1d | dropdown-menu.tsx, context-menu.tsx | T-0 | ⬦ T-1a,b,c |
| T-1e | combobox.tsx(command 소비), menubar.tsx·navigation-menu.tsx(dropdown-menu 소비) | T-1c, T-1d | 단독 |

### Wave 2 — 티어 3 입력 9종 (T-2a~T-2c, Wave 1 완료 후 전체 병렬)

| 태스크 | 컴포넌트 | 선행 |
|---|---|---|
| T-2a | native-select.tsx, select.tsx, input-otp.tsx, input-group.tsx | T-0, T-1b(select가 popover 소비) |
| T-2b | slider.tsx, resizable.tsx, scroll-area.tsx | T-0 |
| T-2c | calendar.tsx, form.tsx | T-0 |

### Wave 3 — 티어 4 복합 11종 (T-3a~T-3d, 전 병렬)

| 태스크 | 컴포넌트 | 선행 |
|---|---|---|
| T-3a | chart.tsx + src/chart/* 렌더러 확정 | T-0 |
| T-3b | carousel.tsx, sidebar.tsx, sonner.tsx | T-0, T-1a(sheet 소비) |
| T-3c | spinner.tsx, direction.tsx | T-0 |
| T-3d | message.tsx, message-scroller.tsx, bubble.tsx, attachment.tsx, marker.tsx | T-0(ScrollView 프리미티브 직접 소비) |

### Wave 4 — 통합·문서·검증 (직접, T-4)

1. index.ts 32종 export(chart 제외 — chart는 `@unikit-bridge/ui/chart` 단독 진입점, §0.1. 기존 export 나열 관행).
2. registry/ui 사본 생성 — 신규 33종 + 소급 3종(table·progress·pagination) 재동기화(T-0에서 선행 수행, 여기 최종 확인) + audit (d) names 배열 61종 갱신.
3. registry.json: 신규 33종 아이템 수작성(deps 정책 §1.5) + 기존 28종 deps 교정(react-native·uniwind 제거). generate:design 재실행(theme 항목 재생성 + 정합 확인).
4. README(28종→61종·버전 표기 드리프트 수정)·docs/components.md(61종)·docs/roadmap-components.md(완료 상태·한계 갱신 + 경쟁 현황 섹션: @aniui 등 신규 경쟁자·단일 소스 포지션)·docs/sdd/51-research.md(재확인 기록 보강 — AC-9 산출 위치).
5. llms.txt·AGENTS.md 신규(AC-6).
6. 쇼케이스: apps/web/app/page.tsx·apps/expo/app/index.tsx — 티어별 대표 신규 데모(dialog·popover·select·slider·chart·sonner 등), 양측 동일 섹션(AC-8). **chart 색상 토큰 보강(T-3a 확정)**: chart 컴포넌트는 `--chart-1~5` CSS 변수(shadcn 차트 표준)를 소비하므로 apps/web/app/site.css(및 다크 프리셋)에 토큰을 추가한다.
7. docs/tokens.md 재생성(audit (f))·검증 전체 실행.

## 5. 수납 기준 ↔ 태스크 ↔ 검증 매핑

| AC | T-* | V-* |
|---|---|---|
| AC-1 (33종·61 registry) | T-1~3, T-4.1~3 | V-2, V-5 |
| AC-2 (한 벌·typecheck 3종) | T-0~4 | V-1 |
| AC-3 (shadcn 형태·audit 8/8) | T-0~4 | V-2, V-3, V-4 |
| AC-4 (레지스트리 정합·deps) | T-4.2~3 | V-2, V-5 |
| AC-5 (문서 최신화) | T-4.4 | V-6 |
| AC-6 (llms.txt·AGENTS.md) | T-4.5 | V-6 |
| AC-7 (빌드·번들) | 전체 | V-3, V-4 |
| AC-8 (쇼케이스·portal 관찰) | T-4.6 | V-3, V-4, V-7 |
| AC-9 (경쟁 확인 보고) | T-4.4 | V-6 |

## 6. 검증 계획 (V-1~4는 CI와 동일한 실존 명령 — .github/workflows/ci.yml. V-5~7는 본 계획의 추가 검사)

| ID | 방법 | cwd | 기대 | 판정 |
|---|---|---|---|---|
| V-1 | `bun run typecheck` (패키지·web·expo 3종) | 루트 | exit 0 | pending |
| V-2 | `bun run audit:design` | 루트 | 8/8 PASS (신규 61종 사본 동일·임의값 클래스 0·기본 팔레트 0 포함) | pending |
| V-3 | `bun run build` (next build) | apps/web | exit 0 | pending |
| V-4 | `bun x expo export --platform android` | apps/expo | exit 0 (네이티브 그래프 컴파일) | pending |
| V-5 | registry 정합 일회 검사(bun -e): ① registry:ui 아이템 61종·전체 66 items 개수 ② items 이름 ↔ audit names 배열 ↔ src/components 파일 3자 정합 ③ 모든 registry:ui deps에 react-native·uniwind 부재 ④ form peerDependencies에 react-hook-form·chart description에 react-native-svg 명시 존재 (구현 정정 — deps 대신 peerDependencies, G3 QA P2-2 반영) | 루트 | 전 항목 만족 | pending |
| V-6 | 문서 대조: README·components.md·llms.txt·AGENTS.md·roadmap에 61종 기준 표기 + 구아키텍처 용어 부재 — `grep -riE '@unikit/core|nativewind|react-native-web|tailwind *3'`(uniwind·Tailwind v4는 현행이라 미매칭; 과거형 서술 맥락은 수동 검토 제외) | 루트 | 일치·잔여 0건 | pending |
| V-7 | 쇼케이스 양측 섹션 동일성 대조(수동 — G4 UX 감사에서 실물 관찰과 함께) | apps/* | 동일 섹션 구성 | pending |

G4(사용성) 관찰 경로(F-G1-11 구분): **웹** — next dev·실제 DOM(accessibility 트리·portal 부모·포커스 이동) 관찰. **네이티브** — RN Modal·PanResponder 드래그·onLongPress 등 신규 33종의 네이티브 실물은 expo 웹 preview로 대리 불가(RN web이 흉내만 냄). 에뮬레이터 가용 시 실물 관찰, 미가용 시 해당 항목은 컴파일 수준 증거(V-1·V-4)로 공백을 명시적 기록한다. F-11(Pressable onPress, 요구 제외 항목)과 별개 영역이다.

## 7. 태스크 원장

| ID | 담당 | 수정 허용 경계 | 선행 | 완료 기준 | 검증 |
|---|---|---|---|---|---|
| T-0 | System Architect(직접) | bridge/types.ts, bridge/web.tsx, bridge/native.tsx, lib/overlay.tsx(신규), chart/web.tsx·native.tsx(신규), packages/unikit/package.json(exports·peer+dev 이중), components/{table,progress,pagination}.tsx(소급) + registry/ui 동일 3종 사본 재동기화 | 없음 | §2 계약 구현·typecheck 3종 회귀 없음·audit (d) 8항 유지 | V-1, V-2 |
| T-1a | Frontend/UI Engineer(자식) | components/{dialog,alert-dialog,sheet,drawer}.tsx 신규 | T-0 | 4종 완성·파일 머리 주석 | V-1,2 |
| T-1b | 〃 | components/{popover,hover-card,tooltip}.tsx 신규 | T-0 | 〃 | 〃 |
| T-1c | 〃 | components/command.tsx 신규 | T-0 | 〃 | 〃 |
| T-1d | 〃 | components/{dropdown-menu,context-menu}.tsx 신규 | T-0 | 〃 | 〃 |
| T-1e | 〃 | components/{combobox,menubar,navigation-menu}.tsx 신규 | T-1c,d | 〃 | 〃 |
| T-2a | 〃 | components/{native-select,select,input-otp,input-group}.tsx 신규 | T-1b | 〃 | 〃 |
| T-2b | 〃 | components/{slider,resizable,scroll-area}.tsx 신규 | T-0 | 〃 | 〃 |
| T-2c | 〃 | components/{calendar,form}.tsx 신규 | T-0 | 〃 | 〃 |
| T-3a | 〃 | components/chart.tsx 신규 + src/chart/* 보완 | T-0 | 〃 | 〃 |
| T-3b | 〃 | components/{carousel,sidebar,sonner}.tsx 신규 | T-1a(sheet 소비) | 〃 | 〃 |
| T-3c | 〃 | components/{spinner,direction}.tsx 신규 | T-0 | 〃 | 〃 |
| T-3d | 〃 | components/{message,message-scroller,bubble,attachment,marker}.tsx 신규 | T-0(ScrollView 프리미티브 직접 소비) | 〃 | 〃 |
| T-4 | Platform/Tooling(직접) | index.ts(chart 제외 — 단독 진입점), registry/ui/*(신규), registry.json, scripts/audit-design.ts, README.md, docs/{components,roadmap-components}.md, llms.txt, AGENTS.md, apps/web/app/page.tsx, apps/expo/app/index.tsx, docs/tokens.md(재생성), apps/expo/package.json(react-native-svg), apps/web+expo(react-hook-form) | T-1~3 | §4 Wave 4 전 항목(상태 시나리오 §8 포함) | V-1~7 |

각 구현 태스크 완료 시 독립 Task QA Validator 판정 없이 오케스트레이터가 브리프 완료 기준으로 1차 확인 후 Wave 마지막에 통합 검증(V-1~4) — 개별 PASS를 통합 PASS로 간주하지 않고 Wave 4에서 전체 재실행.

## 8. UI 설계 기준 (UX/Design Auditor 관점 — G1)

- **디자인 출처**: shadcn new-york-v4 원본 클래스 토큰. 색·반경·간격 임의 변경 금지(WCAG 조정은 기존 토큰 체계 준수).
- **상태 전이와 쇼케이스 상태 시나리오(F-G1-4)**: 쇼케이스는 아래 컴포넌트×상태 최소 목록을 관찰 가능하게 구성한다(T-4.6 반영) — overlay 계열 {열림·닫힘·바깥 눌림·ESC}, command {필터 결과 있음·빈 결과(CommandEmpty)}, form {초기·오류(FormMessage+aria-invalid)·제출 중}, 비활성 {메뉴 항목·버튼 disabled 변형}, sonner {success·error·중첩 스택}, input-otp {부분 입력·완성}, spinner {로딩(웹 회전·네이티브 정적 한계)}, select·native-select {선택 전·선택됨}, calendar {월 이동·선택일}. 이 목록 외 상태는 머리 주석·roadmap 한계 기록으로 관리한다.
- **접근성**: §2.1 계약(aria-value·current·role)이 실제 지정되는지 G4에서 웹 DOM 관찰로 확인. 키보드(웹): ESC 닫기·방향키 탐색·포커스 링(web:focus-visible 토큰).
- **반응형**: 오버레이는 뷰포트 클램프(§2.3), 모달은 sm: 최대폭 토큰(원본 준용). 모바일(네이티브)은 동일 클래스가 축소 레이아웃으로 자연 대응하는지 G4 관찰.

## 9. 평가와 인계

- G0: 1차 판정 FAIL(독립 Requirements Auditor + 감사 렌즈 2종 — F-1~F-13, P1 3·P2 4·P3 6) → 40-requirements.md 전건 반영 개정(AC-9 신설·AC-3/8 관찰 조건·범위 보완) → **재평가 PASS**(신규 참조 3건 실존 확인 포함). 잔여 P3 관찰 1건: 51-research.md를 사이클 40·50이 공유 — 본 사이클은 "보강(추가 전용)"으로만 편집해 경합 회피.
- G1(본 문서): 작성 System Architect + UX 관점(직접) → 확정 전 독립 Architecture & Plan Reviewer(validate-plan plan 모드) + UX/Design Auditor(review-design 설계 모드) 읽기 전용 스폰 교차검증. 결함(F-*)은 본문 갱신으로 보완.
- 다음 행동: 교차검증 반영 후 Wave 0 착수. 막힌 조건 없음(네트워크 원본 확보 완료 — gh api 경로 `apps/v4/registry/new-york-v4/ui/`).
