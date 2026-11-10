# 사이클 60 요구 정의 (G0) — 디자인 시스템 패딩·간격 체계화 및 사이트 레이아웃 정합

- 작성: Product Manager (role-perspective self-execution) · 2026-11-10
- 원 요청: «/sdd 지금 사이트를 보면 기본적인 패딩 모두 잘 안맞는데 이 부분들을 왜 안맞는지 확인해주고, 맞추도록 해서 디자인 시스템을 어떻게 해줄래?»
- 기준 리비전: `eadf2a7`

## 1. 배경 및 문제 의식

사이트(소개 랜딩 `/` 및 쇼케이스 `/showcase`, `/showcase/[name]`) 전반에 걸쳐 여백(Padding), 정렬 기준선(Grid / Alignment), 내부 인셋(Inset)이 시각적으로 일치하지 않고 어긋나 보이는 현상이 발생하고 있다.

근본 원인 분석 결과:
1. **디자인 토큰 차원의 Spacing Token 부재**: UniKit의 `tokens.ts`에는 색상(19종)과 반경(`--radius: 0.5rem`)만 정의되어 있을 뿐, 간격/패딩(Spacing Scale, Layout Gutter, Section Spacing, Surface Padding)에 대한 토큰이나 규격이 전혀 정의되어 있지 않다.
2. **페이지 간 레이아웃 기준선(Grid / Container) 불일치**:
   - 랜딩(`/`): 최대 폭 `max-w-5xl`(1024px), 좌우 거터 `px-4 sm:px-6`(16px/24px)
   - 쇼케이스(`/showcase`): 헤더 `max-w-7xl px-6 sm:px-8`(1280px, 24px/32px), 사이드바 `px-5`/`px-6`, 본문 `px-6 sm:px-8 lg:px-10`, 내부 인덱스 `max-w-5xl`, 상세 `max-w-3xl`
   - 페이지 전환 시 헤더 로고 및 컨텐츠 좌측 시작선이 100px 이상 도약(Jump)하며, 헤더와 사이드바의 수직 정렬 라인이 불일치.
3. **컴포넌트 뷰(`DemoPanel`, `PreviewFrame`, `CodeBlock`) 인셋 불균형**:
   - `DemoPanel` 상단 탭은 `p-1.5`(6px), 프리뷰 영역은 `px-6 py-8 sm:px-8 sm:py-10`(32px/40px), 하단 코드 영역은 `px-4 py-5`(16px/20px)로 내부 패딩 리듬이 급변함.
   - 프리뷰 내부가 `max-w-md`(448px)로 과도하게 좁게 갇혀 Table, Chart, Command, Calendar 등이 답답하게 눌리거나 좌우 불균형 발생.
4. **컴포넌트 인셋 불일치 및 마크업 중첩 결함**:
   - `landing.tsx`의 LiveDemo 카드에서 `CardFooter`가 `CardContent` 내부에 중첩되어 `px-0 pt-2`로 해킹되어 있음.
   - 폼 컨트롤에서 동일 높이(`h-10`) 기준 `Button`은 `px-4`(16px)이나 `Input`은 `px-3`(12px)로 인셋이 4px 어긋남.

## 2. 목표

1. **원인 규명 및 문서화**: 사이트 전체에서 패딩이 어긋나는 원인을 레이아웃·컴포넌트·토큰 3계층으로 명확히 규명한다.
2. **디자인 시스템 스페이싱 체계(Spacing System) 확립**: UniKit의 철학(웹+네이티브 브리지, shadcn 규격 호환)을 해치지 않으면서 일관된 4px/8px 스페이싱 스케일과 컨테이너·서피스·인셋 표준 가이드를 제정한다.
3. **사이트 전면 레이아웃 정합(Layout Harmonization)**: 랜딩과 쇼케이스의 좌우 거터, 최대 폭 기준선, 헤더/사이드바 정렬, 프리뷰 카드 내부 리듬을 단일 체계로 정렬한다.
4. **검증 무손상**: `bun run typecheck`, `bun run audit:design`, `apps/web` 빌드, `apps/expo` 번들 export가 모두 무결하게 통과해야 한다.

## 3. 범위

### 포함
- **조사 (`61-research.md`)**: 사이트 내 모든 패딩 불일치 지점 전수 실측 및 원인 분석.
- **설계 (`62-design-plan.md`)**: Spacing Design System 명세 (토큰/CSS 변수 또는 유틸리티 상수 규격, 레이아웃 컨테이너/거터 규격, 서피스/컴포넌트 인셋 표준).
- **웹 사이트 구현**:
  - `apps/web/components/site/landing.tsx`: 거터, 섹션 상하 패딩, 카드 마크업(LiveDemo CardFooter 분리) 정합.
  - `apps/web/components/showcase/docs-shell.tsx`: 헤더 좌우 여백과 사이드바/본문 좌측 기준선 정렬, `DemoPanel`·`PreviewFrame`·`CodeBlock`의 패딩/너비 제약 개선.
  - `apps/web/app/showcase/page.tsx` & `[name]/component-doc.tsx`: 이중 패딩(`pb-20` + `pb-8`) 해소, 인덱스 카드 패딩 통일.
  - `apps/web/app/site.css`: 마케팅/쇼케이스 레이아웃 스페이싱 유틸리티/CSS 변수 반영.
- **디자인 토큰 문서화**: `packages/unikit` 가이드에 Spacing 규격 명시 및 일관성 확보.

### 제외
- shadcn 원본 61종 컴포넌트의 공개 API 및 CVA variant 구조 파괴(이식 9조 준수).
- Expo 네이티브 쇼케이스 대규모 개편(web 사이트 요청에 집중하되 공유 패키지 무결성 유지).
- 임의 패키지 매니저(pnpm 등) 사용 금지, 임의 커밋/푸시 금지.

## 4. 수락 조건 (AC-*)

| ID | 수락 조건 |
|---|---|
| **AC-1** | **원인 분석 완전성**: 사이트에서 패딩이 어긋난 구조적 원인(토큰 부재, 컨테이너 불일치, 컴포넌트 중첩 등)이 `docs/sdd/61-research.md`에 실측 수치와 함께 기록된다. |
| **AC-2** | **디자인 시스템 스페이싱 규격**: 4px/8px 배수 기반의 표준 스페이싱 체계(Gutter, Section, Surface, Inset)가 `docs/sdd/62-design-plan.md` 및 가이드에 명문화된다. |
| **AC-3** | **랜딩 ↔ 쇼케이스 기준선 정합**: 랜딩(`/`)과 쇼케이스(`/showcase`)의 헤더 로고 좌측 기준선 및 컨테이너 거터가 반응형 중단점(mobile/tablet/desktop)에서 통일되어 페이지 전환 시 레이아웃 튐(Jump)이 해소된다. |
| **AC-4** | **쇼케이스 헤더 ↔ 사이드바 ↔ 본문 수직 정렬**: 데스크톱 뷰포트에서 상단 헤더 로고와 사이드바 좌측, 본문 컨텐츠의 수직 정렬 축(Alignment Axis)이 수학적으로 일치한다. |
| **AC-5** | **데모 프리뷰/코드 패딩 리듬 일관성**: `DemoPanel` 내 탭 바, 프리뷰 영역, 코드 블록 및 `CodeBlock`/`InstallSnippet` 간 패딩 비율이 조화를 이루며, 프리뷰 스테이지 폭이 컴포넌트 특성에 맞게 적응형으로 개선된다. |
| **AC-6** | **컴포넌트 마크업 결함 해소**: 랜딩 `LiveDemo`의 Card 구조(Header-Content-Footer)가 올바른 시맨틱 형제 구조로 정상화된다. |
| **AC-7** | **전체 빌드 및 디자인 감사 통과**: `bun run typecheck`, `bun run audit:design`, `apps/web` 빌드(`cd apps/web && bun run build`)가 exit 0으로 성공한다. |

## 5. 제약 사항
- 패키지 매니저는 bun만 사용.
- `packages/unikit`의 컴포넌트 이식 규칙 9조 엄수 (원본 CVA 및 클래스 보존 원칙).
- `globals.css`의 `UNIKIT-TOKENS` 및 `UNIKIT-THEME-MAP` 자동 생성 마커는 수동 수정 금지.
