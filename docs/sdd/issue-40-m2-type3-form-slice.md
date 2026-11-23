# 이슈 #40 — M2-③ 입력·폼 유형 슬라이스 (field·input — ElementInternals 등가 표면)

에픽 [#35](https://github.com/loopy-lim/unikit-ui/issues/35)(«다 go» 로드맵) M2의 셋째 유형 ③ 입력·폼 첫 슬라이스예요. 폼 계열 12종(checkbox·color-picker·combobox·date-input·date-picker·field·file-input·listbox·number-input·radio·select·slider)이 공유하는 `attachFormInternals` 계열 바인딩을, 슬라이스 대표 field(5슬롯)·input(root 1슬롯)로 검증했어요. 날짜: 2026-11-23.

## 1. 커널 실측 — ElementInternals는 직접 요구하지 않는다

`attachFormInternals`는 WeakMap 조회예요 — 인터내als가 없으면 «일반 요소»로 조용히 통과. RN 렌더러가 실제로 채워야 한 것은 네 가지:

| 요구 | 커널 소비 지점 | 렌더러 진입점 |
|---|---|---|
| ① HTML* 브랜드 글로벌(instanceof) | field adopt()의 `instanceof HTMLButtonElement` 등 검사 | `installSdkFormGlobals()` — 9종 브랜드 + Node + Event(SdkEvent), «미존재 시에만» 가드 |
| ② value 프로토타입 접근자 | watchValue intercept·writeValue asUser | SdkElement `#value` 프로토타입 getter/setter — 인스턴스 필드면 own 서술자가 intercept 경로를 죽임 |
| ③ 요소 이벤트 레지스트리 | `on(el, "input")` → typed·compositionend | 실동작 addEventListener/removeEventListener/dispatchEvent |
| ④ 폼 모드 연결 | `elements()` bound 필터·`element("control")` | `setSdkElementFormMode()` — isConnected에 반영 |

부수 표면: defaultValue·id·form·name·type·required·willValidate(=false → 커널 validity 경로 건너뜀)·validity·validationMessage·setCustomValidity·setAttribute/removeAttribute(id 동기)·`SdkDocument.createElement`(valueMissingMessage 캐시). useSdkPart는 바인딩 전 계산된 domAttrs(id·role·data-*)를 요소에 심어요(registerById가 bind 시점 el.id를 읹).

## 2. 프로브 (10) — 137 OK

`packages/unikit/scripts/ui-sdk-contract-probe.ts` (10): 폼 글로벌 설치 → input 비제어/제어 왕복(typed→change→read·writeValue asUser)·api.setValue/clear·field 5슬롯 바인딩·외부 invalid 에러 상태기계(revealed·aria-describedby 조립 `ui-sdk-…-description …-error`·data-invalid)·label press → activate. 30건 추가(전체 137 OK).

## 3. 기기 실증이 발견한 두 계약(2026-11-23, 에뮬레이터 390×844dp headless)

1. **폼 글로벌은 모듈 스코프에서** — field의 adopt()가 queueMicrotask에서 브랜드 검사를 하는데 마이크로태스크는 passive useEffect보다 먼저 흐를 수 있어요(실제 Render Error «Property 'HTMLButtonElement' doesn't exist» → 화면을 모듈 평가 시점 설치로 수정).
2. **sdkElement 가시성** — useSdkPart의 sdkElement는 렌더 시 캡처돼요. 마운트 외 상태 변화가 없으면(비제어 input) 바인딩 후 재렌더가 없어 영구 null → 타이핑 주입이 요소를 못 찾음. 렌더러 계약으로 해결: 바인딩이 요소를 노출하면 한 번 흔들어 구독 렌더에 반영.
3. **값 미러는 소비자 몫** — input root 슬롯의 partState 투영(textState)은 filled·disabled·readOnly·required만 노출해요(value는 인스턴스 상태). 화면이 snapshot.value를 읽으면 항상 «»라 RN controlled TextInput이 타이핑을 되돌려요 — onValueChange에서 미러하고 value prop을 거기서 파생.

최종 판독(클린 번들): 타이핑 `rn` → `state.value «rn» · filled true(data-filled '') · 값 길이 2`·`onValueChange("rn") 이유:input-change` ✓, api.clear → `«» · filled false`(이유 imperative) ✓, invalid 토글 off → error 소거·`root data-invalid: 없음` ✓, label press → 이름 입력 포커스 ✓, Metro·logcat 무오류.

## 4. 알려진 경계(v1)

- label `for` 속성 생략 — isLabelable 브랜드 경계(활성화는 press 경로로 성립).
- DOM 발견 기반 validity는 가상 트리가 없어 항상 비어요 — 커널 계약 그대로(willValidate false).
- form 제출·reset 실물·password-input 등 12종 잔여는 후속 슬라이스.
- error 슬롯 숨김 시 part 바인딩은 유지돼요(웹은 언마운트로 정리) — aria-describedby 참조가 남을 수 있음.
