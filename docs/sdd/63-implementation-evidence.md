# 사이클 60 구현 및 검증 증거 (G2~G5) — 패딩 정합 및 스페이싱 디자인 시스템

- 작성: Platform & Verification Engineer (role-perspective self-execution) · 2026-11-10
- 기준: `docs/sdd/60-requirements.md` (AC-1 ~ AC-7), `docs/sdd/62-design-plan.md` (T-1 ~ T-5)

---

## 1. 구현 내역 (Tasks)

### T-1: 디자인 시스템 Spacing 규격 수립 (`docs/spacing.md`)
- 4px/8px 배수 기반의 Base Spacing Scale 정의 (`space-1` ~ `space-20`).
- 글로벌 컨테이너 기준선(`max-w-7xl`, `px-4 sm:px-6 lg:px-8`) 명문화.
- 서피스(`Card`, `DemoPanel`, `CodeBlock`) 인셋 및 마크업 규칙 제정.

### T-2: 쇼케이스 셸(`docs-shell.tsx`) 정합
- `DocsHeader`: 컨테이너 거터를 `px-4 sm:px-6 lg:px-8`로 조정하여 랜딩과 1:1 일치.
- `DocsShell`: 바깥 레이아웃 래퍼에 `max-w-7xl px-4 sm:px-6 lg:px-8`을 적용하여 헤더와 사이드바 좌측선 완벽 수직 정렬.
- `DocsSidebar`: 너비 `w-60 lg:w-64`, 우측 패딩 `md:pr-6 lg:pr-8`로 경계선 정돈.
- `DocsMain`: `pb-16 pt-6 sm:pt-8 md:pl-8 lg:pl-10`으로 여백 재정비.
- `DemoPanel`: 탭 바 `px-3 py-2`, 프리뷰 스테이지 `p-6 sm:p-8 min-h-44`, 내부 컨테이너 `max-w-xl`로 쾌적한 공간 확보, 코드 뷰 `p-4 sm:p-5 text-[13px] leading-6`.
- `PreviewFrame` & `CodeBlock`: `p-6 sm:p-8` 및 `max-w-xl`, `px-4 py-2` 헤더 인셋 적용.

### T-3: 랜딩 페이지(`landing.tsx`) 정합
- `SiteNav`: `max-w-7xl px-4 sm:px-6 lg:px-8 h-16`으로 쇼케이스 헤더와 동일 기준선 확립.
- `Hero`: 전폭 `border-b border-border/60 py-14 sm:py-16 lg:py-20`, 내부 `max-w-7xl px-4 sm:px-6 lg:px-8`.
- `ValueSection`: 중간에 끊기던 1024px 보더 제거, 전폭 `border-b py-14 sm:py-16 lg:py-20`, 내부 `max-w-7xl px-4 sm:px-6 lg:px-8`.
- `InstallSection`: 전폭 `border-b py-14 sm:py-16 lg:py-20`, 내부 `max-w-7xl px-4 sm:px-6 lg:px-8`.
- `TeaserSection`: `py-14 sm:py-16 lg:py-20`, 내부 `max-w-7xl px-4 sm:px-6 lg:px-8`.
- `Footer`: `border-t border-border/60 py-10`, 내부 `max-w-7xl px-4 sm:px-6 lg:px-8`.

### T-4: 쇼케이스 상세 뷰 및 인덱스 정합
- `apps/web/app/showcase/page.tsx`: 자식 레벨의 불필요한 `pb-8` 제거, `w-full space-y-12`로 카드 그리드 전폭 활용.
- `apps/web/app/showcase/[name]/component-doc.tsx`: `pb-8` 중복 여백 제거, `max-w-3xl`에서 `max-w-4xl`로 확장하여 복합 컴포넌트(Table, Calendar, Chart 등)의 여백 확보.

---

## 2. 검증 증거 (Verification Evidence)

### V-1: 타입 검사 (Typecheck)
```bash
$ bun run typecheck
@unikit-bridge/ui typecheck: Done in 900 ms
@unikit/web typecheck: Types generated successfully, Done in 798 ms
@unikit/expo typecheck: Done in 989 ms
```
- 결과: **0 errors, exit 0**.

### V-2: 디자인 일관성 감사 (Audit Design)
```bash
$ bun run audit:design
[OK] (a1) globals.css 생성 영역 일치(1317B)
[OK] (a2) theme 항목 4/4종 — 값 8스킴 전수·형식·대비(≥4.5) 일치
[OK] (b) 원색 리터럴 0건 (대상 73파일, 값 정의 2파일 제외)
[OK] (c) 임의값 클래스 0건 (대상 122파일)
[OK] (d) registry 사본 62종 동일(import 치환 제외)
[OK] (e) files 경로 전부 실재(files 없는 theme 4종 외 66항목 검사)
[OK] (f) tokens.md 생성물과 byte 일치(4034B)
[OK] (g) Tailwind 팔레트 클래스 0건 (대상 122파일, 원본 인용 허용 24건)

audit:design PASS — 8/8 검사 통과
```
- 결과: **PASS (8/8 통과, exit 0)**.

### V-3: 웹 프로덕션 빌드 (Next.js Build & Export)
```bash
$ cd apps/web && bun run build
generate-registry-static: 66 items + registry.json → public/r
✓ Compiled successfully in 63ms
✓ Generating static pages using 8 workers (67/67) in 332ms
Finalizing page optimization in 511ms
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /showcase
├   /showcase/[name] (61 components)
└ ○ /showcase/kitchen-sink
```
- 결과: **정적 67개 라우트 빌드 성공, exit 0**.

### V-4: Expo 네이티브/웹 번들 검증
```bash
$ cd apps/expo && bun x expo export --platform web
Web Bundled 6872ms node_modules/expo-router/entry.js (1066 modules)
Static routes (4): / (index), /_sitemap, /+not-found, /component/[slug]
Exported: dist
```
- 결과: **정상 번들 산출, exit 0**.

---

## 3. 수락 조건(AC-*) 달성 여부

| ID | 수락 조건 | 판정 | 증거 |
|---|---|---|---|
| **AC-1** | 원인 분석 완전성 | **PASS** | `docs/sdd/61-research.md`에 토큰 부재, 거터 불일치, 수직 정렬 단절, 탭/프리뷰/코드 패딩 불균형 실측 수치 기록 완료 |
| **AC-2** | 디자인 시스템 스페이싱 규격 | **PASS** | `docs/spacing.md`에 4px/8px 배수 스케일 및 레이아웃/서피스 표준 제정 완료 |
| **AC-3** | 랜딩 ↔ 쇼케이스 기준선 정합 | **PASS** | 헤더 및 본문 컨테이너를 `max-w-7xl px-4 sm:px-6 lg:px-8`로 완전 통일하여 페이지 전환 시 로고 튐 0px 달성 |
| **AC-4** | 쇼케이스 헤더 ↔ 사이드바 ↔ 본문 수직 정렬 | **PASS** | `DocsShell` 컨테이너와 `DocsSidebar`의 좌측 정렬 축을 일치시키고 중복 `pb-8` 제거 |
| **AC-5** | 데모 프리뷰/코드 패딩 리듬 일관성 | **PASS** | `DemoPanel` 탭 바 `px-3 py-2`, 프리뷰 `p-6 sm:p-8`, 코드 `p-4 sm:p-5`, 내부 너비 `max-w-xl`로 쾌적한 여백 부여 |
| **AC-6** | 컴포넌트 마크업 결함 해소 | **PASS** | LiveDemo 카드 제거 및 컴포넌트 61종 소개 섹션으로 정비, Card 표준 3단 구조 수립 |
| **AC-7** | 전체 빌드 및 디자인 감사 통과 | **PASS** | `typecheck`(0에러), `audit:design`(8/8), `apps/web build`(67/67), `expo export` 전건 exit 0 |
