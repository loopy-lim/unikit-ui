import { Circle, Line, Path, Rect, Svg, Text } from "react-native-svg";

import type {
  ChartCircleProps,
  ChartLineProps,
  ChartPathProps,
  ChartRectProps,
  ChartSurfaceProps,
  ChartTextProps,
} from "./types";

export type * from "./types";

const ChartSurface = ({
  width,
  height,
  children,
  className,
  accessibilityLabel,
}: ChartSurfaceProps) => (
  <Svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    accessibilityLabel={accessibilityLabel}
    {...({ className } as Record<string, unknown>)}
  >
    {children}
  </Svg>
);

const ChartLine = ({ x1, y1, x2, y2, className, stroke, strokeWidth, strokeDasharray }: ChartLineProps) => (
  <Line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    {...({ className } as Record<string, unknown>)}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeDasharray={strokeDasharray}
  />
);

const ChartRect = ({ x, y, width, height, className, fill, rx, onPress }: ChartRectProps) => (
  <Rect
    x={x}
    y={y}
    width={width}
    height={height}
    fill={fill}
    rx={rx}
    onPress={
      onPress
        ? (event: { nativeEvent: { locationX?: number; locationY?: number } }) => {

            onPress({
              x: event.nativeEvent.locationX ?? 0,
              y: event.nativeEvent.locationY ?? 0,
            });
          }
        : undefined
    }
    {...({ className } as Record<string, unknown>)}
  />
);

const ChartText = ({ x, y, children, className, textAnchor, fontSize }: ChartTextProps) => (
  <Text
    x={x}
    y={y}
    textAnchor={textAnchor}
    fontSize={fontSize}
    {...({ className } as Record<string, unknown>)}
  >
    {children}
  </Text>
);

const ChartPath = ({ d, className, fill, stroke, strokeWidth }: ChartPathProps) => (
  <Path
    d={d}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    {...({ className } as Record<string, unknown>)}
  />
);

const ChartCircle = ({ cx, cy, r, className, fill }: ChartCircleProps) => (
  <Circle
    cx={cx}
    cy={cy}
    r={r}
    fill={fill}
    {...({ className } as Record<string, unknown>)}
  />
);

export { ChartSurface, ChartLine, ChartRect, ChartText, ChartPath, ChartCircle };
