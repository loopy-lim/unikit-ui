/**
 * 차트 팔레트 값 성형 지점 — 토큰 채널("H S% L%")을 RN SVG가 받는 hex로 조립한다.
 *
 * react-native-svg는 CSS 변수(var(--chart-N))·클래스 토큰(fill-chart-N)을 해석하지
 * 못해 네이티브 차트는 config 색을 명시 값으로 줘야 한다(차트 컴포넌트 머리주석
 * 계약). 이 헬퍼가 그 값을 토큰 단일 출처에서 조립한다 — 데모·앱이 손으로 hex를
 * 고르는 관행(드리프트 원인)을 대체한다. 웹은 hsl(var(--chart-N)) 경로가 있으므로
 * 이 헬퍼가 필요 없다(소비 스펙: chart-1..5 → hex 5개, 스킴 반영).
 *
 * 조립 결과는 실행 시 계산되는 값일 뿐 원색 리터럴이 아니며, 소스에는 hex 리터럴이
 * 없다(audit (b) 스캔 대상 밖 — editor/colors.ts와 같은 사정).
 */
import { getThemeTokens, type UnikitColorScheme } from "./tokens";

/** 차트 시리즈 순번용 팔레트 — chart-1..5 토큰의 hex 배열(읽기 전용 길이 5). */
export type ChartPalette = readonly [string, string, string, string, string];

const CHANNELS = /^(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%$/;

/** "H S% L%" 채널 → hex(소수 반올림). 형식이 어긋나면 원문을 그대로 돌려준다. */
function channelsToHex(channels: string): string {
  const m = CHANNELS.exec(channels);
  if (!m) return channels;
  const h = Number(m[1]);
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m2 = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to255 = (v: number) =>
    Math.round((v + m2) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to255(r)}${to255(g)}${to255(b)}`;
}

/**
 * 스킴에 해당하는 차트 팔레트(hex 5종) — 기본(zinc) 테마 기준.
 * 프리셋 차트 팔레트는 웹에서 CSS 변수 경로(hsl(var(--chart-N)))로 소비한다.
 */
export function chartPalette(colorScheme: UnikitColorScheme): ChartPalette {
  const tokens = getThemeTokens(colorScheme);
  return [
    channelsToHex(tokens["--chart-1"]),
    channelsToHex(tokens["--chart-2"]),
    channelsToHex(tokens["--chart-3"]),
    channelsToHex(tokens["--chart-4"]),
    channelsToHex(tokens["--chart-5"]),
  ];
}
