# 이슈 #37 — M2-① 상태기계+press 슬라이스 (button·switch·radio·segmented-control)

에픽 [#35](https://github.com/loopy-lim/unikit-ui/issues/35)(«다 go» 로드맵) M2의 첫 유형 ① 상태기계+press(벽 없음) 슬라이스 기록이에요. M1([issue-36 문서](issue-36-m1-part-renderer-core.md) — 파트 렌더러 코어 제품화)에 이어 같은 유형의 남은 팩토리를 그 진입점으로 구동해요. 날짜: 2026-11-21.

## 1. ①유형 확정 — 팩토리별 슬롯 실측(node_modules/@ui-sdk/core 0.1.0-beta.6 소스)

| 팩토리 | export | 슬롯(소스 근거) | 상태기계 |
|---|---|---|---|
| button | `button` | **root 1** — `slots: (slot) => ({ root: slot({…}) })`(button.js) | press → `runAction`: pending·error·disabled |
| switch | `switchPrimitive` | **root·input·thumb 3** — `toggleSlots("switch")`가 root+input(toggle-control.js), switch.js가 thumb 추가 | press → `api.toggle`: checked |
| radio | `radioGroup` | **group·root(항목)·input·indicator 4** — radio.js `slots`가 radio-parts.js의 group·item·input에 indicator 추가, `root: item`로 이름 매핑 | 항목 press → `check(key)`: value |
| segmented-control | `segmentedControl` | **root(group)·item·input·indicator 4** — segmented-control.js가 `slotNames = { group: "root", item: "item" }`로 radioSlots 재사용 + bindIndicator indicator | radio와 같은 radioGroupApi: value |

- 항목 슬롯(radio root·input, segmented item·input)은 `keyOf = props.id ?? String(props.value)`로 **props.value 키 기반 파트 분리**(kernel/primitive.js). indicator의 `value` prop은 슬롯 스키마가 `{ kind: "string", from: "root" }` 선언 — 웹 어댑터는 루트 문맥에서 채우지만, 이 진입점은 소비자가 명시적으로 넘겨요.
- toggle(root·icon — icon은 그룹 장식 슬롯 `itemIconPart`, 문서 스타일 주입·writeStyle 표면)·checkbox(root·input·indicator)는 M1 참조 범위. 이번에 checkbox input 슬롯 bind를 프로브 (3)에 보강해 ①유형의 폼 입력 bind 경로(associate → ownerDocument 리스너)까지 상시 검증해요. toggle icon 슬롯은 상태기계+press 표면이 아니라 이 슬라이스에서 의도적으로 제외(문서 스타일 주입이 필요한 장식 슬롯).

## 2. 진입점 보강(behaviors/ui-sdk-renderer.ts)

M1의 미구현 목록에서 이 슬라이스가 필요로 한 두 계약만 추가했어요:

1. **커밋된 props 기반 계산** — `useSdkPart`의 `compute()`가 `attrs`·`present`·`partState`에 `{}`가 아니라 커밋된 props를 전달. radio 항목 attrs(`props.value`·`props.disabled` 읽음)·indicator present(`props.value` 비교)가 props에 의존해요.
2. **SdkElement 멤버 2종** — ① `ownerDocument`(최소 문서 `{addEventListener, removeEventListener}`): hidden input bind의 `associate`(reset 리스너)·그룹 bind의 `bindRadioGroup`(pointerdown 캡처)가 요구. ② `style`(`{setProperty, removeProperty}`): segmented-control indicator bind의 CSS 변수 쓰기 — RN 표면은 측정이 없어 제거 경로만 와요.

나머지(lazy resolve·mergeProps·HandleScope·takeOwnId/yieldToAuthor·schemaOf 슬롯 해석)는 여전히 미구현 — 다음 유형 슬라이스에서 필요 시점에 추가.

## 3. 측정 한계 — roving 정차(문서 순서 계약)

radio·segmented-control의 roving tabindex는 `order.list()`가 `el.isConnected`로 항목을 걸러 **문서 순서**로 정차(stop)를 계산해요(kernel/order.js `sorted`). RN 표면 요소는 연결 개념이 없어 목록이 비면 `roving.check()`가 no-op — stop은 null을 유지해요(tabindex는 claims 경로로 첫 항목이 보유). 영향 평가: tabindex는 브리지 번역표(`sdkBridgeProps`)가 버리는 웹 전용 속성이고, roving 키보드 이동은 하드웨어 키 경로(이슈 #19 벽 뒤 — Android 플래그·iOS 폐기)라 이 슬라이스의 소비 계약엔 영향이 없어요. 프로브 (6)에 `stop === null` 단언으로 상시 재현(베타 승급 시 이 표면이 요구하는 바가 바뀌면 드러나요).

## 4. 산출물·검증

| 위치 | 내용 |
|---|---|
| `packages/unikit/scripts/ui-sdk-contract-probe.ts` | 섹션 (4)~(7) — 4팩토리 전 슬롯 경성 검사(button 12·switch 8·radio 14·segmented 8) + checkbox input 보강. 전체 70검사(심볼 10·toggle 13·checkbox 5 포함). 구현에 앞서 먼저 작성(계약 1) |
| `packages/unikit/src/behaviors/ui-sdk-renderer.ts` | 진입점 보강 2종(위 §2) |
| `apps/expo/app/uisdk-press.tsx` | 참조 화면 — button(비동기 action pending·비활성)·switch(root·input·thumb)·radio(3항목·비활성 항목)·segmented(3항목+indicator 상태) |
| `apps/expo/app/index.tsx` | 목록 «실험» 섹션 진입 추가 |

검증 게이트(2026-11-21): `bun run probe:ui-sdk` PASS(70 OK) · 루트 `bun run typecheck` 전부 exit 0 · `bun run audit:design` 10/10. 기기(에뮬레이터) 실증은 이 이슈의 게이트가 아니에요(참조 화면 + 프로브 경성 검사로 대체 — 이슈 범위 선언). registry.json·registry/ui는 이 진입점 계열이 npm 전용이라 등록 대상 아님(계약 3).
