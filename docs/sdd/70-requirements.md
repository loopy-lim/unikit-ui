# 사이클 70 요구 정의 (G0) — 웹 렌더 일관성 붕괴 수정 (브리지 display 기본값·텍스트 정렬·ComboboxValue 빈 값)

- 작성: Product Manager (role-perspective self-execution, 오케스트레이터) · 2026-11-11
- 원 요청: «Combobox이런거나 등등 보면 ui의 일관성 부터 시작해서 모든 디자인이 깨져있어.»
- 기준 리비전: `62a941e` (main, 작업 트리 클린)

## 1. 배경 및 확정된 관찰 (렌더 증거 — localhost:3000 실측, 2026-11-11)

웹 쇼케이스(`/showcase`, `/showcase/combobox`, `/showcase/kitchen-sink`)를 실제 브라우저로 관찰해 아래를 확정했다. 원인 코드 위치는 `71-research.md`가 확정한다.

1. **브리지 웹 `Pressable`이 `display: flex` 기본값을 부여하지 않음** — `flex-row` 등 방향 클래스만 가진 Pressable이 웹에서 `display: block`으로 렌더된다. kitchen-sink 실측: 해당 상태의 button 56개(메뉴 항목·아코디언 트리거·페이지네이션·커맨드·콤보박스 항목 등). RN 네이티브는 display 기본값이 flex이므로 웹에서만 깨진다(웹·네이티브 불일치). justify-between 등 배치 클래스가 무력화되고 자식이 세로로 적층된다.
2. **`<button>` 브라우저 기본 `text-align: center` 노출** — 항목 텍스트가 원본 shadcn 대비 가운데 정렬로 렌더된다(위 1의 block 렌더와 결합). 실측: combobox 항목 "사과"가 항목 폭 272px에서 좌측 8px가 아닌 중앙(offset 111px)에 위치.
3. **아코디언 트리거 적층** — 제목과 chevron 아이콘이 같은 행이 아니라 세로로 쌓임(스크린샷 확보).
4. **`ComboboxValue`가 빈 문자열 "값 없음" 관례를 오판** — 컴포넌트 계약상 지우기는 `onValueChange("")`로 표현하는데(파일 머리 주석 명시), `ComboboxValue`는 `value != null`로만 검사해 `value=""`일 때 플레이스홀더 대신 빈 span을 렌더한다. 쇼케이스 데모가 `useState("")`로 시작해 트리거가 비어 보인다(트리거 span 빈 상태 실측).
5. **`defaultSize` prop DOM 누설** — `resizable.tsx`에서 패널 제약 prop(`defaultSize` 등)이 View로 전개돼 React 경고 발생(Next dev "1 Issue" 배지).

## 2. 목표

1. 웹에서 RN 렌더 기본값과의 불일치(위 1~3)를 브리지 계층에서 해소해 61종 컴포넌트가 웹·네이티브에서 동일하게 렌더되게 한다.
2. Combobox의 빈 문자열 계약을 UI에 올바르게 반영한다(위 4).
3. 부차 결함(defaultSize 누설, 위 5)을 제거한다.
4. 아이콘 프리미티브(81f3c2e 도입)의 컴포넌트 간 일관성을 조사 결과에 따라 판정하고, 시각 결함이면 함께 고친다.

## 3. 범위

### 포함
- `packages/unikit/src/bridge/`(web.tsx·native.tsx·types.ts) — 웹 렌더 기본값 정합.
- 위 결함에 해당하는 `packages/unikit/src/components/*.tsx` 수정과 `registry/ui/*.tsx` 미러 동기, 필요 시 `registry.json` 갱신.
- `apps/expo/` — 브리지 변경에 따르는 네이티브 회귀 정리(구조 개편은 제외).

### 제외
- 컴포넌트 공개 API·CVA variant 구조 변경(이식 9조).
- 데모 전용 아이콘 시스템(lucide-react)의 재설계 — 조사 결과 시각 결함이면 그 지점만 국소 처리.
- 다크 모드 토큰 값 변경(토큰 전환 방식 유지).

## 4. 수락 조건 (AC-*)

| ID | 수락 조건 |
|---|---|
| **AC-1** | 웹 쇼케이스 kitchen-sink에서 레이아웃 방향 클래스(`flex-row` 등)를 가진 브리지 Pressable 버튼 중 `display: block`으로 렌더되는 것이 0개다(DOM computed style 관찰). |
| **AC-2** | 메뉴·아이템 계열(dropdown-menu, context-menu, menubar, command, combobox, select, pagination, accordion)의 항목 텍스트가 웹에서 좌측 정렬로 렌더된다(의도상 가운데인 변형 제외, DOM computed style 관찰). |
| **AC-3** | 아코디언 트리거에서 제목(좌)과 chevron(우)이 같은 행에 렌더된다(브라우저 관찰). |
| **AC-4** | Combobox 트리거가 `value=""` 상태에서 플레이스홀더를 표시하고, 항목 선택 후에는 선택 라벨을 표시한다(브라우저 관찰). |
| **AC-5** | 아이콘 프리미티브의 크기·색 규칙이 조사 결과의 일관성 기준과 일치한다(기준은 `71-research.md`에서 확정, 위반 시 수정). |
| **AC-6** | 네이티브 회귀 없음 — 브리지 네이티브 경로 변경 없음 또는 변경 시 `apps/expo` typecheck·export 통과. |
| **AC-7** | `defaultSize` DOM 누설 경고가 사라진다(쇼케이스 렌더 시 React 경고 0). |
| **AC-8** | `bun run typecheck` 3패키지, `bun run audit:design` 8검사, `cd apps/web && bun run build` 전부 exit 0. `src/components` ↔ `registry/ui` 본문 동기 유지. 커밋 0 유지. |

## 5. 제약 사항

- 패키지 매니저는 bun만.
- 이식 규칙 9조 준수(export 명·cva·토큰 클래스 유지), 임의값 클래스 금지, `dark:` 변형 금지, 새 의존성 금지.
- 브리지 분기 원칙: 플랫폼 분기는 패키지 exports 조건이 담당 — 컴포넌트에 `.web.tsx`·`Platform.select` 신설 금지.
- 생성물(`globals.css` 토큰 블록·registry theme·tokens.md) 직접 편집 금지.
