# 이슈 #43 — 하드웨어 키보드 → 커널 직결(Android)

- 상태: 완료(커밋 참조) · «다 go» 하드웨어 키 마일스톤 Android 슬라이스
- 산출물: `sdkKeyHostProps`(렌더러 export) · 프로브 (15) 9검사 ·
  `apps/expo/app/uisdk-hwkeys.tsx`(전용 화면) · 이슈 #44(iOS 후속)
- 게이트: `probe:ui-sdk` **207검사 PASS**(198 + (15) 9검사) · 루트
  `typecheck` 7패키지 exit 0 · `audit:design` 10/10 · 에뮬레이터 기기 실증
  (플래그 on 빌드 2026-11-18, 클린 재시작)

## 무엇이 채워졌나

M2-④는 «화면 키패드의 합성 발송»만 증명했고, #19 스파이크(uisdk-keys)는
«브리지 View onKeyDown이 발화한다»까지 증명했어요. 사이의 빈 자리 —
**실제 하드웨어 키가 ui-sdk 커널(roving)까지 흐르는 끝** — 을 이 슬라이스가
잇는다.

```
하드웨어 키(DPAD/Enter)
  → ReactRootView → JSKeyDispatcher(focusedViewTag)   [RN 0.88, enableKeyEvents on]
  → 브리지 View onKeyDown(BridgeKeyEvent — W3C 규격 key·수정자)
  → sdkKeyHostProps.onKeyDown → fireSdkEvent(커널 keydown, target=실제 포커스 항목)
  → 커널(roving keydown → focusOn/포커스·select)
```

## 컨테이너 전략 (소유권 계약)

#19 스파이크 §2.2 실측: 항목을 각각 focusable로 두면 방향키를 JS 루빅과
네이티브 포커스 탐색이 함께 움직여 끝 항목에서 갈린다(preventDefault가 비동기
JS 발파라 네이티브 결정에 못 미침). 이 슬라이스의 계약:

- **목록 파트 하나만 focusable**(컨테이너), 항목 뷰는 `focusable={false}`.
  네이티브 탐색이 항목 사이를 움직일 대상이 없으므로 방향키 소유권이 커널
  roving에 단독으로 남는다. 항목 포커스는 가상 레지스트리(activeElement)로.
- **발송 target은 실제 포커스 항목 우선** — 웹 keydown의 event.target과 같은
  계약(커널이 `tab.el === event.target`으로 현재 항목을 찾음). tabs roving은
  remember:false라 stop이 선택을 따르고, 방향키는 activeElement만 옮긴다 —
  manual 활성화 화면에서 둘이 갈라지는 것이 관찰된다.
- **항목 활성화는 커널 keydown이 직접** — 파트 요소 태그가 "BUTTON"이
  아니라(UNKNOWN) 커널이 preventDefault 후 스스로 선택한다. native
  Enter→click 경로가 없어도 활성화가 성립한다(컨테이너는 Pressable이되
  onPress 없음).
- **그룹 경계**: 컨테이너 사이 방향키는 커널이 자기 축이 아닌 키를 무시하고,
  네이티브 탐색이 이웃 컨테이너로 실 포커스를 옮긴다. 이후 onFocus가 가상
  포커스를 새 그룹의 현재 항목으로 동기한다. «방향키로 컨트롤 사이 이동»
  이라는 안드로이드 관행과 같은 소유권 분할.

## 기기 실증(2026-11-23)

- DPAD_DOWN 첫 주입 → 탭 목록 컨테이너 포커스 + 가상 포커스 a 동기.
- DPAD_RIGHT → 포커스 b(value a 유지 — manual). ENTER → value «b» 이유
  item-press(커널 직접 선택).
- 그룹 경계 DOWN → tabs ArrowDown 무시(수평 목록) + 네이티브가 radio
  컨테이너로 이동 + radio onFocus 동기.
- radio DPAD_DOWN/UP → 값·포커스 동시 이동(list-navigation)·비활성 c
  건너뜀(랩). 경계 UP → radio 처리 후 네이티브가 tabs로 이동(다음 키는
  tabs가 수신 — 이벤트 로그로 확인).
- Metro·logcat 무오류.

## 발견 2건 (프로브가 못 잡은 것)

1. **MOVE_HOME/MOVE_END(122/123)는 RN 코어가 key "Unidentified"로 번역** —
   커널 도달 불가. #19 §1.1의 DPAD·Enter·Tab·Escape·CODE_MAP 번역표에
   MOVE_HOME/END가 없다는 뜻(하드웨어 Home/End는 안드로이드에서 이 경로로
   못 쓴다 — v1 경계). 화면 키패드·프로브 합성 발송은 무관.
2. **tabs manual에서 stop과 포커스가 갈라진다** — roving이 remember:false라
   방향키는 activeElement만 옮기고 stop은 선택을 따른다(프로브 (15)이 이
   계약을 고정). 발송 target을 stop이 아니라 «실제 포커스 항목 우선»으로
   짜야 커널이 올은 항목을 찾는다 — 화면·프로브 모두 이 규칙.

## v1 경계

- iOS는 브리지 계약 부재(#19 §1.3) — 별도 마일스톤(이슈 #44, Mac 필요).
- dialog Escape 하드웨어 경로는 이번 범위 밖(창 발송 변형 — 수요 시 화면
  추가).
- 컨테이너 전략은 roving 계열에 대한 소유권 계약 — 제스처(슬라이더)·폼
  계열의 하드웨어 키 소비는 각 패밀리 화면에서 별도 실증 필요.
