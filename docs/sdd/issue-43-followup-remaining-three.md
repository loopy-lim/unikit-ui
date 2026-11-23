# 이슈 #43 후속 — «다 go» 잔여 3건(재조사 확정)

- 상태: 완료 · «다 go» 로드맵(에픽 #35) 재조사로 확정된 이 머신 가능 잔여
  슬라이스(#44 iOS는 Mac 대기로 연기)
- 대상: ① menubar 트리거 포커스 하이라이트(사이클 79 결함) ② input-group
  그룹 포커스 링(사이클 72 G3 F-1) ③ hwkeys 화면 slider·dialog 하드웨어
  섹션 + 프로브 (15) 보강
- 게이트: `probe:ui-sdk` **208검사 PASS**(207 + Escape 창 도달 1검사) · 루트
  `typecheck` 전 패키지 exit 0 · `audit:design` 10/10 · 에뮬레이터 기기 실증
  (클린 재시작 2회 반복)

## ① menubar 포커스 하이라이트

`packages/unikit/src/components/menubar.tsx` — MenubarTrigger가
`onFocus/onBlur`로 `useState(false)`를 유지하고 `nativeFocused = focused &&
Platform.OS !== "web"`일 때 트리거 `bg-accent`·라벨
`text-accent-foreground`를 입는다. 웹은 상태를 쓰지 않고 기존
`web:focus-visible:` CSS를 그대로 둔다 — 마우스 클릭 포커스와 키보드
포커스를 구분하는 건 CSS가 정답이고, 네이티브는 DPAD/하드웨어 포커스에만
발화하는 onFocus 상태가 정답이라는 분기(터치 모드 Pressable은 포커스를
갖지 않으므로 터치 오염이 없다).

기기 실증: 쇼케이스 Menubar 상세 화면에서 DPAD로 «편집» 트리거 포커스 —
트리거 밴드 273 표본 중 252 화소 변화, 평균색 (205,205,206)=accent 배경.

## ② input-group 그룹 포커스 링

`packages/unikit/src/components/input-group.tsx` — 원본 웹의
`:focus-within`(그룹이 `ring-1 ring-ring`)을 context 상태로 이식했다.
`InputGroupContextValue`에 `setFocused`를 추가해 그룹이 소유하고,
InputGroupInput·Textarea가 `onFocus/onBlur`에서 보고한다. 컨트롤 자체의
슬림 `focus:ring-1` 근사는 제거(이중 링 방지). 웹·네이티브가 같은 경로를
쓴다.

기기 실증: 쇼케이스 InputGroup 상세 화면에서 DPAD로 «unikit.dev» 입력
포커스 — 그룹 밴드 13,902 표본 중 2,165 화소 변화, 상·하 가장자리에
링 테두리(각 1,635 dark 화소).

## ③ hwkeys slider·dialog 하드웨어 섹션

`apps/expo/app/uisdk-hwkeys.tsx`에 두 섹션을 추가했다.

- **slider**: 컨테이너를 Pressable(plain View는 네이티브 DPAD 탐색에서
  제외 — tabs/radio와 동일 계열)으로 두고, thumb-input 파트 요소로
  keydown을 발송한다. 판독은 `value «n» · ↓key`.
- **dialog**: 터치/Enter 개방 트리거 + 네이티브 `Modal` 창(오버레이가
  스크롤 콘텐츠에 갇히지 않고 하드웨어 키가 이 창의 포커스로 흐른다).
  콘텐츠 서브트리는 열림 동안만 마운트(수명 계약). 콘텐츠 컨테이너가
  host props로 Escape를 커널(layers 창 캡처)로 흘리고, 안드로이드
  뒤로가기(onRequestClose)도 같은 Escape 발송 경로를 탄다.

### reactCompiler 발견 — 커널 상태 직독 캐시

이 화면 디버깅 중 구조적 발견: `apps/expo/app.json`의
`"reactCompiler": true` 환경에서 **컴파일러가 컴포넌트를 자동 메모**한다.
`instance.get()` 직독은 컴파일러 눈에 보이지 않는 외부 가변 상태라 캐시되고,
옵션 콜백(onValueChange/onOpenChange)도 메모이즈된 클로저로 남아
커널→React 갱신이 유실된다(커널 상태는 변하는데 화면이 안 바뀌는
스플릿브레인). 렌더 본문의 부수효과(ref.current 증가·console.log)가
우연히 메모이즈를 무효화해 «계측하면 고쳐진다»는 미괴적 재현을 보였다.

**수정**: 값·open 렌더를 `React.useSyncExternalStore(instance.subscribe,
() => instance.get()…)`로 읽는다 — 컴파일러가 아는 구독 경로라 캐시되지
않는다(탭·라디오 목록의 파트 구독이 안정적이었던 것과 같은 성격).
옵션 콜백 의존을 제거하고 커널을 단일 진실로 둔다.

또 하나의 실측: Fabric 키 이벤트 핸들러 안에서 커널로 **동기** 발송하면
변경→콜백 전파가 유실되는 레이스가 계측 없이도 재현된다(슬라이더·다이얼로그
— 탭·라디오의 같은 동기 경로는 무사). 화면 단 해법으로 `sendKeyPair`
헬퍼가 keydown·keyup 한 쌍을 `queueMicrotask`로 미뤄 발송한다(파트의
`fire`는 호출 시점의 바인딩 요소를 읽는다).

기기 실증(클린 재시작 2회, 전 항목 재현):
- 슬라이더: DPAD 진출 후 ArrowRight×2 → «52», ArrowLeft로 감소 → «51»
  — step-key 양방향, thumb 위치까지 네이티브 페인트 반영.
- 다이얼로그: DPAD로 트리거 진입 → Enter → 모달 열림(«모달 제목» 노드
  출현) → Escape(111) → 닫힘(노드 소멸). 트리거 Enter는 네이티브
  클릭(Pressable onPress) 경로만 활성화한다 — 커널 keydown으로도 보내면
  이중 활성화로 열렸다 곧바로 닫힌다.

### 프로브 (15) 보강

`packages/unikit/scripts/ui-sdk-contract-probe.ts` — «요소 keydown
Escape → 창 도달(발송 요소 불문 — layers 캡처 전제)» 검사 추가. 프로브
합계 **208검사**.

## 잔여

- #44 iOS 하드웨어 키보드 — Mac 대기(사용자 차기 세션).
- `sendKeyPair`의 마이크로태스크 분리는 화면 단 계약 — 커널/렌더러 단
  규명(동기 발송에서 콜백 유실의 정확한 소유 경계)은 별도 조사 과제.
