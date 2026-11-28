export type UnikitColorScheme = "light" | "dark";

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

  "--chart-1": "221 70% 42%",
  "--chart-2": "160 62% 30%",
  "--chart-3": "32 88% 42%",
  "--chart-4": "258 50% 45%",
  "--chart-5": "346 62% 42%",
} as const;

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

  "--chart-1": "217 82% 66%",
  "--chart-2": "160 55% 52%",
  "--chart-3": "38 88% 60%",
  "--chart-4": "255 60% 72%",
  "--chart-5": "347 70% 66%",
} as const satisfies Record<keyof typeof lightTokens, string>;

export type UnikitThemeTokenName = keyof typeof lightTokens;

export type UnikitThemeTokens = Record<UnikitThemeTokenName, string>;

export function getThemeTokens(colorScheme: UnikitColorScheme): UnikitThemeTokens {
  return colorScheme === "dark" ? darkTokens : lightTokens;
}
