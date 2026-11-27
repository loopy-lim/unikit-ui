// 사이클 40 차트(엑스포) — ChartContainer + BarSeries/LineSeries.
// 카탈로그 재구성: 컴포넌트별 CatalogEntry로 분리(막대·선 슬라이드 2종).
// 네이티브 렌더러는 @unikit-bridge/ui/chart(react-native-svg optional peer)다.
// 색은 config 명시 hex(웹 oklch 토큰의 sRGB 근사)로 전달한다 — 네이티브
// SVG는 CSS 변수 var(--chart-N)도 fill-chart-N 클래스 토큰도 해석하지
// 못해(react-native-svg가 className을 폐기) explicit 색 경로만 동작한다.
// 네이티브에 hover는 없어 툴팁은 탭(투명 오버레이 Rect onPress)으로 동작한다.
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

import type { CatalogEntry } from "./catalog";

/** 차트 설정 — 색은 명시 hex(웹 site.css oklch 토큰의 sRGB 근사). 네이티브
 *  SVG는 fill-chart-N 클래스 토큰을 해석하지 못해(react-native-svg가
 *  className을 폐기) config 색 explicit 경로로 전달한다. */
const chartConfig = {
  month: { label: "월" },
  desktop: { label: "데스크톱", color: "#f54900" },
  mobile: { label: "모바일", color: "#009689" },
} satisfies ChartConfig;

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
const pieConfig = {
  browser: { label: "브라우저" },
  Chrome: { label: "Chrome", color: "#f54900" },
  Safari: { label: "Safari", color: "#009689" },
  Firefox: { label: "Firefox", color: "#8b5cf6" },
  기타: { label: "기타", color: "#64748b" },
} satisfies ChartConfig;
const pieData: ChartDatum[] = [
  { browser: "Chrome", share: 62 },
  { browser: "Safari", share: 18 },
  { browser: "Firefox", share: 8 },
  { browser: "기타", share: 12 },
];

/** 레이더 데이터 — 축 라벨이 첫 문자열 키(axis), 시리즈는 수치 키(score) */
const radarConfig = {
  axis: { label: "항목" },
  score: { label: "점수", color: "#009689" },
} satisfies ChartConfig;
const radarData: ChartDatum[] = [
  { axis: "가격", score: 80 },
  { axis: "속도", score: 65 },
  { axis: "안전", score: 90 },
  { axis: "디자인", score: 70 },
  { axis: "연비", score: 55 },
];

/** 다중 y축 데이터 — 좌축(판매), 우축(온도) 크기가 크게 다른 두 시리즈 */
const dualConfig = {
  month: { label: "월" },
  sales: { label: "판매(건)", color: "#f54900" },
  temp: { label: "온도(°C)", color: "#8b5cf6" },
} satisfies ChartConfig;
const dualData: ChartDatum[] = [
  { month: "1월", sales: 4200, temp: 2 },
  { month: "2월", sales: 5100, temp: 5 },
  { month: "3월", sales: 4800, temp: 11 },
  { month: "4월", sales: 6200, temp: 16 },
  { month: "5월", sales: 7100, temp: 21 },
];

/** 스택 데이터 — desktop+mobile 누적과 목표 참조선 */
const stackConfig = {
  month: { label: "월" },
  desktop: { label: "데스크톱", color: "#f54900" },
  mobile: { label: "모바일", color: "#009689" },
} satisfies ChartConfig;

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
      {
        name: "막대(단일 시리즈)",
        element: (
          // width="fluid" — 사이클 90 유동 폭 실증 슬라이드(브리지 onLayout:
          // 네이티브 RN onLayout·웹 ResizeObserver). 회전 시 카드 폭을 따라간다.
          <ChartContainer config={chartConfig} data={barData} width="fluid">
            <ChartGrid />
            <ChartXAxis />
            <ChartYAxis />
            <ChartBarSeries dataKey="desktop" />
            <ChartTooltip />
            <ChartLegend />
          </ChartContainer>
        ),
      },
      {
        name: "선(2시리즈)",
        element: (
          <ChartContainer config={chartConfig} data={lineData}>
            <ChartGrid />
            <ChartXAxis />
            <ChartYAxis />
            <ChartLineSeries dataKey="desktop" />
            <ChartLineSeries dataKey="mobile" />
            <ChartTooltip />
            <ChartLegend />
          </ChartContainer>
        ),
      },
      {
        name: "파이·도넛(innerRadius)",
        element: (
          <ChartContainer config={pieConfig} data={pieData}>
            <ChartPieSeries dataKey="share" innerRadius={44} label />
            <ChartTooltip />
            <ChartLegend />
          </ChartContainer>
        ),
      },
      {
        name: "레이더(방사형)",
        element: (
          <ChartContainer config={radarConfig} data={radarData}>
            <ChartRadialSeries dataKey="score" />
            <ChartTooltip />
            <ChartLegend />
          </ChartContainer>
        ),
      },
      {
        name: "스택 막대 + 참조선",
        element: (
          <ChartContainer config={stackConfig} data={lineData}>
            <ChartGrid />
            <ChartXAxis />
            <ChartYAxis />
            <ChartBarSeries dataKey="desktop" stackId="a" />
            <ChartBarSeries dataKey="mobile" stackId="a" />
            <ChartReferenceLine y={400} label="목표 400" />
            <ChartTooltip />
            <ChartLegend />
          </ChartContainer>
        ),
      },
      {
        name: "다중 y축(좌판매·우온도)",
        element: (
          <ChartContainer config={dualConfig} data={dualData}>
            <ChartGrid />
            <ChartXAxis />
            <ChartYAxis yAxisId="left" />
            <ChartYAxis yAxisId="right" orientation="right" />
            <ChartBarSeries dataKey="sales" yAxisId="left" />
            <ChartLineSeries dataKey="temp" yAxisId="right" />
            <ChartTooltip />
            <ChartLegend />
          </ChartContainer>
        ),
      },
      {
        name: "브러시(드래그 선택)·줌",
        element: (
          <ChartContainer config={chartConfig} data={lineData}>
            <ChartGrid />
            <ChartXAxis />
            <ChartYAxis />
            <ChartLineSeries dataKey="desktop" />
            <ChartBrush />
            <ChartZoom />
            <ChartTooltip />
          </ChartContainer>
        ),
      },
    ],
  },
];
