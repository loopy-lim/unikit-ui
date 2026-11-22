# 이슈 #39 — M2-② 팝업 유형 슬라이스 (popover — createPopup 비공개 커널 계약)

에픽 [#35](https://github.com/loopy-lim/unikit-ui/issues/35)(«다 go» 로드맵) M2의 둘째 유형 ② 팝업 첫 슬라이스예요. M2-①([issue-37 문서](issue-37-m2-type1-press-slice.md))까지의 팩토리는 `createPrimitive` 공개 커널이었지만, 팝업 계열은 **`createPopup` 비공개 커널**이 스스로 `PrimitiveContext`를 조립해요(`api` getter가 `definition.api(context)` → popoverApiBody → controller). 그래서 이 슬라이스의 본질은 «커널 API를 제공하는 것»이 아니라 **커널이 스스로 부르는 SdkElement 표면·전역 스텁을 채우는 것**이에요. 날짜: 2026-11-23.

## 1. popover 슬롯·컨트롤러 실측(node_modules/@ui-sdk/core 0.1.0-beta.6 소스)

| 슬롯 | bind(popup-slots.js·popup-presets.js) | 이 슬라이스 검증 범위 |
|---|---|---|
| trigger | bindTrigger — adoptPlatform·shortcut 경유, aria-haspopup·aria-expanded·type=button 부여 | ✓ 프로브+기기 |
| content | bindPopupContent — attach(레이어·position)·titled/labelledby/describedby·role=dialog | ✓ 프로브+기기 |
| title | 바인딩 시 content의 aria-labelledby에 id 연결(titled 플래그) | ✓ |
| description | aria-describedby 연결 | ✓ |
| close | press → hide(close-press) | ✓ 프로브+기기 |
| arrow | placement arrow 계약 — position()이 left/top·data-side·data-arrow-clamped 기록 | ✓ (화살표 시각은 근사) |
| viewport | sheet 전용(모달 치수 슬롯) | 제외 — popover 미소비 |
| shortcut·backdrop | popover는 렌더 안 함(레이어 무대 뒤) | 제외 |

컨트롤러 api: `isOpen·setOpen·open·close·toggle`(close는 `{reason}` 청구 가능 — RN 바깥누름 소비 경로). 배치 옵션 기본값: side "bottom"·sideOffset 4·alignOffset 0·collisionPadding 8·**align "center"**(bindPopupContent가 placement.options에 주입 — P2 프로브의 start 아님).

## 2. 진입점 보강(behaviors/ui-sdk-renderer.ts)

1. **팝업 모드**(`setSdkElementPopupMode`) — 바인딩 요소가 «연결됨»으로 보고(`isConnected·checkVisibility`) createPopup의 요소 조회(`context.element·elements()`)와 layer bind 시작 조건이 성립. `getBoundingClientRect`는 **«스타일이 곧 위치»** web 의미로 position()이 쓴 left/top을 원점으로 환산(고정 rect 반환 시 추종마다 원점 누적 드리프트 — P3 실증).
2. **SdkStyle(observer)** — `setProperty`가 observer를 통지해요. RN 화면이 position()의 계산 결과를 구독하는 통로예요(속성 저장소의 data-side는 쓰기 순서 계약으로 같은 시점에 읽음).
3. **rect 캐시**(`setSdkRect`) — 화면이 `measureInWindow`(비동기)로 주입하면 position()이 동기 측정처럼 소비(FakeElement 패턴 — P2/P3 실증의 렌더러 이식).
4. **SdkDocument·SdkElement 멤버 다수** — `activeElement·getSelection`(focus/focusout), `querySelectorAll → []·contains → false·getRootNode·scrollTo·getClientRects`·client/offset 게터(lays·dismissal), `showPopover/hidePopover` no-op(presentation).
5. **바인딩 중 감시자 마스킹을 SilentObserver로** — moves.js가 `new MutationObserver`를 무가드로 생성해요(µObserver 아님 — 프로브에서 `undefined` 마스킹으로는 TypeError).

## 3. 프로브 (9) — 수치까지 경성 검사

`packages/unikit/scripts/ui-sdk-contract-probe.ts` (9): 전역 스텁 멤버별 설치(window의 `visualViewport:null·getComputedStyle`, document의 documentElement 390×844, MutationObserver no-op) → popover 인스턴스·전 슬롯 바인딩 → 개폐·속성·**position() 수치**(앵커 100,200·120×40 고정 → left `48px`(center 정렬 = 100+60−112)·top `244px`(200+40+4)·data-side bottom·`--available-height` `592px`(844−8−244)) → close press·api.setOpen·api.close({reason})·destroy. 검사 32건 추가(전체 107 OK).

**documentElement 경계(프로브가 발견)**: 선행 설치(installSdkAgentDom — 0×0)가 있으면 «미존재 시에만» 가드가 뷰포트를 못 고쳐 배치가 전부 플립/클램프돼요. 프로브는 무조건 교체, 기기 화면은 live getter(`Dimensions.get("window")`)로 교정해요 — 두 진입점 공존의 실제 경계예요.

## 4. 기기 실증(2026-11-23, 에뮬레이터 390×844dp headless)

- **개방**: trigger press → 커널 개방 → 콘텐츠 마운트 → rect 주입 → `popup.place()` 재계산. 판독 `left 84 · top 203.5 · side bottom · available 583.5 · style 쓰기 17회` — 자체검증: top = 트리거 하단 199.5 + sideOffset 4 ✓, left = 트리거 중심 195 − 콘텐츠 절반 112(center 정렬) ✓, available = 창 높이 795 − 패딩 8 − 203.5 ✓.
- **닫힘 2경로**: close 슬롯 press → `onOpenChange(false) 이유:close-press` ✓. 전면 Pressable(바깥누름) → `api.close({reason:"outside-press"})` → 로그 4라인(개방→close-press→재개방→outside-press) ✓.
- Metro·logcat 무오류. 같은 세션에 M2-① 커밋(6fc9095)의 uisdk-agent 화면도 기기 실증 완료(스냅샷 등록·2단계 act·사람 터치 source 판별 — 화면 주석 갱신).

## 5. 알려진 경계(v1)

- 콘텐츠 첫 배치는 rect 주입 전 0치수로 한 번 계산돼요 — onLayout류 주입 후 `place()`로 즉시 교정, 교정 전엔 투명 렌더(프로브 수치 검증이 최종 상태를 고정).
- ESC 닫힘·포커스 트랩·roving은 #19(키보드 modality 벽) 뒤 — 바깥누름도 문서 pointerdown 리스너가 RN에 없어 소비자 청구 계약(전면 Pressable)으로 둬요.
- 화살표 시각(rotate-45 박스)은 계약 기록(left offset·data-side)까지 정확, 시각 배치는 근사.
- registry.json·registry/ui 등록 없음(npm 전용 진입점 계열 — 계약 3, M0과 동일).

## 6. 산출물·검증

| 위치 | 내용 |
|---|---|
| `packages/unikit/scripts/ui-sdk-contract-probe.ts` | 섹션 (9) — 32검사(수치 포함). 구현에 앞서 먼저 작성(계약 1) |
| `packages/unikit/src/behaviors/ui-sdk-renderer.ts` | §2의 5종 계약 + SdkElement 타입 export |
| `apps/expo/app/uisdk-popover.tsx` | 참조 화면 — 트리거·배치 판독·close·바깥누름·화살표 |
| `apps/expo/app/index.tsx` | 목록 «실험» 진입 추가 |
| `apps/expo/app/uisdk-agent.tsx` | «기기 미검증» 주석 → 실증 기록 갱신 |

검증 게이트(2026-11-23): `bun run probe:ui-sdk` PASS(107검사) · 루트 `bun run typecheck` 전부 exit 0 · `bun run audit:design` 10/10 · 에뮬레이터 기기 실증(§4).
