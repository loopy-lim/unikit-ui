import type { ReactNode } from "react";

export type ChartPoint = { x: number; y: number };

export type ChartSurfaceProps = {
  width: number;
  height: number;
  children?: ReactNode;
  className?: string;

  accessibilityLabel?: string;

  onPointMove?: (point: ChartPoint) => void;

  onPointLeave?: () => void;
};

export type ChartLineProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  className?: string;
  stroke?: string;
  strokeWidth?: number;

  strokeDasharray?: string;
};

export type ChartRectProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
  fill?: string;
  rx?: number;

  onPress?: (point: ChartPoint) => void;
};

export type ChartTextProps = {
  x: number;
  y: number;
  children?: ReactNode;
  className?: string;
  textAnchor?: "start" | "middle" | "end";
  fontSize?: number;
};

export type ChartPathProps = {
  d: string;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export type ChartCircleProps = {
  cx: number;
  cy: number;
  r: number;
  className?: string;
  fill?: string;
};
