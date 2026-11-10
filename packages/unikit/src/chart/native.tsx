/**
 * 네이티브 chart 렌더러 — react-native-svg 프록시（`@unikit-bridge/ui/chart`
 * 네이티브 진입점）.
 *
 * react-native-svg를 정적 import해 웹 렌더러와 동일한 공통 인터페이스
 * （ChartSurfaceChartLineChartRectChartTextChartPathChartCircle）로
 * 재노출한다. 이 파일은 "react-native" 조건에서만 로드되므로 웹 번들은
 * react-native-svg를 포함하지 않는다（§0.1 — optional peer）.
 * className은 react-native-svg 타입 계약에 없어 무형 스프레드로 전달한다
 * （uniwind가 해석하면 fill/stroke 토큰으로 적용, 아니면 폐기 — 시리즈 색상
 * 전략은 chart 컴포넌트（T-3a）에서 확정）.
 *
 * T-3a 보완（사이클 40）: ChartRect.onPress를 react-native-svg 도형의 onPress
 * （nativeEvent.locationX/Y — Rect 국소 좌표）로 연결했다. ChartSurface의
 * onPointMove/onPointLeave는 네이티브에 hover가 없어 계약상 받기만 하고
 * 발화하지 않는다（웹 전용 기능 — 툴팁 탭은 투명 오버레이 Rect가 담당）.
 */
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
  >
    {children}
  </Svg>
);
// onPointMove/onPointLeave는 계약에만 존재（웹 hover 전용） — 네이티브는 발화 안 함.

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
            // locationX/Y는 요소（Rect） 국소 좌표 — 오버레이 Rect를 （0,0）에 깔면
            // SVG 좌표계와 일치한다.
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
