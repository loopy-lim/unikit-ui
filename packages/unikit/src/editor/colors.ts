import { getThemeTokens, type UnikitColorScheme } from "../theme/tokens";

export const editorBackground = (colorScheme: UnikitColorScheme): string =>
  `hsl(${getThemeTokens(colorScheme)["--background"]})`;
