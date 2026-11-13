/**
 * UniKit 테마 Provider — colorScheme 상태를 보유하고 브리지를 통해
 * 각 플랫폼의 스타일링 엔진에 반영한다.
 *
 * 메커니즘（엔진 교체: NativeWind → 브리지 구조）:
 * - 토큰 값은 이제 JS 주입（vars（））이 아니라 소비자 앱의 global.css에 상주한다
 *   （기본값 = generate:design이 tokens.ts에서 생성）.
 * - 이 Provider는 스킴 상태만 보유하고, 변경 시 bridge.applyColorScheme을 호출한다:
 *   · native → uniwind Uniwind.setTheme（다크 변형·CSS 변수가 활성 테마로 전환）
 *   · web    → 문서 루트 .dark 클래스 토글（표준 Tailwind dark 변형）
 *
 * 동작 규격（02-design §1.4）: 즉시 전환, 영속화 없음, 기본값 라이트.
 */
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
import { applyColorScheme } from "@unikit-bridge/ui/primitives";

import type { UnikitColorScheme } from "./tokens";

export type UnikitThemeContextValue = {
  /** 현재 색 스킴 */
  colorScheme: UnikitColorScheme;
  /** 스킴 직접 지정 */
  setColorScheme: (colorScheme: UnikitColorScheme) => void;
  /** 라이트 ↔ 다크 즉시 전환 */
  toggleColorScheme: () => void;
};

const UnikitThemeContext = createContext<UnikitThemeContextValue | null>(null);

export type UnikitThemeProviderProps = {
  children: ReactNode;
  /** 초기 스킴（기본값 "light" — 02-design §1.4） */
  defaultColorScheme?: UnikitColorScheme;
  /** 웹 localStorage 키(지정 시 마운트 후 복원 및 변경 시 영속화) */
  storageKey?: string;
  /** 스킴 변경 콜백 */
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
      // storage 접근 불가 환경 무시
    }
  }, [storageKey]);

  const setColorScheme = useCallback(
    (next: UnikitColorScheme) => {
      setColorSchemeState(next);
      if (storageKey && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey, next);
        } catch {
          // storage 접근 불가 환경 무시
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
          // storage 접근 불가 환경 무시
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

  // 스킴 → 엔진 바인딩（마운트 시 기본값도 반영 — 네이티브에서 adaptive system
  // 테마 대신 설계 기본값 라이트로 고정된다, 02-design §1.4）.
  useEffect(() => {
    applyColorScheme(colorScheme);
  }, [colorScheme]);

  return (
    <UnikitThemeContext.Provider value={value}>
      {children}
    </UnikitThemeContext.Provider>
  );
}

/** 현재 테마 상태 접근 훅 — UnikitThemeProvider 내부에서만 사용할 수 있다 */
export function useUnikitTheme(): UnikitThemeContextValue {
  const context = useContext(UnikitThemeContext);
  if (context == null) {
    throw new Error(
      "useUnikitTheme는 UnikitThemeProvider 내부에서 사용해야 합니다.",
    );
  }
  return context;
}
