# UniKit Spacing & Layout Design System (스페이싱 디자인 시스템)

UniKit의 모든 컴포넌트와 사이트(랜딩, 쇼케이스)는 웹(Next.js)과 네이티브(React Native / Expo) 양쪽에서 동일한 시각적 비례와 정렬을 유지하기 위해 **4px / 8px 기반의 통일된 Spacing 규칙**을 준수합니다.

---

## 1. 표준 간격 척도 (Base Spacing Scale)

Tailwind CSS의 기본 `--spacing` (0.25rem = 4px) 기반 척도를 단일 출처로 사용합니다:

| 토큰 / 유틸리티 | CSS 값 | 픽셀(px) | 주 용도 |
|---|---|---|---|
| `p-1` / `gap-1` | 0.25rem | 4px | 초미세 간격, 인라인 칩 사이 간격, 탭 버튼 내부 패딩 |
| `p-2` / `gap-2` | 0.5rem | 8px | 컴팩트 인셋, 탭 바 컨테이너 패딩, 버튼/아이콘 사이 간격 |
| `p-3` / `gap-3` | 0.75rem | 12px | 입력창(`Input`) 수평 인셋, 서브메뉴 항목 인셋 |
| `p-4` / `gap-4` | 1rem | 16px | 표준 컴포넌트 인셋(`Button`), 모바일 기본 거터(`px-4`), 코드 블록 |
| `p-5` / `gap-5` | 1.25rem | 20px | 중간 카드 패딩, 쇼케이스 인덱스 카드 |
| `p-6` / `gap-6` | 1.5rem | 24px | 서피스 기본 패딩(`Card`, `Dialog`), 태블릿 거터(`sm:px-6`) |
| `p-8` / `gap-8` | 2rem | 32px | 데스크톱 거터(`lg:px-8`), 프리뷰 스테이지 내부 여백 |
| `py-12` / `space-y-12` | 3rem | 48px | 컴팩트 섹션 상하 여백, 컴포넌트 문서 섹션 간격 |
| `py-16` / `space-y-16` | 4rem | 64px | 표준 섹션 상하 여백 |
| `py-20` / `space-y-20` | 5rem | 80px | 히어로 및 주요 밴드 상하 여백 |

---

## 2. 레이아웃 & 컨테이너 표준 (Layout & Container Grid)

### 2.1 글로벌 컨테이너 기준선 (Global Alignment Axis)
사이트 내 모든 페이지(랜딩 `/`, 쇼케이스 인덱스 `/showcase`, 컴포넌트 상세 `/showcase/[name]`)는 상단 헤더와 본문 외곽선이 수직으로 일치해야 합니다:

- **최대 폭 (Max Width)**: `max-w-7xl` (1280px)
- **반응형 수평 거터 (Horizontal Gutter)**:
  - 모바일 (< 640px): `px-4` (16px)
  - 태블릿 (640px ~ 1024px): `sm:px-6` (24px)
  - 데스크톱 (≥ 1024px): `lg:px-8` (32px)

### 2.2 쇼케이스 사이드바 & 본문 정렬 (Sidebar & Main Rhythm)
- `DocsHeader`와 `DocsShell` 본문 래퍼가 동일한 `max-w-7xl px-4 sm:px-6 lg:px-8` 컨테이너를 공유합니다.
- `DocsSidebar`의 좌측 콘텐츠 시작점은 상단 헤더 로고(`UniKit`)의 좌측 x좌표와 정확히 일치합니다.
- 사이드바와 본문 사이의 거터는 `md:pl-8 lg:pl-10`으로 여유를 확보합니다.
- `DocsMain`이 하단 여백(`pb-16`)을 전담하며, 하위 자식 페이지에서 `pb-8`을 중복 선언하지 않습니다.

---

## 3. 서피스 & 컴포넌트 인셋 표준 (Surfaces & Insets)

### 3.1 Card 계열 3단 구조
`Card`는 다음 정규 패딩을 준수합니다:
- `CardHeader`: `p-6 pb-2` 또는 `p-6` (제목 + 설명)
- `CardContent`: `p-6 pt-0` (본문)
- `CardFooter`: `p-6 pt-0` (액션 버튼)
- `CardFooter`를 `CardContent` 내부에 중첩하지 않으며, 독립 형제 노드로 배치합니다.

### 3.2 데모 및 프리뷰 스테이지 (`DemoPanel`)
- **탭 바**: `border-b border-border bg-muted/20 px-3 py-2`
- **프리뷰 스테이지**: `p-6 sm:p-8`
- **프리뷰 스테이지 내부 폭**: 좁은 `max-w-md`(448px) 대신 `max-w-xl`(576px) 또는 전폭을 지원하여 폭이 넓은 컴포넌트(Table, Calendar, Chart 등)가 왜곡 없이 숨쉴 수 있는 공간을 제공합니다.
- **코드 블록**: `p-4 sm:p-5 text-[13px] leading-6`
