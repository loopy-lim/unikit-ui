// [소비자 사본] packages/unikit/registry/ui/chart.tsx를 apps/web으로 복사한 것
// (shadcn 배포 모델 — chart는 Metro 오염 방지를 위해 패키지 진입점에서 제외되고
// 소비자 앱이 이 파일을 소유한다. registry.json target = components/ui/chart.tsx).
// 조정: cn을 "../lib/utils" 대신 패키지 진입점 export에서 가져온다.
// 아래부터는 원본(사이클 40, T-3a) 머리주석 그대로.
// Chart — shadcn/ui(new-york-v4) chart.tsx 유니버설 포팅 (사이클 40, T-3a).
// 원본: shadcn-ref/ui/chart.tsx — recharts 2.x 기반. ChartContainer가
// ResponsiveContainer으로 recharts 트리를 감쌌고 ChartTooltip/ChartLegend는
// recharts Primitive를 그대로 재수출했다.
//
// 포팅 판단(원본 대비 차이·이유):
// - recharts 제거. ChartContainer(config, children) 시그니처는 유지하되 children은
//   recharts 차트가 아니라 이 파일의 선언형 요소 조합으로 바뀌었다 — 시리즈
//   (ChartBarSeries·ChartLineSeries·ChartAreaSeries), 보조(ChartGrid·ChartXAxis·
//   ChartYAxis), 오버레이(ChartTooltip), 범례(ChartLegend). 스케일·틱 계산을
//   내장하고 형상은 @unikit-bridge/ui/chart 렌더러(ChartSurface·ChartPath·
//   ChartRect·ChartLine·ChartText·ChartCircle)가 그린다(골격 계약 그대로).
// - 색상 전략(확정): 시리즈 기본색은 getChartColor(index, kind)가 리터럴 토큰
//   클래스(fill-chart-1..5 / stroke-chart-1..5 / bg-chart-1..5, 5색 순환)를
//   반환하고 이를 className으로 싣는다. 웹은 소비자 앱 Tailwind v4가 소비자
//   globals.css의 --chart-N 변수(shadcn 차트 표준 토큰 — 값의 소유자는 소비자
//   앱)에서 유틸리티를 생성하고, 네이티브는 uniwind 테마에 --chart-N이 등록돼
//   있으면 적용된다(없으면 폐기 — 렌더러 골격의 "className 원칙, prop 폴백"
//   계약과 동일). config[key].color가 명시 문자열이면 그것이 우선해 fill/stroke
//   prop에 직접 전달된다(#hex·hsl()·var(--chart-2) 모두 웹은 확실히 동작,
//   네이티브는 리터럴 색 확실·var()은 uniwind 의존). config.theme{light,dark}는
//   스킴 조회 계약이 없어 light 값을 쓴다(다크 전환 미지원 — 로드맵).
// - ChartStyle은 원본 시그니처를 유지하되 no-op: CSS 변수 <style> 주입은
//   네이티브에서 불가능하고(RN은 <style>을 렌더할 수 없음) 위 전략은 JS 레벨
//   이라 --color-* 주입이 불필요하다.
// - 접근성: 원본 accessibilityLayer(recharts 옵션) 대신 ChartSurface에 시리즈
//   요약 accessibilityLabel(각 시리즈 라벨·최소~최대·항목 수)을 기본 제공하고
//   컨테이너 accessibilityLabel prop으로 덮어쓴다(설계 확정 사양).
// - 툴팁 상호작용: 웹은 ChartSurface hover(렌더러 onPointMove), 네이티브·웹
//   공통으로 SVG 위 투명 오버레이 Rect 탭(렌더러 onPress — 같은 지점 재탭 시
//   닫기). ChartTooltip은 SVG 밖 absolute 오버레이(pointerEvents 통과)로
//   렌더된다. ChartTooltipContent는 원본 props(indicator·labelFormatter·
//   formatter·nameKey·labelKey 등)를 유지하되 payload·active은 recharts가
//   아니라 context(활성 데이터 행 + 시리즈)에서 얻는다. formatter 시그니처는
//   (value, name) 2인자로 단순화했다.
// - 반응형 크기 미지원: 브리지에 onLayout 계약이 없어 ResponsiveContainer을
//   대체하지 못한다. width/height props(기본 320×200 = 원본 INITIAL_DIMENSION)
//   로 명시 크기를 받는다(원본 initialDimension prop의 대체 API). 원본의
//   data-slot/data-chart 속성·recharts 자손 셀렉터 클래스([&_.recharts-*])는
//   recharts 전용이라 삭제했다.
// - 미지원(recharts 대비, 로드맵): 스택·극좌표·방사형·브러시·줌·참조선·
//   애니메이션·다중 y축·음수 값(y 도메인 0 고정). x 라벨 겹침은 24px당 1라벨
//   스킵으로만 방지한다. 레이아웃 상수(패딩 좌40·우8·상8·하24, 틱 4구간)는
//   고정 — y 틱 라벨이 길면 tickFormat으로 줄인다.
// - 원본 임의값 클래스 정규화: min-w-[8rem]→min-w-32, rounded-[2px]→rounded-xs,
//   border-[1.5px]→border-2(스텝 근사). shadow-xl은 웹 전용(web:)으로 내렸다.
//   dark: 변형은 없다(토큰이 스킴 단일값). 원본 툴팁/범례 인디케이터의
//   [&>svg]:* 자손 셀렉터(아이콘 크기)는 미지원 — icon 크기는 사용처가 지정한다.
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  Text,
  View,
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

import { cn } from "@unikit-bridge/ui";

// ---------------------------------------------------------------------------
// 설정·컨텍스트
// ---------------------------------------------------------------------------

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

/** 데이터 행 — x키(범주 문자열) + 시리즈 수치(문자열 라벨도 허용). */
export type ChartDatum = Record<string, string | number | null | undefined>;

/** 캔버스 내부 계산 결과 — 시리즈·축·격자·툴팁이 공유한다. */
type ChartScale = {
  plotLeft: number;
  plotTop: number;
  plotWidth: number;
  plotHeight: number;
  /** x 밴드(데이터 1행) 폭 */
  bandWidth: number;
  yMax: number;
  xAt: (index: number) => number;
  yAt: (value: number) => number;
  ticksY: number[];
};

type ChartContextValue = {
  config: ChartConfig;
  data: ChartDatum[];
  xKey: string;
  scale: ChartScale;
  /** children의 시리즈 등장 순서(색 인덱스 기준) */
  seriesKeys: string[];
  activeIndex: number | null;
  width: number;
  height: number;
};

const ChartContext = createContext<ChartContextValue | null>(null);

function useChart(component: string): ChartContextValue {
  const ctx = useContext(ChartContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <ChartContainer> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// 색상 — 시리즈 순번 토큰 클래스(원칙) + config 명시 색 prop(폴백 아닌 우선)
// ---------------------------------------------------------------------------

const CHART_COLOR_CLASSES = {
  fill: ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4", "fill-chart-5"],
  stroke: ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5"],
  bg: ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"],
} as const;

type ChartColorKind = keyof typeof CHART_COLOR_CLASSES;

/**
 * 시리즈 순번 → chart-N 토큰 클래스. 리터럴 테이블에서 반환해야 Tailwind v4
 * 스캐너가 유틸리티를 생성한다(문자열 연결 금지). 6번째 시리즈부터 5색 순환.
 */
function getChartColor(index: number, kind: ChartColorKind = "fill"): string {
  const classes = CHART_COLOR_CLASSES[kind];
  return classes[Math.abs(index) % classes.length];
}

type ResolvedSeriesColor = { className: string; color?: string };

/** config 명시 색(color·theme.light)이 우선, 없으면 순번 토큰 클래스. */
function resolveSeriesColor(
  config: ChartConfig,
  dataKey: string,
  index: number,
  kind: ChartColorKind,
): ResolvedSeriesColor {
  const entry = config[dataKey];
  const explicit = entry?.color ?? entry?.theme?.light;
  return explicit
    ? { className: "", color: explicit }
    : { className: getChartColor(index, kind) };
}

// ---------------------------------------------------------------------------
// 스케일 계산
// ---------------------------------------------------------------------------

const CHART_PADDING = { top: 8, right: 8, bottom: 24, left: 40 } as const;
const INITIAL_DIMENSION = { width: 320, height: 200 } as const;
/** 툴팁 카드 추정 폭(min-w-32=128px) — 위치 클램프 계산용 동적 상수 */
const TOOLTIP_WIDTH = 128;

/** 보기 좋은 틱 간격(1/2/5×10^k)으로 올림 — 틱 라벨이 언제나 정돈된 수가 된다. */
function niceStep(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function rawSeriesMax(data: ChartDatum[], seriesKeys: string[]): number {
  let max = 0;
  for (const datum of data) {
    for (const key of seriesKeys) {
      const value = datum[key];
      if (typeof value === "number" && value > max) max = value;
    }
  }
  return max;
}

function buildScale(
  data: ChartDatum[],
  seriesKeys: string[],
  width: number,
  height: number,
): ChartScale {
  const plotLeft = CHART_PADDING.left;
  const plotTop = CHART_PADDING.top;
  const plotWidth = Math.max(width - CHART_PADDING.left - CHART_PADDING.right, 1);
  const plotHeight = Math.max(height - CHART_PADDING.top - CHART_PADDING.bottom, 1);
  const count = data.length;
  const bandWidth = count > 0 ? plotWidth / count : plotWidth;
  // 틱 4구간 — 최대값/4를 niceStep으로 올려 라벨을 깔끔히 유지한다.
  const step = niceStep(rawSeriesMax(data, seriesKeys) / 4);
  const yMax = step * 4;
  return {
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    bandWidth,
    yMax,
    xAt: (index) => plotLeft + bandWidth * (index + 0.5),
    // 음수 미지원 — 0으로 클램프(머리주석 참고).
    yAt: (value) => plotTop + plotHeight - (Math.max(value, 0) / yMax) * plotHeight,
    ticksY: [0, step, step * 2, step * 3, step * 4],
  };
}

function formatChartValue(value: number): string {
  return value.toLocaleString();
}

/** 데이터 첫 행의 첫 문자열 값 키 — xKey 미지정 시 폴백. */
function firstCategoryKey(data: ChartDatum[]): string {
  const first = data[0];
  if (first) {
    for (const [key, value] of Object.entries(first)) {
      if (typeof value === "string") return key;
    }
  }
  return "x";
}

/** ChartSurface 시리즈 요약 라벨(원본 accessibilityLayer 대체). */
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
      if (typeof value === "number") {
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
    if (min === Infinity) return `${name}: 값 없음`;
    return `${name} 최소 ${formatChartValue(min)} 최대 ${formatChartValue(max)}`;
  });
  return `차트(${xName}) — ${parts.join(", ")} (${data.length}개 항목)`;
}

// ---------------------------------------------------------------------------
// 시리즈 렌더러 — context의 스케일로 SVG 조각을 그린다
// ---------------------------------------------------------------------------

type SeriesPoint = { index: number; value: number; x: number; y: number };

function seriesPoints(ctx: ChartContextValue, dataKey: string): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  ctx.data.forEach((datum, index) => {
    const value = datum[dataKey];
    if (typeof value === "number") {
      points.push({ index, value, x: ctx.scale.xAt(index), y: ctx.scale.yAt(value) });
    }
  });
  return points;
}

function seriesIndex(ctx: ChartContextValue, dataKey: string): number {
  const index = ctx.seriesKeys.indexOf(dataKey);
  return index >= 0 ? index : 0;
}

export type ChartBarSeriesProps = {
  dataKey: string;
  className?: string;
  /** 막대 모서리 반경(px) */
  radius?: number;
};

function ChartBarSeries({ dataKey, className, radius = 4 }: ChartBarSeriesProps) {
  const ctx = useChart("ChartBarSeries");
  const { scale } = ctx;
  const color = resolveSeriesColor(ctx.config, dataKey, seriesIndex(ctx, dataKey), "fill");
  // 인접 막대 사이 표면 간격 — 밴드의 60%만 채운다(최소 2px).
  const barWidth = Math.max(2, scale.bandWidth * 0.6);
  const baseline = scale.plotTop + scale.plotHeight;
  return (
    <>
      {ctx.data.map((datum, index) => {
        const value = datum[dataKey];
        if (typeof value !== "number") return null;
        const y = scale.yAt(value);
        return (
          <ChartRect
            key={index}
            x={scale.xAt(index) - barWidth / 2}
            y={y}
            width={barWidth}
            height={baseline - y}
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
};

function ChartLineSeries({ dataKey, className, strokeWidth = 2 }: ChartLineSeriesProps) {
  const ctx = useChart("ChartLineSeries");
  const points = seriesPoints(ctx, dataKey);
  if (!points.length) return null;
  const index = seriesIndex(ctx, dataKey);
  const stroke = resolveSeriesColor(ctx.config, dataKey, index, "stroke");
  const dot = resolveSeriesColor(ctx.config, dataKey, index, "fill");
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
};

function ChartAreaSeries({ dataKey, className, strokeWidth = 2 }: ChartAreaSeriesProps) {
  const ctx = useChart("ChartAreaSeries");
  const points = seriesPoints(ctx, dataKey);
  if (!points.length) return null;
  const { scale } = ctx;
  const index = seriesIndex(ctx, dataKey);
  const fill = resolveSeriesColor(ctx.config, dataKey, index, "fill");
  const stroke = resolveSeriesColor(ctx.config, dataKey, index, "stroke");
  const baseline = scale.plotTop + scale.plotHeight;
  const first = points[0];
  const last = points[points.length - 1];
  const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const areaD = `${lineD} L${last.x} ${baseline} L${first.x} ${baseline} Z`;
  const active = activePointOf(ctx, points);
  return (
    <>
      {/* 채움은 반투명(선 Path가 위에 그려진다) */}
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
        <ChartCircle cx={active.x} cy={active.y} r={4} className={dotOf(ctx, dataKey)} />
      ) : null}
    </>
  );
}

function dotOf(ctx: ChartContextValue, dataKey: string): string {
  return resolveSeriesColor(ctx.config, dataKey, seriesIndex(ctx, dataKey), "fill").className;
}

// ---------------------------------------------------------------------------
// 격자·축
// ---------------------------------------------------------------------------

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
  /** x 라벨 포맷(기본: 데이터 문자열 그대로) */
  tickFormat?: (value: string, index: number) => string;
};

function ChartXAxis({ className, tickFormat }: ChartXAxisProps) {
  const ctx = useChart("ChartXAxis");
  const { scale, data, xKey } = ctx;
  const baseline = scale.plotTop + scale.plotHeight;
  // 라벨 겹침 방지 — 12px 폰트 기준 24px당 1라벨 이하로 스킵한다.
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
  /** y 틱 포맷(기본: toLocaleString) */
  tickFormat?: (value: number) => string;
};

function ChartYAxis({ className, tickFormat }: ChartYAxisProps) {
  const { scale } = useChart("ChartYAxis");
  return (
    <>
      <ChartLine
        x1={scale.plotLeft}
        x2={scale.plotLeft}
        y1={scale.plotTop}
        y2={scale.plotTop + scale.plotHeight}
        strokeWidth={1}
        className={cn("stroke-border", className)}
      />
      {scale.ticksY.map((tick) => (
        <ChartText
          key={tick}
          x={scale.plotLeft - 8}
          y={scale.yAt(tick) + 4}
          textAnchor="end"
          fontSize={12}
          className={cn("fill-muted-foreground", className)}
        >
          {tickFormat ? tickFormat(tick) : formatChartValue(tick)}
        </ChartText>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// 툴팁 — 웹 hover(ChartSurface onPointMove)·탭(투명 Rect onPress)
// ---------------------------------------------------------------------------

export type ChartTooltipProps = {
  /** 커스텀 툴팁 콘텐츠(미지정 시 ChartTooltipContent) */
  content?: ReactNode;
};

function ChartTooltip({ content }: ChartTooltipProps) {
  const ctx = useChart("ChartTooltip");
  if (ctx.activeIndex == null) return null;
  const x = ctx.scale.xAt(ctx.activeIndex);
  // 카드 폭 측정 불가 — min-w-32(128px) 가정 좌우 클램프(근사).
  const left = Math.min(Math.max(x - TOOLTIP_WIDTH / 2, 0), Math.max(ctx.width - TOOLTIP_WIDTH, 0));
  return (
    <View pointerEvents="none" className="absolute" style={{ left: Math.round(left), top: 0 }}>
      {content ?? <ChartTooltipContent />}
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
  /** 인디케이터 색 오버라이드(CSS 색 문자열) */
  color?: string;
  /** 항목 이름을 config에서 조회할 키(기본: 시리즈 dataKey) */
  nameKey?: string;
  /** 라벨 값을 datum에서 읽을 키(기본: xKey) */
  labelKey?: string;
};

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
  // 활성 행 — recharts payload 대신 context에서 얻는다(머리주석 참고).
  const datum = ctx.activeIndex == null ? undefined : ctx.data[ctx.activeIndex];
  if (!datum) return null;

  const rawLabel = labelKey ? datum[labelKey] : datum[ctx.xKey];
  const labelConfig = labelKey ? ctx.config[labelKey]?.label : ctx.config[ctx.xKey]?.label;
  const labelText =
    typeof labelConfig === "string" ? labelConfig : rawLabel == null ? "" : String(rawLabel);

  const items = ctx.seriesKeys
    .map((key) => {
      const value = datum[key];
      if (value == null) return null;
      const itemConfig = ctx.config[nameKey ?? key] ?? ctx.config[key];
      const resolved = resolveSeriesColor(ctx.config, key, seriesIndex(ctx, key), "bg");
      return { key, value, itemConfig, colorClass: resolved.className, colorValue: resolved.color };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

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

// ---------------------------------------------------------------------------
// 범례 — 컨테이너 흐름(SVG 밖)에 렌더된다
// ---------------------------------------------------------------------------

export type ChartLegendItem = {
  dataKey: string;
  /** CSS 색 문자열(미지정 시 순번 토큰 클래스 bg-chart-N) */
  color?: string;
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
  return ctx.seriesKeys.map((key) => ({
    dataKey: key,
    color: resolveSeriesColor(ctx.config, key, seriesIndex(ctx, key), "bg").color,
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
        const colorClass = item.color ? "" : getChartColor(seriesIndex(ctx, item.dataKey), "bg");
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

// ---------------------------------------------------------------------------
// ChartStyle — 원본 API 유지용 no-op(머리주석 참고)
// ---------------------------------------------------------------------------

function ChartStyle(_props: { id?: string; config?: ChartConfig }) {
  return null;
}

// ---------------------------------------------------------------------------
// 컨테이너 — context 제공·children 분류·포인터 이벤트
// ---------------------------------------------------------------------------

export type ChartContainerProps = Omit<ViewProps, "children"> & {
  config: ChartConfig;
  data?: ChartDatum[];
  /** x축(범주) 데이터 키 — 미지정 시 첫 행의 첫 문자열 값 키 */
  xKey?: string;
  /** 캔버스 폭(px) — 기본 320(원본 INITIAL_DIMENSION) */
  width?: number;
  /** 캔버스 높이(px) — 기본 200 */
  height?: number;
  /** 시리즈 요약 accessibilityLabel 덮어쓰기 */
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
      ...props
    },
    ref,
  ) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // children 분류 — SVG 조각(시리즈·축·격자), 오버레이(ChartTooltip),
    // 흐름(ChartLegend). 시리즈는 색 인덱스 순서 확보를 위해 dataKey를 수집한다.
    const svgChildren: ReactNode[] = [];
    const overlayChildren: ReactNode[] = [];
    const flowChildren: ReactNode[] = [];
    const seriesKeys: string[] = [];
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
        if (
          child.type === ChartBarSeries ||
          child.type === ChartLineSeries ||
          child.type === ChartAreaSeries
        ) {
          const dataKey = (child.props as { dataKey?: string }).dataKey;
          if (typeof dataKey === "string") seriesKeys.push(dataKey);
        }
      }
      svgChildren.push(child);
    });

    const resolvedXKey = xKey ?? firstCategoryKey(data);
    const scale = useMemo(
      () => buildScale(data, seriesKeys, width, height),
      // eslint-disable-next-line react-hooks/exhaustive-deps -- seriesKeys는 children에서 유도
      [children, data, width, height],
    );

    /** SVG x좌표 → 가장 가까운 데이터 행 인덱스 */
    const nearestIndex = (x: number): number | null => {
      if (!data.length) return null;
      const index = Math.round((x - scale.plotLeft) / scale.bandWidth - 0.5);
      return Math.min(data.length - 1, Math.max(0, index));
    };

    const summary =
      accessibilityLabel ?? summarizeSeries(config, data, resolvedXKey, seriesKeys);

    return (
      <ChartContext.Provider
        value={{ config, data, xKey: resolvedXKey, scale, seriesKeys, activeIndex, width, height }}
      >
        <View ref={ref} className={cn("relative flex-col items-center", className)} {...props}>
          <View className="relative">
            <ChartSurface
              width={width}
              height={height}
              accessibilityLabel={summary}
              onPointMove={(point) => setActiveIndex(nearestIndex(point.x))}
              onPointLeave={() => setActiveIndex(null)}
            >
              {svgChildren}
              {/* 투명 캡처층 — 웹 클릭·네이티브 탭으로 툴팁을 띄운다(재탭 닫기) */}
              <ChartRect
                x={0}
                y={0}
                width={width}
                height={height}
                fill="transparent"
                onPress={(point) => {
                  const next = nearestIndex(point.x);
                  setActiveIndex((prev) => (prev === next ? null : next));
                }}
              />
            </ChartSurface>
            {/* 툴팁 오버레이 — 포인터는 통과(box-none·none)시켜 hover가 끊기지 않게 한다 */}
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
  ChartGrid,
  ChartXAxis,
  ChartYAxis,
  getChartColor,
};
