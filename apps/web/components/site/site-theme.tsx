"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Check, Copy, Moon, Palette, RotateCcw, Sun } from "lucide-react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Toaster,
  UnikitThemeProvider,
  cn,
  darkTokens,
  lightTokens,
  themePresets,
  useUnikitTheme,
  type PresetKey,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { CommandSearch } from "../showcase/command-search";

export type SiteThemePreset = "zinc" | PresetKey;
export type SiteRadius = "0rem" | "0.3rem" | "0.5rem" | "0.75rem" | "1rem";

export const PRESET_META: Record<
  SiteThemePreset,
  { label: string; registryName: string; swatchHsl: string }
> = {
  zinc: {
    label: "Zinc",
    registryName: "theme",
    swatchHsl: "240 5.9% 10%",
  },
  blue: {
    label: "Blue",
    registryName: "theme-blue",
    swatchHsl: "221.2 83.2% 53.3%",
  },
  emerald: {
    label: "Emerald",
    registryName: "theme-emerald",
    swatchHsl: "162.9 93.5% 24.3%",
  },
  amber: {
    label: "Amber",
    registryName: "theme-amber",
    swatchHsl: "26 90.5% 37.1%",
  },
};

export const RADIUS_OPTIONS: Array<{ value: SiteRadius; label: string }> = [
  { value: "0rem", label: "0" },
  { value: "0.3rem", label: "0.3" },
  { value: "0.5rem", label: "0.5" },
  { value: "0.75rem", label: "0.75" },
  { value: "1rem", label: "1.0" },
];

const COLOR_SCHEME_STORAGE_KEY = "unikit-color-scheme";
const PRESET_STORAGE_KEY = "unikit-theme-preset";
const RADIUS_STORAGE_KEY = "unikit-theme-radius";

const TOKEN_KEYS = Object.keys(lightTokens) as Array<keyof typeof lightTokens>;

type SiteThemeContextValue = {
  colorScheme: "light" | "dark";
  setColorScheme: (next: "light" | "dark") => void;
  toggleColorScheme: () => void;
  preset: SiteThemePreset;
  setPreset: (next: SiteThemePreset) => void;
  radius: SiteRadius;
  setRadius: (next: SiteRadius) => void;
  resetTheme: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
};

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null);

export function useSiteTheme(): SiteThemeContextValue {
  const ctx = useContext(SiteThemeContext);
  if (!ctx) {
    throw new Error("useSiteTheme는 SiteThemeProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}

function getTokensForPreset(
  preset: SiteThemePreset,
  scheme: "light" | "dark",
) {
  if (preset === "zinc") {
    return scheme === "dark" ? darkTokens : lightTokens;
  }
  return scheme === "dark" ? themePresets[preset].dark : themePresets[preset].light;
}

function applyRootTokens(
  preset: SiteThemePreset,
  radius: SiteRadius,
  scheme: "light" | "dark",
) {
  if (typeof document === "undefined") return;
  const rootStyle = document.documentElement.style;
  if (preset === "zinc" && radius === "0.5rem") {
    for (const key of TOKEN_KEYS) {
      rootStyle.removeProperty(key);
    }
    return;
  }
  const tokens = getTokensForPreset(preset, scheme);
  for (const key of TOKEN_KEYS) {
    rootStyle.setProperty(key, key === "--radius" ? radius : tokens[key]);
  }
}

function SiteThemeBridge({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme, toggleColorScheme } = useUnikitTheme();
  const [preset, setPresetState] = useState<SiteThemePreset>("zinc");
  const [radius, setRadiusState] = useState<SiteRadius>("0.5rem");
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    try {
      const savedPreset = window.localStorage.getItem(PRESET_STORAGE_KEY);
      if (
        savedPreset === "zinc" ||
        savedPreset === "blue" ||
        savedPreset === "emerald" ||
        savedPreset === "amber"
      ) {
        setPresetState(savedPreset);
      }
      const savedRadius = window.localStorage.getItem(RADIUS_STORAGE_KEY);
      if (
        savedRadius === "0rem" ||
        savedRadius === "0.3rem" ||
        savedRadius === "0.5rem" ||
        savedRadius === "0.75rem" ||
        savedRadius === "1rem"
      ) {
        setRadiusState(savedRadius);
      }
    } catch {
      // storage 접근 불가 환경 무시
    }
  }, []);

  useEffect(() => {
    applyRootTokens(preset, radius, colorScheme);
  }, [preset, radius, colorScheme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const setPreset = useCallback((next: SiteThemePreset) => {
    setPresetState(next);
    try {
      window.localStorage.setItem(PRESET_STORAGE_KEY, next);
    } catch {
      // storage 접근 불가 환경 무시
    }
  }, []);

  const setRadius = useCallback((next: SiteRadius) => {
    setRadiusState(next);
    try {
      window.localStorage.setItem(RADIUS_STORAGE_KEY, next);
    } catch {
      // storage 접근 불가 환경 무시
    }
  }, []);

  const resetTheme = useCallback(() => {
    setPreset("zinc");
    setRadius("0.5rem");
  }, [setPreset, setRadius]);

  const value = useMemo<SiteThemeContextValue>(
    () => ({
      colorScheme,
      setColorScheme,
      toggleColorScheme,
      preset,
      setPreset,
      radius,
      setRadius,
      resetTheme,
      commandOpen,
      setCommandOpen,
    }),
    [
      colorScheme,
      setColorScheme,
      toggleColorScheme,
      preset,
      setPreset,
      radius,
      setRadius,
      resetTheme,
      commandOpen,
    ],
  );

  return (
    <SiteThemeContext.Provider value={value}>
      {children}
      <CommandSearch open={commandOpen} onOpenChange={setCommandOpen} />
      <Toaster position="bottom-right" richColors closeButton />
    </SiteThemeContext.Provider>
  );
}

export function SiteThemeProvider({ children }: { children: ReactNode }) {
  return (
    <UnikitThemeProvider storageKey={COLOR_SCHEME_STORAGE_KEY}>
      <SiteThemeBridge>{children}</SiteThemeBridge>
    </UnikitThemeProvider>
  );
}

export function ThemeCustomizer() {
  const {
    colorScheme,
    setColorScheme,
    preset,
    setPreset,
    radius,
    setRadius,
    resetTheme,
  } = useSiteTheme();
  const [copiedCli, setCopiedCli] = useState(false);

  const activeMeta = PRESET_META[preset];
  const cliCommand = `bunx shadcn@latest add https://ui.ll3.kr/r/${activeMeta.registryName}.json -y`;

  const copyThemeCli = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cliCommand);
      setCopiedCli(true);
      window.setTimeout(() => setCopiedCli(false), 1500);
    } catch {
      setCopiedCli(false);
    }
  }, [cliCommand]);

  return (
    <Popover>
      <PopoverTrigger
        accessibilityLabel="테마 사용자 정의"
        className="site-focusable flex h-8 flex-row items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
      >
        <span
          aria-hidden="true"
          className="size-3 rounded-full border border-border/80"
          style={{ backgroundColor: `hsl(${activeMeta.swatchHsl})` }}
        />
        <Palette className="size-3.5 text-muted-foreground sm:hidden" />
        <Text className="hidden font-sans text-xs font-medium text-foreground sm:inline">
          테마
        </Text>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4 p-4">
        <View className="flex flex-row items-center justify-between gap-2">
          <View>
            <Text className="font-sans text-sm font-semibold text-popover-foreground">
              테마 커스터마이저
            </Text>
            <Text className="font-sans text-xs text-muted-foreground">
              프리셋·모서리 둥글기·다크 모드를 실시간 비교해요.
            </Text>
          </View>
          <button
            type="button"
            onClick={resetTheme}
            aria-label="테마 초기화"
            className="site-focusable flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </View>

        <View className="space-y-1.5">
          <Text className="font-sans text-xs font-medium text-muted-foreground">
            컬러 프리셋
          </Text>
          <View className="grid grid-cols-2 gap-1.5">
            {(Object.keys(PRESET_META) as SiteThemePreset[]).map((key) => {
              const item = PRESET_META[key];
              const selected = preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPreset(key)}
                  className={cn(
                    "site-focusable flex h-8 flex-row items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-foreground bg-accent text-accent-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent/60",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-4 shrink-0 items-center justify-center rounded-full border border-border/60"
                    style={{ backgroundColor: `hsl(${item.swatchHsl})` }}
                  >
                    {selected ? (
                      <Check className="size-2.5 text-primary-foreground" />
                    ) : null}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </View>
        </View>

        <View className="space-y-1.5">
          <Text className="font-sans text-xs font-medium text-muted-foreground">
            Radius
          </Text>
          <View className="grid grid-cols-5 gap-1.5">
            {RADIUS_OPTIONS.map((option) => {
              const selected = radius === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRadius(option.value)}
                  className={cn(
                    "site-focusable h-8 rounded-md border text-xs font-medium transition-colors",
                    selected
                      ? "border-foreground bg-accent text-accent-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent/60",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </View>
        </View>

        <View className="space-y-1.5">
          <Text className="font-sans text-xs font-medium text-muted-foreground">
            화면 모드
          </Text>
          <View className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setColorScheme("light")}
              className={cn(
                "site-focusable flex h-8 flex-row items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors",
                colorScheme === "light"
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-border bg-background text-foreground hover:bg-accent/60",
              )}
            >
              <Sun className="size-3.5" />
              <span>라이트</span>
            </button>
            <button
              type="button"
              onClick={() => setColorScheme("dark")}
              className={cn(
                "site-focusable flex h-8 flex-row items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors",
                colorScheme === "dark"
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-border bg-background text-foreground hover:bg-accent/60",
              )}
            >
              <Moon className="size-3.5" />
              <span>다크</span>
            </button>
          </View>
        </View>

        <View className="border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            onPress={copyThemeCli}
            className="w-full justify-between"
          >
            <View className="flex min-w-0 flex-1 flex-row items-center gap-1.5">
              <Copy className="size-3.5 shrink-0" />
              <Text className="truncate font-sans text-xs font-medium text-foreground">
                {copiedCli ? "CLI 명령 복사됨" : `${activeMeta.label} 테마 CLI 복사`}
              </Text>
            </View>
            <Text className="site-mono shrink-0 text-[11px] text-muted-foreground">
              {activeMeta.registryName}
            </Text>
          </Button>
        </View>
      </PopoverContent>
    </Popover>
  );
}
