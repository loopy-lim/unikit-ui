# @unikit/core

Universal UI kit for React Native + [NativeWind](https://www.nativewind.dev/) — one set of typed components that renders identically on iOS, Android, and web (via [react-native-web](https://necolas.github.io/react-native-web/)).

- **One codebase, no `Platform.select`** — components are React Native primitives styled with NativeWind; the web build renders the same tree through react-native-web.
- **Design tokens as a single source of truth** — light/dark themes are injected as CSS variables through `UnikitThemeProvider` and consumed by Tailwind classes (`bg-background`, `text-foreground`, …), so switching schemes is instant on both platforms.
- **shadcn-style variants** — component variants are built with `class-variance-authority`, and `cn()` (clsx + tailwind-merge) is exported for custom styling.

## Installation

```bash
bun add @unikit/core nativewind tailwindcss \
  react react-native react-native-web \
  class-variance-authority clsx tailwind-merge
```

> Prerequisite: [NativeWind v4 setup](https://www.nativewind.dev/getting-started/installation) (Metro config + global CSS) must already be working in your app.

### Expo (native)

Works out of the box — Metro compiles the package source directly. No extra config.

### Next.js (web)

Add the package to `transpilePackages` and alias `react-native`:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: [
    "nativewind",
    "react-native",
    "react-native-web",
    "@unikit/core",
  ],
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
    },
  },
};
```

## Usage

Wrap your app in the theme provider, then use the components:

```tsx
import { UnikitThemeProvider, Button, Card, CardContent } from "@unikit/core";

export default function App() {
  return (
    <UnikitThemeProvider defaultColorScheme="light">
      <Card>
        <CardContent className="gap-2">
          <Button variant="default" size="md" onPress={() => {}}>
            Press me
          </Button>
        </CardContent>
      </Card>
    </UnikitThemeProvider>
  );
}
```

### Theming

```tsx
import { useUnikitTheme } from "@unikit/core";

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  return (
    <Button variant="outline" onPress={toggleColorScheme}>
      {colorScheme === "light" ? "Dark" : "Light"} mode
    </Button>
  );
}
```

Prebuilt token presets (`themePresets`) and raw token access (`getThemeTokens`, `lightTokens`, `darkTokens`) are exported for advanced theming.

## Components

`Button` · `Card` (+ Header / Title / Description / Content / Footer) · `Input` · `Label` · `Badge`

All components accept NativeWind `className` and forward their variant helpers (`buttonVariants`, `cardVariants`, …) for composition.

## License

MIT
