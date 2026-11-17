# Issue #17: 층2 definePrimitive / parts 렌더러 RN 어댑터 — 경계 재실측·스파이크·판정

- **관련 이슈**: [#17](https://github.com/loopy-lim/unikit-ui/issues/17) (상위 에픽 [#11](https://github.com/loopy-lim/unikit-ui/issues/11)) · 판정 반영: [#18](https://github.com/loopy-lim/unikit-ui/issues/18)
- **기준일**: 2026-11-18 (기준 커밋 `bdcccdd` = main, PR #32 반영)
- **판정**: **전면 도입(51종) no-go · 소수 primitive(toggle/checkbox/switch급)는 기술적 조건부 go — 제품 수요 발생 전까지 미도입 유지. #18의 A 판정(층 1 헬퍼+position 경계, PR #32)과 정합.**

## 1. 경계 재실측 — renderer/parts 공개 표면 vs 비공개 경계 (체크박스 1)

측정 대상은 이 저장소가 소비하는 버전 그대로예요: **`@ui-sdk/core`·`@ui-sdk/react` `0.1.0-beta.6`**(bun.lock 고정 — apps/expo·packages/unikit 의존 `^0.1.0-beta.6`의 해석 결과). churn 비교용으로 `0.1.0-beta.4`~`beta.7` npm 타르볼 4세트를 내려받아 같은 방법으로 측정했어요(§3).

### 공개 표면(업스트림이 `@stable`로 문서화)

| 진입점 | 내용 |
|---|---|
| `@ui-sdk/core` 루트 | `definePrimitive`·행동 헬퍼 263종·`Primitive`/`PrimitiveInstance` 등 타입(docs/sdd/100 §1과 동일 규모) |
| `@ui-sdk/core/{컴포넌트}` 서브패스 | 컴포넌트 프리미티브 정의(toggle·checkbox 등 51종). 스파이크가 쓴 `@ui-sdk/core/toggle`도 여기 소속(공개) |
| `@ui-sdk/react` | `usePrimitive`·`usePart`·`createParts`·`HandleScope`·`PartProps` 등 — 전부 `@stable` JSDoc. 단 **react-dom 전제**(JSX·className·`event.nativeEvent`)라 RN에서 재사용 불가 |

### 비공개 경계 — `@ui-sdk/core/renderer`

- exports 맵에는 **등록돼 있어서** 소비자가 import할 수 있지만(70 진입점 중 1개), 모듈 머리 주석이 스스로 선언해요: «프레임워크 렌더러 전용·문서화되지 않음·릴리스마다 변경 가능·여기엔 공개 API가 없다»(`renderer.d.ts` 1-8행). **«import 가능»과 «공개»가 다른, 선언적 비공개 경계**예요.
- re-export 심볼 수: **49개 export 문**(kernel 파트 엔진·store·live·forms internals·컴포넌트 내부 파트 등).
- 웹 어댑터(`@ui-sdk/react` `use-primitive.js`, 681줄)가 이 진입점에서 import하는 심볼은 **18종**: `attrs`·`commit`·`directNames`·`handlers`·`keep`·`partState`·`present`·`ref`·`release`·`renderVersion`·`sameSlotState`·`sameValue`·`schemaOf`·`selectedKeys`·`subscribe`·`takeOwnId`·`unwatched`·`yieldToAuthor`.
- **RN 최소 파트 렌더러(이번 스파이크)는 10종**으로 성립: `attrs`·`handlers`·`present`·`partState`·`subscribe`·`commit`·`ref`·`keep`·`release`·`unwatched`. 나머지 8종은 웹 최적화(읽은 키 좁은 구독 `renderVersion`·`sameSlotState`·`sameValue`·`directNames`)·목록 선택(`selectedKeys`)·작성자 id 소유권(`takeOwnId`·`yieldToAuthor`)·Root 조립(`schemaOf`)이에요.
- **타입 마찰(실측)**: renderer의 TS 계약이 DOM 타입이라(`ref(part, host)`의 반환은 `HTMLElement` 인자, `handlers`는 `Event` 인자) RN 어댑터는 바인딩·이벤트 합성 2곳에서 `as unknown as` 캐스트를 감수해요. 런타임은 DOM-프리 계약(§2)인데 타입만 DOM인 불일치예요.

## 2. 최소 primitive RN 스파이크 — toggle (체크박스 2)

산출: `apps/expo/app/uisdk-toggle.tsx`(목록 «실험» 섹션 진입 추가). `@ui-sdk/react` 없이 코어 프리미티브(`@ui-sdk/core/toggle`, 공개)를 비공개 renderer 심볼 10종으로 구동하는 RN 파트 렌더러 최소형이에요. 구성:

- **인스턴스 수명**: 웹 `usePrimitive`와 동일 패턴 — `unwatched(() => toggle({…options, controller: undefined, id}))` 생성 → `keep` → 언마운트 시 `release`·`destroy`.
- **파트 상태 구독**: `instance.part("root", {}, true)` → `commit` + `subscribe`(스토어 변화→재렌더). 웹의 읽은 키 좁은 구독 최적화는 생략(전체 구독 — 비용 차이는 §3).
- **요소 바인딩**: `ref(part, host)`에 가짜 요소 전달. 토글 root가 실제로 읽는 멤버는 **3개**(프록시 실측: `tagName`·`isConnected` 즉시, `parentElement`는 watchFieldsets 마이크로태스크에서 지연)에 렌더러 계약 방어 2개(`addEventListener`/`removeEventListener` — 커널 `bind()`가 host.attaches 밖의 이벤트를 요소에 직접 붙이는 경로)를 더한 것 — `position()` 계열이 요구한 10멤버+전역 6종(docs/sdd/100 §7)과 대비돼요. **전역 스텁(installDomStubs) 불필요.**
- **번역표(DOM attrs → 브리지 계약)**: `role`/인스턴스 상태 `element` → `accessibilityRole` 합성(웹은 native `<button>`이 역할을 대신하지만 RN Pressable는 View) · `aria-pressed:"true"/"false"`(문자열) → 브리지 `aria-pressed`(불리언, bridge/types.ts «네이티브는 시각 상태로만 반영» 관례와 정렬) · `aria-disabled`/네이티브 `disabled` → `disabled`·`aria-disabled` · `class` → `className`(uniwind) · `tabindex`·`type`·`data-*` → 드롭(시각 상태는 `data-pressed`를 렌더러가 직접 소비 — 웹 CSS 속성 셀렉터의 RN 등가) · `click` → `onPress` 합성 이벤트(`defaultPrevented`·`preventDefault`만 있으면 성립).

### 계약 발견 3건 (스파이크의 실측 산물)

1. **RN 0.88 내장 MutationObserver와 ui-sdk `followId` 충돌**. RN 0.88이 자체 웹 API 폴리필(`react-native/src/private/webapis/mutationobserver` — Metro 번들 실측)을 내장했어요. ui-sdk 커널 `bind()`는 `MutationObserver`가 존재하면 `followId`로 `observer.observe(el, { attributeFilter: ["id"] })`를 부르는데, RN 구현은 **대상이 `ReactNativeElement`가 아니면 TypeError, `attributeFilter`는 아예 미지원 예외**(childList 전용)라 바로 죽어요(기기 오버레이 실측). 우회: 바인딩 동안만 `globalThis.MutationObserver`를 마스킹해 `followId`를 건너뛰게 함 — id 전파는 웹 전용 계약이고 RN 렌더러가 id를 소유하지 않아 의미 손실이 없어요. **bun 프로브(프로세스에 MutationObserver 없음)는 이 결함을 못 봤어요** — «DOM 없는 런타임 검증은 기기를 대체하지 못한다» 교훈 재현(docs/sdd/100 §7 P2와 동일 패턴).
2. **`aria-pressed`의 RN 부재**. react-native 0.88.1 타입 실측: `aria-checked`·`aria-disabled`·`aria-expanded`·`aria-selected`는 존재, **`aria-pressed`는 없음**(AccessibilityState에도 pressed 없음). 브리지가 이미 같은 결론으로 관례를 세워 둠(«네이티브는 시각 상태로만 반영») — 층2 번역표는 브리지 관례에 정렬하는 것이 정답.
3. **파트 상태 계약의 이중성**. `partState(part)`는 슬롯이 선언한 상태만 돌려줘요(toggle root는 `{pressed, disabled}`). 역할 합성에 필요한 `element`("unknown"→바인딩 후 "button")은 인스턴스 전체 상태(`instance.get()`)에만 있어요. 또한 바인딩 전(`element:"unknown"`)에는 `aria-disabled:"true"`가 내려오고 바인딩 후(`element:"button"`)에는 네이티브 `disabled:""`로 대체되는 웹 계약도 확인(번역표가 둘 다 다뤄야 함).

### 검증 (2단계)

- **bun 프로브(DOM 없는 런타임, 기기 전 사전 검증)** — 18/18 PASS: element 전환(`unknown`→`button`)·`aria-pressed`/`data-pressed` 갱신·`onPressedChange` 발화([true]→[true,false])·disabled 억제(상태 불변·`preventDefault` 기록·콜백 미발생)·`handlers` 종류{click,keydown,keyup}·파생 attrs·수명 해제 크래시 없음. 프로브 파일은 선례에 따라 실측 후 삭제(결과는 전부 이 문서에 기록).
- **기기 실증(emulator-5554, Metro 8083, 개발 클라이언트)**: 딥링크·목록 «실험» 카드 양쪽 진입 OK. 접근성 트리에서 `[button] "기본 토글"`·`[button] "비활성 토글" [disabled]` 확인(역할 합성·disabled 번역). 누름 실측: 기본 토글 idle→pressed(시각 채움·attrs `aria-pressed:"true"`·`data-pressed:""`·로그 `onPressedChange(true)`)→재누름 idle(로그 2건)·초기 pressed 토글 유지·비활성 토글 눌림 무반응(상태·로그 불변). MutationObserver 마스킹 반영 후 오류 오버레이 소멸.

## 3. 유지 비용·업스트림 의존 리스크 수치화 (체크박스 3)

전부 npm 타르볼 4세트(beta.4~7)와 Metro 번들·기기에서의 실측이에요.

- **릴리스 케이던스**: beta.4(2026-11-15T08:37Z)→beta.7(2026-11-17T00:07Z) — **3일 4릴리스**. npm dist-tags: latest=beta.6, beta=beta.7.
- **전체 churn(b6→b7)**: core dist 전체 777파일 중 **39파일(5.0%)** 내용 변동(내역: `.js` 388파일 중 27파일=7.0% · `.d.ts` 388파일 중 12파일), react는 3파일(field·preferences·render-element — render-element는 `resolveLazy`의 중첩 lazy 지원 7줄).
- **어댑터 의존군 churn(b4→b7, 3구간)**: `renderer.d.ts`(export 목록)·`renderer.js`·react `use-primitive.js`/`.d.ts`·kernel `part.js`·`keep.js`·`primitive.js`·`store.js`·`platform/button.js`·`components/toggle/toggle.js` — **전부 0줄 변화**. 유일 변동은 `forms/form.js` +4줄(신규 헬퍼 `typedBeforeBind` export — 토글 바인드 경로인 `watchFieldsets`/`fieldsetDisabled`와 무관). 즉 지금까지는 안정적이지만 이는 **계약이 아니라 관찰**이에요 — renderer 머리 선언(«릴리스마다 변경 가능»)이 우선하고, 베타 3일차~5일차 구간이라 통계적 근거도 약해요.
- **번역 층 유지 규모**: 웹 `use-primitive.js` 681줄 + `render-element.js` 109줄 중 RN판 최소 렌더러는 스파이크 기준 약 150줄(번역표·수명·구독·가짜 요소). 웹이 하는 최적화(읽은 키 좁은 구독·lazy resolve·mergeProps 체인)를 갖추면 규모는 웹판에 수렴해요.
- **컴포넌트당 DOM 표면 편차(확장 비용의 핵심)**: toggle은 요소 실측 3멤버·전역 0이지만, 팝업 계열은 요소 10멤버+전역 6종(docs/sdd/100 §7 실측), 폼 계열은 `ElementInternals`(`attachFormInternals` — RN에 등가 없음), focus 계열은 키 이벤트(§7 3벽). **«컴포넌트를 더 넓힐수록 어댑터는 얇아지지 않고 두꺼워져요.**
- **생태계 규모 대조**: 업스트림 react 어댑터는 src 85파일(컴포넌트 51+공유 인프라). 제3자 Angular 어댑터는 업스트림 발표 기준 약 67파일(이슈 [#495](https://github.com/vercel-labs/ui/issues/495) — 단 Angular는 DOM 렌더러라 우리 3벽과 다름, docs/sdd/issue-16 §2 재인용). RN 어댑터 공식 논의는 여전히 0건(같은 조사, 2026-11-18 기준).

## 4. go/no-go 판정 (체크박스 4 → #18 반영)

- **층2 전면(완성 컴포넌트 51종을 RN 파트로) — no-go.** 근거: ① 3벽(명령형 변이·동기 레이아웃·키 이벤트)은 렌더러 층이 아니라 개별 컴포넌트의 행동이 직접 부딪히는 벽(§7 층3와 동일) ② 비공개 renderer 계약을 51종 전량의 조립에 결합하면 베타 케이던스(3일 4릴리스)마다 추적 비용이 커져요 ③ UniKit이 자체 보유한 62종 컴포넌트와 기능이 중복돼 제품 이유가 없어요.
- **소수 primitive(toggle/checkbox/switch급 «상태기계+press» 유형) — 기술적 조건부 go, 제품 수요 대기.** 스파이크가 증명한 범위: 비공개 심볼 10종·가짜 요소 실측 3멤버·전역 스텁 0(마스킹 1곳)로 코어 상태기계가 RN에서 완전 동작. 필요해지면 스파이크 렌더러(~150줄)를 `behaviors/` 계열 제품 진입점으로 성장 가능(P2·P3 position()이 그 경로를 밟은 선례). 다만 지금은 그 수요가 없어요 — 미도입 유지가 기본값.
- **층3(#18)과의 정합**: 이슈 #18은 병행 세션에서 **A 판정**(층 1 헬퍼+`position()` 경계로 제품 정의 고정, 층 3 51종 웹 전용 제외 — PR [#32](https://github.com/loopy-lim/unikit-ui/pull/32), 2026-11-18 머지)으로 확정됐어요. 본 스파이크의 판정(전면 no-go·소수 조건부 go)은 A와 모순되지 않아요 — «소수 조건부 go»는 #18 문서 §5의 재평가 트리거 중 «층 2의 성립»에 해당하는 예비 입력이고, 지금은 수요가 없으므로 트리거 미발동. A 경계 유지가 양쪽 판정의 합의점이에요(소수 도입은 (B) 대신 §5 트리거 3이 여는 경로).

## 5. 재평가 조건 (Unblock / Re-evaluate Triggers)

1. 업스트림이 renderer 계약을 공개 문서화하거나(«프레임워크 렌더러 전용» 선언 철회) RN/비DOM 렌더러 논의를 공식화하면 §1 경계 전면 재실측.
2. `renderer.d.ts` export 목록이나 `use-primitive`의 번역 층이 임의 릴리스에서 실제로 바뀌는 첫 사례가 관측되면 §3의 «안정 관찰»을 갱신(마이그레이션 비용 실측으로 전환).
3. UniKit 제품 로드맵에서 «ui-sdk 정의를 그대로 쓰는 RN 컴포넌트» 수요가 구체화되면 toggle급 허용 목록부터 시험 적용(이 스파이크 화면이 참조 구현).

## 6. 산출물·검증 기록

- 코드: `apps/expo/app/uisdk-toggle.tsx`(스파이크 화면+RN 파트 렌더러 최소형), `apps/expo/app/index.tsx`(«실험» 진입 1건). 패키지 의존 변경 없음(`@ui-sdk/core` ^0.1.0-beta.6 기존 — `@ui-sdk/react`는 미추가).
- 검증: 루트 `bun run typecheck` 전부 exit 0 · `bun run audit:design` 10/10 PASS · bun 프로브 18/18 PASS(실측 후 삭제) · 기기(emulator-5554) 화면·상호작용 실증(§2). 계약 프로브와 디버그 스크립트는 선례에 따라 제거했어요.
- 이 문서는 docs/sdd/100 §7 «층 2» 문단·«스파이크 부속»·«실험 화면 정책» 표에 링크로 연결돼요(병합 원칙 — 기존 기술은 유지).
