# UniKit UI 디자인 토큰 카탈로그

> ⛔ 이 파일은 `bun run generate:design`(packages/unikit)이 생성합니다 — 수동 수정 금지.
> 값의 출처는 [`src/theme/tokens.ts`](../src/theme/tokens.ts)(기본)와 [`src/theme/presets.ts`](../src/theme/presets.ts)(프리셋 3종)입니다. 값 형식은 CSS `hsl()` 함수 인자로 바로 쓰는 HSL 채널 문자열("H S% L%")입니다.

## 토큰 값 표 (20종 = 색 19 + radius)

| 토큰 | 라이트 | 다크 | 역할 | 대표 사용 |
|---|---|---|---|---|
| `--background` | `0 0% 100%` | `240 10% 3.9%` | 화면 전체 기본 배경 | `bg-background (provider 래퍼)` |
| `--foreground` | `240 10% 3.9%` | `0 0% 98%` | 기본 텍스트·아이콘 전경색 | `text-foreground` |
| `--card` | `0 0% 100%` | `240 10% 3.9%` | 카드 표면 배경 | `bg-card` |
| `--card-foreground` | `240 10% 3.9%` | `0 0% 98%` | 카드 위 텍스트 전경색 | `text-card-foreground` |
| `--popover` | `0 0% 100%` | `240 10% 3.9%` | 팝오버·드롭다운 표면 — v0.1 컴포넌트 미사용, 확장용 | `bg-popover (예약)` |
| `--popover-foreground` | `240 10% 3.9%` | `0 0% 98%` | 팝오버 위 텍스트 — v0.1 미사용, 확장용 | `text-popover-foreground (예약)` |
| `--primary` | `240 5.9% 10%` | `0 0% 98%` | 주요 행동 색(기본 버튼 배경) | `bg-primary` |
| `--primary-foreground` | `0 0% 98%` | `240 5.9% 10%` | 주요 행동 위 텍스트 | `text-primary-foreground` |
| `--secondary` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | 보조 행동 색(secondary 버튼·배지) | `bg-secondary` |
| `--secondary-foreground` | `240 5.9% 10%` | `0 0% 98%` | 보조 행동 위 텍스트 | `text-secondary-foreground` |
| `--muted` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | 강조를 낮춘 영역 배경 | `bg-muted` |
| `--muted-foreground` | `240 3.8% 46.1%` | `240 5% 64.9%` | 강조를 낮춘 텍스트(설명문) | `text-muted-foreground` |
| `--accent` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | 호버·눌림 강조 배경(outline/ghost active) | `active:bg-accent` |
| `--accent-foreground` | `240 5.9% 10%` | `0 0% 98%` | 강조 배경 위 텍스트 | `active:text-accent-foreground` |
| `--destructive` | `0 72.2% 50.6%` | `0 72% 65%` | 위험·삭제 행동 색 | `bg-destructive` |
| `--destructive-foreground` | `0 0% 98%` | `0 0% 98%` | 위험 행동 위 텍스트 | `text-destructive-foreground` |
| `--border` | `240 5.9% 90%` | `240 3.7% 15.9%` | 일반 테두리(card outline 등) | `border-border` |
| `--input` | `240 5.9% 90%` | `240 3.7% 15.9%` | 입력창 테두리 | `border-input` |
| `--ring` | `240 5.9% 10%` | `240 4.9% 83.9%` | 키보드 포커스 링 | `focus-visible:ring-ring` |
| `--radius` | `0.5rem` | `0.5rem` | 모서리 반경 기준값(스킴 무관 공통) | `rounded-md (scale 파생)` |

## 프리셋 테마 (기본 + 3종)

값 출처는 Tailwind 공식 팔레트 계산 + WCAG 대비 검증(22-design-plan §2.2 규칙). 재적용: 다른 프리셋을 같은 방식으로 add하면 기존 값이 그 자리에서 교체됩니다(같은 프리셋 재add는 값 불변).

| 항목 | 중립 계열 | 라이트 primary | 핵심 대비비¹ | 설치(한 줄) |
|---|---|---|---|---|
| `theme` (Zinc (기본)) | zinc | zinc-900 | 16.96:1 | `bunx shadcn add <레지스트리>/r/theme.json -y` |
| `theme-blue` (Blue) | slate | blue-600 | 5.17:1 | `bunx shadcn add <레지스트리>/r/theme-blue.json -y` |
| `theme-emerald` (Emerald) | zinc | emerald-700 | 5.49:1 | `bunx shadcn add <레지스트리>/r/theme-emerald.json -y` |
| `theme-amber` (Amber) | stone | amber-700 | 5.01:1 | `bunx shadcn add <레지스트리>/r/theme-amber.json -y` |

¹ 라이트 primary↔primary-foreground(흰 전경)의 WCAG 대비비 — audit:design가 매 실행 재계산(기준 ≥4.5:1).
프리셋 전체 값(20종×라이트/다크)은 [`src/theme/presets.ts`](../src/theme/presets.ts)와 각 `/r/theme-<이름>.json`에서 관찰할 수 있습니다.

## 일관성 규칙 (audit:design가 기계 검사)

1. **원색 리터럴 금지** — 컴포넌트 소스에 `#fff`, `rgb(...)`, `oklch(...)` 등 직접 색 값을 쓰지 않는다. 반드시 위 토큰을 참조하는 유틸리티 클래스(`bg-primary` 등)를 쓴다.
2. **Tailwind 기본 팔레트 금지** — `bg-zinc-500`, `text-white` 류는 테마 전환(라이트↔다크)이 되지 않으므로 금지.
3. **임의값 클래스 금지** — `h-[37px]`, `bg-[#fff]` 류 대신 스케일 클래스(`h-10`)와 토큰을 쓴다.
4. **재테마** — 소비자는 아래 한 줄로 토큰을 받고, 값 커스터마이즈는 해당 CSS 변수값만 바꾼다(컴포넌트 수정 불필요). 런타임 스킴 전환은 `UnikitThemeProvider`가 담당한다.
   ```bash
   bunx shadcn add <레지스트리>/r/theme.json
   ```

## 사본이 생성되는 곳

| 사본 | 생성 위치 | 비고 |
|---|---|---|
| 웹 전역 CSS | `apps/web/app/globals.css` :root/.dark 블록 | 표준 Tailwind v4 — 기본 테마만 |
| 네이티브 전역 CSS | `apps/expo/global.css` @variant light/dark 블록 | uniwind(Tailwind v4) — 기본 테마만 |
| 토큰→유틸리티 매핑 | 두 앱 전역 CSS `@theme inline` 블록 | 토큰 키에서 자동 생성 — 두 플랫폼 동일 바이트 |
| 레지스트리 theme 항목 4종 | `registry.json` cssVars light/dark | 기본 + 프리셋 3 — 소비자 `shadcn add` 전달 |
| 이 카탈로그 | `packages/unikit/docs/tokens.md` | 값 드리프트는 audit (f)가 차단 |
