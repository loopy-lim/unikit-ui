"use client";
// 사이클 40 신규 섹션 — Chart(티어 6, 웹 전용): ChartContainer + BarSeries/
// LineSeries 데이터 예시. 색은 site.css의 --chart-1..5(shadcn 차트 표준 oklch
// 팔레트)를 config 색 "var(--chart-N)"으로 소비한다 — 라이트·다크 모두 대응.
// 네이티브는 uniwind 테마 등록 폴백 한계로 엑스포 쇼케이스에 넣지 않는다.
import { Button } from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

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
import { DemoLabel, Hint, Section } from "./section";

/** 차트 설정 — 라벨과 색(var(--chart-N) — site.css 토큰) */
const chartConfig = {
  month: { label: "월" },
  desktop: { label: "데스크톱", color: "var(--chart-1)" },
  mobile: { label: "모바일", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** 막대 차트 데이터(단일 시리즈) */
const barData: ChartDatum[] = [
  { month: "1월", desktop: 152 },
  { month: "2월", desktop: 186 },
  { month: "3월", desktop: 240 },
  { month: "4월", desktop: 205 },
  { month: "5월", desktop: 267 },
  { month: "6월", desktop: 310 },
];

/** 선 차트 데이터(2시리즈) */
const lineData: ChartDatum[] = [
  { month: "1월", desktop: 152, mobile: 90 },
  { month: "2월", desktop: 186, mobile: 120 },
  { month: "3월", desktop: 240, mobile: 168 },
  { month: "4월", desktop: 205, mobile: 201 },
  { month: "5월", desktop: 267, mobile: 244 },
  { month: "6월", desktop: 310, mobile: 280 },
];

/** Section: Chart — ChartContainer + BarSeries/LineSeries (웹 전용) */
export function ChartSection() {
  return (
    <Section
      title="Chart — 차트 (웹 전용)"
      description="선언형 시리즈 조합으로 그리는 차트예요. 막대 위를 hover하거나 누르면 툴팁이 떠요."
    >
      {/* 막대 차트 — 단일 시리즈 */}
      <DemoLabel>ChartBarSeries — 방문자 수</DemoLabel>
      <ChartContainer config={chartConfig} data={barData}>
        <ChartGrid />
        <ChartXAxis />
        <ChartYAxis />
        <ChartBarSeries dataKey="desktop" />
        <ChartTooltip />
        <ChartLegend />
      </ChartContainer>

      {/* 선 차트 — 2시리즈(색 순환 chart-1·chart-2) */}
      <DemoLabel>ChartLineSeries — 플랫폼별 추이</DemoLabel>
      <ChartContainer config={chartConfig} data={lineData}>
        <ChartGrid />
        <ChartXAxis />
        <ChartYAxis />
        <ChartLineSeries dataKey="desktop" />
        <ChartLineSeries dataKey="mobile" />
        <ChartTooltip />
        <ChartLegend />
      </ChartContainer>

      <View className="flex flex-row flex-wrap items-center gap-3">
        <Button variant="outline" disabled>
          데이터 내보내기 (준비 중)
        </Button>
        <Hint>
          시리즈 색은 --chart-1..5 토큰(site.css)이에요. 테마를 전환하면 팔레트도
          바뀌어요.
        </Hint>
      </View>
    </Section>
  );
}
