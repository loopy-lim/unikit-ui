# 사이클 60 조사 및 원인 분석 (Research) — 패딩 불일치 현황과 근본 원인

- 작성: Codebase Researcher & Tooling Analyst (role-perspective self-execution) · 2026-11-10
- 대상: `apps/web` (랜딩 `/`, 쇼케이스 `/showcase`, `[name]`), `packages/unikit` (토큰, 프리미티브, 컴포넌트)

---

## 1. 개요: 왜 사이트의 패딩이 모두 잘 안 맞는 것처럼 보이는가?

사용자가 사이트를 둘러보았을 때 "기본적인 패딩이 모두 잘 안 맞는다"고 직관적으로 느끼게 되는 이유는 단 하나의 실수가 아니라, **1) 디자인 토큰의 부재, 2) 페이지 간 거터 및 최대 폭 불일치, 3) 셸(Shell) 내부의 수직 정렬 축(Alignment Axis) 단절, 4) 프리뷰 카드 및 마크업 내부의 급격한 패딩 변화**가 복합적으로 얽혀 있기 때문이다.

각 계층별 실측 데이터와 원인을 상세히 기록한다.

---

## 2. 계층별 실측 데이터 및 불일치 지점

### 2.1 계층 1: 디자인 토큰 레벨 (`tokens.ts`)의 Spacing 공백
- **현황**: `packages/unikit/src/theme/tokens.ts`에는 다음 토큰만 존재한다:
  - 색상 19종 (`--background`, `--foreground`, `--primary`, `--secondary`, ...)
  - 반경 1종 (`--radius: 0.5rem`)
- **문제점**:
  - 간격(Spacing), 마진, 패딩, 레이아웃 컨테이너에 대한 토큰이 **0개**이다.
  - 디자이너와 엔지니어가 공유하는 단일 출처(Single Source of Truth)가 없으므로, 코드를 작성할 때마다 Tailwind 클래스(`p-1.5`, `p-2`, `p-2.5`, `p-3`, `p-4`, `p-5`, `p-6`, `p-8`, `p-10`, `px-6`, `px-8`, `px-10` 등)를 임의로 직관에 의존해 섞어 쓰게 되었다.
  - 그 결과 `apps/web` 안에서만 30가지가 넘는 서로 다른 패딩 클래스가 산발적으로 쓰이고 있다.

### 2.2 계층 2: 랜딩(`/`) vs 쇼케이스(`/showcase`) 레이아웃 컨테이너 불일치

| 항목 | 랜딩 페이지 (`/`, `landing.tsx`) | 쇼케이스 헤더 (`docs-shell.tsx`) | 쇼케이스 본문 (`DocsMain`) |
|---|---|---|---|
| **최대 폭 (Max Width)** | `max-w-5xl` (1024px) | `max-w-7xl` (1280px) | `max-w-7xl` 안에서 사이드바 제외 나머지 |
| **좌우 패딩 (Gutter - Mobile)** | `px-4` (16px) | `px-6` (24px) | `px-6` (24px) |
| **좌우 패딩 (Gutter - SM/MD)** | `sm:px-6` (24px) | `sm:px-8` (32px) | `sm:px-8` (32px) |
| **좌우 패딩 (Gutter - LG)** | `sm:px-6` (24px) 유지 | `sm:px-8` (32px) 유지 | `lg:px-10` (40px) 로 확대 |
| **헤더 로고 좌측 시작점 (1440px 뷰포트 기준)** | **232px** `((1440-1024)/2 + 24)` | **112px** `((1440-1280)/2 + 32)` | — |

- **시각적 증상**:
  - 사용자가 랜딩에서 `쇼케이스 보기` 버튼을 누르거나 네비게이션을 클릭해 `/showcase`로 이동하는 순간, 상단 헤더의 `UniKit` 로고와 네비게이션 바가 왼쪽으로 **120px이나 점프(Layout Shift)**한다.
  - 사용자는 같은 사이트임에도 완전히 다른 규격의 페이지로 이동했다고 느끼며, 시각적 안정감을 잃게 된다.

### 2.3 계층 3: 쇼케이스 셸 내부의 수직 정렬선(Alignment Axis) 파괴
`docs-shell.tsx`의 데스크톱 레이아웃 구조를 분석하면:
```text
<View className="mx-auto flex w-full max-w-7xl flex-col md:flex-row">
  <DocsSidebar className="... md:px-5 md:py-8 lg:w-64 lg:px-6">
  <DocsMain className="... px-6 pb-20 pt-8 sm:px-8 lg:px-10 lg:pt-10">
</View>
```
- **헤더와 사이드바 좌측선 불일치**:
  - `DocsHeader`의 로고는 컨테이너 좌측으로부터 `px-6`(24px) 또는 `sm:px-8`(32px) 위치에 있다.
  - 반면 바로 아래 `DocsSidebar`의 메뉴 항목(`전체 목록`, 카테고리 라벨)은 사이드바 컨테이너 자체 패딩 `md:px-5`(20px) 또는 `lg:px-6`(24px)에 배치된다.
  - 상단 로고의 `U` 글자와 사이드바 첫 메뉴의 `전` 글자가 수직으로 8px~12px 어긋나 눈에 거슬린다.
- **이중 하단 패딩(Double Bottom Padding)**:
  - `DocsMain`이 이미 `pb-20`(80px)을 가지고 있는데,
  - 그 안에 들어가는 `ShowcaseIndexPage`(`w-full max-w-5xl space-y-14 pb-8`)와 `ComponentDoc`(`w-full max-w-3xl space-y-12 pb-8`)이 둘 다 또 `pb-8`(32px)을 선언하고 있다.
  - 합산 하단 여백이 112px에 달해 스크롤 맨 아래가 불필요하게 휑하게 붕 뜬다.

### 2.4 계층 4: 쇼케이스 컴포넌트 프리뷰(`DemoPanel`)의 내부 인셋 불균형
최근 커밋(`1dcb49a`)에서 도입된 `DemoPanel`:
```tsx
<View className="site-preview-enter overflow-hidden rounded-xl border border-border">
  {/* 1. 탭 헤더: 극단적으로 좁은 패딩 */}
  <View className="flex flex-row gap-1 border-b border-border bg-muted/20 p-1.5">
    <button className="px-3 py-1.5 font-sans text-sm font-medium">미리보기</button>
  </View>

  {/* 2. 프리뷰 스테이지: 갑자기 거대해진 패딩 */}
  <View className="site-preview-stage flex min-h-40 items-center justify-center px-6 py-8 sm:min-h-44 sm:px-8 sm:py-10">
    <View className="flex w-full max-w-md flex-col items-center">
      {preview}
    </View>
  </View>

  {/* 3. 코드 뷰: 또 다른 패딩 */}
  <pre className="site-mono overflow-x-auto bg-muted/30 px-4 py-5 text-[13px] leading-6">
</View>
```
- **문제점**:
  1. **상하 패딩 리듬의 붕괴**: 탭 바(p-1.5, 버튼 py-1.5 = 6px) → 프리뷰 스테이지(py-8~py-10 = 32px~40px) → 하단 코드(py-5 = 20px)로 이어지며 한 카드 내부에서 패딩 스케일이 6px ↔ 40px ↔ 20px로 날뛴다.
  2. **`max-w-md`(448px) 강제 가둠**: 프리뷰 내부 컨테이너가 `max-w-md`로 묶여 있어, `Table`, `Chart`, `Carousel`, `Command`, `Calendar`, `Form` 등 가로 폭이 필요한 컴포넌트가 양옆 여백 100px 이상을 남긴 채 가운데 좁은 상자에 억지로 우겨넣어져 보인다.

### 2.5 계층 5: 컴포넌트 마크업 구조 및 인셋 해킹
- **`landing.tsx` LiveDemo의 CardFooter 중첩 결함**:
  ```tsx
  <CardContent className="space-y-5">
    ...
    <CardFooter className="px-0 pt-2">
      <Button onPress={onSubmit}>만들기</Button>
    </CardFooter>
  </CardContent>
  ```
  `CardFooter`는 원래 `CardHeader`, `CardContent`와 동등한 레벨의 형제 컴포넌트여야 한다. `CardContent` 내부에 넣고 `px-0 pt-2`로 오버라이드한 결과, 카드의 상하좌우 패딩 밸런스가 왜곡되었다.
- **Button vs Input 수평 텍스트 인셋 불일치**:
  - `Button`: `h-10 px-4 py-2` (내부 텍스트 인셋 = 16px)
  - `Input`: `h-10 px-3 py-2` (내부 텍스트 인셋 = 12px)
  - 폼에서 Input과 Button을 나란히 놓거나 상하로 나열할 때 4px 어긋남이 발생한다.

---

## 3. 결론 및 해결 방향

디자인 시스템 차원에서 **Spacing Token 및 레이아웃 그리드 표준**을 정립하고, 사이트 전체의 클래스를 이 표준에 맞춰 리팩토링해야 한다.

1. **디자인 시스템 스페이싱 토큰 체계**:
   - 4px 배수 스케일 (`2: 8px`, `3: 12px`, `4: 16px`, `6: 24px`, `8: 32px`, `12: 48px`, `16: 64px`)을 표준 척도로 고정.
   - 컨테이너 거터(Gutter): 모바일 `16px`(px-4), 데스크톱 `24px`(`md:px-6`) 또는 `32px`(`lg:px-8`) 표준화.
   - 최대 폭(Max Width): 사이트 전체의 기준선을 `max-w-7xl` 헤더 / `max-w-6xl` 본문 등으로 일관 정렬.
2. **쇼케이스 셸 수직 정렬 정비**:
   - 헤더 좌측 여백과 사이드바 좌측 여백을 1:1로 맞춘다.
   - `DocsMain`의 중복 하단 패딩 제거.
3. **`DemoPanel` 및 `PreviewFrame` 패딩 정상화**:
   - 탭 바 `px-4 py-2.5`, 프리뷰 스테이지 `p-6 sm:p-8`, 코드 `p-4`로 완만한 시각적 위계 부여.
   - 프리뷰 스테이지 폭을 컴포넌트 성격에 맞게 유연하게 확장(`max-w-2xl` 또는 100%).
4. **마크업 버그 수정**:
   - `landing.tsx`의 CardFooter를 CardContent 밖으로 분리하여 카드 고유 패딩 복원.
