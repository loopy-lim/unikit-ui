# SDD — M2-④⑤⑥ 키·포커스·제스처·modality 유형 (이슈 #41)

에픽 #35 «다 go» 로드맵의 M2 셋째 조각. 이전 슬라이스(#37 press·#39 popup·#40 form)이
깔아둔 렌더러 위에, «문서·창 리스너가 필요한 마지막 커널 계열»을 구동해요.

## 배경 — #19 «문서 벽»의 최종 하강

- roving(`createRovingFocus`)은 항목 요소의 focus/blur 리스너와 `ownerDocument.activeElement`로 stop을 추적해요.
- slider 드래그(`bindDrag`)는 문서 pointermove/pointerup/pointercancel 리스너와 창 rAF로 추적해요.
- dialog(layers)는 창 pointerdown/click/keydown 캡처 리스너로 바깥누름·Escape를 다뤄요.

`installSdkEventGlobals()`(M2-③에서 확립)가 문서·창을 실 이벤트 대상(SdkEventTarget)으로
깔면서 세 계열 전부가 성립했어요. `layers.js`의 `listenIn(doc)`은 `doc.defaultView`가 없으면
no-op이었어요 — 창이 문서에 연결되는 것이 이 슬라이스의 전제예요.

## 커널 실측 계약 (프로브 (11)(12)(13) — 193 검사)

### (11) M2-④ roving
| 요구 | 실측 |
|---|---|
| tabs 바인딩 후 stop = 선택 탭 | stop «a» (roving.check) |
| tabindex roving | 선택/stop 탭 0, 나머지 −1 |
| 문서 순서 | compareDocumentPosition(a→b 뒤따름) |
| list keydown ArrowRight(target a) | preventDefault·value b·stop b·onValueChange(b, list-navigation) |
| 가상 포커스 | document.activeElement === tab b 요소 |
| tab press(click) | value b(item-press)·preventDefault false |
| 비활성 tab press | preventDefault·값 유지 |
| Home(target c) | value a·포커스 a·preventDefault |
| radio ArrowDown | value b·stop b·포커스 b(list-navigation) |

### (12) M2-⑤ slider
| 요구 | 실측 |
|---|---|
| 8슬롯 bind | root·control·track·indicator·thumb·thumb-input(id «0» 계약)·value·input 무예외 |
| control pointerdown(x=100/200) | value 50(track-press)·preventDefault |
| document pointermove(rAF flush) | 값 추적(drag) |
| document pointerup | onValueCommit(drag)·같은 틱 click 삼킴(swallowNextClick) |
| pointercancel | 종료·commit |
| thumb-input keydown ArrowRight | step-key + commit |

### (13) M2-⑥ dialog
| 요구 | 실측 |
|---|---|
| 터치 개방(문서 pointerdown → trigger click) | open·초점 계획 «popup» → 콘텐츠 포커스 |
| 스크롤 잠금 | documentElement.style overflow hidden·--scrollbar-width 0px |
| content attrs | role=dialog·aria-modal=true·aria-labelledby/describedby |
| Tab 트랩(tabbable 없음) | 콘텐츠 유지·preventDefault |
| Escape(close keydown 버블) | 닫힘(escape-key)·preventDefault |
| 잠금 수명 | 닫힘 직후 유지 → 콘텐츠 언마운트에 해제(웹 exit 수명과 동일) |
| 바깥누름(터치) | pointerdown 대기 → click 10px 이내에서 outside-press·소비 |
| 안쪽 누름(close — parentElement 체인) | contains → 유지 → click close-press |
| 바깥누름(마우스) | pointerdown 소비(지연) → pointerup에서 outside-press |
| 비모달(modal false) | 잠금 없음·aria-modal 없음 |

## 기기 발견 계약 (프로브가 못 잡은 것 — 전부 화면에 반영)

1. **판독 정착 시차**: value·stop 같은 파생 상태는 커널 변경이 마이크로태스크로 흘러요.
   즉시 판독은 stale(null)이 뜨고, tabindex·document.activeElement는 동기라 즉시 움직여요.
   검증 화면의 판독은 지연/폴링으로 읽어야 해요(tabs «stop null · 포커스 tab b» 실측).
2. **End 키와 비활성 항목**: roving의 focusables는 disabled 포함 전 항목이라 End가 비활성
   탭에 «포커스는 옮기고», tabs/radio 층의 select가 enabled만 허용해 «활성화는 차단»해요.
   프로브는 활성 대상만 걸었고, 기기가 비활성 분기를 밝혔어요(커널 충실 동작).
3. **PanResponder 클로저**: PanResponder는 한 번만 만들어져요 — 첫 렌더의 파츠
   클로저(sdkElement null)를 얼으면 누름이 실종돼요(grant el=false 실측). 최신 파츠
   ref(`latest.current = {control}`)를 읽는 것이 소비자 계약이에요.
4. **오버레이 좌표 기준**: `absolute inset-0` 오버레이는 «남은 높이를 차지하는 컨테이너»
   직속이어야 전체 화면을 덮어요. auto 높이 스택 안의 flex-1(flex-basis 0)은 0으로 붕괴하고,
   inset-0도 카드 영역만 덮어 바깥누름이 실종돼요(뒷면 bounds 실측). 화면 루트에
   `mt-6 flex-1` 컨테이너를 두고 그 안에 오버레이를 뒀어요.
5. **bridge Pressable 좌표**: onPress가 이벤트를 주지 않아요 — 창 이벤트의 좌표는 고정값을
   써도 계약이 보존돼요(좌표는 pointerdown↔click 10px 근접·스크롤바 브랜드 판정에만 쓰이고
   안/밖은 target의 요소 연결로 정해짐 — 프로브 (13) 실측).

## 참조 화면 (apps/expo/app/)

- `uisdk-roving.tsx` — tabs(4탭+3패널·비활성 d) + radio(3항목·비활성 c). 키 패드가
  `fireSdkEvent(list, "keydown", {key, target: stop 요소})` 커널 계약 그대로 발송.
- `uisdk-slider.tsx` — PanResponder grant/move/release → control pointerdown·document
  pointermove/pointerup(+같은 틱 click)·pointercancel. 트랙 rect는 measureInWindow →
  setSdkRect(M2-② 캐시 패턴). 키 스텝은 thumb-input keydown/keyup.
- `uisdk-dialog.tsx` — 터치 개방(문서 pointerdown→trigger click), 뒷면 press → 창
  pointerdown+click(바깥누름), close press → 창 pointerdown/up(마우스·안쪽)+click.
  ContentTree는 열림 동안만 마운트(웹 수명). 안쪽 슬롯 parentElement 연결(composedHops).

## 게이트

- `cd packages/unikit && bun run probe:ui-sdk` — **PASS(193 검사)**
- 루트 `bun run typecheck` — 6패키지 exit 0
- `bun run audit:design` — 10/10
- 기기 실증(2026-11-23, 에뮬레이터 390×844dp, 클린 재시작 기준):
  - roving: → tabindex roving·value b(list-navigation)·«tab b» 포커스, Home, End→비활성
    포커스만, press item-press, radio ↓ 값·포커스 동시 — Metro·logcat 무오류
  - slider: 누름 50 track-press·commit, 드래그 89→91→93(drag)·commit, 스텝 94/95(step-key)
  - dialog: 개방 초점 «콘텐츠»·잠금 hidden, Tab 트랩, Escape(escape-key)·해제·returnFocus,
    바깥누름(outside-press), close-press

## v1 경계

- 하드웨어 키보드(DPAD) 경로는 #19 스파이크(uisdk-keys) 영역 — 이 화면들은 커널 계약 발송만.
- inert는 정직한 no-op(프로브 명시). position 기반 팝업 배치는 M2-②(#39) 영역.
- Fast Refresh는 클래스 인스턴스를 못 갱신 — 렌더러·커널 변경 후 기기 검증은 완전 재시작 관례.
