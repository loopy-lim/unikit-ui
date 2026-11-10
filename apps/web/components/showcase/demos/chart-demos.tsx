"use client";

import {
  ChartBarSeries,
  ChartContainer,
  ChartGrid,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
  type ChartConfig,
  type ChartDatum,
} from "../../ui/chart";
import type { ShowcaseDemo } from "./types";

const chartConfig = {
  month: { label: "월" },
  desktop: { label: "데스크톱", color: "var(--chart-1)" },
} satisfies ChartConfig;

const barData: ChartDatum[] = [
  { month: "1월", desktop: 152 },
  { month: "2월", desktop: 186 },
  { month: "3월", desktop: 240 },
];

export const chartDemo: ShowcaseDemo = {
  Demo: function ChartDemo() {
    return (
      <ChartContainer config={chartConfig} data={barData}>
        <ChartGrid />
        <ChartXAxis />
        <ChartYAxis />
        <ChartBarSeries dataKey="desktop" />
        <ChartTooltip />
      </ChartContainer>
    );
  },
  code: `import { ChartContainer, ChartBarSeries, ChartXAxis, ChartYAxis } from "@unikit-bridge/ui/chart";

<ChartContainer config={config} data={data}>
  <ChartBarSeries dataKey="desktop" />
</ChartContainer>`,
};
