// 사이클 40 차트(엑스포) — ChartContainer + BarSeries/LineSeries.
// 카탈로그 재구성: 컴포넌트별 CatalogEntry로 분리(막대·선 슬라이드 2종).
// 네이티브 렌더러는 @unikit-bridge/ui/chart(react-native-svg optional peer)다.
// 색은 chartPalette()(토큰 --chart-1..5의 hex 조립)로 전달한다 — 네이티브
// SVG는 CSS 변수 var(--chart-N)도 fill-chart-N 클래스 토큰도 해석하지
// 못해(react-native-svg가 className을 폐기) explicit 색 경로만 동작한다.
// 팔레트는 스킴을 따라간다(useUnikitTheme) — 라이트 고정 관행(2026-11-28 이전)을
// 폐기하고 다크 전환 시 차트도 함께 전환된다.
// 네이티브에 hover는 없어 툴팁은 탭(투명 오버레이 Rect onPress)으로 동작한다.
import { useMemo } from "react";
import {
  ChartBarSeries,
  ChartBrush,
  ChartConfig,
  ChartContainer,
  ChartGrid,
  ChartLegend,
  ChartLineSeries,
  ChartPieSeries,
  ChartRadialSeries,
  ChartReferenceLine,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
  ChartZoom,
  type ChartDatum,
} from "../ui/chart";
import { chartPalette, useUnikitTheme, type ChartPalette } from "@unikit-bridge/ui";

import type { CatalogEntry } from "./catalog";

/** 팔레트 기반 차트 설정 — chart-1..5 순번에 시리즈를 맞춘다. */
function configsFor(p: ChartPalette) {
  return {
    chart: {
      month: { label: "월" },
      desktop: { label: "데스크톱", color: p[0] },
      mobile: { label: "모바일", color: p[1] },
    } satisfies ChartConfig,
    pie: {
      browser: { label: "브라우저" },
      Chrome: { label: "Chrome", color: p[0] },
      Safari: { label: "Safari", color: p[1] },
      Firefox: { label: "Firefox", color: p[3] },
      기타: { label: "기타", color: p[2] },
    } satisfies ChartConfig,
    radar: {
      axis: { label: "항목" },
      score: { label: "점수", color: p[1] },
    } satisfies ChartConfig,
    dual: {
      month: { label: "월" },
      sales: { label: "판매(건)", color: p[0] },
      temp: { label: "온도(°C)", color: p[3] },
    } satisfies ChartConfig,
    stack: {
      month: { label: "월" },
      desktop: { label: "데스크톱", color: p[0] },
      mobile: { label: "모바일", color: p[1] },
    } satisfies ChartConfig,
  };
}

/** 스킴 반응형 설정 훅 — 다크 전환 시 차트 팔레트도 함께 바뀐다. */
function useChartConfigs() {
  const { colorScheme } = useUnikitTheme();
  return useMemo(() => configsFor(chartPalette(colorScheme)), [colorScheme]);
}

/** 막대 차트 데이터(단일 시리즈) — 웹 쇼케이스와 동일 */
const barData: ChartDatum[] = [
  { month: "1월", desktop: 152 },
  { month: "2월", desktop: 186 },
  { month: "3월", desktop: 240 },
  { month: "4월", desktop: 205 },
  { month: "5월", desktop: 267 },
  { month: "6월", desktop: 310 },
];

/** 선 차트 데이터(2시리즈) — 웹 쇼케이스와 동일 */
const lineData: ChartDatum[] = [
  { month: "1월", desktop: 152, mobile: 90 },
  { month: "2월", desktop: 186, mobile: 120 },
  { month: "3월", desktop: 240, mobile: 168 },
  { month: "4월", desktop: 205, mobile: 201 },
  { month: "5월", desktop: 267, mobile: 244 },
  { month: "6월", desktop: 310, mobile: 280 },
];

/** 파이 데이터 — x키(브라우저명)가 config 색 조회 키가 된다 */
const pieData: ChartDatum[] = [
  { browser: "Chrome", share: 62 },
  { browser: "Safari", share: 18 },
  { browser: "Firefox", share: 8 },
  { browser: "기타", share: 12 },
];

/** 레이더 데이터 — 축 라벨이 첫 문자열 키(axis), 시리즈는 수치 키(score) */
const radarData: ChartDatum[] = [
  { axis: "가격", score: 80 },
  { axis: "속도", score: 65 },
  { axis: "안전", score: 90 },
  { axis: "디자인", score: 70 },
  { axis: "연비", score: 55 },
];

/** 다중 y축 데이터 — 좌축(판매), 우축(온도) 크기가 크게 다른 두 시리즈 */
const dualData: ChartDatum[] = [
  { month: "1월", sales: 4200, temp: 2 },
  { month: "2월", sales: 5100, temp: 5 },
  { month: "3월", sales: 4800, temp: 11 },
  { month: "4월", sales: 6200, temp: 16 },
  { month: "5월", sales: 7100, temp: 21 },
];

/** 슬라이드 데모 — 설정 훅을 쓰는 시점에 스킴이 반영된다. */
function BarFluidDemo() {
  const c = useChartConfigs();
  return (
    // width="fluid" — 사이클 90 유동 폭 실증 슬라이드(브리지 onLayout:
    // 네이티브 RN onLayout·웹 ResizeObserver). 회전 시 카드 폭을 따라간다.
    <ChartContainer config={c.chart} data={barData} width="fluid">
      <ChartGrid />
      <ChartXAxis />
      <ChartYAxis />
      <ChartBarSeries dataKey="desktop" />
      <ChartTooltip />
      <ChartLegend />
    </ChartContainer>
  );
}

function LineDemo() {
  const c = useChartConfigs();
  return (
    <ChartContainer config={c.chart} data={lineData}>
      <ChartGrid />
      <ChartXAxis />
      <ChartYAxis />
      <ChartLineSeries dataKey="desktop" />
      <ChartLineSeries dataKey="mobile" />
      <ChartTooltip />
      <ChartLegend />
    </ChartContainer>
  );
}

function PieDemo() {
  const c = useChartConfigs();
  return (
    <ChartContainer config={c.pie} data={pieData}>
      <ChartPieSeries dataKey="share" innerRadius={44} label />
      <ChartTooltip />
      <ChartLegend />
    </ChartContainer>
  );
}

function RadarDemo() {
  const c = useChartConfigs();
  return (
    <ChartContainer config={c.radar} data={radarData}>
      <ChartRadialSeries dataKey="score" />
      <ChartTooltip />
      <ChartLegend />
    </ChartContainer>
  );
}

function StackDemo() {
  const c = useChartConfigs();
  return (
    <ChartContainer config={c.stack} data={lineData}>
      <ChartGrid />
      <ChartXAxis />
      <ChartYAxis />
      <ChartBarSeries dataKey="desktop" stackId="a" />
      <ChartBarSeries dataKey="mobile" stackId="a" />
      <ChartReferenceLine y={400} label="목표 400" />
      <ChartTooltip />
      <ChartLegend />
    </ChartContainer>
  );
}

function DualAxisDemo() {
  const c = useChartConfigs();
  return (
    <ChartContainer config={c.dual} data={dualData}>
      <ChartGrid />
      <ChartXAxis />
      <ChartYAxis yAxisId="left" />
      <ChartYAxis yAxisId="right" orientation="right" />
      <ChartBarSeries dataKey="sales" yAxisId="left" />
      <ChartLineSeries dataKey="temp" yAxisId="right" />
      <ChartTooltip />
      <ChartLegend />
    </ChartContainer>
  );
}

function BrushDemo() {
  const c = useChartConfigs();
  return (
    <ChartContainer config={c.chart} data={lineData}>
      <ChartGrid />
      <ChartXAxis />
      <ChartYAxis />
      <ChartLineSeries dataKey="desktop" />
      <ChartBrush />
      <ChartZoom />
      <ChartTooltip />
    </ChartContainer>
  );
}

/** Chart — ChartContainer + BarSeries/LineSeries (네이티브 SVG) */
export const CHART_ENTRIES: CatalogEntry[] = [
  {
    slug: "chart",
    title: "Chart",
    subtitle: "차트",
    category: "차트",
    description:
      "선언적 시리즈 조합으로 그리는 차트예요. 막대를 탭하면 툴팁이 떠요.",
    slides: [
      { name: "막대(단일 시리즈)", element: <BarFluidDemo /> },
      { name: "선(2시리즈)", element: <LineDemo /> },
      { name: "파이·도넛(innerRadius)", element: <PieDemo /> },
      { name: "레이더(방사형)", element: <RadarDemo /> },
      { name: "스택 막대 + 참조선", element: <StackDemo /> },
      { name: "다중 y축(좌판매·우온도)", element: <DualAxisDemo /> },
      { name: "브러시(드래그 선택)·줌", element: <BrushDemo /> },
    ],
  },
];
