import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  Text,
  View,
  measureInWindow,
  useColorScheme,
  useDrag,
  type BridgeColorScheme,
  type BridgeDragEvent,
  type BridgeLayout,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import {
  ChartCircle,
  ChartLine,
  ChartPath,
  ChartRect,
  ChartSurface,
  ChartText,
} from "@unikit-bridge/ui/chart";

import { cn } from "../lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: ReactNode;
    icon?: ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<"light" | "dark", string> }
  )
>;

export type ChartDatum = Record<string, string | number | null | undefined>;

export type ChartScale = {
  plotLeft: number;
  plotTop: number;
  plotWidth: number;
  plotHeight: number;

  bandWidth: number;
  yMin: number;
  yMax: number;
  xAt: (index: number) => number;
  yAt: (value: number) => number;

  yValueAt: (y: number) => number;
  ticksY: number[];
};

type ChartContextValue = {
  config: ChartConfig;
  data: ChartDatum[];
  xKey: string;
  scale: ChartScale;

  scales: Record<string, ChartScale>;

  barStacks: Record<string, Array<{ base: number; value: number } | null>>;

  pie: {
    dataKey: string;
    cx: number;
    cy: number;
    outerRadius: number;
    arcs: ChartPieArc[];
  } | null;

  radar: RadarGeometry | null;

  fullData: ChartDatum[];

  brushWindow: [number, number] | null;

  selectionRect: { x: number; y: number; width: number; height: number } | null;

  zoomed: boolean;

  seriesKeys: string[];
  activeIndex: number | null;
  width: number;
  height: number;
  colorScheme: BridgeColorScheme;
};

const ChartContext = createContext<ChartContextValue | null>(null);

function useChart(component: string): ChartContextValue {
  const ctx = useContext(ChartContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <ChartContainer> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

const CHART_COLOR_CLASSES = {
  fill: ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4", "fill-chart-5"],
  stroke: ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5"],
  bg: ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"],
} as const;

type ChartColorKind = keyof typeof CHART_COLOR_CLASSES;

function getChartColor(index: number, kind: ChartColorKind = "fill"): string {
  const classes = CHART_COLOR_CLASSES[kind];
  return classes[Math.abs(index) % classes.length];
}

type ResolvedSeriesColor = { className: string; color?: string };

function resolveSeriesColor(
  config: ChartConfig,
  dataKey: string,
  index: number,
  kind: ChartColorKind,
  colorScheme: BridgeColorScheme = "light",
): ResolvedSeriesColor {
  const entry = config[dataKey];
  const explicit =
    entry?.color ?? entry?.theme?.[colorScheme] ?? entry?.theme?.light;
  return explicit
    ? { className: "", color: explicit }
    : { className: getChartColor(index, kind) };
}

const CHART_PADDING = { top: 8, right: 8, bottom: 24, left: 48 } as const;

const CHART_PADDING_AXIS_RIGHT = 48;
const INITIAL_DIMENSION = { width: 320, height: 200 } as const;

const TOOLTIP_WIDTH = 128;

const DEFAULT_Y_AXIS_ID = "left";

const RESET_CHIP = { width: 48, height: 18, offset: 6, label: "초기화" } as const;

const TAP_THRESHOLD = 8;

const DOUBLE_TAP_WINDOW = 300;

type ChartPadding = { top: number; right: number; bottom: number; left: number };

export type ChartScaleOptions = {

  yDomain?: { min: number; max: number };

  range?: { min: number; max: number };

  padding?: Partial<ChartPadding>;
};

function chartPlotBox(
  width: number,
  height: number,
  padding?: Partial<ChartPadding>,
): { plotLeft: number; plotTop: number; plotWidth: number; plotHeight: number } {
  const pad = { ...CHART_PADDING, ...padding };
  return {
    plotLeft: pad.left,
    plotTop: pad.top,
    plotWidth: Math.max(width - pad.left - pad.right, 1),
    plotHeight: Math.max(height - pad.top - pad.bottom, 1),
  };
}

function niceStep(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function rawSeriesRange(
  data: ChartDatum[],
  seriesKeys: string[],
): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const datum of data) {
    for (const key of seriesKeys) {
      const value = datum[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
  }
  return { min, max };
}

function domainTicks(min: number, max: number): number[] {
  const step = niceStep((max - min) / 4);
  const ticks: number[] = [];
  const first = Math.ceil(min / step) * step;
  for (let i = 0; i <= 64; i++) {
    const value = first + i * step;
    if (value > max + step * 1e-6) break;
    ticks.push(Number(value.toPrecision(10)));
  }
  return ticks.length ? ticks : [min];
}

export function buildChartScale(
  data: ChartDatum[],
  seriesKeys: string[],
  width: number,
  height: number,
  options?: ChartScaleOptions,
): ChartScale {
  const pad = { ...CHART_PADDING, ...options?.padding };
  const { plotLeft, plotTop, plotWidth, plotHeight } = chartPlotBox(width, height, pad);
  const count = data.length;
  const bandWidth = count > 0 ? plotWidth / count : plotWidth;
  const { min, max } = options?.range ?? rawSeriesRange(data, seriesKeys);

  let yMin = 0;
  let yMax: number;
  let ticksY: number[];
  if (options?.yDomain) {

    yMin = options.yDomain.min;
    yMax = options.yDomain.max;
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMax <= yMin) {
      yMin = 0;
      yMax = 1;
    }
    ticksY = domainTicks(yMin, yMax);
  } else if (min < 0) {

    if (!Number.isFinite(max - min)) {
      yMin = 0;
      yMax = 1;
      ticksY = [0, 1];
    } else {
      const step = niceStep((max - min) / 4);
      yMin = Math.floor(min / step) * step;
      yMax = Math.max(Math.ceil(max / step) * step, yMin + step);
      const stepsCount = Math.max(1, Math.round((yMax - yMin) / step));
      ticksY = Array.from({ length: stepsCount + 1 }, (_, i) =>
        Number((yMin + step * i).toPrecision(10)),
      );
    }
  } else {
    const step = niceStep(max / 4);

    if (!Number.isFinite(step * 4)) {
      yMin = 0;
      yMax = 1;
      ticksY = [0, 1];
    } else {
      yMax = step * 4;
      ticksY = [0, step, step * 2, step * 3, step * 4];
    }
  }

  const span = Math.max(yMax - yMin, 1e-9);
  const plotBottom = plotTop + plotHeight;
  return {
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    bandWidth,
    yMin,
    yMax,
    xAt: (index) => plotLeft + bandWidth * (index + 0.5),
    yAt: (value) => plotTop + plotHeight - ((value - yMin) / span) * plotHeight,
    yValueAt: (y) => yMin + ((plotBottom - y) / plotHeight) * span,
    ticksY,
  };
}

export type ChartStackMember = { dataKey: string; stackId: string };

export function groupStacks(members: ChartStackMember[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const member of members) {
    const list = groups.get(member.stackId);
    if (list) list.push(member.dataKey);
    else groups.set(member.stackId, [member.dataKey]);
  }
  return groups;
}

export function computeBarStackOffsets(
  data: ChartDatum[],
  members: ChartStackMember[],
): Record<string, Array<{ base: number; value: number } | null>> {
  const offsets: Record<string, Array<{ base: number; value: number } | null>> = {};
  for (const member of members) offsets[member.dataKey] = data.map(() => null);

  const groupAcc = new Map<string, Array<{ pos: number; neg: number }>>();
  for (const member of members) {
    let acc = groupAcc.get(member.stackId);
    if (!acc) {
      acc = data.map(() => ({ pos: 0, neg: 0 }));
      groupAcc.set(member.stackId, acc);
    }
    data.forEach((datum, index) => {
      const value = datum[member.dataKey];
      if (typeof value === "number" && Number.isFinite(value)) {
        const slot = acc[index];
        offsets[member.dataKey][index] = {
          base: value >= 0 ? slot.pos : slot.neg,
          value,
        };
        if (value >= 0) slot.pos += value;
        else slot.neg += value;
      }
    });
  }
  return offsets;
}

export function stackedTotalsRange(
  data: ChartDatum[],
  groups: Map<string, string[]>,
): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const datum of data) {
    for (const keys of groups.values()) {
      let pos = 0;
      let neg = 0;
      for (const key of keys) {
        const value = datum[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          if (value >= 0) pos += value;
          else neg += value;
        }
      }
      if (pos > max) max = pos;
      if (neg < min) min = neg;
    }
  }
  return { min, max };
}

export function seriesEffectiveRange(
  data: ChartDatum[],
  series: Array<{ dataKey: string; stackId?: string }>,
): { min: number; max: number } {
  const plainKeys = series
    .filter((item) => !item.stackId)
    .map((item) => item.dataKey);
  const stacked = series
    .filter((item) => item.stackId)
    .map((item) => ({ dataKey: item.dataKey, stackId: item.stackId as string }));
  const raw = rawSeriesRange(data, plainKeys);
  const totals = stackedTotalsRange(data, groupStacks(stacked));
  return { min: Math.min(raw.min, totals.min), max: Math.max(raw.max, totals.max) };
}

export type ReferenceLineGeometry = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
  labelAnchor: "start" | "middle" | "end";
};

export function buildReferenceLine(options: {
  axis: "x" | "y";
  value: string | number;
  scale: ChartScale;
  data: ChartDatum[];
  xKey: string;
  labelPosition?: "start" | "middle" | "end";
}): ReferenceLineGeometry | null {
  const { axis, value, scale, data, xKey } = options;
  const position = options.labelPosition ?? "end";
  const plotRight = scale.plotLeft + scale.plotWidth;
  const plotBottom = scale.plotTop + scale.plotHeight;
  if (axis === "x") {
    if (typeof value !== "string") return null;
    const index = data.findIndex((datum) => datum[xKey] === value);
    if (index < 0) return null;
    const x = scale.xAt(index);
    const labelY =
      position === "start"
        ? plotBottom - 6
        : position === "middle"
          ? (scale.plotTop + plotBottom) / 2
          : scale.plotTop + 12;
    return {
      x1: x,
      x2: x,
      y1: scale.plotTop,
      y2: plotBottom,
      labelX: x + 4,
      labelY,
      labelAnchor: "start",
    };
  }
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const y = scale.yAt(value);
  const labelX =
    position === "start"
      ? scale.plotLeft + 4
      : position === "middle"
        ? (scale.plotLeft + plotRight) / 2
        : plotRight - 4;
  return {
    x1: scale.plotLeft,
    x2: plotRight,
    y1: y,
    y2: y,
    labelX,
    labelY: y - 6,
    labelAnchor: position,
  };
}

export function polarToAngle(cx: number, cy: number, x: number, y: number): number {
  const angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
  return ((angle % 360) + 360) % 360;
}

function polarPoint(cx: number, cy: number, r: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return { x: cx + r * Math.cos(radians), y: cy + r * Math.sin(radians) };
}

export type ChartPieArc = {

  index: number;
  label: string;
  value: number;

  fraction: number;
  startAngle: number;
  endAngle: number;

  d: string;
  centroid: { x: number; y: number };
};

export function buildPieArcs(
  data: ChartDatum[],
  dataKey: string,
  labelKey: string,
  options: {
    cx: number;
    cy: number;
    outerRadius: number;
    innerRadius?: number;
    startAngle?: number;
  },
): ChartPieArc[] {
  const { cx, cy, outerRadius } = options;

  const innerRadius = Math.min(
    Math.max(options.innerRadius ?? 0, 0),
    Math.max(outerRadius - 1, 0),
  );
  const startAngle = options.startAngle ?? 270;
  const slices = data
    .map((datum, index) => {
      const raw = datum[dataKey];
      return {
        index,
        label: String(datum[labelKey] ?? ""),

        value: typeof raw === "number" && Number.isFinite(raw) ? raw : 0,
      };
    })
    .filter((slice) => slice.value > 0);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total <= 0 || outerRadius <= 0) return [];

  const arcs: ChartPieArc[] = [];
  let cursor = startAngle;
  for (const slice of slices) {
    const fraction = slice.value / total;
    const start = cursor;
    const end = start + fraction * 360;
    cursor = end;
    const largeArc = fraction > 0.5 ? 1 : 0;
    const o1 = polarPoint(cx, cy, outerRadius, start);
    const o2 = polarPoint(cx, cy, outerRadius, end);
    let d: string;
    if (fraction >= 0.9999) {

      const oh = polarPoint(cx, cy, outerRadius, start + 180);
      const outerRing = `M${o1.x} ${o1.y} A${outerRadius} ${outerRadius} 0 1 1 ${oh.x} ${oh.y} A${outerRadius} ${outerRadius} 0 1 1 ${o1.x} ${o1.y}`;
      if (innerRadius > 0) {
        const i1 = polarPoint(cx, cy, innerRadius, start);
        const ih = polarPoint(cx, cy, innerRadius, start + 180);
        d = `${outerRing} M${i1.x} ${i1.y} A${innerRadius} ${innerRadius} 0 1 0 ${ih.x} ${ih.y} A${innerRadius} ${innerRadius} 0 1 0 ${i1.x} ${i1.y} Z`;
      } else {

        d = `${outerRing} Z`;
      }
    } else if (innerRadius > 0) {
      const i1 = polarPoint(cx, cy, innerRadius, end);
      const i2 = polarPoint(cx, cy, innerRadius, start);
      d = `M${o1.x} ${o1.y} A${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${o2.x} ${o2.y} L${i1.x} ${i1.y} A${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${i2.x} ${i2.y} Z`;
    } else {
      d = `M${cx} ${cy} L${o1.x} ${o1.y} A${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${o2.x} ${o2.y} Z`;
    }
    const midAngle = (start + end) / 2;
    arcs.push({
      index: slice.index,
      label: slice.label,
      value: slice.value,
      fraction,
      startAngle: start,
      endAngle: end,
      d,
      centroid: polarPoint(cx, cy, innerRadius + (outerRadius - innerRadius) / 2, midAngle),
    });
  }
  return arcs;
}

export function pieIndexAtAngle(
  angle: number,
  values: number[],
  startAngle = 270,
): number | null {
  if (!values.length) return null;

  const weights = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = weights.reduce((sum, v) => sum + v, 0);
  if (total <= 0) return null;
  const rel = (((angle - startAngle) % 360) + 360) % 360;
  let cursor = 0;
  let lastPositive = -1;
  for (let i = 0; i < weights.length; i++) {
    const sweep = (weights[i] / total) * 360;
    if (sweep > 0) {
      lastPositive = i;
      if (rel < cursor + sweep) return i;
    }
    cursor += sweep;
  }

  return lastPositive >= 0 ? lastPositive : null;
}

export type RadarAxisPoint = {
  index: number;

  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelAnchor: "start" | "middle" | "end";
  label: string;
};

export type RadarGeometry = {
  cx: number;
  cy: number;
  radius: number;

  valueMax: number;
  axes: RadarAxisPoint[];

  gridD: string[];
  seriesD: Record<string, string>;
  seriesPoints: Record<string, Array<{ x: number; y: number }>>;
};

export function buildRadarGeometry(
  data: ChartDatum[],
  seriesKeys: string[],
  options: {
    cx: number;
    cy: number;
    radius: number;
    labelKey: string;
    levels?: number;
    startAngle?: number;
  },
): RadarGeometry {
  const { cx, cy, radius, labelKey } = options;
  const levels = Math.max(1, options.levels ?? 4);
  const startAngle = options.startAngle ?? 270;
  const count = data.length;
  const angleAt = (index: number) => startAngle + (index * 360) / Math.max(count, 1);
  let valueMax = 0;
  for (const datum of data) {
    for (const key of seriesKeys) {
      const value = datum[key];
      if (typeof value === "number" && Number.isFinite(value) && value > valueMax) {
        valueMax = value;
      }
    }
  }
  if (valueMax <= 0) valueMax = 1;

  const axes: RadarAxisPoint[] = data.map((datum, index) => {
    const angle = angleAt(index);
    const vertex = polarPoint(cx, cy, radius, angle);
    const labelPoint = polarPoint(cx, cy, radius + 14, angle);
    const cos = Math.cos((angle * Math.PI) / 180);
    const labelAnchor = Math.abs(cos) < 0.35 ? "middle" : cos > 0 ? "start" : "end";
    return {
      index,
      x: vertex.x,
      y: vertex.y,
      labelX: labelPoint.x,
      labelY: labelPoint.y + 4,
      labelAnchor,
      label: String(datum[labelKey] ?? ""),
    };
  });

  const gridD: string[] = [];
  if (count > 0) {
    for (let level = 1; level <= levels; level++) {
      const r = (radius * level) / levels;
      const points = data.map((_, index) => polarPoint(cx, cy, r, angleAt(index)));
      gridD.push(points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") + " Z");
    }
  }

  const seriesD: Record<string, string> = {};
  const seriesPoints: Record<string, Array<{ x: number; y: number }>> = {};
  for (const key of seriesKeys) {
    const points = data.map((datum, index) => {
      const value = datum[key];
      const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
      const r = (Math.max(numeric, 0) / valueMax) * radius;
      return polarPoint(cx, cy, r, angleAt(index));
    });
    seriesPoints[key] = points;

    seriesD[key] = points.length
      ? `${points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ")} Z`
      : "";
  }

  return { cx, cy, radius, valueMax, axes, gridD, seriesD, seriesPoints };
}

export function nearestRadarIndex(
  cx: number,
  cy: number,
  x: number,
  y: number,
  count: number,
  startAngle = 270,
): number | null {
  if (count <= 0) return null;
  const rel = (((polarToAngle(cx, cy, x, y) - startAngle) % 360) + 360) % 360;
  return Math.round(rel / (360 / count)) % count;
}

export function pixelToBandIndex(
  x: number,
  plotLeft: number,
  bandWidth: number,
  count: number,
): number {
  if (count <= 0) return 0;
  if (bandWidth <= 0) return 0;
  const index = Math.round((x - plotLeft) / bandWidth - 0.5);
  return Math.min(count - 1, Math.max(0, index));
}

export function yPixelsToDomain(
  scale: ChartScale,
  y0: number,
  y1: number,
): { min: number; max: number } {
  const plotBottom = scale.plotTop + scale.plotHeight;
  const clampY = (y: number) =>
    Math.min(plotBottom, Math.max(scale.plotTop, y));
  return {
    min: scale.yValueAt(clampY(Math.max(y0, y1))),
    max: scale.yValueAt(clampY(Math.min(y0, y1))),
  };
}

export function buildSelectionRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  scale: ChartScale,
  mode: "band" | "rect",
): { x: number; y: number; width: number; height: number } {
  const plotRight = scale.plotLeft + scale.plotWidth;
  const plotBottom = scale.plotTop + scale.plotHeight;
  const clampX = (v: number) => Math.min(plotRight, Math.max(scale.plotLeft, v));
  const clampY = (v: number) => Math.min(plotBottom, Math.max(scale.plotTop, v));
  const x0 = clampX(Math.min(a.x, b.x));
  const x1 = clampX(Math.max(a.x, b.x));
  if (mode === "band") {
    return {
      x: x0,
      y: scale.plotTop,
      width: Math.max(1, x1 - x0),
      height: scale.plotHeight,
    };
  }
  const y0 = clampY(Math.min(a.y, b.y));
  const y1 = clampY(Math.max(a.y, b.y));
  return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) };
}

function formatChartValue(value: number): string {
  return value.toLocaleString();
}

function firstCategoryKey(data: ChartDatum[]): string {
  const first = data[0];
  if (first) {
    for (const [key, value] of Object.entries(first)) {
      if (typeof value === "string") return key;
    }
  }
  return "x";
}

function summarizeSeries(
  config: ChartConfig,
  data: ChartDatum[],
  xKey: string,
  seriesKeys: string[],
): string {
  const xLabel = config[xKey]?.label;
  const xName = typeof xLabel === "string" ? xLabel : xKey;
  if (!seriesKeys.length) return `차트(${xName}) — 시리즈 없음`;
  const parts = seriesKeys.map((key) => {
    const label = config[key]?.label;
    const name = typeof label === "string" ? label : key;
    let min = Infinity;
    let max = -Infinity;
    for (const datum of data) {
      const value = datum[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
    if (min === Infinity) return `${name}: 값 없음`;
    return `${name} 최소 ${formatChartValue(min)} 최대 ${formatChartValue(max)}`;
  });
  return `차트(${xName}) — ${parts.join(", ")} (${data.length}개 항목)`;
}

type SeriesPoint = { index: number; value: number; x: number; y: number };

function seriesPoints(
  ctx: ChartContextValue,
  dataKey: string,
  scale: ChartScale,
): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  ctx.data.forEach((datum, index) => {
    const value = datum[dataKey];
    if (typeof value === "number" && Number.isFinite(value)) {
      points.push({ index, value, x: scale.xAt(index), y: scale.yAt(value) });
    }
  });
  return points;
}

function seriesIndex(ctx: ChartContextValue, dataKey: string): number {
  const index = ctx.seriesKeys.indexOf(dataKey);
  return index >= 0 ? index : 0;
}

function seriesScale(ctx: ChartContextValue, yAxisId?: string): ChartScale {
  return (yAxisId && ctx.scales[yAxisId]) || ctx.scale;
}

export type ChartBarSeriesProps = {
  dataKey: string;
  className?: string;

  radius?: number;

  stackId?: string;

  yAxisId?: string;
};

function ChartBarSeries({ dataKey, className, radius = 4, stackId, yAxisId }: ChartBarSeriesProps) {
  const ctx = useChart("ChartBarSeries");
  const scale = seriesScale(ctx, yAxisId);
  const color = resolveSeriesColor(
    ctx.config,
    dataKey,
    seriesIndex(ctx, dataKey),
    "fill",
    ctx.colorScheme,
  );

  const barWidth = Math.max(2, scale.bandWidth * 0.6);

  const zeroValue = Math.max(scale.yMin, Math.min(scale.yMax, 0));
  return (
    <>
      {ctx.data.map((datum, index) => {
        const value = datum[dataKey];
        if (typeof value !== "number" || !Number.isFinite(value)) return null;
        const segment = stackId ? ctx.barStacks[dataKey]?.[index] : null;
        if (stackId && !segment) return null;
        const base = segment?.base ?? 0;
        const topValue = segment
          ? Math.max(base, base + segment.value)
          : Math.max(value, zeroValue);
        const bottomValue = segment
          ? Math.min(base, base + segment.value)
          : Math.min(value, zeroValue);

        const top = scale.yAt(topValue);
        const bottom = scale.yAt(bottomValue);
        const barHeight = Math.max(0, bottom - top);
        return (
          <ChartRect
            key={index}
            x={scale.xAt(index) - barWidth / 2}
            y={top}
            width={barWidth}
            height={barHeight}
            rx={radius}
            className={cn(color.className, className)}
            fill={color.color}
          />
        );
      })}
    </>
  );
}

function activePointOf(ctx: ChartContextValue, points: SeriesPoint[]): SeriesPoint | null {
  if (ctx.activeIndex == null) return null;
  return points.find((point) => point.index === ctx.activeIndex) ?? null;
}

export type ChartLineSeriesProps = {
  dataKey: string;
  className?: string;
  strokeWidth?: number;

  yAxisId?: string;
};

function ChartLineSeries({ dataKey, className, strokeWidth = 2, yAxisId }: ChartLineSeriesProps) {
  const ctx = useChart("ChartLineSeries");
  const scale = seriesScale(ctx, yAxisId);
  const points = seriesPoints(ctx, dataKey, scale);
  if (!points.length) return null;
  const index = seriesIndex(ctx, dataKey);
  const stroke = resolveSeriesColor(ctx.config, dataKey, index, "stroke", ctx.colorScheme);
  const dot = resolveSeriesColor(ctx.config, dataKey, index, "fill", ctx.colorScheme);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const active = activePointOf(ctx, points);
  return (
    <>
      <ChartPath
        d={d}
        className={cn(stroke.className, className)}
        stroke={stroke.color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {active ? (
        <ChartCircle cx={active.x} cy={active.y} r={4} className={dot.className} fill={dot.color} />
      ) : null}
    </>
  );
}

export type ChartAreaSeriesProps = {
  dataKey: string;
  className?: string;
  strokeWidth?: number;

  yAxisId?: string;
};

function ChartAreaSeries({ dataKey, className, strokeWidth = 2, yAxisId }: ChartAreaSeriesProps) {
  const ctx = useChart("ChartAreaSeries");
  const scale = seriesScale(ctx, yAxisId);
  const points = seriesPoints(ctx, dataKey, scale);
  if (!points.length) return null;
  const index = seriesIndex(ctx, dataKey);
  const fill = resolveSeriesColor(ctx.config, dataKey, index, "fill", ctx.colorScheme);
  const stroke = resolveSeriesColor(ctx.config, dataKey, index, "stroke", ctx.colorScheme);
  const baseline = scale.yAt(Math.max(scale.yMin, Math.min(scale.yMax, 0)));
  const first = points[0];
  const last = points[points.length - 1];
  const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const areaD = `${lineD} L${last.x} ${baseline} L${first.x} ${baseline} Z`;
  const active = activePointOf(ctx, points);
  return (
    <>

      <ChartPath
        d={areaD}
        className={cn(fill.className, "opacity-50", className)}
        fill={fill.color}
      />
      <ChartPath
        d={lineD}
        className={stroke.className}
        stroke={stroke.color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {active ? (

        <ChartCircle
          cx={active.x}
          cy={active.y}
          r={4}
          className={dotOf(ctx, dataKey, ctx.colorScheme)}
          fill={stroke.color}
        />
      ) : null}
    </>
  );
}

function dotOf(
  ctx: ChartContextValue,
  dataKey: string,
  colorScheme: BridgeColorScheme,
): string {
  return resolveSeriesColor(
    ctx.config,
    dataKey,
    seriesIndex(ctx, dataKey),
    "fill",
    colorScheme,
  ).className;
}

export type ChartPieSeriesProps = {
  dataKey: string;
  className?: string;

  innerRadius?: number;

  outerRadius?: number;

  label?: boolean;
};

function ChartPieSeries({ dataKey, className, label = false }: ChartPieSeriesProps) {
  const ctx = useChart("ChartPieSeries");
  const pie = ctx.pie;
  if (!pie || pie.dataKey !== dataKey) return null;
  return (
    <>
      {pie.arcs.map((arc) => {
        const color = resolveSeriesColor(
          ctx.config,
          arc.label,
          arc.index,
          "fill",
          ctx.colorScheme,
        );
        return (
          <ChartPath
            key={arc.index}
            d={arc.d}
            className={cn(color.className, className)}
            fill={color.color}
          />
        );
      })}
      {label
        ? pie.arcs.map((arc) => (
            <ChartText
              key={`label-${arc.index}`}
              x={arc.centroid.x}
              y={arc.centroid.y + 4}
              textAnchor="middle"
              fontSize={11}
              className="fill-foreground"
            >
              {`${Math.round(arc.fraction * 100)}%`}
            </ChartText>
          ))
        : null}
    </>
  );
}

export type ChartRadialSeriesProps = {
  dataKey: string;
  className?: string;
  strokeWidth?: number;

  levels?: number;
};

function ChartRadialSeries({ dataKey, className, strokeWidth = 2 }: ChartRadialSeriesProps) {
  const ctx = useChart("ChartRadialSeries");
  const radar = ctx.radar;
  const d = radar?.seriesD[dataKey];
  if (!radar || !d) return null;
  const index = seriesIndex(ctx, dataKey);
  const fill = resolveSeriesColor(ctx.config, dataKey, index, "fill", ctx.colorScheme);
  const stroke = resolveSeriesColor(ctx.config, dataKey, index, "stroke", ctx.colorScheme);
  const active =
    ctx.activeIndex == null ? null : radar.seriesPoints[dataKey]?.[ctx.activeIndex] ?? null;
  return (
    <>

      <ChartPath
        d={d}
        className={cn(fill.className, "opacity-50", className)}
        fill={fill.color}
      />
      <ChartPath
        d={d}
        className={stroke.className}
        stroke={stroke.color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {active ? (
        <ChartCircle
          cx={active.x}
          cy={active.y}
          r={4}
          className={dotOf(ctx, dataKey, ctx.colorScheme)}
          fill={stroke.color}
        />
      ) : null}
    </>
  );
}

export type ChartGridProps = {
  className?: string;
};

function ChartGrid({ className }: ChartGridProps) {
  const { scale } = useChart("ChartGrid");
  const x2 = scale.plotLeft + scale.plotWidth;
  return (
    <>
      {scale.ticksY.map((tick) => (
        <ChartLine
          key={tick}
          x1={scale.plotLeft}
          x2={x2}
          y1={scale.yAt(tick)}
          y2={scale.yAt(tick)}
          strokeWidth={1}
          className={cn("stroke-border/50", className)}
        />
      ))}
    </>
  );
}

export type ChartXAxisProps = {
  className?: string;

  tickFormat?: (value: string, index: number) => string;
};

function ChartXAxis({ className, tickFormat }: ChartXAxisProps) {
  const ctx = useChart("ChartXAxis");
  const { scale, data, xKey } = ctx;
  const baseline = scale.plotTop + scale.plotHeight;

  const step = Math.max(1, Math.ceil((data.length * 24) / Math.max(scale.plotWidth, 1)));
  return (
    <>
      <ChartLine
        x1={scale.plotLeft}
        x2={scale.plotLeft + scale.plotWidth}
        y1={baseline}
        y2={baseline}
        strokeWidth={1}
        className={cn("stroke-border", className)}
      />
      {data.map((datum, index) => {
        if (index % step !== 0) return null;
        const raw = datum[xKey];
        const value = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
        return (
          <ChartText
            key={index}
            x={scale.xAt(index)}
            y={baseline + 16}
            textAnchor="middle"
            fontSize={12}
            className={cn("fill-muted-foreground", className)}
          >
            {tickFormat ? tickFormat(value, index) : value}
          </ChartText>
        );
      })}
    </>
  );
}

export type ChartYAxisProps = {
  className?: string;

  tickFormat?: (value: number) => string;

  yAxisId?: string;

  orientation?: "left" | "right";
};

function ChartYAxis({ className, tickFormat, yAxisId, orientation = "left" }: ChartYAxisProps) {
  const ctx = useChart("ChartYAxis");
  const scale = seriesScale(ctx, yAxisId);
  const right = orientation === "right";
  const axisX = right ? scale.plotLeft + scale.plotWidth : scale.plotLeft;
  return (
    <>
      <ChartLine
        x1={axisX}
        x2={axisX}
        y1={scale.plotTop}
        y2={scale.plotTop + scale.plotHeight}
        strokeWidth={1}
        className={cn("stroke-border", className)}
      />
      {scale.ticksY.map((tick) => (
        <ChartText
          key={tick}
          x={right ? axisX + 8 : axisX - 8}
          y={scale.yAt(tick) + 4}
          textAnchor={right ? "start" : "end"}
          fontSize={12}
          className={cn("fill-muted-foreground", className)}
        >
          {tickFormat ? tickFormat(tick) : formatChartValue(tick)}
        </ChartText>
      ))}
    </>
  );
}

export type ChartReferenceLineProps = {

  x?: string;

  y?: number;
  className?: string;

  stroke?: string;

  strokeDasharray?: string;

  label?: string;

  labelPosition?: "start" | "middle" | "end";
  labelClassName?: string;

  yAxisId?: string;
};

function ChartReferenceLine({
  x,
  y,
  className,
  stroke,
  strokeDasharray = "4 4",
  label,
  labelPosition,
  labelClassName,
  yAxisId,
}: ChartReferenceLineProps) {
  const ctx = useChart("ChartReferenceLine");
  const scale = seriesScale(ctx, yAxisId);
  const axis = y !== undefined ? "y" : "x";
  const geometry = buildReferenceLine({
    axis,
    value: axis === "y" ? (y as number) : (x as string),
    scale,
    data: ctx.data,
    xKey: ctx.xKey,
    labelPosition,
  });
  if (!geometry) return null;
  return (
    <>
      <ChartLine
        x1={geometry.x1}
        y1={geometry.y1}
        x2={geometry.x2}
        y2={geometry.y2}
        strokeWidth={1}
        strokeDasharray={strokeDasharray}
        className={cn("stroke-border", className)}
        stroke={stroke}
      />
      {label != null ? (
        <ChartText
          x={geometry.labelX}
          y={geometry.labelY}
          textAnchor={geometry.labelAnchor}
          fontSize={11}
          className={cn("fill-muted-foreground", labelClassName)}
        >
          {label}
        </ChartText>
      ) : null}
    </>
  );
}

export type ChartTooltipProps = {

  content?: ReactNode;
};

function ChartTooltip({ content }: ChartTooltipProps) {
  const ctx = useChart("ChartTooltip");

  const [cardWidth, setCardWidth] = useState(0);
  const active = ctx.activeIndex;
  if (active == null) return null;

  const pieArc = ctx.pie?.arcs.find((arc) => arc.index === active);
  const radarAxis = ctx.radar?.axes.find((axis) => axis.index === active);
  const x = pieArc ? pieArc.centroid.x : radarAxis ? radarAxis.x : ctx.scale.xAt(active);
  const width = cardWidth > 0 ? cardWidth : TOOLTIP_WIDTH;
  const left = Math.min(Math.max(x - width / 2, 0), Math.max(ctx.width - width, 0));
  return (
    <View pointerEvents="none" className="absolute" style={{ left: Math.round(left), top: 0 }}>
      <View
        onLayout={(layout: BridgeLayout) => {
          const next = Math.round(layout.width);
          setCardWidth((prev) => (Math.abs(prev - next) >= 1 ? next : prev));
        }}
      >
        {content ?? <ChartTooltipContent />}
      </View>
    </View>
  );
}

export type ChartTooltipFormatter = (value: string | number, name: string) => ReactNode;
export type ChartTooltipLabelFormatter = (label: string, datum: ChartDatum) => ReactNode;

export type ChartTooltipContentProps = {
  className?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "dot" | "line" | "dashed";
  labelFormatter?: ChartTooltipLabelFormatter;
  labelClassName?: string;
  formatter?: ChartTooltipFormatter;

  color?: string;

  nameKey?: string;

  labelKey?: string;
};

type TooltipItem = {
  key: string;
  value: string | number;
  itemConfig: ChartConfig[string] | undefined;
  colorClass: string;
  colorValue: string | undefined;
};

function tooltipItems(ctx: ChartContextValue): TooltipItem[] {
  const datum = ctx.activeIndex == null ? undefined : ctx.data[ctx.activeIndex];
  if (!datum) return [];
  if (ctx.pie) {

    const label = datum[ctx.xKey];
    const labelText = label == null ? "" : String(label);
    const raw = datum[ctx.pie.dataKey];
    if (raw == null) return [];
    const value = typeof raw === "number" ? raw : String(raw);
    const resolved = resolveSeriesColor(
      ctx.config,
      labelText,
      ctx.activeIndex ?? 0,
      "bg",
      ctx.colorScheme,
    );
    return [
      {
        key: labelText || ctx.pie.dataKey,
        value,
        itemConfig: ctx.config[labelText],
        colorClass: resolved.className,
        colorValue: resolved.color,
      },
    ];
  }
  return ctx.seriesKeys
    .map((key) => {
      const value = datum[key];
      if (value == null) return null;
      const itemConfig = ctx.config[key];
      const resolved = resolveSeriesColor(
        ctx.config,
        key,
        seriesIndex(ctx, key),
        "bg",
        ctx.colorScheme,
      );
      return { key, value, itemConfig, colorClass: resolved.className, colorValue: resolved.color };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function ChartTooltipContent({
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) {
  const ctx = useChart("ChartTooltipContent");

  const datum = ctx.activeIndex == null ? undefined : ctx.data[ctx.activeIndex];
  if (!datum) return null;

  const rawLabel = labelKey ? datum[labelKey] : datum[ctx.xKey];
  const labelConfig = labelKey ? ctx.config[labelKey]?.label : ctx.config[ctx.xKey]?.label;
  const labelText =
    typeof labelConfig === "string" ? labelConfig : rawLabel == null ? "" : String(rawLabel);

  const items = tooltipItems(ctx);

  const nestLabel = items.length === 1 && indicator !== "dot";

  const tooltipLabel =
    hideLabel || !labelText ? null : (
      <View className={cn(labelClassName)}>
        {labelFormatter ? (
          labelFormatter(labelText, datum)
        ) : (
          <Text className="font-sans text-xs font-medium text-foreground">{labelText}</Text>
        )}
      </View>
    );

  return (
    <View
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 web:shadow-xl",
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <View className="grid gap-1.5">
        {items.map((item) => {
          const label = item.itemConfig?.label;
          const name = typeof label === "string" ? label : item.key;
          const indicatorColor = color ?? item.colorValue;
          return (
            <View
              key={item.key}
              className={cn(
                "flex w-full flex-row flex-wrap items-stretch gap-2",
                indicator === "dot" && "items-center",
              )}
            >
              {formatter && item.value !== undefined ? (
                formatter(item.value, name)
              ) : (
                <>
                  {item.itemConfig?.icon ? (
                    <item.itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <View
                        className={cn(
                          "shrink-0 rounded-xs",
                          indicator === "dot" && "h-2.5 w-2.5",
                          indicator === "line" && "w-1",
                          indicator === "dashed" && "w-0 border-2 border-dashed bg-transparent",
                          nestLabel && indicator === "dashed" && "my-0.5",
                          !indicatorColor && item.colorClass,
                        )}
                        style={
                          indicatorColor
                            ? { backgroundColor: indicatorColor, borderColor: indicatorColor }
                            : undefined
                        }
                      />
                    )
                  )}
                  <View
                    className={cn(
                      "flex flex-1 flex-row justify-between leading-none",
                      nestLabel ? "items-end" : "items-center",
                    )}
                  >
                    <View className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <Text className="text-xs text-muted-foreground">{name}</Text>
                    </View>
                    {item.value != null && (
                      <Text className="font-mono text-xs font-medium text-foreground tabular-nums">
                        {typeof item.value === "number"
                          ? formatChartValue(item.value)
                          : String(item.value)}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export type ChartLegendItem = {
  dataKey: string;

  color?: string;

  colorClassName?: string;
};

export type ChartLegendProps = {
  content?: ReactNode;
  verticalAlign?: "top" | "bottom";
  className?: string;
};

function ChartLegend({ content, verticalAlign = "bottom", className }: ChartLegendProps) {
  const ctx = useChart("ChartLegend");
  if (content != null) return <>{content}</>;
  return (
    <ChartLegendContent
      payload={defaultLegendPayload(ctx)}
      verticalAlign={verticalAlign}
      className={className}
    />
  );
}

function defaultLegendPayload(ctx: ChartContextValue): ChartLegendItem[] {
  if (ctx.pie) {

    return ctx.pie.arcs.map((arc) => {
      const resolved = resolveSeriesColor(
        ctx.config,
        arc.label,
        arc.index,
        "bg",
        ctx.colorScheme,
      );
      return { dataKey: arc.label, color: resolved.color, colorClassName: resolved.className };
    });
  }
  return ctx.seriesKeys.map((key) => ({
    dataKey: key,
    color: resolveSeriesColor(
      ctx.config,
      key,
      seriesIndex(ctx, key),
      "bg",
      ctx.colorScheme,
    ).color,
  }));
}

export type ChartLegendContentProps = {
  className?: string;
  hideIcon?: boolean;
  payload?: ChartLegendItem[];
  verticalAlign?: "top" | "bottom";
  nameKey?: string;
};

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: ChartLegendContentProps) {
  const ctx = useChart("ChartLegendContent");
  const items = payload ?? defaultLegendPayload(ctx);
  if (!items.length) return null;
  return (
    <View
      className={cn(
        "w-full flex-row items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {items.map((item) => {
        const itemConfig = ctx.config[nameKey ?? item.dataKey] ?? ctx.config[item.dataKey];
        const label = itemConfig?.label;
        const colorClass = item.color
          ? ""
          : item.colorClassName ?? getChartColor(seriesIndex(ctx, item.dataKey), "bg");
        return (
          <View key={item.dataKey} className="flex-row items-center gap-1.5">
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <View
                className={cn("h-2 w-2 shrink-0 rounded-xs", colorClass)}
                style={item.color ? { backgroundColor: item.color } : undefined}
              />
            )}
            {typeof label === "string" ? (
              <Text className="text-xs text-foreground">{label}</Text>
            ) : label != null ? (
              label
            ) : (
              <Text className="text-xs text-foreground">{item.dataKey}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

export type ChartBrushProps = {
  className?: string;

  fill?: string;
};

function ChartBrush({ className, fill }: ChartBrushProps) {
  const ctx = useChart("ChartBrush");
  const { scale, selectionRect, brushWindow, fullData } = ctx;
  const baseline = scale.plotTop + scale.plotHeight;
  const fullStep = fullData.length > 0 ? scale.plotWidth / fullData.length : scale.plotWidth;
  const bandX = (index: number) => scale.plotLeft + fullStep * index;
  return (
    <>
      {selectionRect ? (
        <ChartRect
          x={selectionRect.x}
          y={selectionRect.y}
          width={selectionRect.width}
          height={selectionRect.height}
          className={cn("fill-muted/30", className)}
          fill={fill}
        />
      ) : null}
      {brushWindow ? (

        <>
          <ChartRect
            x={scale.plotLeft}
            y={baseline - 4}
            width={scale.plotWidth}
            height={4}
            className="fill-muted/40"
          />
          <ChartRect
            x={bandX(brushWindow[0])}
            y={baseline - 5}
            width={Math.max(2, bandX(brushWindow[1] + 1) - bandX(brushWindow[0]))}
            height={6}
            rx={2}
            className={cn("fill-chart-1", className)}
          />
        </>
      ) : null}
    </>
  );
}

export type ChartZoomProps = {
  className?: string;

  fill?: string;
};

function ChartZoom({ className, fill }: ChartZoomProps) {
  const ctx = useChart("ChartZoom");
  const { selectionRect } = ctx;
  if (!selectionRect) return null;
  return (
    <ChartRect
      x={selectionRect.x}
      y={selectionRect.y}
      width={selectionRect.width}
      height={selectionRect.height}
      rx={2}
      className={cn("fill-primary/10 stroke-primary", className)}
      fill={fill}
    />
  );
}

function ChartStyle(_props: { id?: string; config?: ChartConfig }) {
  return null;
}

type SeriesChildMeta = {
  dataKey: string;
  kind: "bar" | "line" | "area" | "pie" | "radial";
  stackId?: string;
  yAxisId?: string;
};

type PieChildMeta = {
  dataKey: string;
  innerRadius?: number;
  outerRadius?: number;
};

export type ChartContainerProps = Omit<ViewProps, "children"> & {
  config: ChartConfig;
  data?: ChartDatum[];

  xKey?: string;

  width?: number | "fluid";

  height?: number | "fluid";

  accessibilityLabel?: string;
  children?: ReactNode;
};

const ChartContainer = forwardRef<BridgeViewRef, ChartContainerProps>(
  (
    {
      config,
      data = [],
      xKey,
      width = INITIAL_DIMENSION.width,
      height = INITIAL_DIMENSION.height,
      accessibilityLabel,
      className,
      children,
      onLayout,
      ...props
    },
    ref,
  ) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const colorScheme = useColorScheme();

    const [fluidWidth, setFluidWidth] = useState(0);
    const [fluidHeight, setFluidHeight] = useState(0);
    const handleLayout =
      width === "fluid" || height === "fluid" || onLayout !== undefined
        ? (layout: BridgeLayout) => {
            if (width === "fluid") {
              const next = Math.round(layout.width);
              setFluidWidth((prev) =>
                Math.abs(prev - next) >= 1 ? next : prev,
              );
            }
            onLayout?.(layout);
          }
        : undefined;
    const canvasWidth =
      width === "fluid" ? fluidWidth || INITIAL_DIMENSION.width : width;
    const canvasHeight =
      height === "fluid" ? fluidHeight || INITIAL_DIMENSION.height : height;

    const svgChildren: ReactNode[] = [];
    const overlayChildren: ReactNode[] = [];
    const flowChildren: ReactNode[] = [];
    const seriesMeta: SeriesChildMeta[] = [];
    const axisMeta: Array<{ id: string; orientation: "left" | "right" }> = [];
    let pieMeta: PieChildMeta | null = null;
    let radarLevels = 4;
    let hasBrush = false;
    let hasZoom = false;
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        if (child.type === ChartTooltip) {
          overlayChildren.push(child);
          return;
        }
        if (child.type === ChartLegend) {
          flowChildren.push(child);
          return;
        }
        const seriesProps = child.props as {
          dataKey?: string;
          stackId?: string;
          yAxisId?: string;
          innerRadius?: number;
          outerRadius?: number;
          levels?: number;
          orientation?: "left" | "right";
        };
        if (
          child.type === ChartBarSeries ||
          child.type === ChartLineSeries ||
          child.type === ChartAreaSeries ||
          child.type === ChartPieSeries ||
          child.type === ChartRadialSeries
        ) {
          if (typeof seriesProps.dataKey === "string") {
            const kind =
              child.type === ChartBarSeries
                ? "bar"
                : child.type === ChartLineSeries
                  ? "line"
                  : child.type === ChartAreaSeries
                    ? "area"
                    : child.type === ChartPieSeries
                      ? "pie"
                      : "radial";
            seriesMeta.push({
              dataKey: seriesProps.dataKey,
              kind,
              stackId: kind === "bar" ? seriesProps.stackId : undefined,
              yAxisId: seriesProps.yAxisId,
            });
            if (kind === "pie" && !pieMeta) {
              pieMeta = {
                dataKey: seriesProps.dataKey,
                innerRadius: seriesProps.innerRadius,
                outerRadius: seriesProps.outerRadius,
              };
            }
            if (kind === "radial" && typeof seriesProps.levels === "number") {
              radarLevels = seriesProps.levels;
            }
          }
        } else if (child.type === ChartYAxis) {
          axisMeta.push({
            id: seriesProps.yAxisId ?? DEFAULT_Y_AXIS_ID,
            orientation: seriesProps.orientation ?? "left",
          });
        } else if (child.type === ChartBrush) {
          hasBrush = true;
        } else if (child.type === ChartZoom) {
          hasZoom = true;
        }
      }
      svgChildren.push(child);
    });

    const seriesKeys = seriesMeta.map((meta) => meta.dataKey);
    const resolvedXKey = xKey ?? firstCategoryKey(data);
    const polarMode = pieMeta ? "pie" : seriesMeta.some((m) => m.kind === "radial") ? "radar" : null;
    const interactive = hasBrush || hasZoom;

    const [brushWindow, setBrushWindow] = useState<[number, number] | null>(null);
    const [zoomDomain, setZoomDomain] = useState<{ min: number; max: number } | null>(null);
    const [selectionRect, setSelectionRect] = useState<ChartContextValue["selectionRect"]>(null);
    const resetDomain = () => {
      setBrushWindow(null);
      setZoomDomain(null);
      setActiveIndex(null);
    };
    const zoomed = brushWindow != null || zoomDomain != null;

    const windowRange: [number, number] | null = brushWindow
      ? [
          Math.min(brushWindow[0], Math.max(data.length - 1, 0)),
          Math.min(brushWindow[1], Math.max(data.length - 1, 0)),
        ]
      : null;
    const viewData = useMemo(
      () =>
        windowRange
          ? data.slice(windowRange[0], windowRange[1] + 1)
          : data,

      [data, brushWindow],
    );

    const rightAxis = axisMeta.some((axis) => axis.orientation === "right");
    const effectivePadding = rightAxis ? { right: CHART_PADDING_AXIS_RIGHT } : undefined;

    const axisIds = Array.from(
      new Set([DEFAULT_Y_AXIS_ID, ...seriesMeta.map((m) => m.yAxisId ?? DEFAULT_Y_AXIS_ID), ...axisMeta.map((a) => a.id)]),
    );
    const scales = useMemo(() => {
      const result: Record<string, ChartScale> = {};
      for (const id of axisIds) {
        const members = seriesMeta.filter(
          (meta) => (meta.yAxisId ?? DEFAULT_Y_AXIS_ID) === id && meta.kind !== "pie" && meta.kind !== "radial",
        );
        result[id] = buildChartScale(
          viewData,
          members.map((meta) => meta.dataKey),
          canvasWidth,
          canvasHeight,
          {
            padding: effectivePadding,
            range: seriesEffectiveRange(viewData, members),
            yDomain: id === DEFAULT_Y_AXIS_ID ? zoomDomain ?? undefined : undefined,
          },
        );
      }
      return result;

    }, [children, viewData, canvasWidth, canvasHeight, zoomDomain]);
    const scale = scales[DEFAULT_Y_AXIS_ID];

    const barStacks = useMemo(
      () =>
        computeBarStackOffsets(
          viewData,
          seriesMeta
            .filter((meta) => meta.kind === "bar" && meta.stackId)
            .map((meta) => ({ dataKey: meta.dataKey, stackId: meta.stackId as string })),
        ),

      [children, viewData],
    );

    const pieGeometry = useMemo(() => {
      if (!pieMeta) return null;
      const box = chartPlotBox(canvasWidth, canvasHeight, effectivePadding);
      const cx = box.plotLeft + box.plotWidth / 2;
      const cy = box.plotTop + box.plotHeight / 2;
      const outerRadius = pieMeta.outerRadius ?? Math.min(box.plotWidth, box.plotHeight) / 2;
      return {
        dataKey: pieMeta.dataKey,
        cx,
        cy,
        outerRadius,
        arcs: buildPieArcs(viewData, pieMeta.dataKey, resolvedXKey, {
          cx,
          cy,
          outerRadius,
          innerRadius: pieMeta.innerRadius ?? 0,
        }),
      };

    }, [children, viewData, canvasWidth, canvasHeight]);

    const radarGeometry = useMemo(() => {
      const keys = seriesMeta.filter((meta) => meta.kind === "radial").map((meta) => meta.dataKey);
      if (!keys.length) return null;
      const box = chartPlotBox(canvasWidth, canvasHeight, effectivePadding);
      return buildRadarGeometry(viewData, keys, {
        cx: box.plotLeft + box.plotWidth / 2,
        cy: box.plotTop + box.plotHeight / 2,
        radius: Math.min(box.plotWidth, box.plotHeight) / 2,
        labelKey: resolvedXKey,
        levels: radarLevels,
      });

    }, [children, viewData, canvasWidth, canvasHeight]);

    const nearest = (x: number, y: number): number | null => {
      if (!viewData.length) return null;
      if (polarMode === "pie" && pieGeometry) {
        const { cx, cy, outerRadius } = pieGeometry;
        if (Math.hypot(x - cx, y - cy) > outerRadius + 8) return null;
        return pieIndexAtAngle(
          polarToAngle(cx, cy, x, y),
          viewData.map((datum) =>
            typeof datum[pieGeometry.dataKey] === "number"
              ? (datum[pieGeometry.dataKey] as number)
              : 0,
          ),
        );
      }
      if (polarMode === "radar") {
        return nearestRadarIndex(
          scale.plotLeft + scale.plotWidth / 2,
          scale.plotTop + scale.plotHeight / 2,
          x,
          y,
          viewData.length,
        );
      }
      return pixelToBandIndex(x, scale.plotLeft, scale.bandWidth, viewData.length);
    };

    const summary = useMemo(
      () =>
        accessibilityLabel ??
        summarizeSeries(config, viewData, resolvedXKey, seriesKeys),
      [accessibilityLabel, config, viewData, resolvedXKey, seriesKeys],
    );

    const wrapperRef = useRef<BridgeViewRef | null>(null);
    const wrapperOriginRef = useRef<{ x: number; y: number } | null>(null);
    const gestureStartRef = useRef<{ x: number; y: number } | null>(null);
    const lastTapRef = useRef<{ x: number; y: number; t: number } | null>(null);
    const measureWrapper = () => {
      measureInWindow(wrapperRef.current, (x, y, _w, _h, pageX, pageY) => {
        wrapperOriginRef.current = { x: pageX ?? x, y: pageY ?? y };
      });
    };
    useEffect(() => {
      if (interactive) measureWrapper();

    }, [interactive]);

    const chipX = scale.plotLeft + scale.plotWidth - RESET_CHIP.width - RESET_CHIP.offset;
    const chipY = scale.plotTop + RESET_CHIP.offset;

    const handleTap = (local: { x: number; y: number }) => {
      if (
        zoomed &&
        local.x >= chipX &&
        local.x <= chipX + RESET_CHIP.width &&
        local.y >= chipY &&
        local.y <= chipY + RESET_CHIP.height
      ) {
        resetDomain();
        return;
      }
      const now = Date.now();
      const last = lastTapRef.current;
      if (
        last &&
        now - last.t <= DOUBLE_TAP_WINDOW &&
        Math.hypot(local.x - last.x, local.y - last.y) <= 32
      ) {

        lastTapRef.current = null;
        resetDomain();
        return;
      }
      lastTapRef.current = { x: local.x, y: local.y, t: now };
      const next = nearest(local.x, local.y);
      setActiveIndex((prev) => (prev === next ? null : next));
    };

    const commitSelection = (start: { x: number; y: number }, end: { x: number; y: number }) => {
      const a = pixelToBandIndex(Math.min(start.x, end.x), scale.plotLeft, scale.bandWidth, viewData.length);
      const b = pixelToBandIndex(Math.max(start.x, end.x), scale.plotLeft, scale.bandWidth, viewData.length);
      const offset = windowRange?.[0] ?? 0;
      const lo = offset + Math.min(a, b);
      const hi = offset + Math.max(a, b);

      if (hi - lo >= 1) {
        setBrushWindow(lo <= 0 && hi >= data.length - 1 ? null : [lo, hi]);
      }
      if (hasZoom && Math.abs(end.y - start.y) >= TAP_THRESHOLD) {
        const domain = yPixelsToDomain(scale, start.y, end.y);

        if (domain.max > domain.min) setZoomDomain(domain);
      }
      setActiveIndex(null);
    };

    const { dragHandlers } = useDrag({
      onBegin: () => {
        measureWrapper();
        gestureStartRef.current = null;
      },
      onMove: (event: BridgeDragEvent) => {
        const origin = wrapperOriginRef.current;
        if (!origin) return;
        const local = { x: event.x - origin.x, y: event.y - origin.y };
        if (!gestureStartRef.current) {
          if (Math.abs(event.dx) < 3 && Math.abs(event.dy) < 3) return;

          gestureStartRef.current = { x: local.x - event.dx, y: local.y - event.dy };
        }
        setSelectionRect(
          buildSelectionRect(gestureStartRef.current, local, scale, hasZoom ? "rect" : "band"),
        );
      },
      onEnd: (event?: BridgeDragEvent) => {
        const start = gestureStartRef.current;
        gestureStartRef.current = null;
        setSelectionRect(null);
        const origin = wrapperOriginRef.current;
        if (!origin || !event) return;
        const local = { x: event.x - origin.x, y: event.y - origin.y };
        const tiny = Math.abs(event.dx) < TAP_THRESHOLD && Math.abs(event.dy) < TAP_THRESHOLD;
        if (!start || tiny) {
          handleTap(local);
          return;
        }
        commitSelection(start, local);
      },
    });

    return (
      <ChartContext.Provider
        value={{
          config,
          data: viewData,
          xKey: resolvedXKey,
          scale,
          scales,
          barStacks,
          pie: pieGeometry,
          radar: radarGeometry,
          fullData: data,
          brushWindow: windowRange,
          selectionRect,
          zoomed,
          seriesKeys,
          activeIndex,
          width: canvasWidth,
          height: canvasHeight,
          colorScheme,
        }}
      >
        <View
          ref={ref}
          onLayout={handleLayout}
          className={cn(
            "relative flex-col items-center",

            width === "fluid" && "w-full min-w-0",
            className,
          )}
          {...props}
        >
          <View
            ref={wrapperRef}
            className={cn(
              "relative",

              height === "fluid" && "flex-1 self-stretch min-h-0 overflow-hidden",
              interactive && "touch-none web:cursor-crosshair",
            )}
            onLayout={
              height === "fluid"
                ? (layout: BridgeLayout) => {

                    const next = Math.round(layout.height);
                    setFluidHeight((prev) =>
                      next >= 40 && Math.abs(prev - next) >= 1 ? next : prev,
                    );
                  }
                : undefined
            }
            {...(interactive ? (dragHandlers as ViewProps) : {})}
          >
            <ChartSurface
              width={canvasWidth}
              height={canvasHeight}
              accessibilityLabel={summary}
              onPointMove={(point) => setActiveIndex(nearest(point.x, point.y))}
              onPointLeave={() => setActiveIndex(null)}
            >

              {radarGeometry ? (
                <>
                  {radarGeometry.gridD.map((d, i) => (
                    <ChartPath
                      key={`grid-${i}`}
                      d={d}
                      fill="none"
                      strokeWidth={1}
                      className="stroke-border/50"
                    />
                  ))}
                  {radarGeometry.axes.map((axis) => (
                    <ChartLine
                      key={`axis-${axis.index}`}
                      x1={radarGeometry.cx}
                      y1={radarGeometry.cy}
                      x2={axis.x}
                      y2={axis.y}
                      strokeWidth={1}
                      className="stroke-border/50"
                    />
                  ))}
                  {radarGeometry.axes.map((axis) => (
                    <ChartText
                      key={`axis-label-${axis.index}`}
                      x={axis.labelX}
                      y={axis.labelY}
                      textAnchor={axis.labelAnchor}
                      fontSize={12}
                      className="fill-muted-foreground"
                    >
                      {axis.label}
                    </ChartText>
                  ))}
                </>
              ) : null}
              {svgChildren}
              {
                                                       }
              {!interactive ? (
                <ChartRect
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  fill="transparent"
                  onPress={(point) => {
                    const next = nearest(point.x, point.y);
                    setActiveIndex((prev) => (prev === next ? null : next));
                  }}
                />
              ) : null}

              {interactive && zoomed ? (
                <>
                  <ChartRect
                    x={chipX}
                    y={chipY}
                    width={RESET_CHIP.width}
                    height={RESET_CHIP.height}
                    rx={4}
                    className="fill-background stroke-border"
                  />
                  <ChartText
                    x={chipX + RESET_CHIP.width / 2}
                    y={chipY + 12}
                    textAnchor="middle"
                    fontSize={10}
                    className="fill-muted-foreground"
                  >
                    {RESET_CHIP.label}
                  </ChartText>
                </>
              ) : null}
            </ChartSurface>

            <View pointerEvents="box-none" className="absolute inset-0">
              {overlayChildren}
            </View>
          </View>
          {flowChildren}
        </View>
      </ChartContext.Provider>
    );
  },
);
ChartContainer.displayName = "ChartContainer";

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartBarSeries,
  ChartLineSeries,
  ChartAreaSeries,
  ChartPieSeries,
  ChartRadialSeries,
  ChartGrid,
  ChartXAxis,
  ChartYAxis,
  ChartReferenceLine,
  ChartBrush,
  ChartZoom,
  getChartColor,
};
