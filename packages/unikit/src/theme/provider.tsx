/**
 * UniKit 테마 Provider — colorScheme 상태를 보유하고 현재 스킴의 토큰을 주입한다.
 *
 * 메커니즘(웹·네이티브 동일): 래핑 `View`의 style에 NativeWind `vars()`로
 * 토큰 객체(CSS 변수 → HSL 채널 문자열 전체, 예: `--background: "0 0% 100%"`)를 주입한다.
 * 웹(react-native-web)에서는 인라인 CSS 변수로 하위 요소에 상속되고, 네이티브에서는
 * react-native-css-interop 런타임이 변수를 분해한다 — `.dark` 클래스 토글은 필요 없다.
 *
 * 동작 규격(02-design §1.4): 즉시 전환, 영속화 없음, 기본값 라이트.
 */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import { vars } from "nativewind";
import {
  getThemeTokens,
  type UnikitColorScheme,
  type UnikitThemeTokens,
} from "./tokens";

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
  /** 초기 스킴(기본값 "light" — 02-design §1.4) */
  defaultColorScheme?: UnikitColorScheme;
};

export function UnikitThemeProvider({
  children,
  defaultColorScheme = "light",
}: UnikitThemeProviderProps) {
  const [colorScheme, setColorScheme] =
    useState<UnikitColorScheme>(defaultColorScheme);

  const value = useMemo<UnikitThemeContextValue>(
    () => ({
      colorScheme,
      setColorScheme,
      toggleColorScheme: () =>
        setColorScheme((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [colorScheme],
  );

  const themeVars = useMemo<UnikitThemeTokens>(
    () => getThemeTokens(colorScheme),
    [colorScheme],
  );

  return (
    <UnikitThemeContext.Provider value={value}>
      <View style={vars(themeVars)} className="flex-1">
        {children}
      </View>
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
