# 이슈 #36 — M1 파트 렌더러 코어 제품화 (behaviors/ui-sdk-renderer)

에픽 [#35](https://github.com/loopy-lim/unikit-ui/issues/35)(«다 go» 로드맵)의 M1. 이슈 [#17](https://github.com/loopy-lim/unikit-ui/issues/17) 스파이크(toggle 1종 최소형 — [issue-17 문서](issue-17-layer2-rn-renderer-spike.md))를 임의 프리미티브에 성립하는 일반형 패키지 진입점으로 성장시킨 기록이에요. 날짜: 2026-11-21.

## 1. 산출물

| 위치 | 내용 |
|---|---|
| `packages/unikit/src/behaviors/ui-sdk-renderer.ts` | 진입점 본체 — `useSdkPrimitive`·`useSdkPart`·`sdkBridgeProps`·`sdkSyntheticEvent` |
| `packages/unikit/package.json` | exports `./behaviors/ui-sdk-renderer` 추가, peer `@ui-sdk/core` **정확 고정 `0.1.0-beta.6`**(M0 — caret 금지), script `probe:ui-sdk` |
| `packages/unikit/scripts/ui-sdk-contract-probe.ts` | 상시 계약 프로브(M0 산출물, 이번에 이중 슬롯 검사 추가) |
| `apps/expo/app/uisdk-toggle.tsx` | 참조 소비자 화면 — toggle 3행(기본·초기 pressed·비활성) + checkbox root+indicator 이중 슬롯 |
| `llms.txt` | 진입점 9개로 갱신 |

## 2. API 계약

- `useSdkPrimitive(create, options, idPrefix)` — 수명: `unwatched` 생성(useState 초기화) → layout effect `keep` → 매 렌더 `setOptions({...options, id})` → 언마운트 `release`+`destroy`. 타입은 두 제네릭(FactoryOptions/Instance)로 팩토리 옵션 문맥 추론을 유지하면서 어댑터 주입 필드(id·controller)를 소거해 노출해요.
- `useSdkPart(instance, slot, props?)` — `instance.part(slot, props, true)` → `commit` → `ref` 바인딩(HOST = 프레임워크 렌더러 선언) → `subscribe`(출력 기반 축소) → 출력 `{showing, domAttrs, snapshot, element, bridgeProps, fire, press}`.
- `sdkBridgeProps(domAttrs, element)` — class→className·role 합성(RN Pressable은 View라 `ELEMENT_ROLES`로 역할 합성)·aria 플래그(pressed·checked·selected·expanded·invalid)→불린·aria-disabled|disabled→disabled·aria-label→accessibilityLabel.
- 합성 이벤트는 core 핸들러가 읽는 최소형(defaultPrevented·preventDefault·stopPropagation·key 계열 수정자).

## 3. 설계 판단

- **좁은 구독 — 출력 기반 축소**: 웹 use-primitive는 «읽은 상태 키»를 추적하지만, 이 구현은 통지마다 attrs·partState·present를 재계산해 `sameSlotState`·`sameValue`(renderer 재수출 비교기)로 직전 출력과 같으면 재렌더를 건너뛰어요. 읽기 추적이 없어 누락 렌더가 원천적으로 없는 대신, 출력에 영향 없는 상태 변화도 한 번은 계산해요.
- **MutationObserver 마스킹**(스파이크 실측 계승): RN 0.88 내장 MutationObserver(childList 전용 폴리필)은 커널 followId의 attributeFilter 관찰과 계약이 안 맞아 **바인딩 동안만** 전역을 마스킹(`typeof saved === "function"` 가드로 바인딩이 없는 런타임 통과).
- **미구현(로드맵)**: lazy resolve·mergeProps·HandleScope·takeOwnId/yieldToAuthor·schemaOf 기반 슬롯 해석 — M2 슬라이스에서 필요해질 때 이 진입점에 추가.

## 4. 기기 실측 — 요소 표면의 회귀 2건과 수습

일반화하며 스파이크의 하드코드 요소(«button»)를 인스턴스 상태 기반(`state.element`)으로 바꿨더니, 첫 리로드부터 결정적 크래시 2건이 노출됐어요(둘 다 «undefined is not a function»).

1. **`el.matches("a[href]")`** — `foundation/platform/button.js`의 `buttonElement(el)`. 초기 `element: "unknown"`(toggle.js 초기 상태)이면 tagName 분류를 마치지 못하고 matches를 호출해요. 수습: `matches()` 거짓 추가 — «RN 뷰는 링크가 아니다»의 정직한 번역이고 분류 결과 "other"가 역할 합성(`buttonRole` → role="button")으로 이어져 계약상 옳아요. **이전 세션의 «검증 통과»는 리로드 전 구 번들이라 착각이었어요** — 재검증은 항상 리로드 후에.
2. **`el.toggleAttribute("data-checked"…)`** — checkbox **indicator** 슬롯 bind의 store.subscribe 콜백(checkbox.js). root만 소비하는 검사로는 닿지 않는 경로예요(헤드리스 재현이 통과한 이유). 수습: 속성 저장소(setAttribute·removeAttribute·toggleAttribute·hasAttribute·getAttribute)와 `getAnimations() → []`(presence의 starting/ending-style·종료 대기 — 빈 배열이면 종료 콜백이 즉시 경로로 흘러 finishExit 자연 동작).

둘 다 프로브에 경성 검사로 옮겨 상시 재현해요: (2)에 unknown 요소 바인딩, (3)에 checkbox root+indicator 이중 슬롯 bind·press(click→aria-checked 전환·onCheckedChange 발화·indicator data-checked). 프로브의 bun 런타임에는 `requestAnimationFrame`이 없어(checkbox animateIn 사용 — RN·웹은 네이티브 제공) 타이머 기반 폴리필을 깔았어요.

최종 기기 검증(emulator-5554, 2026-11-21): 화면 렌더·기본 토글 press 전환(idle→pressed)·비활성 no-op·**체크박스 양방향 전환**(unchecked→checked→unchecked + onCheckedChange(true)/(false) 로그)·a11y 스냅샷 `[button]`/`[checkbox]`/`[disabled]`·attrs `role`·`aria-disabled`·`data-checked/unchecked` 전부 확인. LogBox 경고·오류 0.

## 5. 검증 게이트

`bun run probe:ui-sdk` PASS · 루트 `bun run typecheck` 전부 exit 0 · `bun run audit:design` 10/10 · 기기 상호작용(위).

## 6. 잔여 — M2(#35)

51종 6유형 슬라이스. 이 진입점의 미구현 기능(lazy resolve·mergeProps·HandleScope·schemaOf)은 유형별 슬라이스에서 필요 시점에 추가해요. 회귀 교훈: **요소 표면은 슬롯 전부를 소비해야 측정돼요** — M2 각 유형의 첫 슬라이스에서 그 유형의 전 슬롯을 bind하는 프로브 검사를 먼저 세워요.
