# 사이클 90 요구 — 브리지 포인터·포커스·레이아웃 계약 확장과 로드맵 미지원 해소

- 원 요청(해석 없음): «를 활용해서 남은 이슈들 중 해결할 수 있는 것들을 진행해주세요.» — 남은 이슈 = GitHub 열린 이슈(없음, 2026-11-14 실측)가 아니라 `docs/roadmap-components.md` «미지원 기능 로드맵»의 잔여 항목. 사용자 확인(G2)으로 키보드 탐색(select·메뉴) 포함으로 범위 확정.
- 기준 리비전: 50f24cb(main) + 미커밋 사용자 WIP(AGENTS.md·package.json·bun.lock·bridge/web.tsx·native.tsx — 전부 보존 대상, 그 위에서 작업).
- 조사: 2026-11-14, 오케스트레이터(전 파일 직독·grep 실측).

## 배경 실측

### 1. 공통 원인 — 브리지 계약 부재

미지원 목록 다수의 원인은 `bridge/types.ts` 계약 부재다(`src/components/*` 머리주석·로드맵 기재):

- `PressableProps`에 `onHoverIn/onHoverOut`(tooltip·hover-card·navigation-menu·menubar·dropdown 서브메뉴 hover 계열)·`onFocus/onBlur`(tooltip focus 진입) 부재 — `tooltip.tsx:8`, `hover-card.tsx:7`, `navigation-menu.tsx:18`, `menubar.tsx:16`, `dropdown-menu.tsx:13`.
- `ViewProps`에 `onLayout` 부재 — `chart.tsx:47`(«반응형 크기 … onLayout 계약이 없어»), `roadmap-components.md`(측정 캐시 무효화).
- 웹·네이티브 양측 다 네이티브 지원하는 기능이다: RN `Pressable`은 `onHoverIn/onHoverOut/onFocus/onBlur` 프로퍼티를 갖고(react-native 0.88), 웹은 `onMouseEnter/onMouseLeave/focus/blur` 표준 DOM. RN `View`는 `onLayout`을 갖고, 웹은 ResizeObserver로 동등 구현 가능.
- 브리지 구현은 전파 구조라 확장이 소규모다: 웹 Pressable `<button {...rest}>`(`bridge/web.tsx:283`), 네이티브 Pressable `<RNPressable {...rest}>`(`bridge/native.tsx:399`) — hover/focus는 rest 타고 전파, 이름 매핑(웹 hover→mouse계열)만 추가하면 된다.

### 2. 키보드 탐색 부재 (웹)

- `select`·`dropdown-menu`·`context-menu`는 화살표키·Home/End·Enter 항목 탐색이 없다(각 머리주석 «미지원(로드맵)»). radix 원본은 루프 탐색을 제공한다.
- `ViewProps`에 `onKeyDown`이 없어 메뉴 카드에 키 리스너를 붙일 수 없었다(`PressableProps.onKeyDown`은 있음 — `bridge/types.ts:181`).
- 웹에서는 이미 `useOverlayFocus`가 열림 시 첫 포커서블로 포커스를 옮긴다(`lib/overlay.tsx:320`) — 항목(버튼) 포커스 이동(roving) 방식이면 기존 focus-visible 하이라이트 클래스(`dropdown-menu.tsx:180`)를 그대로 재사용할 수 있다.
- `command`는 웹 방향키·엔터 지원(`command.tsx:14`), 네이티브 onKeyPress 한계는 계약 문서화 완료 — 이번 대상 아님.

### 3. 이미 해소된 로드맵 항목(정정 대상)

- «측정 캐시 무효화 — slider·resizable이 최초 1회만 측정» → 현재 소스는 **드래그 시작마다 재측정**한다(`slider.tsx:104-112` «드래그마다 재측정(레이아웃 변화 대응)» 주석, `resizable.tsx:143-149` beginResize의 measureContainer). 로드맵 문서가 낡았다 — 정정만 한다.

### 4. 차트 fluid 폭의 플랫폼 분기

- `chart.tsx:786-809` `useFluidWidth`가 `typeof ResizeObserver !== "function"` 가드로 컴포넌트 코드 안에서 런타임 플랫폼 분기를 한다 — «플랫폼 분기는 브리지 exports 조건이 담당» 원칙(AGENTS.md)의 예외 상태. 네이티브는 기본 320 폴백. 브리지 `onLayout`으로 대체하면 분기가 브리지로 들어가고 네이티브도 fluid 폭을 얻는다.

## 목표와 범위

- **목표**: 브리지에 포인터·포커스·레이아웃 계약 4종(`onHoverIn/onHoverOut/onFocus/onBlur`·`onLayout`·`ViewProps.onKeyDown`)을 추가해, 로드맵 미지원 7건을 shadcn/radix 원본 동작에 맞게 해소한다: ① tooltip hover·focus 진입 ② hover-card 지연 열림·이탈 닫힘 ③ navigation-menu hover 개방 ④ menubar 인접 트리거 hover 전환 ⑤ dropdown-menu 서브메뉴 hover 개방 ⑥ chart 네이티브 반응형 폭(+브리지 원칙 정합) ⑦ select·dropdown-menu 웹 화살표키·Home/End·Enter 탐색. 로드맵 문서를 해소·정정 갱신한다.
- **포함**: `packages/unikit/src/bridge/{types,web,native}` 계약 추가, 컴포넌트 7종(tooltip·hover-card·navigation-menu·menubar·dropdown-menu·context-menu·select)·chart·양 트리 동기(`registry/ui/` 사본), 로드맵·사이클 문서.
- **제외**: 오버레이 등장/퇴장 애니메이션(다음 사이클 제안 유지), command 네이티브 탐색(onKeyPress 한계), 타입어헤드, context-menu 키보드 진입(우클릭 시작 경로 — 열린 뒤 탐색만 포함), recharts 고급 차트, calendar 다중 선택, asChild, Reanimated 도입, `shadcn-ref/`·사용자 WIP 기능 변경, 커밋·푸시(요청 없음).
- **수치 원칙**: radix 지연 기본값은 소스에서 확인되지 않으면 지어내지 않는다(확인 수단: radix 패키지 문서 조회) — 미확인 시 무지연 전환으로 구현하고 머리주석에 기록한다.

## 수용 기준(AC)

- **AC-1 브리지 계약 추가**: `PressableProps`에 `onHoverIn/onHoverOut/onFocus/onBlur`, `ViewProps`에 `onLayout`( `{width,height}` 시그니처)·`onKeyDown`(웹 전용, 네이티브 폐기 문서화)이 추가되고 양측 구현이 계약을 충족한다. 웹 hover는 mouse계열 이벤트로, `onLayout`은 ResizeObserver로, 네이티브 `onLayout`은 RN 관용 시그니처에서 `{width,height}`로 좁혀 매핑한다.
- **AC-2 tooltip 원본 진입**: 웹에서 트리거 hover 진입 시 기존 지연 로직대로 열리고 이탈 시 닫힌다. focus 진입(키보드 탭)에도 열리고 blur에서 닫힌다. 터치(네이티브·모바일 웹)는 기존 press/longPress 진입이 그대로 동작한다. hover/focus 진입분은 displayDuration 자동 닫힘 대상에서 제외되고(원본은 포인터 머무는 동안 유지), press 진입분은 종전대로 자동 닫힌다.
- **AC-3 hover-card 지연·이탈**: 트리거 hover 진입 시 openDelay(기본 200), 트리거·카드 이탈 시 closeDelay(기본 300) 후 닫힌다. 카드 hover는 닫힘을 취소한다(트리거→카드 포인터 이동 유지). press/longPress 토글은 터치 폴백으로 유지된다.
- **AC-4 navigation-menu·menubar hover 전환**: 다른 메뉴가 열려 있는 상태에서 트리거 hover 시 해당 메뉴로 전환된다. 닫힌 상태의 hover 단독 개방은 radix 지연 기본값이 확인된 경우에만 구현한다(미확인 시 미구현으로 기록).
- **AC-5 서브메뉴 hover 개방**: dropdown-menu SubTrigger hover 시 서브메뉴가 열린다(지연값 확인 시 적용). 눌림 토글은 유지된다.
- **AC-6 select·메뉴 키보드 탐색(웹)**: 열린 dropdown-menu(및 sub)·context-menu·select 목록에서 ArrowUp/Down(루프)·Home/End가 항목 포커스를 옮기고, Enter가 포커스된 항목을 선택한다(기존 focus-visible 하이라이트 재사용 — 새 하이라이트 체계를 만들지 않는다). 네이티브는 계약 한계로 미동작(머리주석 기록).
- **AC-7 chart 반응형 폭 양측**: `width="fluid"`가 웹·네이티브 모두 동작한다(네이티브: onLayout). 컴포넌트 코드의 `ResizeObserver` 직접 사용·`HTMLElement` 캐스팅이 제거되고 브리지 `onLayout` 소비로 일원화된다.
- **AC-8 두 트리 동기·문서 정합**: 수정 컴포넌트 전부 `registry/ui/` 사본과 본문 일치(import 줄 제외). 로드맵 문서의 해소 7건·정정 1건(측정 캐시)·잔여 항목이 소스 상태와 일치한다.
- **AC-9 검증 통과**: 루트 `bun run typecheck` exit 0, `bun run audit:design` exit 0, `cd apps/web && bun run build` exit 0, `cd apps/expo && bun x expo export --platform web` exit 0. 웹 데모에서 tooltip(hover·focus)·dropdown(서브 hover·화살표키)·select(화살표키)·navigation-menu/menubar(hover 전환)·chart(fluid) 동작을 브라우저로 직접 확인. 에뮬레이터에서 chart fluid 폭·기존 터치 동작(press·longPress) 회귀 없음을 확인.

## 제약

- bun만 사용. `registry.json` 무변경(신규 아이템·의존성 없음). shadcn 원본 우선 방침(2026-11-11) — 진입 조건·지연값은 원본 동작에 맞추고 임의값 금지. 문서 한국어 해요체. 임의 커밋 금지.

## 차단 질문

- 없음 — G2 대화(2026-11-14)로 범위 확정(키보드 탐색 포함).
