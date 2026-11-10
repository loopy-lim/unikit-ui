/**
 * 웹 chart 렌더러 — JSX `<svg>` 프록시（`@unikit-bridge/ui/chart` 웹 진입점）.
 *
 * React DOM 표준 SVG 요소를 ChartSurfaceChartLineChartRectChartText
 * ChartPathChartCircle 공통 인터페이스로 재노출한다. 스타일링은 소비자 앱의
 * 표준 Tailwind CSS v4가 className（fill-chart-1 등）으로 처리한다.
 * index.ts에서 re-export하지 않는다（§0.1 — Metro 오염 방지）.
 *
 * T-3a 보완（사이클 40）: ChartSurface.onPointMove/onPointLeave를 onMouseMove/
 * onMouseLeave（getBoundingClientRect 국소 좌표 정규화）로, ChartRect.onPress를
 * onClick으로 연결했다 — 차트 툴팁의 웹 hover클릭 진입점.
 */
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
  onPointMove,
  onPointLeave,
}: ChartSurfaceProps) => (
  <svg
    role="img"
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    className={className}
    aria-label={accessibilityLabel}
    onMouseMove={
      onPointMove
        ? (event) => {
            // viewBox가 width/height와 1:1 — SVG 국소 px가 곧 좌표계 좌표다.
            const rect = event.currentTarget.getBoundingClientRect();
            onPointMove({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        : undefined
    }
    onMouseLeave={onPointLeave}
  >
    {children}
  </svg>
);

const ChartLine = ({ x1, y1, x2, y2, className, stroke, strokeWidth, strokeDasharray }: ChartLineProps) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    className={className}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeDasharray={strokeDasharray}
  />
);

const ChartRect = ({ x, y, width, height, className, fill, rx, onPress }: ChartRectProps) => (
  <rect
    x={x}
    y={y}
    width={width}
    height={height}
    className={className}
    fill={fill}
    rx={rx}
    onClick={
      onPress
        ? (event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            onPress({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        : undefined
    }
  />
);

const ChartText = ({ x, y, children, className, textAnchor, fontSize }: ChartTextProps) => (
  <text x={x} y={y} className={className} textAnchor={textAnchor} fontSize={fontSize}>
    {children}
  </text>
);

const ChartPath = ({ d, className, fill, stroke, strokeWidth }: ChartPathProps) => (
  <path d={d} className={className} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
);

const ChartCircle = ({ cx, cy, r, className, fill }: ChartCircleProps) => (
  <circle cx={cx} cy={cy} r={r} className={className} fill={fill} />
);

export { ChartSurface, ChartLine, ChartRect, ChartText, ChartPath, ChartCircle };
