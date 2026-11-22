# Issue #19: 키보드·모달리티 벽 — 하드웨어 키 경로 재실측·계약·대체 UX

- **관련 이슈**: [#19](https://github.com/loopy-lim/unikit-ui/issues/19) (상위 에픽 [#11](https://github.com/loopy-lim/unikit-ui/issues/11)) · 선행 실측: docs/sdd/100 §7 «남은 진짜 벽» · 브리지 계약: `packages/unikit/src/bridge/types.ts`
- **기준일**: 2026-11-18 (기준 커밋 `ce17999` = main)
- **판정**: **벽의 정체가 바뀌었다.** «RN에 View 키 계약이 없다»가 아니라 «계약은 있으나 **기본 off 피처 플래그** 뒤에 숨어 있다». 브리지는 Android View/Pressable `onKeyDown`+`focusable` 계약을 **도입**(정방향 — 플래그를 켠 앱에서 즉시 발화, 안 켠 앱에서 무해한 no-op)하고, 소프트 키보드 UX는 터치 1차+Enter 네이티브 클릭 경로로 확정. iOS·전역(document) 수준은 여전히 진짜 벽이라 폐기 유지.

## 1. 조사 — 하드웨어 키보드 경로 (체크박스 1)

전부 이 저장소가 링크하는 아티팩트 기준 실측이에요: JS·Kotlin 소스는 `node_modules/react-native` 0.88.1, 네이티브 바이너리는 gradle 캐시의 `react-android-0.88.0-debug.aar`(javap로 실제 시그니처 확인).

### 1.1 Android — 계약은 존재한다, 그러나 3중 잠금

**계약(공개)**: `ViewPropTypes`의 `onKeyDown`/`onKeyUp`(W3C KeyboardEvent 규격 — `BaseViewConfig.android.js`가 `topKeyDown`/`topKeyUp` 등록). DPAD는 `KeyEvent.kt`의 매핑표가 `ArrowUp/Down/Left/Right`로 번역하고, Enter·Tab·Escape·CODE_MAP·수정자(ctrl/alt/meta/shift)도 네이티브 실측값으로 온다.

**발화 경로(브리지리스/new arch)**: `ReactSurfaceView`는 `ReactRootView`를 상속하고, `ReactRootView.dispatchKeyEvent`가 (캡처 단계로) `dispatchJSKeyEvent`를 호출 → `JSKeyDispatcher.handleKeyEvent`가 `KeyDownEvent(surfaceId, focusedViewTag, event)`를 **현재 포커스된 뷰 태그로** 발파한다(`JSKeyDispatcher.kt:27-56`). 포커스 태그는 `requestChildFocus`/`onFocusChanged`에서 등록된다(`ReactSurfaceView.kt:218-242`).

**잠금 3개(실측 순서)**:

1. **대상 뷰가 focusable+포커스 상태**일 것 — `focusable` prop → `View.setFocusable`. 이건 브리지가 통과시킨다(§3).
2. **`ReactNativeFeatureFlags.enableKeyEvents()`가 true일 것** — `ReactSurfaceView.init`이 이 플래그에서만 `JSKeyDispatcher`를 생성하고(`ReactSurfaceView.kt:75-77`), false면 `dispatchJSKeyEvent`가 **경고 로그조차 없이 조용히 반환**한다(`ReactSurfaceView.kt:200-203`).
3. **피처 플래그 기본값이 false** — `ReactNativeFeatureFlagsDefaults.h:172`·Kotlin `ReactNativeFeatureFlagsDefaults.kt:96` 둘 다 `false`. 게다가 releaseLevel별 provider(Stable/Canary/Experimental)는 **전부 이 Defaults의 빈 서브클래스**라 어느 레벨에서도 켜지지 않는다(`ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android.kt` — override 0건, javap 확인).

**기기 실측(플래그 off, 스파이크 화면 §2)**: DPAD 3회·문자 A·SHIFT·ENTER 주입 — 네이티브 포커스는 정상 이동(onFocus/onBlur·시각 상태 갱신 확인), ENTER는 포커스된 항목을 **onPress 경로로 선택**했지만(안드로이드가 clickable 뷰의 Enter를 클릭으로 처리), **JS onKeyDown은 대상 레벨·조상 레벨 모두 0건**. 플래그가 꺼진 앱에서 이 계약은 어떤 소비자 코드로도 점화할 수 없다.

### 1.2 플래그를 켜는 방법 — 공개 경로가 없다 (실측 4실수)

`ReactNativeFeatureFlags.override(provider)`는 **런타임 초기화 전 1회만** 허용된다(`ReactNativeFeatureFlagsAccessor.cpp:1602` «Feature flags cannot be overridden more than once»). Expo 템플릿 앱이 이 슬롯을 채우려 한 시도와 결과:

| 시도 | 결과(전부 기기 실측) |
|---|---|
| `loadReactNative` **앞에** override | `loadReactNative` → `DefaultNewArchitectureEntryPoint.load`가 두 번째 override로 `RuntimeException`(스택: `DefaultNewArchitectureEntryPoint.kt:101`) |
| `loadReactNative` **뒤에** `dangerouslyReset()`+재override(베이스 `ReactNativeFeatureFlagsDefaults`) | 부팅은 되나 expo 런타임 파괴 — 레드박스 «[runtime not ready] TypeError: Cannot read property 'EventEmitter' of undefined»(Metro 캐시 초기화·재시작에도 지속). 원인은 reset이 아니라 **잘못된 베이스**(아래 7번)로 판명 |
| `SoLoader.init` 없이 override 선행 | `ExceptionInInitializerError` ← `SoLoader.init() not yet called`(플래그 접근자 클래스 초기화가 SoLoader 요구) |
| 순정(아무것도 안 함) | 정상 부팅 — 키 이벤트 0건(A/B 대조) |

**작동한 유일한 경로(스파이크 채택)**: `loadReactNative(this)`를 대체하고 internal `loadWithFeatureFlags`를 리플렉션으로 호출한다. 이 경로의 추가 시행착오(전부 기기 실측):

5. `getDeclaredMethod("loadWithFeatureFlags", …)` → `NoSuchMethodException` — Kotlin internal 함수는 모듈 접미사로 맹글링된다: 실제 이름은 `loadWithFeatureFlags$ReactAndroid`(AAR javap 실측).
6. 맹글링 수정 + `SoLoader.init` 없이 → `ExceptionInInitializerError`(§1.2 표의 3번과 같은 SoLoader 선행 조건 — `loadWithFeatureFlags`가 override를 먼저 하고 SoLoader는 나중에 부른다).
7. provider 베이스를 `ReactNativeFeatureFlagsDefaults`로 쓰면 **부팅 후 expo 런타임 파괴** — RNOSS_Stable의 실제 베이스는 `ReactNativeNewArchitectureFeatureFlagsDefaults`(이것이 `useNativeViewConfigsInBridgelessMode`·`useTurboModuleInterop`을 true로 뒤집는다). 이 둘이 false로 내려앉으면 expo 네이티브 모듈이 설치되지 않아 «[runtime not ready] Cannot read property 'EventEmitter' of undefined» 레드박스. **베이스를 같은 NewArchitecture 계열로 고치니 해결.**
8. `loadReactNative`(dex 역어셈블 실측)은 `SoLoader.init` + `load()` 외에 `WindowUtilKt.setEdgeToEdgeFeatureFlagOn()`도 호출한다 — 이것도 AAR에서 internal이라 리플렉션으로 재현.

최종 작동 코드(`apps/expo/android/.../MainApplication.kt`):

```kotlin
SoLoader.init(this, OpenSourceMergedSoMapping)
val method = DefaultNewArchitectureEntryPoint::class.java
  .getDeclaredMethod("loadWithFeatureFlags\$ReactAndroid",  // internal 맹글링
    ReactNativeFeatureFlagsProvider::class.java)
method.isAccessible = true
method.invoke(null, object : ReactNativeNewArchitectureFeatureFlagsDefaults() {
  override fun enableKeyEvents(): Boolean = true
})
// + WindowUtilKt.setEdgeToEdgeFeatureFlagOn() 리플렉션 호출(loadReactNative 재현)
```

실패 정책: 리플렉션 실패는 `IllegalStateException` 재throw로 **부팅 크래시**로 드러난다 — internal 맹글링 이름(`loadWithFeatureFlags$ReactAndroid`)은 RN 마이너 업그레이드에서 바뀔 수 있어, 조용히 플래그 없이 구동되는 것보다 크게 실패하는 편이 스파이크의 의도다. 이 레시피를 소비자 문서로 채택할 때는 폴백(실패 시 일반 `loadReactNative` 경로 복귀 — 키 이벤트 없이 앱은 동작)으로 완화할지 재검토한다.

부팅 검증: FATAL 0건 · ReactNativeJS «runtime not ready» 0건 · 번들 4089모듈 정상 로드. **소비자 관점 결론: RN 0.88은 표준 템플릿 앱이 합법적으로 이 플래그를 켤 공개 API를 제공하지 않는다** — internal 리플렉션 아니면 RN 소스 빌드뿐. 업스트림에 «공개 설정 경로 요청» 이슈를 남길 가치가 있다(§5).

### 1.3 iOS — 계약 자체가 없다 (변경 없음)

`BaseViewConfig.ios.js`는 `topKeyPress`뿐이고 일반 View의 keydown/keyup 등록이 없다(G1 실측 재확인). `UIResponder.pressesBegan` 네이티브 모듈을 직접 만들어야 해서 브리지 폐기 판정 유지 — 이건 «플래그 문제»가 아니라 «계약 부재»라 질적으로 다른 벽이다.

### 1.4 전역(document) 수준 — 양 플랫폼 다 없다 (변경 없음)

`@ui-sdk/core` `modality.js`는 `document` 캡티처 리스너(keydown/pointerdown/touchstart·window blur)를 요구한다. RN에는 document가 없고 이를 대체할 «현재 화면의 모든 키를 포착하는» 계약도 없다(§1.1의 발화는 어디까지나 «포커스된 focusable 뷰» 대상). **modality는 웹 전용 유지** — #18 A 판정(층 1 헬퍼+position 경계, 층 3 웹 전용)과 정합.

## 2. 기기 스파이크 — uisdk-keys (플래그 off/on 대조)

산출: `apps/expo/app/uisdk-keys.tsx`(목록 «실험» 섹션 진입 추가). 3개 `focusable` Pressable 항목 + 조상 카드 View `onKeyDown`(메뉴 카드 패턴)으로 측정한다:

- **이벤트 모양**: `key`·수정자 4종(c/a/m/s 플래그)·`toSdkKeyEvent`→`isTypeaheadKey` 통과 판정을 로그(최근 6건).
- **루빙**: ArrowDown/Up → `preventDefault`+`BridgePressableRef.focus()` 이동(이중 이동 여부가 채점 대상 — DPAD의 네이티브 포커스 탐색과 JS 루빙이 겹치는가).
- **선택**: Enter/Space → `preventDefault`+선택 기록.

### 2.1 플래그 off (기본 상태)

§1.1 실측 그대로: 네이티브 포커스 이동·onFocus/onBlur·Enter→onPress 선택은 작동, **JS 키 이벤트 0건**. 프로그래밍 `focus()`(터치 모드에서 버튼으로 호출)도 포커스를 주지 못했다 — 터치 모드의 안드로이드 제약(터치는 focusableInTouchMode가 아니면 포커스를 안 줌). DPAD 주입으로는 아무 문제 없이 첫 focusable에 포커스가 잡힌다(3회 주입 → 3번째 항목 도달 실측).

### 2.2 플래그 on (MainApplication 리플렉션 빌드)

에뮬레이터 하드웨어 키 주입(`adb shell input keyevent` — DPAD 20·A 29·ENTER 66)으로 전 사슬 실증:

- **발화(대상+조상 버블링)**: DPAD 주입에 `key="ArrowDown"`이 **대상 레벨(`[item]`)과 조상 카드 레벨에서 동시 수신** — ReactRootView가 발파한 topKeyDown이 포커스된 뷰에서 조상으로 버블링된다. 메뉴 카드 패턴(menu-nav의 카드 onKeyDown 설계)이 네이티브에서 그대로 성립한다.
- **이벤트 모양**: `key="a" c0 a0 m0 s0` — W3C 규격 그대로(소문자 key, 수정자 4종 불리언). TextInput onKeyPress의 시프트 근사(대문자 + shiftKey 추정)와 다른 진짜 값이다.
- **ui-sdk 헬퍼 통과**: `toSdkKeyEvent(event)` → `isTypeaheadKey`가 `key="a"`에서 **true**, Arrow/Enter에서 **false** — 실측 네이티브 이벤트가 헬퍼 계약을 통과한다.
- **Enter 선택**: `key="Enter"` 수신 + 포커스된 항목(gamma)이 «마지막 선택»에 기록. JS 핸들러와 안드로이드 네이티브의 clickable-Enter→클릭 경로 둘 다 작동(동일 항목이라 구분 불필요).
- **DPAD 루빙 간섭(채점 대상 — 실측)**: JS 루빙(`preventDefault`+`focus()`)과 안드로이드 네이티브 포커스 탐색이 **같은 키에 둘 다 반응**한다. `preventDefault`는 비동기 JS 발파라 네이티브 탐색 결정에 도달하지 못하고, 순 방향 이동에서는 둘이 수렴하지만 **끝 항목에서 갈린다** — gamma에서 ArrowDown 시 JS 루빙은 랩(0번 항목)을, 네이티브 탐색은 인접 이동(위 방향 반대 사례에서 beta)을 골라 최종 착지가 예상과 어긋나는 경우를 관측. **제품 설계 시사: 플래그 on 안드로이드에서 방향키 루빙의 소유권을 JS가 독점할 수 없으니, 방향키는 네이티브 탐색에 맡기고(인접 이동·비랩) JS 카드 핸들러는 Enter/Escape/타입어헤드만 소유하는 것이 안정적이다.** 양 끝 랩 계약이 필요하면 onFocus 추적으로 랩만 보정하는 방향(menu-nav 네이티브 통합 이슈에서 재설계).

### 2.3 플래그 on 상태의 부팅·안정성

§1.2 최종 레시피로 부팅 1회 실증(FATAL 0·«runtime not ready» 0 — 이전 4번의 실패 빌드와 대조). Metro 캐시 초기화(`--reset-cache`)·역방향 포트(8081) 순서를 지키면 재현 안정. 덤으로 증분 빌드 함정 1건 학습: 네이티브 소스 수정이 kotlin 증분 컴파일에 반영 안 된 채 낡은 dex가 나올 수 있다 — 산출물(dexdump/strings) 검증 후 설치할 것.

## 3. 최소 계약 — 브리지 반영 (체크박스 3)

- `bridge/types.ts`: `ViewProps`·`PressableProps`에 `focusable?: boolean` 추가(웹 tabIndex 0/−1 치환, Android View focusable, iOS는 RN 계약 부재로 무시) · `onKeyDown` 문서를 새 판정으로 갱신(Android는 RN 0.88 W3C 규격 View onKeyDown에 연결하되 플래그 전제 명시, iOS 폐기 유지) · `BridgeKeyEvent` 헤더에 Android 경로 명시.
- `bridge/native.tsx`: `toBridgeKeyEvent`(네이티브 합성 이벤트 → 공통 형태, 수정자 실측값 통과) + `androidKeyDown` 래퍼(Platform 게이트 — iOS는 폐기). View·Pressable에 `onKeyDown`·`focusable` 연결.
- `bridge/web.tsx`: `focusable` → `tabIndex` 치환. `onKeyDown`은 DOM 표준명이라 rest 그대로 흐른다.
- **정방향 설계**: 플래그가 꺼진 앱에서 이 계약은 아무 일도 안 한다(이벤트가 안 오고 prop은 네이티브 포커스 가능 설정으로만 기여). 켠 앱에서는 별도 재빌드 없이 바로 발화한다.
- `src/lib/menu-nav.tsx`(및 registry 사본) 머리 주석: 낡은 «네이티브 View는 onKeyDown을 폐기한다» 기술을 2026-11-18 재실측 판정(플래그 벽·iOS 부재·루빙 웹 전용 유지)으로 갱신.

## 4. 소프트 키보드 대체 UX 설계 (체크박스 2)

- **전제**: 소프트 키보드에 방향키가 없다(IME는 문자·Enter·백스페이스만). 하드웨어 키보드·DPAD 보유자에게만 키 탐색이 의미 있다.
- **1차 UX는 터치**: 항목 Pressable onPress가 선택 경로(웹 마우스와 대칭). Enter 선택은 플래그와 무관하게 안드로이드 네이티브가 clickable 뷰의 Enter를 클릭으로 처리해 이미 작동한다(§2.1 실측).
- **방향키 루빙(플래그 on 앱)**: §2.2 실측의 카드 패턴 — 조상 View onKeyDown이 자손 포커스에서 버블링 수신(발화 대상이 «포커스된 뷰»이므로 메뉴 카드 패턴이 정합). 제품 통합은 menu-nav 네이티브 로드맵으로 별개 이슈.
- **모달리티(모달 열림 차단·Escape 닫기)**: ui-sdk modality(document 캡처)는 웹 전용(§1.4). RN은 컴포넌트별 대체 — 오버레이는 이미 AnchoredOverlay의 포커스 이동·백드롭이 담당하고, 하드웨어 Escape는 플래그 on 계약의 `key === "Escape"`를 컴포넌트 onKeyDown에서 처리하는 방향(제품 수요 발생 시).
- **iOS**: §1.3 벽 그대로 — 터치 1차 UX만 제공하고 키 탐색은 웹 전용으로 안내.

## 5. 판정·재평가 조건

- **브리지 계약 도입 go**(§3 — 비용은 타입·매핑 몇 줄, 플래그 off 앱에서 무해).
- **menu-nav 네이티브 루빙 통합은 별도 이슈**(이 슬라이스 범위 밖 — 소비자 앱이 플래그를 켜지 않으면 죽은 코드가 되므로, «플래그 켠 소비자»가 실제로 생길 때 함께 간다).
- **재평가 트리거**: ① RN이 `enableKeyEvents` 공개 설정 경로(또는 기본 on 전환)를 내놓으면 §1.2의 리플렉션 경로 철회 + 소비자 문서 갱신. ② iOS 코어에 View 키 계약이 생기면 §1.3 폐기 판정 재실측. ③ ~~업스트림 리포지터리에 이 갭(표준 템플릿에서 켤 방법 없음)을 이슈로 남길 것~~ — **2026-11-22 철회(사용자 결정: 업스트림 제기 전면 금지)**. §5의 «남길 가치가 있다»도 같은 결정으로 만료.

## 6. 산출물·검증 기록

- 코드: `packages/unikit/src/bridge/{types,native,web}.tsx·.ts`(계약) · `packages/unikit/src/lib/menu-nav.tsx`+`registry/lib/menu-nav.tsx`(머리 주석) · `apps/expo/app/uisdk-keys.tsx`(스파이크 화면) · `apps/expo/app/index.tsx`(«실험» 진입) · `apps/expo/android/.../MainApplication.kt`(플래그 on 스파이크 — §1.2).
- 검증: 루트 `bun run typecheck` 전부 exit 0 · `bun run audit:design` 10/10 PASS(2026-11-18) · 기기(emulator-5554, Metro 8081, 개발 클라이언트) §2 실측.
- 이슈 #19 체크박스: 하드웨어 경로 조사(§1)·소프트 키보드 대체 UX 설계(§4)·최소 계약 초안(§3) 전부 대응.
