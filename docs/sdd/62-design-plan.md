# 사이클 60 설계 및 계획 (G1) — 디자인 시스템 패딩 체계 및 사이트 정합

- 작성: System Architect & Product/UX Designer (role-perspective self-execution) · 2026-11-10
- 대상: `packages/unikit` (토큰 문서 및 디자인 시스템 가이드), `apps/web` (랜딩, 쇼케이스 셸, 프리뷰 카드, CSS)
- 기준 조사: `docs/sdd/61-research.md`
- 수락 조건 추적: `docs/sdd/60-requirements.md` (AC-1 ~ AC-7)

---

## 1. 디자인 시스템 Spacing 체계 정의

UniKit은 웹과 React Native 양쪽에서 동일한 className을 공유한다. 따라서 Spacing 체계는 브라우저 CSS와 React Native의 Yoga 레이아웃 엔진 양쪽에서 오차 없이 계산되는 **4px / 8px 배수 스케일**을 기반으로 한다.

### 1.1 표준 간격 척도 (Base Spacing Scale)

| Token / Step | 값 (rem / px) | 주 용도 |
|---|---|---|
| `space-1` | 0.25rem / 4px | 초미세 간격, 인라인 칩 사이 간격, 배지 패딩 보정 |
| `space-2` | 0.5rem / 8px | 컴팩트 인셋, 탭 바 내부 패딩, 버튼/아이콘 사이 간격 |
| `space-3` | 0.75rem / 12px | 입력창 좌우 패딩, 서브 메뉴 아이템 인셋 |
| `space-4` | 1rem / 16px | 기본 컴포넌트 인셋(버튼, 카드 기본), 모바일 거터(`px-4`) |
| `space-5` | 1.25rem / 20px | 중간 카드 패딩, 컴포넌트 간 보조 여백 |
| `space-6` | 1.5rem / 24px | 표준 서피스 패딩(Card, Dialog), 태블릿/데스크톱 기본 거터(`sm:px-6`) |
| `space-8` | 2rem / 32px | 섹션 내부 간격, 데스크톱 와이드 거터(`lg:px-8`), 프리뷰 스테이지 패딩 |
| `space-12` | 3rem / 48px | 컴팩트 섹션 상하 여백(`py-12`) |
| `space-16` | 4rem / 64px | 표준 섹션 상하 여백(`py-16`) |
| `space-20` | 5rem / 80px | 와이드/히어로 섹션 상하 여백(`sm:py-20`) |

---

## 2. 레이아웃 & 서피스 정합 명세

### 2.1 사이트 헤더 및 컨테이너 기준선 통일 (AC-3, AC-4)

- **글로벌 컨테이너 최대 폭**:
  - 랜딩(`/`) 및 쇼케이스(`/showcase`)의 헤더는 **`max-w-6xl` (1152px)** 또는 **`max-w-7xl` (1280px)** 중 하나로 기준선을 정렬한다.
  - 본 사이클에서는 쇼케이스의 사이드바+본문 복합 레이아웃을 가장 자연스럽게 수용하면서도 랜딩이 지나치게 퍼져 보이지 않는 **`max-w-7xl` (1280px)**로 상단 헤더 컨테이너를 통일한다.
  - **좌우 거터(Gutter)**:
    - 모바일: `px-4` (16px)
    - 태블릿/데스크톱: `sm:px-6 lg:px-8` (24px / 32px)
  - 이로써 랜딩 ↔ 쇼케이스 이동 시 상단 로고 및 네비게이션이 좌우로 1px도 튀지 않고 완전히 제자리에 고정된다.

### 2.2 쇼케이스 셸 수직 정렬선 (Alignment Axis) (AC-4)

- **헤더 ↔ 사이드바 좌측선 일치**:
  - `DocsHeader` 컨테이너: `max-w-7xl px-4 sm:px-6 lg:px-8`
  - `DocsShell` 컨테이너: `max-w-7xl px-4 sm:px-6 lg:px-8` (바깥 래퍼에 동일 거터 부여)
  - `DocsSidebar`: 너비 `w-60 lg:w-64`, 내부 패딩을 `pr-6 py-6`으로 설정하여 사이드바의 첫 글자(`전체 목록`, 카테고리 헤더)가 상단 헤더 로고(`UniKit`)의 x좌표와 수직으로 정확히 1:1 정렬되도록 한다.
- **`DocsMain` 여백 및 하단 이중 패딩 제거**:
  - `DocsMain`은 사이드바와의 간격을 위해 `pl-6 lg:pl-10 pt-6 pb-16`으로 정돈.
  - `ShowcaseIndexPage` 및 `ComponentDoc` 내부의 불필요한 `pb-8`을 제거하여 하단이 붕 뜨는 이중 패딩 결함을 해소.

### 2.3 `DemoPanel` 및 프리뷰 영역 리듬 개선 (AC-5)

- **탭 바**: `border-b border-border bg-muted/20 px-3 py-2` (인셋 안정화)
- **탭 버튼**: `px-3 py-1.5 text-xs font-medium`
- **프리뷰 스테이지**:
  - `p-6 sm:p-8`로 안정적인 여백 부여.
  - 내부 컨테이너: 기존 `max-w-md`(448px)에서 **`max-w-xl` (576px) 및 full 너비 허용**으로 확대하여 Table, Calendar, Chart, Command, Form 컨트롤이 비좁지 않게 렌더링되도록 개선.
- **코드 영역**: `p-4 sm:p-5 text-[13px] leading-6`

### 2.4 컴포넌트 마크업 결함 수정 (AC-6)

- `landing.tsx`의 `LiveDemo`:
  - `CardFooter`를 `CardContent` 밖으로 빼내어 `CardHeader` - `CardContent` - `CardFooter`의 정규 3단 구조로 복원.
  - CardFooter 내부에서 버튼 정렬을 `flex flex-row justify-end` 또는 자연스러운 레이아웃으로 배치.

---

## 3. 태스크 분담 및 계획 (Tasks)

| Task ID | 담당 | 대상 파일 | 작업 내용 | 검증 기준 |
|---|---|---|---|---|
| **T-1** | Product/UX Designer & Architect | `packages/unikit/docs/tokens.md` | Spacing Design System 가이드라인 추가 (스케일 및 레이아웃 규격 명시) | 문서 정합 검증 |
| **T-2** | Frontend/UI Engineer | `apps/web/components/showcase/docs-shell.tsx` | 헤더 거터 통일, 사이드바 수직 정렬 정합, `DemoPanel`·`PreviewFrame`·`CodeBlock` 패딩 및 폭 리팩토링 | 빌드 및 시각적 정렬 확인 |
| **T-3** | Frontend/UI Engineer | `apps/web/components/site/landing.tsx` | 헤더 거터 통일(`max-w-7xl` 기준 정렬), 섹션 패딩 스케일 일치, LiveDemo Card 마크업 정상화 | 빌드 및 랜딩 레이아웃 확인 |
| **T-4** | Frontend/UI Engineer | `apps/web/app/showcase/page.tsx` & `[name]/component-doc.tsx` | `pb-8` 이중 패딩 제거, 쇼케이스 인덱스 카드 패딩 통일 | 빌드 및 쇼케이스 확인 |
| **T-5** | Verification Engineer | 작업 트리 전체 | `typecheck`, `audit:design`, `apps/web` 빌드, 통합 증거 기록 | exit 0 통과 |

---

## 4. 검증 계획 (V-*)

- **V-1 (타입 검사)**: 루트에서 `bun run typecheck` (3패키지 exit 0)
- **V-2 (디자인 감사)**: 루트에서 `bun run audit:design` (8/8 검사 exit 0)
- **V-3 (웹 빌드)**: `cd apps/web && bun run build` (정적 export 및 프리빌드 exit 0)
- **V-4 (레이아웃 실측)**: 랜딩과 쇼케이스의 헤더 좌측 좌표 및 거터가 모바일/데스크톱에서 수학적으로 일치하는지 코드 및 정적 렌더로 확인
