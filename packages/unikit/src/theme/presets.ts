/**
 * UniKit 프리셋 테마 — 미리 준비된 디자인 세트 3종 （3차 사이클, T-17）.
 *
 * 값의 원천: docs/sdd/22-design-plan.md §2.3（설계 확정값 표）.
 * 계산 재료는 Tailwind 공식 팔레트（hex） → HSL 채널（소수 1자리）이며,
 * 색 선택 규칙（22-design-plan §2.2）은 다음과 같다:
 *   - 라이트 primary  = «흰 전경과 WCAG 대비 ≥4.5:1을 만족하는 가장 밝은 주색 단계»
 *                      → blue-600（5.17） / emerald-700（5.48） / amber-700（5.02）
 *   - 다크 primary    = 주색-500
 *   - 다크 primary-foreground = 중립-950 （주색-950은 blue에서 4.00:1로 미달 — 중립-950은 3종 전부 ≥5.48）
 *   - 중립 계열 N     = blue→slate, emerald→zinc, amber→stone （shadcn 관례）
 *   - destructive 쌍·radius = 기본 테마（tokens.ts）값 공통 — 다크 --destructive는
 *     사이클 30 G4/G5 조정값（0 72% 65%, red-400 계） 반영（22-design-plan §2.3 수정 이력）
 *
 * 기본 테마（zinc）는 이 파일에 없다 — src/theme/tokens.ts의 lightTokens/darkTokens이
 * 곧 기본 프리셋이다（값 사본 금지）. registry 항목 이름 매핑은 generate-design.ts의
 * THEME_ITEMS 상수가 담당한다.
 *
 * 주의: 값을 임의로 변경하면 안 된다 — 수정이 필요하면 설계 문서（22-design-plan §2.2·§2.3）를
 * 먼저 고친다. audit:design가 registry 사본·대비 기준（≥4.5）과의 일치를 검사한다.
 */
import type { UnikitThemeTokens } from "./tokens";

/** 프리셋 정의 — label·neutral·primaryStep은 카탈로그 표기용 메타（값 아님） */
export interface ThemePreset {
  label: string;
  /** 중립 계열 이름（slate/zinc/stone） */
  neutral: string;
  /** 카탈로그 표기용 라이트 primary 단계（예: "blue-600"） */
  primaryStep: string;
  light: UnikitThemeTokens;
  dark: UnikitThemeTokens;
}

/** 프리셋 3종 — 키 순서는 tokens.ts 선언 순서와 동일（멱등성 기준） */
export const themePresets = {
  blue: {
    label: "Blue",
    neutral: "slate",
    primaryStep: "blue-600",
    light: {
      "--background": "0 0% 100%",
      "--foreground": "228.6 84% 4.9%",
      "--card": "0 0% 100%",
      "--card-foreground": "228.6 84% 4.9%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "228.6 84% 4.9%",
      "--primary": "221.2 83.2% 53.3%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "210 40% 96.1%",
      "--secondary-foreground": "222.2 47.4% 11.2%",
      "--muted": "210 40% 96.1%",
      "--muted-foreground": "215.4 16.3% 46.9%",
      "--accent": "210 40% 96.1%",
      "--accent-foreground": "222.2 47.4% 11.2%",
      "--destructive": "0 72.2% 50.6%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "214.3 31.8% 91.4%",
      "--input": "214.3 31.8% 91.4%",
      "--ring": "221.2 83.2% 53.3%",
      "--radius": "0.5rem",
    },
    dark: {
      "--background": "228.6 84% 4.9%",
      "--foreground": "210 40% 98%",
      "--card": "228.6 84% 4.9%",
      "--card-foreground": "210 40% 98%",
      "--popover": "228.6 84% 4.9%",
      "--popover-foreground": "210 40% 98%",
      "--primary": "217.2 91.2% 59.8%",
      "--primary-foreground": "228.6 84% 4.9%",
      "--secondary": "217.2 32.6% 17.5%",
      "--secondary-foreground": "210 40% 98%",
      "--muted": "217.2 32.6% 17.5%",
      "--muted-foreground": "215 20.2% 65.1%",
      "--accent": "217.2 32.6% 17.5%",
      "--accent-foreground": "210 40% 98%",
      "--destructive": "0 72% 65%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "217.2 32.6% 17.5%",
      "--input": "217.2 32.6% 17.5%",
      "--ring": "217.2 91.2% 59.8%",
      "--radius": "0.5rem",
    },
  },
  emerald: {
    label: "Emerald",
    neutral: "zinc",
    primaryStep: "emerald-700",
    light: {
      "--background": "0 0% 100%",
      "--foreground": "240 10% 3.9%",
      "--card": "0 0% 100%",
      "--card-foreground": "240 10% 3.9%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "240 10% 3.9%",
      "--primary": "162.9 93.5% 24.3%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "240 4.8% 95.9%",
      "--secondary-foreground": "240 5.9% 10%",
      "--muted": "240 4.8% 95.9%",
      "--muted-foreground": "240 3.8% 46.1%",
      "--accent": "240 4.8% 95.9%",
      "--accent-foreground": "240 5.9% 10%",
      "--destructive": "0 72.2% 50.6%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "240 5.9% 90%",
      "--input": "240 5.9% 90%",
      "--ring": "162.9 93.5% 24.3%",
      "--radius": "0.5rem",
    },
    dark: {
      "--background": "240 10% 3.9%",
      "--foreground": "0 0% 98%",
      "--card": "240 10% 3.9%",
      "--card-foreground": "0 0% 98%",
      "--popover": "240 10% 3.9%",
      "--popover-foreground": "0 0% 98%",
      "--primary": "160.1 84.1% 39.4%",
      "--primary-foreground": "240 10% 3.9%",
      "--secondary": "240 3.7% 15.9%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "240 3.7% 15.9%",
      "--muted-foreground": "240 5% 64.9%",
      "--accent": "240 3.7% 15.9%",
      "--accent-foreground": "0 0% 98%",
      "--destructive": "0 72% 65%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "240 3.7% 15.9%",
      "--input": "240 3.7% 15.9%",
      "--ring": "160.1 84.1% 39.4%",
      "--radius": "0.5rem",
    },
  },
  amber: {
    label: "Amber",
    neutral: "stone",
    primaryStep: "amber-700",
    light: {
      "--background": "0 0% 100%",
      "--foreground": "20 14.3% 4.1%",
      "--card": "0 0% 100%",
      "--card-foreground": "20 14.3% 4.1%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "20 14.3% 4.1%",
      "--primary": "26 90.5% 37.1%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "60 4.8% 95.9%",
      "--secondary-foreground": "24 9.8% 10%",
      "--muted": "60 4.8% 95.9%",
      "--muted-foreground": "25 5.3% 44.7%",
      "--accent": "60 4.8% 95.9%",
      "--accent-foreground": "24 9.8% 10%",
      "--destructive": "0 72.2% 50.6%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "20 5.9% 90%",
      "--input": "20 5.9% 90%",
      "--ring": "26 90.5% 37.1%",
      "--radius": "0.5rem",
    },
    dark: {
      "--background": "20 14.3% 4.1%",
      "--foreground": "60 9.1% 97.8%",
      "--card": "20 14.3% 4.1%",
      "--card-foreground": "60 9.1% 97.8%",
      "--popover": "20 14.3% 4.1%",
      "--popover-foreground": "60 9.1% 97.8%",
      "--primary": "37.7 92.1% 50.2%",
      "--primary-foreground": "20 14.3% 4.1%",
      "--secondary": "12 6.5% 15.1%",
      "--secondary-foreground": "60 9.1% 97.8%",
      "--muted": "12 6.5% 15.1%",
      "--muted-foreground": "24 5.4% 63.9%",
      "--accent": "12 6.5% 15.1%",
      "--accent-foreground": "60 9.1% 97.8%",
      "--destructive": "0 72% 65%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "12 6.5% 15.1%",
      "--input": "12 6.5% 15.1%",
      "--ring": "37.7 92.1% 50.2%",
      "--radius": "0.5rem",
    },
  },
} as const satisfies Record<string, ThemePreset>;

/** 프리셋 키 집합（"blue" | "emerald" | "amber"） */
export type PresetKey = keyof typeof themePresets;
