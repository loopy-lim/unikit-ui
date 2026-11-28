import { getThemeTokens, type UnikitColorScheme } from "./tokens";

export type ChartPalette = readonly [string, string, string, string, string];

const CHANNELS = /^(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%$/;

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
