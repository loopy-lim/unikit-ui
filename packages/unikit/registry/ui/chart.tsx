// Chart — shadcn/ui（new-york-v4） chart.tsx 유니버설 포팅 （사이클 40, T-3a）.
// 원본: shadcn-ref/ui/chart.tsx — recharts 2.x 기반. ChartContainer가
// ResponsiveContainer으로 recharts 트리를 감쌌고 ChartTooltip/ChartLegend는
// recharts Primitive를 그대로 재수출했다.
//
// 포팅 판단（원본 대비 차이이유）:
// - recharts 제거. ChartContainer（config, children） 시그니처는 유지하되 children은
//   recharts 차트가 아니라 이 파일의 선언형 요소 조합으로 바뀌었다 — 시리즈
//   （ChartBarSeriesChartLineSeriesChartAreaSeriesChartPieSeries
//   ChartRadialSeries）, 보조（ChartGridChartXAxisChartYAxis
//   ChartReferenceLine）, 오버레이（ChartTooltip）, 범례（ChartLegend）, 제스처
//   （ChartBrushChartZoom）. 스케일틱 계산을 내장하고 형상은
//   @unikit-bridge/ui/chart 렌더러（ChartSurfaceChartPathChartRectChartLine
//   ChartTextChartCircle）가 그린다（골격 계약 그대로 — 극좌표·방사형도 새
//   프리미티브 없이 계산된 d 문자열의 ChartPath로 표현한다）.
// - 색상 전략（확정）: 시리즈 기본색은 getChartColor（index, kind）가 리터럴 토큰
//   클래스（fill-chart-1..5 / stroke-chart-1..5 / bg-chart-1..5, 5색 순환）를
//   반환하고 이를 className으로 싣는다. 웹은 소비자 앱 Tailwind v4가 소비자
//   globals.css의 --chart-N 변수（shadcn 차트 표준 토큰 — 값의 소유자는 소비자
//   앱）에서 유틸리티를 생성하고, 네이티브는 uniwind 테마에 --chart-N이 등록돼
//   있으면 적용된다（없으면 폐기 — 렌더러 골격의 "className 원칙, prop 폴백"
//   계약과 동일）. config［key］.color가 명시 문자열이면 그것이 우선해 fill/stroke
//   prop에 직접 전달된다（#hexhsl（）var（--chart-2） 모두 웹은 확실히 동작,
//   네이티브는 리터럴 색 확실var（）은 uniwind 의존）. config.theme{light,dark}는
//   컨테이너의 useColorScheme（） 조회로 활성 스킴 값을 전환해 쓴다（다크 전환
//   지원 — 사이클 90 브리지 스킴 계약）. 파이 슬라이스는 슬라이스 라벨（x 값
//   문자열）을 config 키로 조회하고, 없으면 슬라이스 순번 토큰 클래스를 쓴다.
// - ChartStyle은 원본 시그니처를 유지하되 no-op: CSS 변수 <style> 주입은
//   네이티브에서 불가능하고（RN은 <style>을 렌더할 수 없음） 위 전략은 JS 레벨
//   이라 --color-* 주입이 불필요하다.
// - 접근성: 원본 accessibilityLayer（recharts 옵션） 대신 ChartSurface에 시리즈
//   요약 accessibilityLabel（각 시리즈 라벨최소~최대항목 수）을 기본 제공하고
//   컨테이너 accessibilityLabel prop으로 덮어쓴다（설계 확정 사양）. 브러시·줌의
//   초기화 칩·더블탭은 포인터 조작 계열이라 스크린리더 경로는 이 요약 라벨이
//   담당한다（한계 — 칩에 별도 역할 부여는 로드맵）.
// - 툴팁 상호작용: 웹은 ChartSurface hover（렌더러 onPointMove）, 네이티브웹
//   공통으로 SVG 위 투명 오버레이 Rect 탭（렌더러 onPress — 같은 지점 재탭 시
//   닫기）. ChartTooltip은 SVG 밖 absolute 오버레이（pointerEvents 통과）로
//   렌더된다. ChartTooltipContent는 원본 props（indicatorlabelFormatter
//   formatternameKeylabelKey 등）를 유지하되 payloadactive은 recharts가
//   아니라 context（활성 데이터 행 + 시리즈）에서 얻는다. formatter 시그니처는
//   （value, name） 2인자로 단순화했다. 카드 폭은 onLayout 실측값으로 뷰포트
//   클램프한다（첫 측정 전만 min-w-32=128px 추정）.
// - 반응형 크기: 브리지 onLayout 계약（사이클 90 — 웹 ResizeObserver·네이티브
//   RN onLayout）으로 width="fluid"（컨테이너 폭 추종）와 height="fluid"（컨테이너
//   높이 추종 — 캔버스 래퍼 flex-1）를 지원한다. 뷰포트 비례 높이는 BridgeStyle
//   퍼센트 계약（width/height "N%" 문자열, 기준 부모 박스 — vh/vw는 RN 교집합
//   밖）로 소비자가 style={{height:"50%"}} 등을 주고 height="fluid"를 함께 쓰는
//   조합이다. 첫 측정 전엔 기본 320×200（원본 INITIAL_DIMENSION）으로 렌더해
//   전환한다. 원본의 data-slot/data-chart 속성recharts 자손 셀렉터 클래스
//   （［&_.recharts-*］）는 recharts 전용이라 삭제했다.
// - 참조선（ChartReferenceLine）: recharts ReferenceLine 대응 — x（범주 문자열,
//   세로선） 또는 y（수치, 가로선） 값에 점선（기본 "4 4"）과 라벨을 그린다.
//   네이밍은 원본 명칭을 유지했다（Chart 접두만 추가）.
// - 스택 막대: ChartBarSeries stackId — 같은 stackId끼리 양수는 0 위로음수는
//   0 아래로 누적한다（recharts stackOffset="none" 관습）. 축 스케일 도메인은
//   스택 그룹별 양/음 누적 합계로 확장된다. 툴팁툴팁 payload범례는 스택 멤버
//   각각을 그대로 나열한다（원본과 동일）. 라인/면 시리즈의 stackId는 미지원
//   （로드맵）.
// - 다중 y축: 시리즈 yAxisId（기본 축 id "left"） + ChartYAxis yAxisId·
//   orientation（"left"|"right"）. 축별 도메인틱 스케일을 독립 계산하고 우측
//   축이 구성되면 플롯 우측 패딩이 8→48로 늘어난다（ 좌측 라벨 여유와 대칭 —
//   고정 상수 CHART_PADDING_AXIS）. recharts 기본 축 id 0 대신 "left"를 쓴 건
//   이 카탈로그의 문자열 id 관행（토글 그룹 value 등）과의 정합이다.
// - 극좌표（ChartPieSeries）: dataKey 1개가 전체 행을 슬라이스로 소비한다（원본
//   Pie/PieChart를 시리즈 1개로 접은 네이밍）. innerRadius로 도넛. 중심각 시작은
//   화면 좌표 270°（위）부터 시계 방향（recharts startAngle 90과 같은 위상）.
//   hover탭 판정은 각도 기반（pieIndexAtAngle）으로 전환한다.
// - 방사형（ChartRadialSeries + 컨테이너 렌더 폴리곤 격자）: recharts
//   RadarChart/PolarGrid/Radar를 시리즈 컴포넌트 1개로 접었다 — 격자·축은
//   데이터 방향（행 수 = 축 수）이라 컨테이너가 한 번만 그린다. 값 반경은 전
//   시리즈 최댓값 기준 정규화. hover탭 판정은 축(스포크) 각도 기반
//   （nearestRadarIndex）. 파이와 레이더의 동시 구성은 미지원（파이가 우선）.
// - 브러시·줌（ChartBrushChartZoom）: 브리지 useDrag（웹 Pointer Events·
//   네이티브 PanResponder 동일 계약）로 플롯 위 드래그를 받는다. ChartBrush는
//   가로 밴드 선택 → x 도메인 윈도우（전체 데이터 인덱스 구간）, ChartZoom은
//   사각형 선택 → x 윈도우 + 기본(좌측) 축 y 도메인. 확정 후 상단 우측 "초기화"
//   칩 또는 더블탭으로 해제한다. 제스처가 구성된 경우에만 캔버스 래퍼가
//   dragHandlers를 받고（탭 판정도 래퍼가 인계 — 투명 Rect 탭은 제거）, 미구성
//   시 기존 hover탭 동작이 그대로 유지된다（비파괴）. 웹 휠 줌은 브리지 ViewProps에
//   휠 계약이 없어 미지원（로드맵）.
// - 미지원（recharts 대비, 로드맵）: 애니메이션, 라인/면 스택, 휠 줌. 음수 값은
//   지원한다（y 도메인 자동 확장）. x 라벨 겹침은 24px당 1라벨 스킵으로만 방지한다.
//   레이아웃 상수（패딩 좌48우8상8하24 — 우측 축 구성 시 우48, 틱 4구간）는
//   고정 — 좌 패딩은 "20,000"급 6자 라벨이 plotLeft-8 앵커에서 캔버스 밖으로
//   새지 않도록 40→48로 올렸다（2026-11-12 블록 검증）. 그보다 길면
//   tickFormat으로 줄인다.
// - 원본 임의값 클래스 정규화: min-w-［8rem］→min-w-32, rounded-［2px］→rounded-xs,
//   border-［1.5px］→border-2（스텝 근사）. shadow-xl은 웹 전용（web:）으로 내렸다.
//   dark: 변형은 없다（토큰이 스킴 단일값）. 원본 툴팁/범례 인디케이터의
//   ［&>svg］:* 자손 셀렉터（아이콘 크기）는 미지원 — icon 크기는 사용처가 지정한다.
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

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// 설정컨텍스트
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

/** 데이터 행 — x키（범주 문자열） + 시리즈 수치（문자열 라벨도 허용）. */
export type ChartDatum = Record<string, string | number | null | undefined>;

/** 캔버스 내부 계산 결과 — 시리즈축격자툴팁이 공유한다. */
export type ChartScale = {
  plotLeft: number;
  plotTop: number;
  plotWidth: number;
  plotHeight: number;
  /** x 밴드（데이터 1행） 폭 */
  bandWidth: number;
  yMin: number;
  yMax: number;
  xAt: (index: number) => number;
  yAt: (value: number) => number;
  /** y 픽셀 → 값 역매핑（줌 사각형의 y 도메인 확정용） */
  yValueAt: (y: number) => number;
  ticksY: number[];
};

type ChartContextValue = {
  config: ChartConfig;
  data: ChartDatum[];
  xKey: string;
  scale: ChartScale;
  /** 축별 스케일 — 키는 yAxisId（기본 축 DEFAULT_Y_AXIS_ID） */
  scales: Record<string, ChartScale>;
  /** 스택 막대 누적 오프셋 — dataKey별 데이터 인덱스 순회 배열 */
  barStacks: Record<string, Array<{ base: number; value: number } | null>>;
  /** 파이 구성 시의 지오메트리（미구성 null） */
  pie: {
    dataKey: string;
    cx: number;
    cy: number;
    outerRadius: number;
    arcs: ChartPieArc[];
  } | null;
  /** 레이더 구성 시의 지오메트리（미구성 null — 격자는 컨테이너가 렌더） */
  radar: RadarGeometry | null;
  /** 브러시/줌 윈도우 밖 전체 데이터 */
  fullData: ChartDatum[];
  /** 브러시 윈도우 — 전체 데이터 인덱스 구간（미선택 null） */
  brushWindow: [number, number] | null;
  /** 드래그 중 선택 사각형（플롯 좌표계 — 미드래그 null） */
  selectionRect: { x: number; y: number; width: number; height: number } | null;
  /** x 도메인 윈도우 또는 y 도메인 줌이 걸려 있는가（초기화 칩 표시 조건） */
  zoomed: boolean;
  /** children의 시리즈 등장 순서（색 인덱스 기준） */
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

// ---------------------------------------------------------------------------
// 색상 — 시리즈 순번 토큰 클래스（원칙） + config 명시 색 prop（폴백 아닌 우선）
// ---------------------------------------------------------------------------

const CHART_COLOR_CLASSES = {
  fill: ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4", "fill-chart-5"],
  stroke: ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5"],
  bg: ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"],
} as const;

type ChartColorKind = keyof typeof CHART_COLOR_CLASSES;

/**
 * 시리즈 순번 → chart-N 토큰 클래스. 리터럴 테이블에서 반환해야 Tailwind v4
 * 스캐너가 유틸리티를 생성한다（문자열 연결 금지）. 6번째 시리즈부터 5색 순환.
 */
function getChartColor(index: number, kind: ChartColorKind = "fill"): string {
  const classes = CHART_COLOR_CLASSES[kind];
  return classes[Math.abs(index) % classes.length];
}

type ResolvedSeriesColor = { className: string; color?: string };

/** config 명시 색（color · theme[colorScheme] · theme.light）이 우선, 없으면 순번 토큰 클래스. */
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

// ---------------------------------------------------------------------------
// 스케일 계산
// ---------------------------------------------------------------------------

const CHART_PADDING = { top: 8, right: 8, bottom: 24, left: 48 } as const;
/** 우측 y축 구성 시의 패딩 — 좌측 라벨 여유(48)와 대칭 */
const CHART_PADDING_AXIS_RIGHT = 48;
const INITIAL_DIMENSION = { width: 320, height: 200 } as const;
/** 툴팁 카드 폭 추정치（min-w-32=128px） — onLayout 실측 전 초기 클램프값 */
const TOOLTIP_WIDTH = 128;
/** 기본 y축 id — 미지정 yAxisId가 매핑되는 축（recharts 기본 0 대신 문자열） */
const DEFAULT_Y_AXIS_ID = "left";
/** 줌/브러시 확정 후 초기화 칩 — 플롯 우상단, 탭 히트 판정에도 쓰인다 */
const RESET_CHIP = { width: 48, height: 18, offset: 6, label: "초기화" } as const;
/** 탭으로 볼 제스처 이동 임계（px 미만이면 드래그가 아니라 탭） */
const TAP_THRESHOLD = 8;
/** 더블탭 판정 창（ms）과 위치 반경（px） */
const DOUBLE_TAP_WINDOW = 300;

type ChartPadding = { top: number; right: number; bottom: number; left: number };

export type ChartScaleOptions = {
  /** y 도메인 오버라이드 — 줌 확정 구간을 그대로 쓴다（틱은 내부 nice 간격） */
  yDomain?: { min: number; max: number };
  /** 실효 값 범위 오버라이드 — 스택 누적 합계 등 원값 아닌 범위 */
  range?: { min: number; max: number };
  /** 패딩 오버라이드 — 우측 y축 라벨 여유 등 */
  padding?: Partial<ChartPadding>;
};

/** 플롯 박스 — 캔버스 크기와 패딩만으로 정해지는 공통 계산（극좌표 중심 등） */
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

/** 보기 좋은 틱 간격（1/2/5×10^k）으로 올림 — 틱 라벨이 언제나 정돈된 수가 된다. */
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

/** 도메인 구간의 nice 틱 배열 — ceil(최소)/step 부터 최대 이하까지.
 *  인덱스 기반 유계 반복(상한 64) — step이 부동소수점 최소 간격(ulp)보다 작은
 *  극단 줌에서 value += step이 값을 못 바꿔 무한 루프에 빠지던 것을 막는다
 *  (리뷰 후속 — yPixelsToDomain 중첩 줌으로 도달 가능했음). */
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
    // 줌 확정 도메인 — 원 구간을 그대로 보여주고 틱만 내부 nice 간격으로 돈다.
    yMin = options.yDomain.min;
    yMax = options.yDomain.max;
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMax <= yMin) {
      yMin = 0;
      yMax = 1;
    }
    ticksY = domainTicks(yMin, yMax);
  } else if (min < 0) {
    // 스팬 오버플로 가드(리뷰 후속) — 반대 부호 ±1e308급 극값은 max - min이
    // Infinity가 되고 stepsCount가 Infinity로 치솟아 Array.from가 RangeError를
    // 던진다. 극단 도메인은 안전 폴백(0..1)로 내린다(yDomain 가드 관례).
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
    // 같은 오버플로 — max가 약 8.9e307을 넘으면 자릿수 올림 여유분(최대 1.92x)
    // 까지 합쳐 step*4가 Infinity가 된다. 틱·yMax가 무한으로 흐르지 않게 폴백.
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

// ---------------------------------------------------------------------------
// 스택 누적（순수 계산）
// ---------------------------------------------------------------------------

export type ChartStackMember = { dataKey: string; stackId: string };

/** stackId별 멤버 목록 — 등장 순서 보존（누적 순서 = 시리즈 순서） */
export function groupStacks(members: ChartStackMember[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const member of members) {
    const list = groups.get(member.stackId);
    if (list) list.push(member.dataKey);
    else groups.set(member.stackId, [member.dataKey]);
  }
  return groups;
}

/**
 * 스택 막대 누적 오프셋 — dataKey별 "데이터 인덱스 순회" 배열을 반환한다.
 * 양수는 직전 양수 누적(base) 위로, 음수는 직전 음수 누적 아래로 쌓인다
 * （recharts stackOffset "none" 관습）. 값이 없는 행은 null.
 */
export function computeBarStackOffsets(
  data: ChartDatum[],
  members: ChartStackMember[],
): Record<string, Array<{ base: number; value: number } | null>> {
  const offsets: Record<string, Array<{ base: number; value: number } | null>> = {};
  for (const member of members) offsets[member.dataKey] = data.map(() => null);
  // 누적기는 스택 그룹(stackId)별 1벌 — 멤버 순서대로 이어 쌓인다.
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

/** 스택 그룹별 누적 합계의 실효 범위 — 최대 양수 합 / 최소 음수 합 */
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

/**
 * 축 스케일용 실효 범위 — 비스택 시리즈는 원값, 스택 시리즈는 그룹 누적 합계로
 * 잡는다（막대가 도메인을 벗어나지 않게）.
 */
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

// ---------------------------------------------------------------------------
// 참조선 위치（순수 계산）
// ---------------------------------------------------------------------------

export type ReferenceLineGeometry = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
  labelAnchor: "start" | "middle" | "end";
};

/**
 * 참조선 위치 — x（범주 문자열 → 세로선） 또는 y（수치 → 가로선）.
 * labelPosition은 선을 따라가는 위치（세로선: start=아래/end=위, 가로선:
 * start=좌/end=우, 기본 "end"）. 범주를 못 찾으면 null.
 */
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

// ---------------------------------------------------------------------------
// 극좌표（순수 계산） — 화면 좌표 도수: 0°=오른쪽, 시계 방향 증가（270°=위）
// ---------------------------------------------------------------------------

/** 점의 절대 각도（도, [0,360)） — atan2 화면 좌표（y 아래） 기준 */
export function polarToAngle(cx: number, cy: number, x: number, y: number): number {
  const angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
  return ((angle % 360) + 360) % 360;
}

function polarPoint(cx: number, cy: number, r: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return { x: cx + r * Math.cos(radians), y: cy + r * Math.sin(radians) };
}

export type ChartPieArc = {
  /** 데이터 행 인덱스（툴팁 activeIndex와 정합） */
  index: number;
  label: string;
  value: number;
  /** 전체에서 차지하는 비율（0..1） */
  fraction: number;
  startAngle: number;
  endAngle: number;
  /** 조각 경로 — ChartPath d 문자열 */
  d: string;
  centroid: { x: number; y: number };
};

/**
 * 파이/도넛 호 — 양수 값 행만 조각이 되고(0·음수·비수치 건너뜀) 시작 각도는
 * 화면 좌표 270°（위）부터 시계 방향. innerRadius>0이면 도넛 링 경로가 된다.
 */
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
  // innerRadius 클램프 — outerRadius 이상이면 링이 뒤집힌다(작은 컨테이너 방어).
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
        // NaN·±Infinity는 조각이 될 수 없다(Infinity는 > 0을 통과해 전체를 오염).
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
      // 단일 조각 전체 원 — 호 명령이 퇴화하지 않도록 두 반원으로 잇는다.
      const oh = polarPoint(cx, cy, outerRadius, start + 180);
      const outerRing = `M${o1.x} ${o1.y} A${outerRadius} ${outerRadius} 0 1 1 ${oh.x} ${oh.y} A${outerRadius} ${outerRadius} 0 1 1 ${o1.x} ${o1.y}`;
      if (innerRadius > 0) {
        const i1 = polarPoint(cx, cy, innerRadius, start);
        const ih = polarPoint(cx, cy, innerRadius, start + 180);
        d = `${outerRing} M${i1.x} ${i1.y} A${innerRadius} ${innerRadius} 0 1 0 ${ih.x} ${ih.y} A${innerRadius} ${innerRadius} 0 1 0 ${i1.x} ${i1.y} Z`;
      } else {
        // 전체 원 파이 — 중심 M은 중복이다(링 자체가 닫힌 원).
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

/**
 * 각도 → 파이 조각 인덱스 — values는 데이터 행 순서의 양수 가중치（내부에서
 * 정규화）. 각 계약은 polarToAngle과 같다（startAngle 기준 상대 시계 방향）.
 */
export function pieIndexAtAngle(
  angle: number,
  values: number[],
  startAngle = 270,
): number | null {
  if (!values.length) return null;
  // 가중치는 양수 유한값만 — NaN·±Infinity·음수 항목은 스윕 커서를 오염시켜
  // 판정을 마지막 인덱스로 몰아버린다.
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
  // 부동소수점 여분 각도(≈360° 끝) — 그려진 마지막 양수 조각으로(0/음수 인덱스 금지).
  return lastPositive >= 0 ? lastPositive : null;
}

// ---------------------------------------------------------------------------
// 방사형（순수 계산）
// ---------------------------------------------------------------------------

export type RadarAxisPoint = {
  index: number;
  /** 축 정점（최대 반경） */
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
  /** 값 정규화 기준 — 전 시리즈 최댓값 */
  valueMax: number;
  axes: RadarAxisPoint[];
  /** 격자 폴리곤 d 문자열 — 내부→외부 */
  gridD: string[];
  seriesD: Record<string, string>;
  seriesPoints: Record<string, Array<{ x: number; y: number }>>;
};

/**
 * 방사형 지오메트리 — 데이터 행 수 = 축 수, 시작 각도 270°（위）부터 시계 방향.
 * 값 반경은 valueMax로 정규화하고 격자는 levels 단계 폴리곤.
 */
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

  // 빈 데이터 — 격자 없음(" Z"는 참값이라 무효 경로가 렌더된다).
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
    // 빈 데이터 — 시리즈 경로는 빈 문자열(렌더러 가드 !d가 스킵한다).
    seriesD[key] = points.length
      ? `${points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ")} Z`
      : "";
  }

  return { cx, cy, radius, valueMax, axes, gridD, seriesD, seriesPoints };
}

/** 각도 → 방사형 축(스포크) 인덱스 — 가장 가까운 축으로 반올림 */
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

// ---------------------------------------------------------------------------
// 제스처 도메인 매핑（순수 계산）
// ---------------------------------------------------------------------------

/** SVG x좌표 → 가장 가까운 데이터 행 인덱스（플롯 클램프） */
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

/** 픽셀 y 구간 → y 도메인 구간（줌 확정용 — 플롯 밖은 클램프） */
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

/**
 * 드래그 두 점 → 선택 사각형（플롯 클램프）. mode "band"는 브러시용 가로
 * 밴드（플롯 전체 높이）, "rect"는 줌용 사각형.
 */
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

/** ChartSurface 시리즈 요약 라벨（원본 accessibilityLayer 대체）. */
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

// ---------------------------------------------------------------------------
// 시리즈 렌더러 — context의 스케일로 SVG 조각을 그린다
// ---------------------------------------------------------------------------

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

/** 시리즈의 축 스케일 — yAxisId 미지정(기본 축) 포함 미등록 id 폴백 ctx.scale */
function seriesScale(ctx: ChartContextValue, yAxisId?: string): ChartScale {
  return (yAxisId && ctx.scales[yAxisId]) || ctx.scale;
}

export type ChartBarSeriesProps = {
  dataKey: string;
  className?: string;
  /** 막대 모양 반경（px） */
  radius?: number;
  /** 스택 그룹 id — 같은 stackId 막대끼리 누적된다 */
  stackId?: string;
  /** 이 시리즈가 붙는 y축 id（기본 DEFAULT_Y_AXIS_ID） */
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
  // 인접 막대 사이 표면 간격 — 밴드의 60%만 채운다（최소 2px）.
  const barWidth = Math.max(2, scale.bandWidth * 0.6);
  // 도메인으로 클램프된 0 기준선 값 — 비스택 막대의 위/아래 경계를 값 공간에서 잡는다.
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
        // 위·아래 픽셀을 topValue/bottomValue에서 대칭으로 잡는다 — 비스택 음수
        // 막대도 0 아래로 뻗는다(yAt은 단조 감소라 bottom - top ≥ 0).
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
  /** 이 시리즈가 붙는 y축 id（기본 DEFAULT_Y_AXIS_ID） */
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
  /** 이 시리즈가 붙는 y축 id（기본 DEFAULT_Y_AXIS_ID） */
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
      {/* 채움은 반투명（선 Path가 위에 그려진다） */}
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
        // 활성 점 채움 — 선 계열과 동일하게 stroke 색(G3 F-15: fill 누락 보강)
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

// ---------------------------------------------------------------------------
// 파이 시리즈 — 지오메트리는 컨테이너가 계산해 context로 전달한다
// ---------------------------------------------------------------------------

export type ChartPieSeriesProps = {
  dataKey: string;
  className?: string;
  /** 도넛 안쪽 반경（px, 기본 0 = 파이） */
  innerRadius?: number;
  /** 바깥 반경（px, 기본 플롯 최단변의 절반） */
  outerRadius?: number;
  /** 조각 중심에 백분율 라벨 */
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

// ---------------------------------------------------------------------------
// 방사형 시리즈 — 격자·축은 컨테이너가 렌더하고 여기는 시리즈 폴리곤만
// ---------------------------------------------------------------------------

export type ChartRadialSeriesProps = {
  dataKey: string;
  className?: string;
  strokeWidth?: number;
  /** 폴리곤 격자 단계 수（기본 4 — 컨테이너 격자 렌더에 반영） */
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
      {/* 채움은 반투명（선 Path가 위에 그려진다） */}
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

// ---------------------------------------------------------------------------
// 격자축참조선
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
  /** x 라벨 포맷（기본: 데이터 문자열 그대로） */
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
  /** y 틱 포맷（기본: toLocaleString） */
  tickFormat?: (value: number) => string;
  /** 이 축의 id — 시리즈 yAxisId와 짝짓는다（기본 DEFAULT_Y_AXIS_ID） */
  yAxisId?: string;
  /** 축 위치（기본 "left" — "right"면 플롯 우측에 라벨을 붙인다） */
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
  /** x 참조（범주 문자열） — 세로 점선 */
  x?: string;
  /** y 참조（수치） — 가로 점선. x와 함께 주어지면 y가 이긴다 */
  y?: number;
  className?: string;
  /** 선 색 CSS 문자열（기본 토큰 클래스 stroke-border） */
  stroke?: string;
  /** 점선 패턴（기본 "4 4"） */
  strokeDasharray?: string;
  /** 라벨 텍스트 */
  label?: string;
  /** 선을 따라가는 라벨 위치（기본 "end" — 세로선 위, 가로선 오른쪽 끝） */
  labelPosition?: "start" | "middle" | "end";
  labelClassName?: string;
  /** y 참조선 값을 해석할 축（기본 축） */
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

// ---------------------------------------------------------------------------
// 툴팁 — 웹 hover（ChartSurface onPointMove）탭（투명 Rect onPress）
// ---------------------------------------------------------------------------

export type ChartTooltipProps = {
  /** 커스텀 툴팁 콘텐츠（미지정 시 ChartTooltipContent） */
  content?: ReactNode;
};

function ChartTooltip({ content }: ChartTooltipProps) {
  const ctx = useChart("ChartTooltip");
  // 카드 폭 실측 — 첫 측정 전만 min-w-32(128px) 추정으로 클램프한다.
  const [cardWidth, setCardWidth] = useState(0);
  const active = ctx.activeIndex;
  if (active == null) return null;
  // 극좌표 — 활성 파이 조각 중심/레이더 축 정점에서 x를 잡는다(밴드 중심은 어긋난다).
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
  /** 인디케이터 색 오버라이드（CSS 색 문자열） */
  color?: string;
  /** 항목 이름을 config에서 조회할 키（기본: 시리즈 dataKey） */
  nameKey?: string;
  /** 라벨 값을 datum에서 읽을 키（기본: xKey） */
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
    // 파이 — 활성 조각 1개: 항목 키/이름은 슬라이스 라벨, 값은 dataKey.
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
  // 활성 행 — recharts payload 대신 context에서 얻는다（머리주석 참고）.
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

// ---------------------------------------------------------------------------
// 범례 — 컨테이너 흐름（SVG 밖）에 렌더된다
// ---------------------------------------------------------------------------

export type ChartLegendItem = {
  dataKey: string;
  /** CSS 색 문자열（미지정 시 순번 토큰 클래스 bg-chart-N） */
  color?: string;
  /** 토큰 클래스 직접 지정（파이 슬라이스 등 dataKey가 시리즈 키가 아닐 때） */
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
    // 파이 — 조각(슬라이스 라벨)별 항목. 색은 슬라이스 순번 토큰 또는 config[라벨].
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

// ---------------------------------------------------------------------------
// 브러시줌 — 드래그 선택 시각화（제스처 자체는 컨테이너가 받는다）
// ---------------------------------------------------------------------------

export type ChartBrushProps = {
  className?: string;
  /** 드래그 중 음영 색 CSS 문자열（기본 토큰 클래스 fill-muted/30） */
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
        // 확정된 윈도우 표시 — 플롯 하단 개요 스트립(전체 도메인 트랙 + 선택 밴드)
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
  /** 드래그 중 음영 색 CSS 문자열（기본 토큰 클래스 fill-primary/10） */
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

// ---------------------------------------------------------------------------
// ChartStyle — 원본 API 유지용 no-op（머리주석 참고）
// ---------------------------------------------------------------------------

function ChartStyle(_props: { id?: string; config?: ChartConfig }) {
  return null;
}

// ---------------------------------------------------------------------------
// 컨테이너 — context 제공children 분류포인터 제스처도메인 윈도우
// ---------------------------------------------------------------------------

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
  /** x축（범주） 데이터 키 — 미지정 시 첫 행의 첫 문자열 값 키 */
  xKey?: string;
  /** 캔버스 폭（px） — 기본 320（원본 INITIAL_DIMENSION）. "fluid"면 컨테이너
   *  폭에 맞춘다（브리지 onLayout — 웹·네이티브 양측, 사이클 90） */
  width?: number | "fluid";
  /** 캔버스 높이（px） — 기본 200. "fluid"면 캔버스 래퍼(flex-1)의 높이를
   *  잰다 — 뷰포트 비례 높이는 소비자가 style={{height:"50%"}} 등 퍼센트
   *  스타일（BridgeStyle 계약, 기준 부모 박스）과 함께 준다 */
  height?: number | "fluid";
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
      onLayout,
      ...props
    },
    ref,
  ) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const colorScheme = useColorScheme();

    // fluid 캔버스 폭 — 브리지 onLayout 계약으로 컨테이너 자체 폭을 잰다
    // （사이클 90: 웹 ResizeObserver·네이티브 RN onLayout 양측）. 1px 미만
    // 변화는 무시해 마이크로 재측정 루프를 막는다. 소비자 onLayout과 겸한다.
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

    // children 분류 — SVG 조각（시리즈축격자참조선제스처）, 오버레이
    // （ChartTooltip）, 흐름（ChartLegend）. 시리즈는 색 인덱스 순서 확보를 위해
    // dataKey를, 축은 스케일 분리를 위해 id·위치를 수집한다.
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

    // 브러시/줌 도메인 윈도우 — 전체 데이터 인덱스 구간（null = 전체）.
    const [brushWindow, setBrushWindow] = useState<[number, number] | null>(null);
    const [zoomDomain, setZoomDomain] = useState<{ min: number; max: number } | null>(null);
    const [selectionRect, setSelectionRect] = useState<ChartContextValue["selectionRect"]>(null);
    const resetDomain = () => {
      setBrushWindow(null);
      setZoomDomain(null);
      setActiveIndex(null);
    };
    const zoomed = brushWindow != null || zoomDomain != null;

    // 데이터 변경 시 윈도우가 벗어나면 클램프한다.
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
      // eslint-disable-next-line react-hooks/exhaustive-deps -- windowRange는 하한 정규화된 brushWindow
      [data, brushWindow],
    );

    // 우측 y축이 구성되면 플롯 우측 패딩을 늘려 라벨 여유를 확보한다.
    const rightAxis = axisMeta.some((axis) => axis.orientation === "right");
    const effectivePadding = rightAxis ? { right: CHART_PADDING_AXIS_RIGHT } : undefined;

    // 축별 스케일 — 도메인은 그 축의 시리즈(스택은 그룹 누적 합계)에서, y 도메인
    // 줌은 기본(좌측) 축에만 적용한다(보조 축은 단위가 다를 수 있다).
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
      // eslint-disable-next-line react-hooks/exhaustive-deps -- seriesMeta·axisIds는 children에서 유도
    }, [children, viewData, canvasWidth, canvasHeight, zoomDomain]);
    const scale = scales[DEFAULT_Y_AXIS_ID];

    // 스택 누적 오프셋 — 등장 순서대로 누적(stackId는 전역, 축 간 공유 금지 관행).
    const barStacks = useMemo(
      () =>
        computeBarStackOffsets(
          viewData,
          seriesMeta
            .filter((meta) => meta.kind === "bar" && meta.stackId)
            .map((meta) => ({ dataKey: meta.dataKey, stackId: meta.stackId as string })),
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps -- seriesMeta는 children에서 유도
      [children, viewData],
    );

    // 극좌표 지오메트리 — 플롯 박스 중심·반경(최단변 절반) 기준.
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
      // eslint-disable-next-line react-hooks/exhaustive-deps -- pieMeta는 children에서 유도
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
      // eslint-disable-next-line react-hooks/exhaustive-deps -- keys·radarLevels는 children에서 유도
    }, [children, viewData, canvasWidth, canvasHeight]);

    /** 포인터 좌표 → 활성 데이터 행 인덱스 — 극좌표는 각도/축 기반으로 전환 */
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

    // 접근성 요약 — 매 렌더 재계산을 피한다(리뷰 후속 useMemo).
    const summary = useMemo(
      () =>
        accessibilityLabel ??
        summarizeSeries(config, viewData, resolvedXKey, seriesKeys),
      [accessibilityLabel, config, viewData, resolvedXKey, seriesKeys],
    );

    // ── 브러시/줌 제스처 — 브리지 useDrag（웹 Pointer Events·네이티브
    //    PanResponder）. 이벤트 좌표는 창(뷰포트) 기준이라 measureInWindow로
    //    캔버스 래퍼 위치를 잡아 SVG 국소 좌표로 바꾼다（slider 관행）.
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
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회 캐시
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
        // 더블탭 — 도메인 초기화
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
      // 폭 1밴드 이상의 가로 선택만 x 윈도우를 갱신한다 — 단일 밴드 이내(세로
      // 줌 등)의 선택으로 기존 윈도우를 null로 덮어 지우지 않는다. 전체 구간
      // 선택은 해제와 같다.
      if (hi - lo >= 1) {
        setBrushWindow(lo <= 0 && hi >= data.length - 1 ? null : [lo, hi]);
      }
      if (hasZoom && Math.abs(end.y - start.y) >= TAP_THRESHOLD) {
        const domain = yPixelsToDomain(scale, start.y, end.y);
        // 퇴화 구간(플롯 밖 세로 드래그가 양끝 클램프된 [max,max] 등)은 기존
        // 줌 도메인을 유지한다 — 확정하면 스케일이 [0,1] 폴백으로 무너진다.
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
          // 데드존 통과 시점이 아니라 제스처 시작점(x/y − dx/dy)을 기록한다 —
          // 빠른 드래그는 첫 이동이 이미 멀어 있어 선택 시작이 밀린다.
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
            // min-w-0 — 플렉스 자식 최소 폭(auto)이 SVG를 받쳐 유동 폭이
            // 수축하지 못하는 것을 막는다.
            width === "fluid" && "w-full min-w-0",
            className,
          )}
          {...props}
        >
          <View
            ref={wrapperRef}
            className={cn(
              "relative",
              // min-h-0 + overflow-hidden — 플렉스 자식 최소 높이(auto)가 이전
              // 피크 높이의 SVG를 받쳐 유동 높이가 수축하지 못하는 것을 막는다.
              height === "fluid" && "flex-1 self-stretch min-h-0 overflow-hidden",
              interactive && "touch-none web:cursor-crosshair",
            )}
            onLayout={
              height === "fluid"
                ? (layout: BridgeLayout) => {
                    // 캔버스 래퍼(flex-1) 높이 — 소비자 퍼센트 style이 기준.
                    // 자동 높이(측정 붕괴) 방지 임계 40px.
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
              {/* 방사형 격자·축 — 데이터 방향(행 수)이라 컨테이너가 한 번만 그린다 */}
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
              {/* 투명 캡처층 — 웹 클릭네이티브 탭으로 툴팁을 띄운다（재탭 닫기）.
                  제스처(브러시·줌) 구성 시엔 래퍼가 탭을 인계받아 제거한다. */}
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
              {/* 도메인 초기화 칩 — 줌/브러시 확정 중에만（탭은 래퍼가 히트 판정） */}
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
            {/* 툴팁 오버레이 — 포인터는 통과（box-nonenone）시켜 hover가 끊기지 않게 한다 */}
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
