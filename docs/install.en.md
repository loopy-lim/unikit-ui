# Add UniKit to your project

[한국어](install.md) · **English**

Two options: **Option 1 (npm)** is simplest; **Option 2 (source copy)** brings component source into your app like shadcn/ui. Design tokens work the same either way.

Props and variants: [components.md](components.md) (Korean). npm package overview: [packages/unikit/README.md](../packages/unikit/README.md).

## Option 1 — install from npm

```bash
bun add @unikit-bridge/ui class-variance-authority clsx tailwind-merge
```

Add the Lucide peer for your platform (the bridge wraps it; your component imports stay on primitives):

```bash
# web
bun add lucide-react
# native (Expo, etc.)
bun add lucide-react-native
```

Then wire the styling engine:

- **Web (Next.js, etc.)** — Tailwind CSS v4 is enough (create-next-app default). Add to global CSS (e.g. `app/globals.css`):

  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  @custom-variant web (&:where(:root, :root *));   /* enable UniKit web: classes */
  @source '../node_modules/@unikit-bridge/ui/src'; /* scan package class strings */
  ```

  Token values (20 in `:root` / `.dark`) come from the same **theme** registry add as option 2. On Next.js also set `transpilePackages` (option 2 step 3a).

- **Native (Expo)** — `bun add uniwind react-native`, then Metro (`withUniwindConfig`) and global CSS (`cssEntryFile`). See `apps/expo/metro.config.js` and `apps/expo/global.css` in this repo.

Example:

```tsx
"use client";

import { UnikitThemeProvider, Button, Card, CardContent } from "@unikit-bridge/ui";

export default function Home() {
  return (
    <UnikitThemeProvider defaultColorScheme="light">
      <Card>
        <CardContent className="gap-2">
          <Button variant="default">Default</Button>
          <Button variant="outline" size="sm">Outline</Button>
        </CardContent>
      </Card>
    </UnikitThemeProvider>
  );
}
```

> **Publish note** — npm `@unikit-bridge/ui` 0.2.0 is the first 28-component cut. Use option 2 for the full 61 until the next publish.

## Option 2 — copy sources with shadcn CLI

Public registry base: <https://ui.ll3.kr/r/> (catalog: [registry.json](https://ui.ll3.kr/r/registry.json)). While hacking UniKit itself, swap in `http://localhost:3000/r/`.

What you get: one component file (`components/unikit/<name>.tsx`) plus auto-installed deps. Deps stay minimal — shared `@unikit-bridge/ui`, plus only what that component imports (cva · clsx · tailwind-merge · tailwindcss). `form` optionally peers `react-hook-form`; `chart` peers `react-native-svg`. Copied `cn` imports resolve to `@/lib/utils`; bridge primitives resolve to `@unikit-bridge/ui/primitives`.

### Step 1 — scaffold a Next.js app

```bash
bunx create-next-app@latest my-unikit-app --ts --tailwind --app --import-alias "@/*" --use-bun --yes --disable-git
cd my-unikit-app
bunx shadcn@latest init -b base -p nova -y
```

> shadcn CLI 4.23 needs both `-b base` and `-p nova` to skip interactive prompts.

> Keep the Tailwind v4 setup from create-next-app — no downgrade or extra config file.

### Step 2 — pull components from the UniKit registry

In the consumer project:

```bash
bunx shadcn@latest add https://ui.ll3.kr/r/button.json -y
```

Or several at once:

```bash
bunx shadcn@latest add https://ui.ll3.kr/r/button.json https://ui.ll3.kr/r/card.json https://ui.ll3.kr/r/checkbox.json https://ui.ll3.kr/r/tabs.json https://ui.ll3.kr/r/avatar.json -y
```

67 registry items (UI 61 + utils 1 + theme 4 + animations 1): <https://ui.ll3.kr/r/registry.json>. Sources land under `components/unikit/`.

> **Local registry** — while editing UniKit, run `cd apps/web && bun x next dev -p 3000` and use `http://localhost:3000/r/...` instead.

> **shadcn CLI 4.23 notes**
> - `lib/utils.ts` may be skipped as “already exists” — init’s `cn` is fine for UniKit.
> - Leading source comments are stripped on copy — no functional impact.

### Step 3 — required consumer settings

Copy alone will not build. Copied UI uses `@unikit-bridge/ui`’s bridge — add these three. **Skipping this is the most common build failure.**

**(a) Transpile the package** — `@unikit-bridge/ui` ships TypeScript source:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@unikit-bridge/ui"],
};

export default nextConfig;
```

(No react-native alias needed on web — the bridge renders DOM.)

**(b) Global CSS**

```css
@custom-variant dark (&:where(.dark, .dark *));  /* skip if shadcn init already added */
@custom-variant web (&:where(:root, :root *));
@source '../node_modules/@unikit-bridge/ui/src';
```

**(c) Install tokens**

```bash
bunx shadcn@latest add https://ui.ll3.kr/r/theme.json -y
```

That injects 20 UniKit tokens into `:root` / `.dark`. Details: [packages/unikit/docs/tokens.md](../packages/unikit/docs/tokens.md).

Web overlay entry animations (optional; pulled in by dialog/sheet/popover/drawer/alert-dialog):

```bash
bunx shadcn@latest add https://ui.ll3.kr/r/animations.json -y
```

**Theme presets**

| Theme | Feel | Install |
|---|---|---|
| `theme` (default zinc) | Neutral | `bunx shadcn@latest add https://ui.ll3.kr/r/theme.json -y` |
| `theme-blue` | Blue primary + slate | `bunx shadcn@latest add https://ui.ll3.kr/r/theme-blue.json -y` |
| `theme-emerald` | Green primary + zinc | `bunx shadcn@latest add https://ui.ll3.kr/r/theme-emerald.json -y` |
| `theme-amber` | Amber primary + stone | `bunx shadcn@latest add https://ui.ll3.kr/r/theme-amber.json -y` |

Re-adding a preset **replaces** the 20 values in place (verified). Re-running the same preset is idempotent when unchanged.

### Step 4 — use it

```tsx
// app/page.tsx
"use client";

import { Button } from "@/components/unikit/button";
import { Badge } from "@/components/unikit/badge";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <Button variant="default" size="default">Default</Button>
      <Button variant="outline" size="sm" className="mt-4">Outline</Button>
      <Badge variant="secondary" className="mt-4">Badge</Badge>
    </main>
  );
}
```

```bash
bun x tsc --noEmit
bun run build
```

Pages need `"use client"` when they use stateful client components.
