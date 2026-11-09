/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/unikit/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // UniKit 색 토큰 매핑(T-5) — TW3 표준 `hsl(var(--token))` 방식(02-design §2.3).
      // 변수값의 단일 출처는 packages/unikit/src/theme/tokens.ts이며, 이 앱에서는
      // app/globals.css의 :root/.dark 블록과 UnikitThemeProvider의 vars() 주입으로 정의된다.
      // 매핑 키 집합은 apps/expo/tailwind.config.js와 동일해야 한다(T-5 완료 기준).
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      // --radius(0.5rem) 파생(02-design §2.2). xl은 Tailwind 기본값(0.75rem) 유지.
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
