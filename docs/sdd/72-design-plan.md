# 사이클 70 설계·계획 (G1) — 웹 렌더 일관성 붕괴 수정

- 작성: System Architect + Product/UX Designer (role-perspective self-execution, 오케스트레이터) · 2026-11-11
- 입력: `70-requirements.md`(AC-1~8) · `71-research.md` · 기준 리비전 `62a941e`

## 1. 설계 방침

### 1a. 브리지 계층에서 웹·네이티브 기본값 정합 (핵심)

RN에서 Pressable은 View 계열로 기본 `display: flex`·`flexDirection: column`이고, 웹 브리지 View(web.tsx:112)는 이미 `flex flex-col` 기본값으로 이를 재현한다. Pressable(web.tsx:157)에만 기본값이 없어 웹에서 block으로 렌더되는 것이 붕괴의 대부분이다. 컴포넌트 30여 곳에 `flex` 클래스를 도매로 추가하는 대신 **브리지 Pressable에 View와 동일한 기본값을 부여**한다(브리지 분기 원칙 — 플랫폼 차이는 브리지가 흡수).

- Pressable 기본 클래스: `cn("flex flex-col", className)` — View와 동일 규칙. 호출자의 `flex-row`·`hidden` 등이 tailwind-merge로 이긴다(기존 정합).
- 텍스트 정렬: 웹 `<button>` 브라우저 기본 `text-align: center`를 RN 동작(시작 정렬)으로 되돌리기 위해 기본 클래스에 `text-left` 추가. 호출자가 `text-center`를 주면 이긴다(tailwind-merge 동일 그룹 충돌 해소).
- 네이티브 경로 변경 없음(native.tsx 무수정) — 네이티브는 이미 flex 기본값.

### 1b. Combobox 빈 문자열 계약 반영

`ComboboxValue`가 `value=""`를 미선택으로 판정하도록 `combobox.tsx:327-330`의 `value != null` 검사를 보강한다. `""`는 지우기 관례상 "값 없음"이므로 플레이스홀더를 렌더한다. 라벨 결합 시에도 빈 문자열은 미선택으로 처리.

### 1c. Combobox 시각 정합 (형제 팝업 컴포넌트와 동일 규칙으로)

- 팝업 프레임: `border-0 ring-1 ring-foreground/10` → `border border-border` + `web:shadow-md` 유지. 현재 ring 값은 shadcn 원본(shadcn-ref/ui/combobox.tsx:119)의 토큰 그대로이므로 이 변경은 근사 교정이 아니라 **원본 대비 의도적 이탈**이다 — 사유는 select·dropdown·popover와의 UniKit 내부 형제 일관성이며, combobox 머리 주석에 이탈 사유를 명시해 재이식 시 무단 원복되지 않게 한다(9조 #3 충돌 판단 기록).
- 체크 표시자 컨테이너 `size-4` → `size-3.5`(select·dropdown과 동일, 내부 CheckIcon과 정렬).
- X 아이콘: 칩 제거 `size-3` → `size-3.5`(Clear와 통일; 칩의 `hover:text-foreground`는 웹 인터랙션 힌트로 유지).
- 입력행 우측 여백: Clear `mr-2`·트리거 `mr-3` → `mr-2`로 통일.
- 팝업 폭 w-72 고정은 overlay 계약상 문서화된 근사로 **유지**(앵커 폭 추종 미지원 — 머리 주석 기록 존재).
- 데모 트리거 높이: combobox 데모 트리거에 `h-9` 명시해 SelectTrigger(h-9)와 정합(데모 계층 수정, 공유 상수 `outlineTriggerClass`는 건드리지 않음).

### 1d. resizable 제약 prop 누설 제거

`ResizablePanel`이 제약 prop(`defaultSize`·`minSize`·`maxSize`)을 DOM View로 전개하지 않도록 구조분해로 걸러낸다.

### 1e. 데모 계층 아이콘 정리 (컴포넌트 본체 제외 — 데모는 Lucide 허용 방식 유지)

- 웹 kitchen-sink Toggle 데모 `★ 즐겨찾기` 글리프 → lucide 아이콘 방식으로 교체(form-controls 데모와 동일 규칙).
- 웹 Marker `↓` 글리프 → lucide `ArrowDown`(expo와 동일 렌더로 정합).
- 웹 EmptyMedia Inbox `size-7` → `size-6`(core-demos와 통일). expo Item Star `size={18}` → `size={16}`.

### 1f. 머리 주석 정독 (9조 #9 유지)

머리 주석이 "글리프 대체"를 주장하지만 본문은 이미 브리지 SVG 아이콘을 import하는 12종(dialog·sheet·select·dropdown-menu·command·combobox·context-menu·breadcrumb·pagination·carousel·native-select·menubar)의 주석을 실제 사용 사실로 갱신한다. 본문 로직 변경 없음. (G1 감사 F-5 — 초기 6종에서 12종으로 확대)

## 2. UI 상태·검증 기준 (Product/UX Designer)

- 상태 전이: 메뉴 항목 hover/selected/비활성 유지, 아코디언 열림·닫힘, combobox 빈(플레이스홀더)→선택(라벨)→지우기(플레이스홀더) 전이가 웹에서 모두 정상 관찰돼야 한다.
- 아이콘 규칙(단일화 기준): 트리거 보조 아이콘 `size-4 text-muted-foreground opacity-50 shrink-0`, 항목 체크 `size-3.5`, X 계열 `size-3.5`, checkbox `strokeWidth={3}` 원본 준수 유지.
- 접근성: Pressable role·accessibilityLabel 유지, 아이콘 aria-hidden 유지(브리지 제공), 키보드 포커스 링(web:focus-visible) 유지.
- 장식 추가 금지(anti-slop) — 이번 사이클은 정합 회복만. 새 색·그림자·카드 박싱 없음.

## 3. 태스크 분해 (T-* ↔ AC-* ↔ V-*)

| ID | 내용 | 담당 직군 | 수정 허용 파일 | 선행 |
|---|---|---|---|---|
| **T-1** | 브리지 웹 Pressable 기본값 `flex flex-col text-left` 부여 + 주석 갱신 (§1a) | Frontend/UI Engineer | `packages/unikit/src/bridge/web.tsx` | 없음 |
| **T-2** | ComboboxValue 빈 문자열 판정 보정 + 머리 주석 갱신 (§1b) | Frontend/UI Engineer | `src/components/combobox.tsx`, `registry/ui/combobox.tsx` | 없음 |
| **T-3** | Combobox 팝업 프레임 border 통일·아이콘 크기·여백 정합 (§1c) | Frontend/UI Engineer | `src/components/combobox.tsx`, `registry/ui/combobox.tsx` | T-2 (같은 파일 — 순차) |
| **T-4** | resizable 제약 prop 누설 제거 (§1d) | Frontend/UI Engineer | `src/components/resizable.tsx`, `registry/ui/resizable.tsx` | 없음 |
| **T-5** | stale 머리 주석 12종 갱신 (§1f) | Frontend/UI Engineer | `src/components/{dialog,sheet,select,dropdown-menu,command,combobox,context-menu,breadcrumb,pagination,carousel,native-select,menubar}.tsx` + `registry/ui/` 미러 | 없음 (T-2·3과 파일 공유 — 같은 웨이브 순차) |
| **T-6** | 웹·expo 데모 아이콘 정리 (§1e) + combobox 데모 트리거 `h-9` (§1c 말미) | Frontend/UI Engineer | `apps/web/app/showcase/kitchen-sink/page.tsx`, `apps/web/components/showcase/message-sections.tsx`, `apps/web/components/showcase/demos/core-demos.tsx`, `apps/web/components/showcase/demos/command-demos.tsx`, `apps/web/components/showcase/command-sections.tsx`, `apps/expo/components/showcase/message-sections.tsx`, `apps/expo/components/showcase/basic-sections.tsx` | 없음 |
| **T-7** | 통합 검증 V-1~V-7 실행·증거 기록 (`73-implementation-evidence.md`) | Frontend/UI Engineer(실행) | `docs/sdd/73-implementation-evidence.md` 신설 | T-1~T-6 |

파일 소유권: T-1과 T-6은 교집합 ∅. T-2·T-3·T-5는 `combobox.tsx`를 공유하므로 단일 웨이브에서 순차 수행한다(단일 구현 컨텍스트로 묶어 실행 — 교집합 ∅ 규칙은 병렬 스폰에만 적용).

## 4. 검증 (V-*)

| ID | 검증 | 방법 | 커버 AC |
|---|---|---|---|
| **V-1** | 타입 체크 | 루트 `bun run typecheck` exit 0 | AC-6·8 |
| **V-2** | 디자인 감사 | 루트 `bun run audit:design` exit 0 (8검사) | AC-8 |
| **V-3** | 웹 빌드 | `cd apps/web && bun run build` exit 0 | AC-8 |
| **V-4** | 렌더 관찰 (브라우저) | next dev :3000에서 `/showcase`·`/showcase/combobox`·`/showcase/kitchen-sink` 전 페이지 스윕(§5 전면 스윕과 범위 일치 — G1 감사 F-2): ① `flex-row` 버튼 중 `display: block` 0개 ② 메뉴·아이템 텍스트 좌측 정렬 ③ 아코디언 제목·chevron 같은 행 ④ combobox 빈 값 플레이스홀더·선택 라벨·지우기 전이 ⑤ React 경고 0 ⑥ 아이콘 규칙 실측: 체크 표시자 컨테이너 `size-3.5`, X 계열 `size-3.5`, 데모 Star 16px·ArrowDown·Inbox `size-6` (AC-5) ⑦ flex 계열 클래스 없는 단일 자식 Pressable(CollapsibleTrigger 등)이 기본 flex-col 전환 후에도 의도대로 렌더되는지 눈 관찰 (G1 감사 F-6) — 수정 전/후 스크린샷 첨부 | AC-1~5·7 |
| **V-5** | 네이티브 회귀 | `cd apps/expo && bunx tsc --noEmit`·`bunx expo export --platform web` exit 0 | AC-6 |
| **V-6** | 트리 동기 | `src/components` ↔ `registry/ui` diff — 본문 차이 0(import 경로 제외) | AC-8 |
| **V-7** | 제약 | `git status` — 커밋 0·생성물 미편집 | AC-8 |

## 5. 리스크와 대응

- **Pressable 기본 flex가 기존 block 의존 usage를 깰 가능성**: 전면 V-4 스윕(kitchen-sink 전 페이지 + 주요 페이지)으로 확인하고, 문제 usage에만 명시 클래스(`block` 등)를 국소 부여하는 원칙. 컴포넌트 본체 일괄 재작성은 하지 않는다.
- **registry 소비자 전파**: 소비자는 npm 패키지(브리지)를 통해 기본값 수혜 — 본사본 소스는 미러 동기만 유지. 게시·버전 올림은 사용자 요청 시 별도.
- **icon class 충돌**: tailwind-merge가 `size-*`·`text-*` 그룹 충돌을 해소하는 기존 구조 유지 — 새 병합 규칙 금지.
