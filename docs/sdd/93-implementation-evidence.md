# 사이클 90 구현 증거 — 브리지 포인터·포커스·레이아웃 계약과 미지원 7건 해소

- 요구: docs/sdd/90-requirements.md · 설계: docs/sdd/92-design-plan.md
- 기준: 7c25668(main) + 미커밋 사이클 90 변경 24파일(+2427/−627, G4 수정 포함) + 신규 2파일(`src/lib/menu-nav.tsx`·본 문서 등 사이클 문서). 커밋 0 유지(임의 커밋 금지 지침).
- 수행: 2026-11-14. 편성은 92 §4 그대로 직렬(bridge 공유 기반 → 컴포넌트 7종·chart → registry 동기 → 검증 → 문서), 오케스트레이터 직접 수행.

## 구현 결과

- **T-1 브리지 계약** — `bridge/types.ts`: `BridgeLayout = {width,height}`, `ViewProps`에 `onLayout`(마운트 1회+변화마다)·`onKeyDown`(웹 전용)·`onHoverIn/onHoverOut`(웹 전용 — RN View엔 hover 계약 없음), `PressableProps`에 `onHoverIn/onHoverOut/onFocus/onBlur`(양측). 웹(`bridge/web.tsx`): View onLayout은 로컬 ref 합성 + ResizeObserver 관찰(prop 있을 때만), Pressable은 hover 2종을 `onMouseEnter/onMouseLeave`로 매핑. 네이티브(`bridge/native.tsx`): View onLayout을 RN 관용 시그니처에서 `{width,height}`로 좁혀 전달, View `onKeyDown`·hover 2종은 폐기 destructuring, Pressable은 RN 고유 프로퍼티와 동일명이라 rest 전파. `PortalProps`에 `dismissViaDocument`(F-4), `BridgePressableRef`에 선택적 `focus()`.
- **T-2 tooltip** — 트리거 `onHoverIn/onHoverOut`(지연 로직대로 개방·이탈 닫힘)·`onFocus/onBlur`(웹 키보드 진입) 연결. 진입 모드 ref로 displayDuration 자동 닫힘을 press/longPress 진입분만 적용(pointer 진입은 머무는 동안 유지 — radix 정합). press/longPress 토글 폴백 유지.
- **T-3 hover-card** — openDelay(기본 200)·closeDelay(기본 300)를 실제 타이머로 전환(기존 «미사용 토큰» 정정). 트리거 이탈 닫힘 예약 → 카드 진입 취소 → 카드 이탈 재예약. 언마운트 타이머 해제.
- **T-4 navigation-menu** — 트리거 hover 진입 200ms(NAV_HOVER_DELAY — radix delayDuration 기본값) 후 개방, 다른 메뉴 열림 시 즉시 전환, 닫힘 뒤 300ms 창(skipDelayDuration) 안 재진입은 즉시. 눌림 토글 유지.
- **T-5 menubar** — MenubarMenu 컨텍스트에 `hoverActivate`(«다른 메뉴 열림» 가드) 추가, 트리거 onHoverIn에서 호출. 닫힌 상태 hover 단독 개방 없음(원본 정합).
- **T-6 dropdown·context 서브메뉴** — SubTrigger 진입 100ms 뒤 개방 예약(SUB_OPEN_DELAY — radix Menu 소스값, F-1 정정)·이탈 300ms 포인터 grace 뒤 닫힘 예약, 카드 진입이 닫힘 취소. context-menu는 평행 구조 전체 미러. 눌림 토글 유지.
- **T-7 키보드 탐색(웹)** — `lib/menu-nav.tsx` 신규: 카드(Content)가 `useMenuNav` 컨트롤러 소유, 항목은 `useMenuItemRef`로 등록(마운트 순서＝탐색 순서), `ArrowDown/Up`(양 끝 루프)·`Home/End`·`ArrowRight`(SubTrigger 서브 개방). 항목 DOM 포커스 이동 방식(roving)이라 focus-visible 하이라이트·Enter 선택·스크롤 따라가기는 브라우저 기본 동작(AC-6 «새 하이라이트 체계 금지» 준수). dropdown·context SubTrigger에 `ArrowLeft` 서브 닫힘(F-6). select·dropdown·context 항목에 hover 진입 포커스 이동(F-2, radix 정합). 서브 개방 진입 모드(`"pointer"|"keyboard"`) 추적 — pointer 개방은 첫 항목 포커스 이동 없음, keyboard 개방(ArrowRight)만 이동(F-8). 오버레이 열림 포커스는 `visible && ready && focusOnOpen`(F-5).
- **T-8 chart** — `useFluidWidth`의 ResizeObserver 직접 사용·HTMLElement 캐스팅 제거, 컨테이너 View `onLayout`으로 폭 수집(웹 ResizeObserver·네이티브 RN onLayout 양측). 1px 스레순·측정 전 320 폴백 유지. 엑스포 쇼케이스 막대 슬라이드를 `width="fluid"` 실증 슬라이드로 전환(`chart-section.tsx`).
- **T-9 두 트리 동기** — 수정 8종(tooltip·hover-card·navigation-menu·menubar·dropdown-menu·context-menu·select·chart) `registry/ui/` 사본 재생성(import만 `@/lib/utils` 기준). `registry.json`·의존성 무변경(신규 외부 의존 0).
- **T-10 문서** — `docs/roadmap-components.md`: 해소 3건(hover 개방·키보드 탐색 부분·chart 유동 폭)·정정 2건(측정 캐시 무효화 — 이미 드래그마다 재측정, 포인터 이벤트 계약 잔여 서술). `llms.txt` «주요 한계» 3줄·`docs/components.md` menubar·navigation-menu 행 갱신, 로드맵 «다음 사이클 제안» 4번 정정. 본 문서·원장 1행.

## AC별 증거

### AC-1 브리지 계약 추가 — PASS

- `bridge/types.ts:41`(BridgeLayout)·`:106-114`(ViewProps onLayout·onKeyDown·onHoverIn 서술)·`:204-205`(PressableProps onKeyDown) — 머리주석 `:21-22`에 사이클 90 확장 목록.
- 웹 실현: `bridge/web.tsx:174-186`(View onLayout ResizeObserver 관찰·구독 해제)·`:207,305`(Pressable `onMouseEnter={onHoverIn}` 매핑).
- 네이티브 실현: `bridge/native.tsx:215-220`(onLayout `{width,height}` 좁힘·onKeyDown·hover 2종 폐기 destructuring) — 머리주석 `:25-34`에 폐기 목록 문서화.
- 컴포넌트 코드에 플랫폼 분기(Platform.select·.web.tsx) 0건 — audit (h)·grep 실측.

### AC-2 tooltip 원본 진입 — PASS

- hover 진입 개방·이탈 닫힘, focus(Tab) 진입 개방·blur 닫힘, press 진입분만 displayDuration 자동 닫힘(진입 모드 ref) — `components/tooltip.tsx:7-22` 머리주석 계약.
- 네이티브 회귀(에뮬레이터 emulator-5554): 탭 진입 개방 → 3초 뒤 자동 닫힘, 길게 눌러 열림 — device_screenshot 육안 실증(2026-11-14).
- 웹 실물 관찰: G4 UI 감사(아래 원장)에서 재실측.

### AC-3 hover-card 지연·이탈 — PASS

- openDelay 200/closeDelay 300 실동작, 트리거→카드 이동 유지(카드 진입 닫힘 취소) — `components/hover-card.tsx:104-112`.
- F-4(dismissViaDocument) 적용으로 카드가 열리자마자 스스로 닫히던 결함 해소 — 웹 브라우저에서 «열림 유지 → 트리거·카드 밖 이탈 → 300ms 뒤 닫힘 → 바깥 클릭 즉시 닫힘» 전이 실측(사이클 내 F-4 수정 검증).
- 타이밍 정밀 측정은 G4 UI 감사에서 수행.

### AC-4 navigation-menu·menubar hover 전환 — PASS

- nav-menu: 200ms 지연 개방·열린 상태 즉시 전환·300ms 재진입 창 — `components/navigation-menu.tsx:19-22,166`(NAV_HOVER_DELAY·skip 창). Content 이탈 닫힘 근사는 머리주석 기록(다항형 진행 의도는 재현 안 함 — 로드맵 잔여).
- menubar: `hoverActivate` 가드(다른 메뉴 열림 시만) — `components/menubar.tsx:117-120,185-190`.
- 웹 실물 관찰: G4 UI 감사.

### AC-5 서브메뉴 hover 개방 — PASS

- SubTrigger 진입 100ms 개방·이탈 300ms grace·카드 진입 취소 — `components/dropdown-menu.tsx:163-167,693-694`(SUB_OPEN_DELAY=100). radix 소스값(설계 §1 «즉시» 정정 — F-1).
- 웹 실측: «더 보기» hover → 서브 개방(무강투), 이탈 후 grace 내 재진입 유지, 완전 이탈 닫힘.
- 네이티브 회귀(에뮬레이터): «더 보기» 탭 → 서브 카드 개방(부모 유지) 스크린샷 실증.

### AC-6 select·메뉴 키보드 탐색(웹) — PASS

- `lib/menu-nav.tsx` 전체 + 소비 3종(dropdown-menu·context-menu·select). 새 하이라이트 체계 0건(기존 focus-visible 재사용).
- 웹 시나리오 실측(브라우저 합성 이벤트): dropdown — ↓(disabled «관리자 콘솔» 스킵)·↑ 루프·Home/End·ArrowRight 서브 개방→«내보내기» 포커스·서브 안 ↓/↑/랩·ArrowLeft 복귀·재개방 직후 ↓ 정상(F-7 수정 후)·ESC 전체 닫힘. select — 닫힌 트리거 ↓ 개방·카드 ↓·항목 hover 포커스 이동(F-2)·↑ 루프·Enter 선택+닫힘+트리거 «영어»·재개방 시 aria-selected=false,true·ESC. context-menu — 우클릭 개방·서브 hover 개방·ESC는 최상위만 닫음(radix 정합).
- 네이티브: View onKeyDown 폐기로 미동작 — 머리주석·로드맵 잔여 기록(계약 한계).

### AC-7 chart 반응형 폭 양측 — PASS

- `components/chart.tsx:795-824` — ResizeObserver·HTMLElement 캐스팅 제거 확인(grep 0건), onLayout 소비. `width?: number | "fluid"`.
- 웹(/blocks/dashboard): 뷰포트 480px→차트 398px·1280px→926px, 항상 부모 폭과 일치.
- 네이티브(에뮬레이터 portrait 390dp): 막대 fluid 카드 폭(~656px) 충전, 아래 선 차트(320 고정 기본) 대조 — 스크린샷 실증. **회전 재측정은 앱 매니페스트 portrait 잠금(`apps/expo/app.json` orientation)으로 불가 — 한계 기록.**

### AC-8 두 트리 동기·문서 정합 — PASS

- audit (d) registry 사본 62종 동일 — 최종 재실행 9/9(F-9 수정 후).
- 로드맵 해소 3건·정정 2건·llms.txt 3줄·components.md 2행 갱신 완료(위 T-10).

### AC-9 검증 통과 — PASS

| 검증 | 결과 |
|---|---|
| 루트 `bun run typecheck` | exit 0(desktop·expo·mobile·web·unikit 전부) |
| 루트 `bun run audit:design` | 최종 **9/9 PASS**(중간 (d) FAIL 1건 → F-9 재동기화 후 회복) |
| `cd apps/web && bun run build` | exit 0(정적 익스포트 — F-9 registry 수정 뒤 재실행) |
| `cd apps/expo && bun x expo export --platform web` | exit 0(dist 생성) |

- 에뮬레이터 회귀: tooltip 3종(탭 개방·3초 자동 닫힘·longpress)·dropdown(트리거 탭 개방 — 비활성 항목 흐림·체크·라디오 표시 확인, 서브트리거 탭 개방·부모 유지, «내보내기» 탭 전체 닫힘, 체크 항목 탭 닫힘)·context-menu(longpress 개방·«공유» 탭 서브 개방·«링크 복사» 탭 전체 닫힘)·select(트리거 탭 개방 — «기타» disabled, «영어» 탭 선택+닫힘+트리거 «영어»·힌트 "en") — 전부 device_screenshot·스냅샷 육안 실증(2026-11-14).
- hover-card 네이티브: 엑스포 카탈로그가 `webOnly` 안내 슬라이드(네이티브 데모 없음) — 회귀 대상 아님.

## 구현·검증 중 발견해 고친 결함

- **F-1(P2·설계 정정) radix 서브 개방 지연**: 설계 §1은 «즉시 열림(지연 없음 — 지연 추가 요청이 미해결 이슈 #2330)»으로 근거를 뒀으나 radix Menu 소스 실측 결과 **진입 100ms 타이머·이탈 300ms grace**. 구현은 소스값(SUB_OPEN_DELAY=100)을 따르고 머리주석·로드맵에 출처 기록. 설계 문서 근거표는 확정값으로 정정하지 않고 본 증거가 정정 근거가 된다.
- **F-2(P2) hover-follows-focus 부재**: hover로 서브를 열어 둔 채 다른 항목을 가리키고 Enter를 누르면 포커스가 머문 옛 항목이 활성화됐다(radix Menu은 항목 pointerenter 시 항목으로 포커스 이동). 수정: `composeMenuItemHoverIn`(reportFocus + node.focus()) — dropdown·context 항목 전종·select 항목.
- **F-3(P3) disabled 항목 포커스 거부**: 브라우저가 disabled 버튼의 focus()를 무시해 탐색이 멈춰 보였다. 수정: `focusAt` 스킵 루프 — 한 번의 키에 비활성 항목을 건너뛴다(원본 동작).
- **F-4(P1) 커버층 hover 탈취**: AnchoredOverlay의 웹 투명 커버층(fixed inset:0·pointer-events auto)이 열리는 순간 브라우저 hover 재계산으로 트리거 mouseleave를 일으켜, hover로 연 카드가 스스로 닫혔다(hover-card는 개방 즉시 300ms 뒤 닫힘·nav-menu는 약 217ms 주기 진동·커버층이 페이지 hover 자체를 차단). 수정: 오버레이를 커버층 없이 띄우고 바깥 클릭 닫힘을 문서 수준 pointerdown(`dismissViaDocument`)으로 잡는다 — 이탈 닫힘(hover 계열)과 바깥 클릭 닫힘이 분리. 수정 후 «열림 유지→이탈 닫힘→바깥 클릭 닫힘» 전이 실측 통과.
- **F-5(P1) 오버레이 열림 포커스 미진입**: `useOverlayFocus(contentRef, visible)`가 첫 커밋(카드 마운트 전)에 no-op로 끝나고 ready 반전에도 재실행되지 않아, 열림 시 포커스가 카드 안으로 들어가지 않았다(→ 키보드 탐색 전체 불능). 수정: 의존을 `visible && ready && focusOnOpen`으로 + `focusOnOpen` prop(hover 개방 계열은 false — F-8과 짝).
- **F-6(P3) SubTrigger ArrowLeft 갭**: hover로 서브를 연 뒤(포커스가 트리거에 남음) ArrowLeft로 서브를 닫을 수 없었다. 수정: SubTrigger keydown에서 `ArrowLeft && sub.open` 처리(서브 카드가 아니라 트리거 쪽에서 — 이식 구조 차이 주석 기록).
- **F-7(P1) 포탈 프로그래매틱 focus 미발화**: 포탈 안 useEffect의 `node.focus({preventScroll:true})`가 React onFocus(→reportFocus)를 발화시키지 않는 경우가 있어, 서브 개방 직후 첫 ArrowDown이 no-op였다(End는 동작·blur+refocus 후에는 동작으로 국소화해 판별). 수정: handleKeyDown이 매 입력 시점에 `document.activeElement`로 항목을 해석(`resolveCurrentId`) — focus 이벤트 등록 불의존. currentRef(reportFocus)는 네이티브 폴백으로 유지.
- **F-8(P2) 진입 모드 포커스 정책**: pointer(hover/press)로 연 서브에서 첫 항목 강제 포커스는 radix 포인터 모드와 불일치했다. 수정: Sub 컨텍스트에 진입 경로(`entry: "pointer"|"keyboard"|null`) 추적, SubContent는 `focusOnOpen={entry !== "pointer"}` — keyboard(ArrowRight) 개방만 첫 항목으로.
- **F-9(P3·최종 게이트 적발) registry select 사본 동기 누락**: 머리주석 «포커스 정책» 병합분이 `registry/ui/select.tsx`에 반영되지 않았다가 최종 `audit:design` (d)가 FAIL로 적발. 재동기화 후 9/9 회복·웹 빌드 재실행. 두 트리 동기 규율(AGENTS.md)이 게이트에서 실제로 작동한 사례.
- **F-10(P1·G4 확정+오케스트레이터 실증) 문서 리스너 계층 무시 — 트리거 재클릭 재오픈·서브 항목 클릭 유실**: F-4의 문서 수준 pointerdown 닫힘이 열려 있는 모든 카드를 각자 판정했다. (a) 열린 메뉴의 트리거 재클릭이 «바깥»으로 판정돼 닫힘+재개방으로 토글이 어긋났다(리뷰어 재현). (b) 루트 카드의 리스너가 서브 카드 **안** 눌림도 바깥으로 판정해 트리가 언마운트되고, 이후 click 이벤트가 분리된 노드에 발생해 문서에 도달하지 못했다 — 웹에서 서브 항목 클릭 선택이 전체 유실(실측 `{"ev":["pd:PDF"],"pdfInDoc":false,"menusAfter":0}`). 수정: `bridge/web.tsx` Portal에 `dismissLayers` 계층 스택(radix DismissableLayer 근사) — 문서 pointerdown에서 위에서부터 내려가며 눌림 대상 포함 층에서 멈추고 그 위만 닫는다. 트리거 재클릭은 `dismissIgnoreRef`(앵커=트리거)로 바깥 판정에서 제외해 눌림 토글에 맡긴다(`AnchoredOverlay`가 전달, `PortalProps` 계약 문서화). 수정 후 재실측: 트리거 재클릭→닫힘 유지·«PDF» 클릭→문서 도달+선택+전체 닫힘·context-menu «링크 복사» 클릭 동일.
- **F-11(P3·G4 확정) End 키 스킵 방향**: `focusAt(order.length - 1)`이 끝 항목이 disabled면 기본 +1(앞 방향)로 건너뛰어 목록 끝에서 한 바퀴 돌아 첫 항목으로 갔다. 수정: End는 `-1`(뒤 방향 스킵). 재실측: select End→«일본어»(«기타» 비활성 스킵)·context-menu End→«삭제».
- **F-12(P2·G4 확정) 닫힘 후 포커스 BODY 잔류**: Content의 AnchoredOverlay가 `triggerRef`를 전달하지 않아 ESC/Enter 닫힘 뒤 포커스가 body에 남았다(다음 Tab이 문서 처음부터). 수정: dropdown·context의 Content(트리거)·SubContent(서브트리거)에 `triggerRef` 연결. 재실측: select ESC→activeElement=«언어 선택» 트리거.
- **F-13(P2·G4 확정) press 서브 개방 진입 미표시**: SubTrigger 눌림 토글이 `setOpen(true)`로 entry null로 열어 focusOnOpen이 켜져 첫 항목으로 포커스가 튀었다(머리주석 «press는 포커스를 옮기지 않는다»와 불일치). 수정: Sub 컨텍스트에 `openViaPointer`(타이머 청소+entry "pointer"+즉시 개방) 추가, SubTrigger 눌림 개방을 이것으로. 재실측: «내보내기» press→서브 개방+포커스 트리거 잔류(«공유» 동일).
- **F-14(P3·G4 확정) 진입 모드 ref 잔재 — press 개방 중 hover 진입 미반영**: tooltip·hover-card의 `entryRef`는 ref라 이미 열린(press) 채 hover가 와도 재렌더가 없어 context.entry가 stale로 남았다 — press로 연 툴팁/카드 위의 클릭이 «pointer 진입 중 끄지 않는다» 게이트를 뚫고 껐다. hover-card는 «press» 유니온이 죽은 값이기도 했다(대입은 "pointer"·null뿐). 수정: 양쪽 `useState` 전환 + 이미 열림 조기 반환 **앞에** setEntry(진입 상승), hover-card 유니온 `"pointer"|null` 축소. 재실측: press 개방 툴팁→hover 진입→클릭에 열림 유지(press-only 토글은 여전히 닫힘 확인).

## 관문 판정 원장

| 관문 | 평가(독립/자체) | 판정 | 근거 |
|---|---|---|---|
| G1 탐색·앵커 | 오케스트레이터(요구 §배경 실측 — radix 소스·RN 0.88 계약·shadcn-ref 대조) | PASS | 90-requirements 배경 실측 4节·§1 원본값 근거표 |
| G2 대화 계획 | 사용자 확인(2026-11-14) | PASS | «키보드 탐색(select·메뉴)도 포함» 범위 확정 — 90-requirements 차단 질문 없음 |
| G3 구현+기계 게이트 | 오케스트레이터(92 §4 직렬 편성) | PASS | AC-1~8 위 증거·AC-9 게이트 재실행 통과(F-9 수정 후 audit 9/9·웹 빌드 재실행) |
| G4 다분야 독립 리뷰 | Code & Architecture Reviewer·UI/UX & Visual Auditor(클린 컨텍스트 병렬 스폰) | PASS | 확정 결함 5건 수정(트리거 재클릭·서브 클릭 유실→F-10, End 방향→F-11, 포커스 복귀→F-12, press 진입→F-13, entry state→F-14) + UI 감사 radix 정합 실측(타이밍 6종·다크 모드·chart fluid) + 취향/무근거 기각 후 기계 게이트 재통과(typecheck·audit 9/9·web build)·웹 6항목 재실측(아래 G4 재검증) |

### G4 재검증(F-10~F-14 수정 후)

- 게이트 재실행: `bun run typecheck` exit 0 · `bun run audit:design` 9/9 PASS(registry 62종 동일 — 재동기화 4종 포함) · `cd apps/web && bun run build` exit 0.
- 웹 재실측(kitchen-sink, 합성 pointerdown→포커스→click 실측·hover는 mouseout/mouseover 페어링): ① menubar 트리거 재클릭→닫힘 유지 ② «내보내기» hover→서브 개방+포커스 이동→«PDF» 클릭→click 문서 도달·메뉴 전체 닫힘·트리거 aria-expanded=false ③ select End→«일본어»(«기타» 비활성 스킵)·Home→«한국어» ④ ESC→activeElement=«언어 선택» 트리거 ⑤ «내보내기» press→서브 개방+포커스 트리거 잔류 ⑥ tooltip press 개방→hover 상승→클릭에 열림 유지(press 단독 토글 닫힘은 유지). context-menu(실제 우클릭): 개방·End→«삭제»·«공유» press 서브+포커스 잔류·«링크 복사» 클릭 도달+전체 닫힘.
- 채택하지 않은 리뷰 의견(근거 기각·기록): registry에 `../lib/overlay`·`menu-nav` 등 lib 사본 미제공은 `check:consumer` 통과 구조와 동일한 기존 공백(신규 결함 아님), 모바일 웹 tap focus 우회는 도구 미지원으로 BLOCKED 처리, nav-menu 인접 트리거 전환·skipDelay 창 실측은 데모 구조(트리거 1개)·도구 왕복 지연으로 BLOCKED 처리 — 잔여 한계 참조.

## 잔여 한계·BLOCKED

- **회전 재측정 불가(BLOCKED)** — `apps/expo/app.json` `"orientation": "portrait"` 잠금으로 에뮬레이터 회전이 강제되어 chart fluid의 회전 전이 실증 불가(adb user_rotation·`emu rotate` 모두 무시됨 확인). 매니페스트 변경은 침습적이라 하지 않았다 — portrait 실증(폭 충전)으로 갈음, 회전 대응은 onLayout 계약 구조상 자동(재발화)이지만 실물 증거 없음.
- **registry lib 사본 공백(기록)** — `registry/ui/*`가 참조하는 `../lib/overlay`·`../lib/menu-nav` 사본이 registry에 없다(`registry.json` files에도 없음). `check:consumer`가 통과하는 기존 구조와 동일한 공백이라 이번에 신규 처리하지 않음 — 소비자 수동 복사 시 lib 누락 이슈는 로드맵 과제.
- **모바일 웹 tap focus 우회 미실측(BLOCKED)** — 터치 브라우저에서 press 개방 포커스 정책 실물 검증 도구 없음(에뮬레이터 웹뷰는 데브클라이언트 전용).
- **AC-4 실측 2건 BLOCKED** — nav-menu 인접 트리거 hover 전환은 데모가 트리거 1개(kitchen-sink 구조 한계), skipDelay 300ms 창 재진입은 도구 왕복이 창보다 길어 측정 불가. 구현(가드·타이머)은 코드·머리주석 근거로 PASS 처리.
- nav-menu 다항형 진행 의도(pointer grace intent) 판정 미재현 — 형제 항목 전환은 grace 만료 뒤 닫힘으로 근사(머리주석·로드맵 기록).
- 타입어헤드·네이티브 카드 키보드 탐색(View onKeyDown 폐기)은 계약 한계로 잔여(로드맵).
- RN Modal 열림 중 접근성 스냅샷이 빈 트리로 보이는 에뮬레이터 도구 한계 — 스크린샷 육안으로 대체(메모리 규칙: 화면은 직접 눈으로).
- 커밋·푸시는 요청 없어 수행하지 않음(지침).

## 후속 작업 (2026-11-14, 사이클 90 완료 직후 — 사용자 요청 «남은 것 미리 진행»)

위 «잔여 한계·BLOCKED» 중 처리 가능한 항목을 당겨서 진행했다. 기존 기록은 보존하고 이 섹션이 해소 상태를 갱신한다.

### 후속-1 타입어헤드(radix Menu 원본 이식 — 웹)

- **구현**: `src/lib/menu-nav.tsx`에 radix `getNextMatch` 원본 이식(wrapArray — 반복 글자 «aa»→«a» 정규화 순환·현재 매치 앞쪽부터 탐색·정규화 검색어 1글자면 현재 매치 제외·toLowerCase startsWith). 항목 텍스트는 등록 노드 `textContent` trim(원본 textValue 기본 전략), disabled 제외, 버퍼는 마지막 입력 1초 뒤 초기화(원본값), 매칭 포커스는 setTimeout 지연(원본·React 배칭 회피). 키 게이트 `event.key.length === 1 && !ctrl && !alt && !meta`(원본 isModifierKey 상응) — BridgeKeyEvent에 `ctrlKey·altKey·metaKey?` 플래그 추가(웹은 DOM KeyboardEvent가 구조적으로 제공). 카드 (재)개방 시 버퍼 리셋(원본은 카드 언마운트 리셋 — 컨트롤러가 카드보다 오래 사는 구조 차이의 근사).
- **실측**(kitchen-sink, 케이스 사이 1.1s cooldown — 버퍼 1초 누적 방지): ① menubar «파일» «가»→«가져오기» 비활성 제외 «새 문서» 유지 ② «새»→«새 문서»(1글자 정규화로 자기 자신 제외) ③ 서브 카드 «이»→«이미지» ④ select «일»→«일본어» ⑤ «기» 반복→«기타» 비활성이라 미이동. radix 소스 근거: packages/react/menu/src/menu.tsx getNextMatch·handleTypeaheadSearch(1초)·키 게이트·textContent 전략.

### 후속-2 registry lib 사본 공백 해소(«잔여 한계» 2건째 해소)

- `registry/lib/overlay.tsx`·`registry/lib/menu-nav.tsx` 신규(src/lib에서 byte 동일 사본 — overlay는 same-dir `./utils` import 그대로). `registry.json`에 `registry:lib` 아이템 2종 추가(utils 뒤) → **총 69 아이템 = UI 61 + lib 3(utils·overlay·menu-nav) + theme 4 + animations 1**. 오버레이 12종(dialog·alert-dialog·sheet·drawer·popover·hover-card·tooltip·combobox·context-menu·dropdown-menu·navigation-menu·select)에 `overlay`, 메뉴 3종(select·dropdown-menu·context-menu)에 `menu-nav` registryDependencies 추가 — `add` 한 번에 lib이 `lib/`에 함께 복사된다.
- 감사 확장: (d)에 `@/lib/overlay`·`@/lib/menu-nav` 정규화 2종 + lib 사본 byte 동일 검사 루프, (g) PALETTE_ALLOWLIST에 `overlay.tsx: bg-black/50`(원본 shadcn DialogOverlay 딤 — 이식 9조 #3·slider bg-white 전례).

### 후속-3 잔여 실측 3건 해제

- **nav-menu 인접 트리거 hover 전환**(AC-4 BLOCKED 해소): 웹 데모에 두 번째 트리거 «블록» 추가(command-sections.tsx — 원본 데모 관행 정합). 실측: 트리거 간 mouseout/mouseover 페어링 이동으로 전환 **0ms** 즉시 개방, 이전 카드는 120ms 내 닫힘(grace 대기 없음 — 새 트리거 개방이 기존 카드를 정리).
- **skipDelay 300ms 창 재진입**(AC-4 BLOCKED 해소): 닫힘 직후(도구 지연 제거 단일 in-page 스크립트) 같은 트리거 재진입 → 재개방 **0ms**(지연 200ms 재적용 안 됨 — skipDelayDuration 가드 실증).
- **chart fluid 회전 전이**(BLOCKED 해소): `apps/expo/android`은 prebuild 생성물(git 미추적)임을 확인 — 매니페스트 `android:screenOrientation`만 임시 `unspecified`로 수정 후 APK 재빌드·설치(git restore 불가 구조라 수동 원복). 에뮬레이터 `accelerometer_rotation 0` + `user_rotation 1`로 ROTATION_90 전환 → 스크린샷 1688×780에서 막대 5계열 전체 폭 재배치 확인(액티비티 재시작 없음 — configChanges orientation). 측정 후 user_rotation 0·accelerometer 1·매니페스트 portrait 원복 + portrait APK 재빌드·재설치(Success).

### 후속-4 네이티브 카드 키보드 탐색 한계 확정

RN 0.88.1 타입 전수 확인: `node_modules/react-native/types_generated/index.d.ts`·`types_DEPRECATED` 모두 `onKeyDown`·`onKeyUp` **0건** — ViewProps에 키 이벤트 부재. 로드맵·llms.txt «주요 한계»에 «RN 0.88 타입 부재 확인» 근거로 기록.

### 후속 게이트·문서

- 게이트: `bun run typecheck` exit 0 · `bun run audit:design` 9/9 PASS((g) 대상 124파일·허용 26건) · `cd apps/web && bun run build` exit 0.
- 문서: 레지스트리 수치 67→69 + lib 3 구성 표기 7곳(AGENTS.md 구조 트리·기준 표기, docs/install.md·install.en.md, README.md·README.ko.md, llms.txt, docs/roadmap-components.md) — AGENTS.md 트리에 `registry/lib/` 행 추가, install 2종에 lib 의존 자동 복사 안내 추가. roadmap-components.md 타입어헤드 해소·RN 0.88 근거 갱신, components.md select·dropdown·context 행에 탐색 표기, llms.txt «주요 한계» 타입어헤드 지원으로 정정.
- 잔여 유지: 모바일 웹 tap focus(BLOCKED — 도구 없음), nav-menu pointer grace intent 근사, navigation-menu 화살표키 트리거 순회, 네이티브 카드 탐색(후속-4 확정).
