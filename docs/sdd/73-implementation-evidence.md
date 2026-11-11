# 사이클 70 구현 증거 (G2) — 웹 렌더 일관성 붕괴 수정

- 작성: Frontend/UI Engineer · 2026-11-11
- 입력: `72-design-plan.md`(T-1~T-6) · 기준 리비전 `62a941e` + 기존 미커밋 G0·G1 문서 보존
- 판정: 본 문서는 실행 증거 기록이며 PASS 자체 승인이 아니다 — 독립 평가 직군이 V-* 출력과 AC를 판정한다.

## 1. 태스크별 변경 (T-1~T-6)

### T-1 — 브리지 웹 Pressable 기본값 (§1a)

- `packages/unikit/src/bridge/web.tsx`: Pressable(157행 부근)의 `<button>` className을
  `className={className}` → `className={cn("flex flex-col text-left", className)}`으로 변경.
  View(112행)의 `cn("flex flex-col", className)`과 동일 규칙 + `<button>` 브라우저 기본
  `text-align: center` 리셋(`text-left`). `cn`은 동일 파일 39행에서 기존 import된 것을 사용
  (새 import 없음). 네이티브 경로(native.tsx)는 무수정.
- Pressable 섹션 머리 주석에 기본값 사유 추가: RN View 계열 기본 display:flex·column 재현
  (View와 동일 규칙), `<button>` text-align:center를 시작 정렬로 되돌림, 호출자 클래스가
  tailwind-merge로 이긴다는 점을 한두 줄 기록.

### T-2 — ComboboxValue 빈 문자열 판정 (§1b)

- `packages/unikit/src/components/combobox.tsx` + `registry/ui/combobox.tsx` 미러:
  ComboboxValue(323행 부근) 선택 판정을 `combobox.value != null` →
  `combobox.value != null && combobox.value !== ""`로 보정. `""`는 지우기 관례상
  "값 없음"(파일 머리 주석 17-18행 계약)이므로 `value=""`일 때 플레이스홀더를 렌더한다.
- 머리 주석에 판정 근거 한 줄 추가: "ComboboxValue도 빈 문자열을 미선택으로 판정해
  플레이스홀더를 렌더한다（value != null && value !== \"\"）".

### T-3 — Combobox 시각 정합 (§1c) — T-2와 같은 파일 순차 수행

`combobox.tsx` src+미러 5곳:

1. ComboboxContent(462행 부근) className: `border-0 p-0 ring-1 ring-foreground/10 …` →
   `p-0 web:max-h-96 web:overflow-y-auto web:shadow-md`. popover.tsx:144 기본 카드의
   `border border-border`를 통과시켜 select·dropdown과 테두리를 통일. 콘텐츠 내부에
   이탈 사유 주석 2줄 추가.
2. 선택 표시자 컨테이너(ComboboxItem 내부): `size-4` → `size-3.5`
   (select.tsx:417·dropdown-menu.tsx:188과 동일, 내부 CheckIcon size-3.5와 정렬).
3. 칩 제거 X(ComboboxChip 내부): `size-3` → `size-3.5`(Clear size-3.5와 통일,
   `hover:text-foreground` 유지).
4. 입력행 트리거 여백(ComboboxInput 내부): `mr-3` → `mr-2`(Clear의 mr-2와 통일).
5. 머리 주석 갱신: ① 아이콘 항목을 "CheckIcon·ChevronDownIcon·XIcon — 브리지 SVG 아이콘
   프리미티브（@unikit-bridge/ui/primitives）를 사용한다"로 정정(글리프 대체 주석 제거).
   ② ring 근사 기록을 "원본（shadcn-ref/ui/combobox.tsx:119）의 ring-1
   ring-foreground/10에서 border border-border로 의도적 이탈 — 사유: select·dropdown·
   popover와 내부 형제 일관성"으로 교체(9조 #3 충돌 판단 기록).

### T-4 — resizable 제약 prop 누설 제거 (§1d)

- `packages/unikit/src/components/resizable.tsx` + 미러: ResizablePanel(196행 부근) 파라미터
  구조분해에 `defaultSize: _defaultSize`·`minSize: _minSize`·`maxSize: _maxSize`를 추가해
  View(DOM)에 전개되지 않게 걸러냄(React 알 수 없는 prop 경고 제거 — AC-7).
- 내부 주입 prop 확인: 그룹이 Panel에 주입하는 것은 `index`뿐이고 index는 기존 구조분해
  (`index = -1`)로 이미 걸러져 DOM 누설 없음. ResizableHandle도 `withHandle`·`index`를
  이미 구조분해 중 — 추가 정리 불필요로 확인.

### T-5 — stale 머리 주석 12종 갱신 (§1f) — 본문 로직 변경 0

각 파일의 실제 import를 확인 후 주석을 사실에 맞게 갱신 (src+registry 미러 동시):

| 파일 | 실제 import(확인) | 주석 정정 내용 |
|---|---|---|
| dialog.tsx | XIcon | "✕ 글리프 Text" → 브리지 SVG 아이콘 프리미티브 |
| sheet.tsx | XIcon | 동일 |
| select.tsx | CheckIcon·ChevronDownIcon·ChevronUpIcon | "⌄/✓ 글리프 Text" → 브리지 SVG 아이콘(트리거·표시자·스크롤 버튼) |
| dropdown-menu.tsx | CheckIcon·ChevronRightIcon | "✓/› 글리프 Text" → 브리지 SVG 아이콘, CircleIcon 점 View 근사는 유지 기술 |
| command.tsx | SearchIcon | "⌕ 글리프 Text" → 브리지 SVG 아이콘 |
| context-menu.tsx | CheckIcon·ChevronRightIcon | dropdown-menu와 동일 정정 |
| combobox.tsx | CheckIcon·ChevronDownIcon·XIcon | T-3에서 수행 |
| breadcrumb.tsx | ChevronRightIcon·MoreHorizontalIcon | "›/⋯ 글리프 Text" → 브리지 SVG 아이콘 |
| pagination.tsx | ChevronLeftIcon·ChevronRightIcon·MoreHorizontalIcon | "‹/› 글리프 Text" → 브리지 SVG 아이콘, Previous/Next "글리프+라벨" → "아이콘+라벨", 본문 `paginationGlyphVariants` 위 주석도 export API 호환용임을 명시(이름 유지) |
| carousel.tsx | ArrowLeftIcon·ArrowRightIcon·ArrowUpIcon·ArrowDownIcon | "←/→/↑/↓ 글리프" → 브리지 SVG 아이콘 + 위/아래 아이콘 교체 근사 기술 |
| native-select.tsx | ChevronDownIcon | "⌄ 글리프（ChevronDownIcon 근사）" → 브리지 SVG 아이콘 |
| menubar.tsx | 아이콘 import 없음(dropdown-menu 소비) | "같은 글리프 관행" → "브리지 SVG 아이콘 관행" |

- 한계: native-select.tsx 본문 102행의 `// 오른쪽 ⌄ 글리프 공간（원본 pr-9）`은 본문 주석이라
  T-5 명세(머리 주석만 갱신)에 따라 그대로 뒀다 — 다음 주석 정정 시 후보.

### T-6 — 데모 계층 정리 (§1e + §1c 말미)

1. `apps/web/app/showcase/kitchen-sink/page.tsx`: Toggle 데모 `★ 즐겨찾기` 텍스트 글리프 →
   `<Star className="size-4" />`(lucide-react, form-controls-demos.tsx:116 Bookmark 데모와
   동일 패턴·크기 — Star는 동일 파일 13행 기존 import 사용).
2. `apps/web/components/showcase/message-sections.tsx`: MarkerIcon 내부
   `<Text …>↓</Text>` → `<ArrowDown size={12} className="text-muted-foreground" />`
   (lucide-react, apps/expo/components/showcase/message-sections.tsx:152와 동일 렌더 —
   expo 파일은 참조만 하고 무수정). `Text`는 동일 파일 타 곳에서 사용 중이라 import 유지.
3. `apps/web/app/showcase/kitchen-sink/page.tsx`: EmptyMedia Inbox `size-7` → `size-6`
   (core-demos.tsx:377과 통일). core-demos.tsx는 무수정(수정 불필요).
4. `apps/expo/components/showcase/basic-sections.tsx`: Item Star `size={18}` → `size={16}`.
5. `apps/web/components/showcase/demos/command-demos.tsx`(69행)·
   `apps/web/components/showcase/command-sections.tsx`(96행): combobox 데모 트리거
   className에 `h-9` 명시(`cn(outlineTriggerClass, "h-9 w-40 justify-between")` 등 —
   SelectTrigger h-9와 정합). 공유 상수 `outlineTriggerClass`는 무수정.

## 2. 검증 실행 증거 (V-1·V-2·V-5·V-6·V-7)

### V-1 타입 체크 — 통과

- 명령: 루트 `bun run typecheck`
- 종료 코드: 0
- 핵심 출력: `@unikit-bridge/ui typecheck: Exited with code 0` · `@unikit/expo
  typecheck: Exited with code 0` · `@unikit/web typecheck: Exited with code 0`
  (웹은 "Generating route types… ✓ Types generated successfully" 후 종료) — 3패키지 전부 0.

### V-2 디자인 감사 — 통과

- 명령: 루트 `bun run audit:design`
- 종료 코드: 0
- 핵심 출력: `audit:design PASS — 8/8 검사 통과`. 세부: (a1) globals.css 생성 영역 일치 ·
  (a2) theme 4/4종 · (b) 원색 리터럴 0건(73파일) · (c) 임의값 클래스 0건(122파일) ·
  (d) registry 사본 62종 동일(import 치환 제외) · (e) files 경로 전부 실재(66항목) ·
  (f) tokens.md byte 일치 · (g) Tailwind 팔레트 클래스 0건.

### V-3 웹 빌드 — 통과 (실행: 오케스트레이터)

- 명령: `cd apps/web && bun run build` (dev 서버 정지 후 실행 — `.next` 충돌 회피)
- 종료 코드: 0
- 핵심 출력: `✓ Generating static pages (67/67)` — 67개 정적 페이지 생성·route table 출력.
  prebuild(`generate:registry` → `public/r/*.json`) 포함 정상.

### V-4 렌더 관찰 (브라우저) — 통과 (관찰: 오케스트레이터 · 독립 판정: 평가 직군 예정)

- 환경: `cd apps/web && bun run dev`(:3000, Next 16.4.5 Turbopack) + 프리뷰 브라우저 DOM 실측.
  대상 페이지: `/showcase`·`/showcase/combobox`·`/showcase/kitchen-sink`.
- ① AC-1: kitchen-sink에서 `flex-row` 클래스 보유 button 전수 계산 — **119개 중
  `display: block` 0개**(수정 전 56개). 전부 flex 렌더.
- ② AC-2: combobox 항목 "사과" — 항목 폭 기준 좌측 오프셋 8px·`text-align: left`(수정 전
  중앙 offset 111px). dropdown-menu 항목도 동일 실측(좌측 오프셋 8px). getComputedStyle 기준.
- ③ AC-3: 아코디언 트리거 제목(좌)·chevron(우) 같은 행 — 부모 폭 기준 chevron 우측 정렬
  (justify-between 유효). 스크린샷: `docs/sdd/evidence/70-after-accordion-row.png`.
- ④ AC-4: combobox 트리거가 초기(`value=""`)에 플레이스홀더 "과일" 표시 → "바나나" 선택 시
  라벨 표시·팝업 닫힘. 스크린샷: `docs/sdd/evidence/70-after-combobox-label.png`.
- ⑤ AC-7: 페이지 전환 스윕 동안 React 경고 0건 — `defaultSize` DOM 경고 소멸(수정 전
  dev 서버 로그에 재현 확인된 상태).
- ⑥ AC-5: combobox 항목 체크 표시자 컨테이너 14px(`size-3.5`) 실측, 팝업 프레임
  `border 1px` + border-border 색. kitchen-sink Toggle Star 16px(lucide), Inbox 24px
  (`size-6`), Marker ArrowDown 12px 실측.
- ⑦ flex 계열 클래스 없는 단일 자식 Pressable(CollapsibleTrigger 등) — 기본 flex-col
  전환 후에도 의도대로 렌더(텍스트·보조 아이콘 세로 적층 없음, kitchen-sink + /showcase
  전 페이지 육안). §5 리스크 1(기존 block 의존 usage 파손)에 해당하는 사용처 미발견.

### V-5 네이티브 회귀 — 통과

- 명령 1: `cd apps/expo && bunx tsc --noEmit` — 종료 코드 0 (출력 없음 = 오류 없음).
- 명령 2: `cd apps/expo && bunx expo export --platform web` — 종료 코드 0.
  핵심 출력: `Exported: dist`, Static routes 4개(/·/_sitemap·/+not-found·/component/[slug]).
  (dist 산출물 갱신을 수반 — 선례상 허용된 검증. dist는 버전 관리 대상 아님.)

### V-6 트리 동기 — 통과

- 방법: 수정한 13종(src/components ↔ registry/ui) `diff` 전수.
- 결과: combobox·command는 `import { cn } from "../lib/utils";` ↔ `import { cn } from
  "@/lib/utils";` 한 줄 차이뿐(기존 차이 유지 — 현행 9개 파일 규칙). resizable·dialog·sheet·
  select·dropdown-menu·context-menu·breadcrumb·pagination·carousel·native-select·menubar는
  diff 0(원래 상대 경로를 쓰는 파일들 — 조사 71-research §6의 9종 외 파일 규칙).
  본문 차이 0.
- 보강: audit:design (d) 검사가 "registry 사본 62종 동일(import 치환 제외) OK"로 전수 확인.

### V-7 제약 — 통과

- 명령: `git status --porcelain`
- 결과: 커밋 0(스테이지 없음, HEAD = `62a941e` 유지). 변경(M) 32파일은 모두 허용 경계 내:
  `src/bridge/web.tsx` 1 · `src/components` 13 · `registry/ui` 13 · apps/web 4
  (kitchen-sink page·message-sections·command-sections·demos/command-demos) · apps/expo 1
  (basic-sections). 미출력(무수정): core-demos.tsx·expo message-sections.tsx.
- 기존 미커밋 변경 훼손 없음: `docs/sdd/70-requirements.md`·`71-research.md`·
  `72-design-plan.md`·`docs/sdd/evidence/70-before-*.png` 2종이 `??`(untracked)로 그대로.
- 생성물(globals.css 토큰 블록·registry.json theme·tokens.md)·shadcn-ref/ 무편집
  (git status에 부재로 확인).

## 3. 남은 한계·우려

1. **Pressable 기본 `flex flex-col`의 usage 영향(잔여 리스크)** — V-4 스윕 범위(/showcase,
   /showcase/combobox, /showcase/kitchen-sink)에서는 파손 usage 미발견. 스윕 밖 페이지나
   소비자 프로젝트의 `block`·`inline` 의존 usage는 국소 `block` 부여가 필요할 수 있다(계획
   §5 원칙 유지).
2. **본문 글리프 주석 잔여 3곳** — `native-select.tsx:103`(기록) 외에 G5 감사 렌즈가 신규
   확인: `carousel.tsx:278`(본문은 이미 ArrowLeft/RightIcon 사용 — stale)·
   `combobox.tsx:675`. 후속 주석 정정 시 함께 정리.
3. **expo export가 apps/expo/dist를 재생성**했다 — gitignore 대상이라 작업 트리에 영향 없음.
4. **팝업 폭 w-72 고정**은 이번 범위 밖(overlay 계약상 문서화된 근사 — 머리 주석 기록 존재).

## 4. 독립 평가 판정·결함 처리 (G2·G3)

- G3 Staff Code Reviewer — **PASS**. tailwind-merge 3.7.0으로 Pressable 기본 클래스 대비
  호출자 승부 실증(호출자 `flex-row`·`text-center`·`hidden`·`inline` 전부 이김),
  Pressable 사용처 28파일 전수에서 다중 자식 소비는 명시 `flex-row` 전달 확인,
  ComboboxValue·resizable·미러 동기·주석 전용 파일(본문 변경 0, 실측 11쌍) 독립 검증,
  typecheck·audit·웹 빌드 직접 재실행 통과. 비차단 참고 P3 1건(native-select 본문 주석 —
  §3.2와 동일 항목).
- G2 Task QA Validator — **PASS**. T-1~T-7 전부 통과, AC-1~AC-8 증거 충족 판정
  (브라우저 재관찰 불가 항목은 73 기록·PNG 4종 실재성·정합성 대조로 검증했음을 명시).
  비차단 결함 2건 반환:
  - **F-1(P3, 수정함)** — expo combobox 데모 트리거(`apps/expo/components/showcase/
    command-sections.tsx:97`)에 `h-9` 미명시(웹 데모 T-6 5항과 동일 정합 작업의 expo
    잔여 — 계획 T-6 파일 목록 누락). 처리: `"w-44 justify-between"` →
    `"h-9 w-44 justify-between"` 추가(웹 command-sections.tsx:96과 동일 패턴). 재검증:
    루트 `bun run typecheck` 3패키지 exit 0(위 기록). 데모 계층 1행이라 웹·패키지
    스냅샷 불변 — G3 리뷰 대상 영향 없음.
  - **F-2(P3, 수정함)** — 본 문서의 native-select 본문 주석 행번호 102→103 정정
    (주석 추가로 시프트된 실제 위치).
- F-1·F-2 외 잔여: §3.2(native-select 본문 주석 표현)는 후속 주석 정정 후보로 유지.

## 5. G4 판정·증거 보강

- G4 UX/Design Auditor — **PASS**. 상태 전이(아코디언 적층→같은 행, combobox 빈 트리거→
  플레이스홀더→선택 라벨, 메뉴 항목 중앙→좌측 정렬)를 before/after 스크린샷 6종에서 직접
  관찰해 판정. 팝업 프레임·아이콘 규칙의 형제 일관성 확인, anti-slop 위반(새 색·그림자·
  장식 유입) 0건. 코드 지점 5곳을 읽기 전용으로 대조해 기록과 정합 확인.
- 증거 보강 참고 3건 중 2건을 오케스트레이터가 즉시 보강 (G4 판정 이후 추가 관찰):
  - **참고 2 일부 해소** — select 팝업 개방 관찰: `/showcase/select` "언어" 트리거 클릭 →
    항목 한국어·영어 `text-align: left`, 카드 프레임 `1px rgb(228,228,231)`(border-border) +
    그림자 — combobox·dropdown과 동일 프레임 토큰. 스크린샷:
    `docs/sdd/evidence/70-after-select-open.png`.
  - **참고 3 해소** — 키보드 단독 조작 관찰: Tab으로 컴포넌트 버튼(복사) 포커스 —
    `:focus-visible` 매칭·링 box-shadow 렌더 확인. Shift+Tab으로 combobox 트리거 포커스
    (같은 링), Enter로 팝업 개방(항목 2개 렌더), Escape로 닫힘·트리거로 포커스 복귀
    (options 0·focusVisible true). 스크린샷(키보드 링 + 열린 팝업 + 선택 표시자 ✓):
    `docs/sdd/evidence/70-after-combobox-keyboard-focus.png`.
  - **참고 1 미보강(기록 유지)** — 쇼케이스 단일 선택 데모에 지우기 어포던스(X)가 없어
    UI로 "지우기→플레이스홀더" 전이를 구동할 수 없다. 전이는 상태 구동(`onValueChange("")`)
    이고 "" 상태 렌더(플레이스홀더)는 초기 상태·70-after-combobox-popup-open.png가 그대로
    대변한다(G4 동일 판단). 데모에 지우기 어포던스 추가는 후속 후보.
  - 참고 2의 아이콘 실측 수치(Star 16px·Inbox 24px·ArrowDown 12px·표시자 14px)는
    코드+V-4 기록 근거로 유지(별도 캡처 없음 — G4가 기록 근거임을 명시한 범위).

## 6. G5 최종 판정 (Release Gatekeeper, completion 모드)

- **PASS** — AC-1~AC-8 전 건 충족. 게이트키퍼가 최종 상태를 직접 재확인: 브라우저 재관찰
  4건(flex-row 버튼 119개 중 block 0·항목 좌측 8px·아코디언 same-row·combobox
  플레이스홀더→라벨 전이·resizable DOM 속성 0), 명령 3종 재실행(typecheck 3패키지·
  audit 8/8·웹 빌드 exit 0), 미러 13쌍 diff 전수, 커밋 0·기존 미커밋 보존 확인.
- AC-4의 "지우기→플레이스홀더" UI 구동 전이만 미관찰(데모에 지우기 어포던스 부재) —
  AC 문면(빈 값 렌더·선택 라벨)은 충족, 후속 후보로 기록.
- 잔여 한계 5건(§3·위)은 전부 비차단. 커밋은 사용자 요청 시점에 남는다(AC-8 제약 유지).
