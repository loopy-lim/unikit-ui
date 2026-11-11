# 사이클 70 조사 보고 — 웹 렌더 일관성 붕괴 원인

- 작성: Codebase Researcher(스폰, 독립 컨텍스트) + 오케스트레이터 렌더 관찰 병합 · 2026-11-11
- 기준 리비전: `62a941e` (main, 클린) · 방법: 소스·git diff 대조(스폰 36도구) + localhost:3000 실제 브라우저 DOM 실측(오케스트레이터)

## 1. 핵심 원인 — 브리지 웹 Pressable display 기본값 부재 (렌더 붕괴의 대부분)

- `packages/unikit/src/bridge/web.tsx:112` — **View**는 `cn("flex flex-col", className)`으로 RN 기본값(display:flex, flexDirection:column)을 재현한다.
- `packages/unikit/src/bridge/web.tsx:157-202` — **Pressable**은 `<button className={className}>`으로 기본 클래스 없이 렌더한다. RN에서 Pressable도 View 계열이라 기본이 flex인데 웹에서만 누락.
- 결과(브라우저 실측): `flex-row` 등 방향 클래스만 넘기는 컴포넌트가 웹에서 `display: block`으로 렌더. kitchen-sink에서 해당 상태 button **56개**(dropdown-menu·context-menu·menubar·command·combobox·select·pagination 항목, accordion 트리거 등). justify-between·items-center 같은 배치 클래스가 무력화되고 자식이 세로 적층된다(아코디언에서 제목과 chevron이 다른 행으로 적층 — 스크린샷 확보).
- 추가로 `<button>` 브라우저 기본 `text-align: center`가 노출돼 항목 텍스트가 전부 가운데 정렬된다(실측: combobox 항목 "사과" — 항목 폭 272px, 좌측 오프셋 111px).
- 역사: 81f3c2e(아이콘 커밋)는 Pressable 정의를 건드리지 않았다. 이 결함은 브리지 도입(464c525) 이후 존재하는 구조 결함으로, 메뉴가 열린 상태의 실물 관찰이 이전 사이클 G4에서 정적 렌더 대체입증으로 이뤄지지 않아 남아 있던 것.

## 2. ComboboxValue 빈 문자열 오판

- 계약: 지우기의 "값 없음" 표현은 `onValueChange("")` 관례(`src/components/combobox.tsx:17-18` 머리 주석 명시).
- 결함: `ComboboxValue`의 선택 판정이 `combobox.value != null`(`combobox.tsx:327-330`)이라 `value=""`를 "값 있음"으로 봄 → `joined=""` → 빈 span 렌더(브라우저 실측: 트리거 span 빈 상태). 쇼케이스 데모가 `useState("")`로 시작(`apps/web/components/showcase/demos/command-demos.tsx:66`)해 플레이스홀더 "과일"이 안 보인다.

## 3. resizable defaultSize DOM 누설

- `src/components/resizable.tsx` — `ResizablePanel`이 제약 prop(`defaultSize` 등)을 구조분해 없이 View에 `{...props}`로 전개(resizable.tsx:197·209 부근)해 React 경고(`defaultSize` DOM 인식 불가) 발생. 그룹이 Panel에 주입하는 것은 index뿐이다. Next dev "1 Issue" 배지의 정체. (G1 감사 트리아지로 경로 문구 정정)

## 4. Combobox 시각 일관성 (코드 대조 — 스폰 조사)

1. 팝업 프레임: `ComboboxContent`(`combobox.tsx:463`) `border-0 ring-1 ring-foreground/10` vs Select(select.tsx:343 오버라이드가 popover.tsx:144 기본 카드 `border border-border`를 통과)·Dropdown(`dropdown-menu.tsx:169`) `border border-border` — 같은 페이지에서 인접한 팝업끼리 테두리 토큰·톤이 다름. 참고: ring 값 자체는 shadcn 원본(shadcn-ref/ui/combobox.tsx:119) 토큰 그대로다. (G1 감사 F-3·F-4로 인용·성격 정정)
2. 팝업 폭: popover 기본 `w-72`(288px) 그대로라 트리거(w-40/w-44)보다 항상 넓게 열림 — `combobox.tsx:31` 주석이 명시한 근사. SelectContent는 `w-auto min-w-32`와 다른 동작. (본 설계에서 처리 여부는 G1 판단 사항 — 앵커 폭 추종은 overlay 계약 밖이라 문서화된 한계)
3. 트리거 높이: 쇼케이스 combobox 데모 트리거가 `outlineTriggerClass`(section.tsx:35-39 → button 기본 h-10)인데 SelectTrigger는 h-9 — 나란히 배치 시 4px 차.
4. 체크 표시자 컨테이너: `combobox.tsx:576` `size-4` vs select.tsx:417·dropdown-menu.tsx:188 `size-3.5`(내부 CheckIcon은 3곳 모두 size-3.5) — combobox만 중심 2px 어긋남.
5. X 아이콘 혼용: 칩 제거 `size-3 hover:text-foreground`(:652) vs Clear `size-3.5` 무호버(:367), 입력행 우측 여백 Clear `mr-2`(:415) vs 트리거 `mr-3`(:420).
6. 플레이스홀더·트리거 체브론 자체는 select와 동일 규칙으로 정상(select.tsx:300-303·274 대조).

## 5. 아이콘 시스템 구조 (스폰 조사)

- 브리지 자체 SVG 아이콘 19종: web `createWebIcon`(web.tsx:676-706, viewBox 24·stroke currentColor·기본 `size-4`), native `createNativeIcon`(native.tsx:804-834, react-native-svg, size 기본 16). 정의·색·기본 크기는 일관적. checkbox의 `strokeWidth={3}`은 원본 준수(정상).
- 데모 계층: `apps/web` lucide-react@^1.71.0, `apps/expo` lucide-react-native@^1.71.0 (81f3c2e 추가). 컴포넌트 본체(브리지 SVG)와 데모(Lucide)가 이중화 — 본체는 새 의존성 금지 규칙 유지, 데모만 Lucide 허용이 현재 확립 방식.
- 잔여 불일치:
  - 웹 kitchen-sink Toggle 데모에 텍스트 글리프 `★ 즐겨찾기` 잔존(`apps/web/app/showcase/kitchen-sink/page.tsx:413`) — 같은 웹 앱의 Toggle 데모(form-controls-demos.tsx)는 아이콘 전용으로 교체됨.
  - Marker 아이콘: 웹은 `↓` 글리프(`apps/web/components/showcase/message-sections.tsx:150`), expo는 lucide ArrowDown(`apps/expo/components/showcase/message-sections.tsx:152`) — 플랫폼 간 렌더 불일치.
  - EmptyMedia 아이콘 크기: 웹 Inbox size-6(core-demos.tsx:377) vs 웹 kitchen-sink size-7(kitchen-sink/page.tsx:547).
  - Item Star: 웹 size-4 vs expo size={18}.
  - 트리거 체브론류는 `text-muted-foreground opacity-50 shrink-0`로 통일돼 있고 calendar·pagination·carousel은 부모 전경색 상속(원본 대응 — 의도적, 유지).

## 6. src ↔ registry 동기

61=61. 차이 9개 파일 전부 `cn` import 경로 한 줄(`../lib/utils` vs `@/lib/utils`) — 본문 동기 양호.

## 7. 검증 환경 (V-* 정의 근거)

- `bun run typecheck`(루트, 3패키지), `bun run audit:design`(8검사), `cd apps/web && bun run build` — 전부 실재·실행 확인.
- 렌더 관찰: `cd apps/web && bun run dev`(next dev, :3000) + 브라우저 DOM 실측 — 이번 사이클에서 프리뷰 도구 가용 확인(사이클 40과 다름).
- 네이티브: `cd apps/expo && bunx tsc --noEmit`·`bunx expo export --platform web`(선례 명령 실재).
