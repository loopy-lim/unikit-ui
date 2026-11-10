// 사이클 40 차트(엑스포) — ChartContainer + BarSeries/LineSeries.
// 카탈로그 재구성: 컴포넌트별 CatalogEntry로 분리(막대·선 슬라이드 2종).
// 네이티브 렌더러는 @unikit-bridge/ui/chart(react-native-svg optional peer)다.
// 색은 config 명시 hex(웹 oklch 토큰의 sRGB 근사)로 전달한다 — 네이티브
// SVG는 CSS 변수 var(--chart-N)도 fill-chart-N 클래스 토큰도 해석하지
// 못해(react-native-svg가 className을 폐기) explicit 색 경로만 동작한다.
// 네이티브에 hover는 없어 툴팁은 탭(투명 오버레이 Rect onPress)으로 동작한다.
import {
  ChartBarSeries,
  ChartConfig,
  ChartContainer,
  ChartGrid,
  ChartLegend,
  ChartLineSeries,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
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
          <ChartContainer config={chartConfig} data={barData}>
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
    ],
  },
];
