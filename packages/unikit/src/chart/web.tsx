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
