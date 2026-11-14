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

Besides renderer primitives (`View`, `Text`, `Pressable`, `TextInput`, `Image`, `ScrollView`, `SectionList`, `Select`, `Portal`, …), the same entry exposes app-level APIs with web fallbacks so screen code never imports `react-native` directly — one source renders on web (including Tauri's WebView) and native:

```tsx
import {
  KeyboardAvoidingView, // web: transparent View (browser viewport handles the keyboard)
  Platform,             // web: { OS: "web" }
  Dimensions,           // web: window/screen size + resize subscription
  Share,                // web: navigator.share (resolves "dismissed" when unsupported)
} from "@unikit-bridge/ui/primitives";
```

On native these re-export the RN implementations; `SectionList` accepts the RN subset (`sections`, `renderItem`, `renderSectionHeader`, `keyExtractor`, `List{Header,Empty,Footer}Component`, `stickySectionHeadersEnabled` — sticky via `position: sticky` on web).

## Installation

```bash
bun add @unikit-bridge/ui class-variance-authority clsx tailwind-merge
```

Then add the engine side you need:

- **Native**: `bun add uniwind react-native lucide-react-native` (Tailwind v4 comes with uniwind's toolchain) — see the [uniwind setup](https://docs.uniwind.dev) (Metro `withUniwindConfig` + `global.css`).
- **Web**: `bun add tailwindcss lucide-react` (v4) and make sure your global CSS scans this package, e.g. `@source '../node_modules/@unikit-bridge/ui/src';`.

Icons come from Lucide via `@unikit-bridge/ui/primitives` (`CheckIcon`, `ChevronDownIcon`, …). Components never import Lucide directly — the bridge picks `lucide-react` or `lucide-react-native` through package export conditions.

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

Web overlay entry animations (`unikit-backdrop-in`, `unikit-dialog-in`, sheet/popover variants — 7 classes, 6 keyframes, `prefers-reduced-motion` guard) are distributed as a registry style item: `bunx shadcn add <registry>/r/animations.json` merges them into the same global CSS, and `dialog`, `sheet`, `popover`, `drawer` and `alert-dialog` pull it in automatically.

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

## Components — 62 universal components

The full shadcn/ui catalog (new-york-v4, 61 items) ported to one source that renders on web and native alike, plus one original component:

- **Basics (5)** — `Button` · `Card` (+ Header / Title / Description / Content / Footer) · `Input` · `Label` · `Badge`
- **Forms (14)** — `Checkbox` · `RadioGroup` · `Switch` · `Toggle` · `ToggleGroup` · `Textarea` · `Select` · `NativeSelect` · `Slider` · `Calendar` · `InputOTP` · `InputGroup` · `Form` (react-hook-form integration, optional peer) · `EditorToolbar` (original — tiptap toolbar skin; the editor engine stays app-owned)
- **Overlays & menus (13)** — `Dialog` · `AlertDialog` · `Sheet` · `Drawer` · `Popover` · `HoverCard` · `Tooltip` · `DropdownMenu` · `ContextMenu` · `Command` · `Combobox` · `Menubar` · `NavigationMenu` — portaled via the built-in overlay layer (`Portal`, anchored positioning, focus trap, dismiss)
- **Feedback & data (7)** — `Alert` · `Avatar` · `Empty` · `Skeleton` · `Table` · `Spinner` · `Sonner` (toast)
- **Data viz & composites (3)** — `Chart` (declarative bar/line/area series — see below) · `Carousel` · `Sidebar`
- **Messaging (5)** — `Message` · `MessageScroller` · `Bubble` · `Attachment` · `Marker`
- **Navigation & layout (15)** — `Tabs` · `Accordion` · `Collapsible` · `Breadcrumb` · `Pagination` · `Progress` · `Separator` · `AspectRatio` · `Kbd` · `Field` · `Item` · `ButtonGroup` · `ScrollArea` · `Resizable` · `Direction`

All components accept a `className`, forward refs, and forward variant helpers (`buttonVariants`, `cardVariants`, …) for composition. Per-component props, variants and accessibility behavior are documented in [`docs/components.md`](../../docs/components.md) (Korean); porting decisions are recorded in each source file's header comment.

### Chart — separate entry point

`Chart` is the one component excluded from the main barrel: the npm package exposes only its renderer through a dedicated entry, so the chart dependency tree never leaks into the main bundle (Metro safety):

```tsx
// Renderer primitives (what the npm package provides):
import { ChartSurface, ChartPath, ChartRect } from "@unikit-bridge/ui/chart";
```

The declarative component itself (`ChartContainer`, `ChartBarSeries`, `ChartTooltip`, …) is consumed via the shadcn registry copy (`components/unikit/chart.tsx`), which imports the renderer above. Web renders standard JSX `<svg>`; native renders through `react-native-svg` (optional peer dependency — install it only when you use charts). Series colors come from the `--chart-1..5` tokens (consumer-owned, shadcn chart standard).

### Optional peer dependencies

- **Icons (platform)**: web → `lucide-react`, native → `lucide-react-native` (bridged through `/primitives`).
- **Form** → `react-hook-form`
- **Chart** → `react-native-svg`

Install only the peers your platform / features need.

## License

MIT
