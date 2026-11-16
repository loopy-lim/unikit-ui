/**
 * editor 값 성형 지점 — HSL 채널 토큰을 RN 인라인 색 문자열로 조립한다.
 *
 * 네이티브 렌더러의 WebView는 서드파티 컴포넌트라 uniwind className이 닿지 않아
 * 페인트 전 깜빡임 방지 배경색을 인라인 style로 줘야 한다. 색은 어디까지나
 * --background 토큰에서 조립한다(원색 리터럴 아님) — 다만 (b) 스캔은 정규식이라
 * hsl( 조립 텍스트를 잡으므로, 이 파일은 VALUE_SOURCES와 같은 사정으로 제외된다
 * (audit-design.ts (b) 참조).
 */
import { getThemeTokens, type UnikitColorScheme } from "../theme/tokens";

/** WebView 페인트 전 깜빡임 방지용 배경색 — --background 토큰 조립. */
export const editorBackground = (colorScheme: UnikitColorScheme): string =>
  `hsl(${getThemeTokens(colorScheme)["--background"]})`;
