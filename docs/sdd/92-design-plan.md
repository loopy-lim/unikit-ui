# 사이클 90 설계·계획 — 브리지 계약 확장과 미지원 7건 해소

- 요구: docs/sdd/90-requirements.md (AC-1~9)
- 원칙: 플랫폼 분기는 브리지가 담당(컴포넌트는 한 벌 소스), shadcn 원본 우선(진입 조건·지연값은 radix 원본값 — 아래 근거), 임의값 클래스 금지, 두 트리 동기.

## §1 원본 동작 근거 (외부 문서 실측, 2026-11-14)

| 동작 | 원본값 | 출처 |
|---|---|---|
| NavigationMenu hover 개방 | delayDuration **200ms** 후 열림 | radix 공식 문서 NavigationMenu.Root API 표 |
| NavigationMenu 트리거 이동 | skipDelayDuration **300ms** 창 안 재진입은 즉시 열림 | 〃 |
| DropdownMenu 서브메뉴 hover | **즉시 열림**(지연 없음 — 지연 추가 요청이 미해결 이슈 #2330) | radix-ui/primitives GitHub |
| HoverCard openDelay/closeDelay | **200/300ms** (포팅이 이미 API로 수용) | radix 기본값(기존 머리주석) |
| Tooltip delayDuration | **0** (shadcn Provider 설정값 — 포팅 기본값과 동일) | 기존 포팅 머리주석 |

## §2 브리지 계약 설계 (T-1)

`bridge/types.ts`:

- `BridgeLayout = { width: number; height: number }` 신규.
- `ViewProps` + `onLayout?: (layout: BridgeLayout) => void` — 웹: ResizeObserver(최초 관찰 시 1회 + 변화마다 발화, RN onLayout 관행과 정합). 네이티브: RN View onLayout(`{nativeEvent:{layout}}`)에서 width/height만 좁혀 호출.
- `ViewProps` + `onKeyDown?: (event: BridgeKeyEvent) => void` — 웹 전용(메뉴 카드 키보드 탐색). 네이티브: 폐기(Pressable onKeyDown과 동일 취급, 문서화).
- `ViewProps` + `onHoverIn?/onHoverOut?: () => void` — 웹: mouseenter/mouseleave. 네이티브: 폐기(RN View에는 hover 계약 없음 — Pressable에만 있음). 소비처: hover-card 카드 이탈 닫힘.
- `PressableProps` + `onHoverIn?/onHoverOut?/onFocus?/onBlur?: () => void` — 웹: onMouseEnter/onMouseLeave/onFocus/onBlur(무인자 래핑). 네이티브: RN Pressable 고유 프로퍼티와 동일명이라 rest 전파만으로 동작(RN 0.88 계약).

구현(`web.tsx`·`native.tsx`): 웹 View는 onLayout용 로컬 ref 합성 + ResizeObserver effect(prop 있을 때만 관찰). 웹 Pressable은 hover 2종 이름 매핑, focus/blur는 rest 통과(DOM 표준명). 네이티브 View는 onLayout 시그니처 래핑, onKeyDown/onHoverIn/onHoverOut 폐기 destructuring.

## §3 컴포넌트 설계

### T-2 tooltip — 진입 조건 원본 정합

- Trigger에 `onHoverIn → show()`·`onHoverOut → hide()`·`onFocus → show()`·`onBlur → hide()` 연결. 기존 onPress 토글·onLongPress는 터치 폴백으로 유지(웹 클릭 토글도 유지 — 원본도 클릭 시 열린 채 유지, 토글은 포팅 보류 동작).
- displayDuration 자동 닫힘: 진입 경로를 구분해 **press/longPress 진입분만** 자동 닫힘(hover/focus 진입은 포인터·포커스 머무는 동안 유지 — 원본 정합). 구현: 루트에 진입 모드 ref 기록, displayDuration effect가 모드를 조사.
- 머리주석 갱신: «onFocus 부재로 미지원» 서술 삭제, 새 진입 조건 기록.

### T-3 hover-card — 지연·이탈 원본 정합

- 루트에 open/close 타이머 추가. Trigger `onHoverIn` → openDelay 후 열림, `onHoverOut` → closeDelay 후 닫힘 예약. Content(View) `onHoverIn` → 닫힘 예약 취소, `onHoverOut` → closeDelay 재예약. 언마운트 시 타이머 해제.
- openDelay/closeDelay를 실제 동작으로 전환(기존 «미사용 토큰» 주석 정정). press/longPress 토글 유지(터치).
- 원본의 «바깥 포인터 닫힘»은 AnchoredOverlay 투명 백드롭이 이미 잡는다 — 이탈 닫힘과 별개 유지.

### T-4 navigation-menu — hover 개방(200ms)+즉시 전환(300ms 창)

- 루트 컨텍스트에 `lastOpenAtRef` 기록(값이 null이 아닌 게 된 시각). Trigger `onHoverIn`: 다른 메뉴가 열려 있으면 즉시 전환, 아니면 200ms 타이머 후 열림. `onHoverOut` 타이머 해제(열린 콘텐츠는 유지 — 원본도 콘텐츠 이탈로 닫힘, 콘텐츠에 onHoverOut→닫힘은 hover-card와 달리 원본이 viewport 이탈 감지 없이 닫힘 유지… 원본은 콘텐츠 밖으로 포인터가 나가면 타이머로 닫는다 — Content에도 onHoverOut 닫힘(즉시 아님, 원본 종료 동작 근사는 200ms 재사용 없이 즉시 닫음으로 근사하고 주석 기록)).
- 상수는 §1 표의 원본값을 그대로 쓰고 출처 주석 기록. 눌림 토글 유지.

### T-5 menubar — 열린 상태 인접 트리거 hover 전환

- MenubarMenu 컨텍스트에 `hoverActivate` 추가(«다른 메뉴가 열려 있을 때만» 가드). MenubarTrigger `onHoverIn`에서 호출. 원본과 같이 닫힌 상태에서 hover만으로 열지 않는다.

### T-6 dropdown-menu 서브메뉴 — hover 즉시 개방

- SubTrigger `onHoverIn → setOpen(true)`·`onHoverOut`은 닫지 않음(원본 즉시 개방·이탈 유지). 머리주석의 «지연 재현 불가» 서술을 §1 근거로 정정.

### T-7 select·dropdown·context-menu 키보드 탐색 (웹) — 포커스 로빙

방식: **DOM 포커스 이동(roving focus)** — 항목은 웹에서 `<button>`이라 포커스가 하이라이트(focus-visible 클래스)·Enter 선택(브라우저 기본 클릭)·scroll-into-view(브라우저 기본)를 모두 무료로 제공한다. 별도 하이라이트 상태·조건부 클래스 체계를 만들지 않는다(AC-6).

- 공통 내부 훅 `useMenuKeyboardNav`(파일별 소규모 복제 또는 lib 공유 — dropdown·context·select가 각자 파일을 가진 구조상 **lib/menu-nav.ts** 신설 공유): 항목 등록(마운트 순 인덱스)·현재 인덱스 추적(항목 onFocus)·키 핸들러(ArrowDown/Up 루프, Home/End, ArrowRight → 서브트리거 개방(dropdown만), ArrowLeft → 서브 닫기(dropdown 서브 카드만)). 등록 항목은 disabled 제외.
- 포커스 이동은 등록한 요소 노드의 `focus()` 호출 — `BridgePressableRef`에 선택적 `focus?(): void` 계약 추가(웹 DOM 요소는 충족, 네이티브 인스턴스는 미정의 → no-op 가드; BridgeTextInputRef focus/blur와 같은 구조적 계약 방식).
- 카드(View)에 `onKeyDown` 연결(ViewProps 신규 계약). 열림 시 useOverlayFocus가 이미 첫 항목으로 포커스를 옮긴다(기존 동작) — 첫 ArrowDown은 다음 항목부터(추적 인덱스 기준).
- Enter/Space는 네이티브 버튼 클릭에 맡긴다(이벤트 가로채기 없음). Tab은 기존 오버레이 포커스 트랩.
- context-menu: 동일 패턴 적용(구조가 dropdown과 평행). select: SelectContent가 내부 PopoverContent에 onKeyDown 전달, SelectItem 등록. 트리거 ArrowDown/Up 개방은 기존 구현 유지.
- 네이티브: onKeyPress 한계로 미동작 — 머리주석·로드맵에 잔여로 기록(계약상 타입만 존재).

### T-8 chart — fluid 폭 양측

- `useFluidWidth`의 ResizeObserver·`HTMLElement` 캐스팅 제거 → 컨테이너 View에 `onLayout` prop 전달로 폭 수집(브리지가 웹 ResizeObserver/네이티브 RN onLayout을 대체). 측정 전 기본 320 폴백·1px 스레숄드 유지. 머리주석 «웹 전용» 서술 정정.

### T-9 두 트리 동기

- 수정 파일: tooltip·hover-card·navigation-menu·menubar·dropdown-menu·context-menu·select·chart(+bridge 3종·lib/overlay 무변경·lib/menu-nav 신규은 registry 사본에도) — `registry/ui/` 동일 본문·import만 `@/lib/utils` 기준. `registry.json`·의존성 무변경(신규 외부 의존 0).

### T-10 문서

- `docs/roadmap-components.md`: 해소 7건 이동(오버레이·키보드·차트 절에서 해소 기록으로), «측정 캐시 무효화» 정정(이미 드래그마다 재측정), 잔여 목록 갱신, §근거(§1 표) 추가. 사이클 문서 3종(90·92·93)·원장 1행.
- `llms.txt`·`docs/components.md`에 미지원 목록이 있다면 해당 줄만 갱신(보존 원칙).

## §4 태스크 순서·소유 (직렬 — bridge가 공유 기반)

T-1 bridge(3종) → T-2~T-8 컴포넌트(파일 독립, 순차 실행) → T-9 registry 동기 → 검증(V) → T-10 문서. 병렬 스폰 없음(공유 파일·머리주석 정합성 위험 > 병렬 이득, 오케스트레이터 직접 수행).

## §5 검증 계획 (AC ↔ V)

| V | 명령/관찰 | AC |
|---|---|---|
| V-1 | 루트 `bun run typecheck` exit 0 | 전체 |
| V-2 | 루트 `bun run audit:design` exit 0(두 트리 동기 검증 포함) | AC-8 |
| V-3 | `cd apps/web && bun run build` exit 0 | 전체 |
| V-4 | `cd apps/expo && bun x expo export --platform web` exit 0 | 전체 |
| V-5 | 웹 데모 브라우저 실물: tooltip hover/focus·hover-card 지연·nav-menu hover 개방·전환·menubar 전환·dropdown 서브 hover+화살표키/Home/End/Enter·select 화살표키·chart fluid 리사이즈 | AC-2~7 |
| V-6 | 에뮬레이터(emulator-5554): chart fluid 폭 회전 대응·tooltip/hover-card press·longPress 회귀·dropdown 탭 동작 회귀 | AC-2·3·7 |
| V-7 | grep: `ResizeObserver`(chart.tsx 제거 확인)·머리주석 «onFocus 부재» 잔여 0·registry 사본 diff 0 | AC-7·8 |

컴파일러·audit이 1차 게이트, V-5·V-6은 수정 뒤 재실시(사이클 74 관례).
