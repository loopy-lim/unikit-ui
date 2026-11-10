# @unikit-bridge/ui

One typed component set that **renders React Native views on native and plain DOM on web** — the same `className` strings, the same look, no platform branches in your code.

- **Native (iOS/Android)** — components render React Native primitives styled by [uniwind](https://uniwind.dev) (Tailwind CSS v4 bindings).
- **Web (React DOM)** — the very same components render `div`/`span`/`button`/`input` styled by **standard Tailwind CSS v4**. No react-native-web, no extra styling engine: your Tailwind CSS is the engine.
- **Design tokens as a single source of truth** — light/dark themes are CSS variables generated from one `tokens.ts`; switching schemes is instant on both platforms (`UnikitThemeProvider`).
- **shadcn-style variants** — built with `class-variance-authority`; `cn()` (clsx + tailwind-merge) is exported for custom styling.

## How the bridge works

`@unikit-bridge/ui/primitives` resolves through [package export conditions](https://nodejs.org/api/packages.html#conditional-exports):

| Platform | Condition | Implementation |
|---|---|---|
| Metro (React Native) | `react-native` | RN `View`/`Text`/`Pressable`/`TextInput` + uniwind |
| webpack / Turbopack / Vite (web) | `default` | `div`/`span`/`button`/`input` + standard Tailwind CSS |

Components import from that one entry point; each bundler picks its side. RN-specific props (`hitSlop`, …) are ignored on web, and web-idiom props (`disabled`, `onChangeText`, …) are translated on native.

## Installation

```bash
bun add @unikit-bridge/ui class-variance-authority clsx tailwind-merge
```

Then add the engine side you need:

- **Native**: `bun add uniwind react-native` (Tailwind v4 comes with uniwind's toolchain) — see the [uniwind setup](https://docs.uniwind.dev) (Metro `withUniwindConfig` + `global.css`).
- **Web**: `bun add tailwindcss` (v4) and make sure your global CSS scans this package, e.g. `@source '../node_modules/@unikit-bridge/ui/src';`.

### Required CSS (both platforms)

Add the token mapping + values to your global CSS (or install them via the shadcn registry: `bunx shadcn add <registry>/r/theme.json`):

```css
@import "tailwindcss";

/* web only — uniwind registers these itself */
@custom-variant dark (&:where(.dark, .dark *));
@custom-variant web (&:where(:root, :root *));

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  /* … full 20-token mapping — see docs/tokens.md */
}

:root { --background: 0 0% 100%; /* … */ }
.dark { --background: 240 10% 3.9%; /* … */ }
```

On web, put this in the app that compiles your Tailwind CSS (e.g. `app/globals.css` in Next.js, added to `transpilePackages: ["@unikit-bridge/ui"]`). On native, put it in the `global.css` referenced by uniwind's `cssEntryFile`.

## Usage

Wrap your app in the theme provider, then use the components — identical JSX on both platforms:

```tsx
import { UnikitThemeProvider, Button, Card, CardContent } from "@unikit-bridge/ui";

export default function App() {
  return (
    <UnikitThemeProvider defaultColorScheme="light">
      <Card>
        <CardContent className="gap-2">
          <Button onPress={() => {}}>Press me</Button>
        </CardContent>
      </Card>
    </UnikitThemeProvider>
  );
}
```

### Theming

```tsx
import { useUnikitTheme } from "@unikit-bridge/ui";

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  return (
    <Button variant="outline" size="sm" onPress={toggleColorScheme}>
      {colorScheme === "light" ? "Dark" : "Light"} mode
    </Button>
  );
}
```

The provider holds the scheme and binds it to each engine: `Uniwind.setTheme()` on native, a `.dark` class on `<html>` on web. Prebuilt token presets (`themePresets`) and raw token access (`getThemeTokens`, `lightTokens`, `darkTokens`) are exported for advanced theming.

## Components

`Button` · `Card` (+ Header / Title / Description / Content / Footer) · `Input` · `Label` · `Badge`

All components accept a `className` and forward variant helpers (`buttonVariants`, `cardVariants`, …) for composition.

## License

MIT
