/**
 * UniKit UI 디자인 토큰 — 라이트/다크 단일 출처（single source of truth）.
 *
 * 값의 원천: docs/sdd/02-design.md §2.1（색 19종, HSL 채널값）·§2.2（반경）.
 * 값 형식은 TW3 `hsl（var（--token））` 매핑과 호환하는 HSL 채널 문자열（"H S% L%"）이며,
 * `vars（）` 주입（웹·네이티브 공통）과 apps/web/app/globals.css의 변수 블록이
 * 이 객체를 그대로 복사한 값이다（완료 기준: 값 1:1 대조）.
 *
 * 주의: 값을 임의로 변경하면 안 된다 — 수정이 필요하면 설계 문서（02-design）를 먼저 고친다.
 * `--destructive`（라이트）는 shadcn 기본값이 아닌 red-600 계（02-design §2.1 주석, WCAG AA 확보）.
 * `--destructive`（다크）도 shadcn 원본 대비 red-400 계로 조정（사이클 30 G4 — 원본 값은
 * 다크 배경 대비 1.99:1로 텍스트가 사실상 안 읽힘. 조정값 6.1:1）.
 * `--radius`는 스킴과 무관한 공통값（§2.2）이며 두 객체에 동일하게 포함한다.
 */

export type UnikitColorScheme = "light" | "dark";

/** 라이트 스킴 토큰（기본값 — 02-design §1.4） */
export const lightTokens = {
  "--background": "0 0% 100%",
  "--foreground": "240 10% 3.9%",
  "--card": "0 0% 100%",
  "--card-foreground": "240 10% 3.9%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "240 10% 3.9%",
  "--primary": "240 5.9% 10%",
  "--primary-foreground": "0 0% 98%",
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
  "--ring": "240 5.9% 10%",
  "--radius": "0.5rem",
} as const;

/** 다크 스킴 토큰 — satisfies로 라이트와 키 집합이 동일함을 컴파일 타임에 강제 */
export const darkTokens = {
  "--background": "240 10% 3.9%",
  "--foreground": "0 0% 98%",
  "--card": "240 10% 3.9%",
  "--card-foreground": "0 0% 98%",
  "--popover": "240 10% 3.9%",
  "--popover-foreground": "0 0% 98%",
  "--primary": "0 0% 98%",
  "--primary-foreground": "240 5.9% 10%",
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
  "--ring": "240 4.9% 83.9%",
  "--radius": "0.5rem",
} as const satisfies Record<keyof typeof lightTokens, string>;

/** 토큰 CSS 변수 이름（--background 등 색 19종 + --radius） */
export type UnikitThemeTokenName = keyof typeof lightTokens;

/** CSS 변수 이름 → 값（"H S% L%" 문자열） 매핑. vars（） 주입·globals.css 복사 양쪽에 쓴다. */
export type UnikitThemeTokens = Record<UnikitThemeTokenName, string>;

/** 스킴에 해당하는 토큰 객체를 반환한다 */
export function getThemeTokens(colorScheme: UnikitColorScheme): UnikitThemeTokens {
  return colorScheme === "dark" ? darkTokens : lightTokens;
}
