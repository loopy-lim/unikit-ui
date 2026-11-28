import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PortalHost, applyColorScheme } from "@unikit-bridge/ui/primitives";

import type { UnikitColorScheme } from "./tokens";

export type UnikitThemeContextValue = {

  colorScheme: UnikitColorScheme;

  setColorScheme: (colorScheme: UnikitColorScheme) => void;

  toggleColorScheme: () => void;
};

const UnikitThemeContext = createContext<UnikitThemeContextValue | null>(null);

export type UnikitThemeProviderProps = {
  children: ReactNode;

  defaultColorScheme?: UnikitColorScheme;

  storageKey?: string;

  onColorSchemeChange?: (colorScheme: UnikitColorScheme) => void;
};

export function UnikitThemeProvider({
  children,
  defaultColorScheme = "light",
  storageKey,
  onColorSchemeChange,
}: UnikitThemeProviderProps) {
  const [colorScheme, setColorSchemeState] =
    useState<UnikitColorScheme>(defaultColorScheme);
  const onChangeRef = useRef(onColorSchemeChange);
  onChangeRef.current = onColorSchemeChange;

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "light" || saved === "dark") {
        setColorSchemeState(saved);
      }
    } catch {

    }
  }, [storageKey]);

  const setColorScheme = useCallback(
    (next: UnikitColorScheme) => {
      setColorSchemeState(next);
      if (storageKey && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey, next);
        } catch {

        }
      }
      onChangeRef.current?.(next);
    },
    [storageKey],
  );

  const toggleColorScheme = useCallback(() => {
    setColorSchemeState((prev) => {
      const next: UnikitColorScheme = prev === "light" ? "dark" : "light";
      if (storageKey && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey, next);
        } catch {

        }
      }
      onChangeRef.current?.(next);
      return next;
    });
  }, [storageKey]);

  const value = useMemo<UnikitThemeContextValue>(
    () => ({
      colorScheme,
      setColorScheme,
      toggleColorScheme,
    }),
    [colorScheme, setColorScheme, toggleColorScheme],
  );

  useEffect(() => {
    applyColorScheme(colorScheme);
  }, [colorScheme]);

  return (
    <UnikitThemeContext.Provider value={value}>
      <PortalHost>{children}</PortalHost>
    </UnikitThemeContext.Provider>
  );
}

export function useUnikitTheme(): UnikitThemeContextValue {
  const context = useContext(UnikitThemeContext);
  if (context == null) {
    throw new Error(
      "useUnikitTheme는 UnikitThemeProvider 내부에서 사용해야 합니다.",
    );
  }
  return context;
}
