# Issue #22: Vercel UI SDK 제외 헬퍼 재평가 (`labelOf` · `createSelection`)

- **관련 이슈**: [#22](https://github.com/loopy-lim/unikit-ui/issues/22) (상위 에픽 [#11](https://github.com/loopy-lim/unikit-ui/issues/11))
- **기준일**: 2026-11-18
- **판정**: **deferred (보류)** — 현행 소비자 수요가 없고, 두 헬퍼 모두 층 1(`@unikit-bridge/ui/behaviors` 순수 헬퍼 경로)에서 RN 대체/단독 소비 조건을 충족하지 못해요.

## 1. 조사 범위와 기준

이 문서는 `@ui-sdk/core` P1 순수 헬퍼 선별에서 제외했던 `labelOf`와 `createSelection`에 대해 다음 세 가지를 재평가한 기록이에요.

1. 현재 저장소(`main`) 소비자 수요 유무 확인
2. `labelOf`: React Native 접근성 라벨 트리로 대체 가능한지 조사
3. `createSelection`: `PrimitiveContext` 없이 쓸 수 있는 공개 API 존재 여부 재확인

> **참고**: `main` 기준선에는 아직 사이클 101의 `@unikit-bridge/ui/behaviors/ui-sdk` 실험 진입점 및 `@ui-sdk/core` 의존성이 병합되지 않은 상태예요. 패키지 계약 확인은 `@ui-sdk/core@0.1.0-beta.6` 배포본(`dist/`)과 `main`의 기존 브리지·컴포넌트 소스를 대조해 수행했어요.

## 2. 소비자 수요 확인 — 수요 없음 (`deferred`)

`main` 기준선 전체(`apps/*`, `packages/unikit/src/*`)를 점검한 결과, `labelOf` 및 `createSelection`에 대한 소비자 수요가 없어요.

- **앱 소비자 (`apps/web`, `apps/expo`, `apps/desktop`, `apps/mobile`)**: `@unikit-bridge/ui/behaviors` 진입점을 직접 소비하는 앱 코드가 0건이에요.
- **패키지 컴포넌트 (`packages/unikit/src/components/` 62종)**:
  - `tree` 또는 다중 선택 `listbox` 컴포넌트가 없어요. `select`는 단일 선택 전용이고, `command`는 React 렌더 단계에서 최상위 문자열 자식을 모으는 자체 `textValueOf(nodes: ReactNode)`(`packages/unikit/src/components/command.tsx:141-146`)를 써요.
  - `dropdown-menu` · `context-menu` · `select`의 키보드 타입어헤드는 `packages/unikit/src/lib/menu-nav.tsx:82-93,172-214`에서 웹 `HTMLElement.textContent` + `getNextMatch`로 이미 자급하고 있어요.
- **기존 `behaviors` 진입점 (`packages/unikit/src/behaviors/index.ts`)**: `overlay`, `menu-nav`, 브리지 훅 5종만 재노출하고 있으며, `@ui-sdk/core` 의존성은 `main`에 편입되지 않았어요.

따라서 두 헬퍼를 당장 이식·래핑할 실제 수요가 없어 **deferred**로 유지해요.

## 3. `labelOf` — RN 접근성 라벨 트리 대체 가능성 조사 (층 1 대체 불가)

### `@ui-sdk/core` 원본 구현 (`@ui-sdk/core@0.1.0-beta.6`)
`dist/foundation/text/typeahead.js:7-23` 기준 동작은 다음과 같아요.

- `textOf(el)`이 `document.createTreeWalker(el, NodeFilter.SHOW_TEXT)`로 DOM 자식 텍스트 노드를 동기 순회하면서 `[aria-hidden="true"]`, `[hidden]` 조상 아래 텍스트를 제외해요.
- `labelOf(el)`은 수집한 텍스트의 공백을 정규화해 반환하고, 비어 있으면 `el.getAttribute("aria-label") ?? ""`를 폴백으로 돌려줘요.

### UniKit RN 브리지 대조 결과
1. **RN 호스트 인스턴스에는 JS 동기 순회 가능한 접근성 라벨 트리가 없어요.**
   - `packages/unikit/src/bridge/native.tsx` 및 `packages/unikit/src/bridge/types.ts:99-223,286-295`에서 `accessibilityLabel`, `aria-hidden`(`accessibilityElementsHidden`)은 JS에서 네이티브 OS 접근성 트리(`AccessibilityNodeInfo` / `UIAccessibility`)로 내려보내는 **단방향(write-only) prop**이에요.
   - 마운트된 `BridgeViewRef` / `BridgePressableRef`를 받아 동기적으로 자식 텍스트나 합산 접근성 라벨을 걷어 올리는 `createTreeWalker` · `textContent` 상당 공개 API가 React Native(0.88.1)에 없어요.
2. **네이티브 `View`/`Pressable`에는 `onKeyDown` 계약도 없어요.**
   - `packages/unikit/src/bridge/types.ts:110,204`와 `packages/unikit/src/lib/menu-nav.tsx:22`에 기록됐듯이 RN `View`/`Pressable`은 키보드 다운 이벤트를 받지 못하므로, 메뉴 카드에서 DOM ref를 훑어 타입어헤드를 구동하는 흐름 자체가 네이티브에서 발화하지 않아요.
3. **`createTypeahead`는 이미 `labels: string[]`를 직접 받아요.**
   - `dist/foundation/text/typeahead.js:48`의 `search(key, labels, current)`는 `HTMLElement`가 아니라 문자열 배열 `labels`를 인수로 받아요. 라벨 추출이 필요할 때도 React 렌더 단계의 명시적 `label` · `textValue` prop 또는 `command.tsx`의 `textValueOf(children)` 패턴처럼 `ReactNode` 수준에서 처리하는 편이 RN과 호환돼요.

**결론**: RN 접근성 라벨 트리로 `labelOf(el)`을 층 1에서 대체할 수 없어요. 층 2(`#17` `definePrimitive` RN 어댑터)를 추진하거나 명시적 라벨 문자열 계약이 필요한 소비자가 생길 때 재평가해요.

## 4. `createSelection` — `PrimitiveContext` 없는 공개 API 재확인 (없음)

### `@ui-sdk/core` 공개 계약 확인 (`@ui-sdk/core@0.1.0-beta.6`)
- **`dist/index.d.ts:17`**: 루트에서 `createSelection`, `SelectionModel`, `SelectionOptions`만 export해요.
- **`dist/foundation/selection/selection-model.d.ts:63`**: 공개 시그니처는 `context: Pick<PrimitiveContext<Options, State, any>, "store" | "options" | "onDestroy">`를 필수 첫 번째 인수로 요구해요.
- **`dist/foundation/selection/selection-model.js:1-144`**: 내부에는 `PrimitiveContext` 없이 `{ keys, set, order, selectable }`만 받는 `createKeySelection` 함수가 존재해요. 그러나 루트 `dist/index.d.ts`에서도, `package.json` `exports`의 어떤 서브패스에서도 `createKeySelection`은 **공개 export되지 않았어요**.
- 부가 한계로, `createSelection`의 범위 선택(`extend`)은 주로 Shift 조합 키 입력과 함께 쓰이므로 브리지 `BridgeKeyEvent.shiftKey` 확장(`#13`)과도 맞물려요.

**결론**: `@ui-sdk/core`에서 `PrimitiveContext` 없이 소비할 수 있는 공개 API는 **없어요**. 커널 `store`/`onDestroy`를 수동으로 흉내 내는 비공식 더미 컨텍스트 래핑은 취약하므로, 업스트림이 `createKeySelection`을 공개 export하거나 층 2(`#17` `definePrimitive` RN 어댑터) 도입 시점까지 **deferred**로 유지해요.

## 5. 재개 조건 (Unblock / Re-evaluate Triggers)

다음 중 하나가 충족되면 이 보류 결정을 다시 검토해요.

1. UniKit 컴포넌트나 소비자 앱에서 다중 선택·Shift 범위 선택(`Tree`, 다중 `Listbox` 등) 수요가 실제로 발생할 때 (필요 시 `#13` `BridgeKeyEvent.shiftKey`와 함께 검토)
2. `@ui-sdk/core` 업스트림이 `createKeySelection` 등 커널 비의존 순수 선택 API를 공개 `exports`로 노출할 때
3. 층 2(`#17` `definePrimitive` RN 어댑터) 구현이 확정돼 `PrimitiveContext`와 React children/접근성 라벨 수집 계층을 함께 제공할 때
