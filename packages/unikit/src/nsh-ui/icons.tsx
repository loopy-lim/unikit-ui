// 유니버설 벡터 아이콘 — lucide 경로 데이터를 nsh canvas(Path2D)로 그린다.
// 구현은 src/bridge/nsh.tsx(제거됨, 사이클 101)에서 계승했다.
//
// 계약(실측 — 101 §3):
// - Canvas의 draw는 생성 시 1회만 소비된다(스킴 전환 미갱신 — 로드맵).
// - Path2D는 전역이 아니라 nsh 모듈 export다 — SVG d 문자열을 네이티브가 파싱.
// - 캔버스에 currentColor 상속이 없어 className의 text-* 토큰을 token()으로
//   직접 해석한다. 미지정 시 foreground 폴백.
import { Canvas, Path2D as NshPath2D, token } from "nsh";

import { NSH_LUCIDE_ICONS } from "./lucide-icons.generated";
import { cn } from "../lib/utils";
import { nshClass } from "./lib";

/** className의 text-* 색 토큰을 nsh token()으로 해석한 색. */
function iconColor(className: string | undefined): string {
  const fallback = () => {
    try {
      return token("foreground") as string;
    } catch {
      return "black";
    }
  };
  if (!className) return fallback();
  const match = className.match(/text-([a-z0-9-]+)/g);
  if (match) {
    for (const cls of match) {
      const name = cls.slice("text-".length).replace(/\/\d+$/, "");
      try {
        const value = token(name as "foreground");
        if (typeof value === "string") return value;
      } catch {
        // 미지원 토큰 — 다음 매치로
      }
    }
  }
  return fallback();
}

type NshCanvasContext = {
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  scale(x: number, y: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  arc(x: number, y: number, radius: number, start: number, end: number): void;
  ellipse(
    x: number, y: number, rx: number, ry: number, rot: number,
    start: number, end: number,
  ): void;
  rect(x: number, y: number, w: number, h: number): void;
  stroke(path?: unknown): void;
  fill(path?: unknown): void;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  lineCap: "round";
  lineJoin: "round";
};

/** lucide 아이콘 노드(tag별 도형)를 24×24 뷰박스에서 캔버스로 그린다. */
function drawIcon(
  cx: NshCanvasContext,
  width: number,
  height: number,
  data: readonly (readonly [string, Readonly<Record<string, string | number>>])[],
  color: string,
  strokeWidth: number,
) {
  const scale = Math.min(width, height) / 24;
  if (scale <= 0) return;
  cx.save();
  cx.translate((width - 24 * scale) / 2, (height - 24 * scale) / 2);
  cx.scale(scale, scale);
  cx.strokeStyle = color;
  cx.fillStyle = color;
  cx.lineWidth = strokeWidth;
  cx.lineCap = "round";
  cx.lineJoin = "round";
  for (const [tag, attrs] of data) {
    if (tag === "circle") {
      cx.beginPath();
      cx.ellipse(
        Number(attrs.cx), Number(attrs.cy), Number(attrs.r), Number(attrs.r),
        0, 0, Math.PI * 2,
      );
      cx.stroke();
    } else if (tag === "ellipse") {
      cx.beginPath();
      cx.ellipse(
        Number(attrs.cx), Number(attrs.cy), Number(attrs.rx), Number(attrs.ry),
        0, 0, Math.PI * 2,
      );
      cx.stroke();
    } else if (tag === "rect") {
      cx.beginPath();
      cx.rect(
        Number(attrs.x), Number(attrs.y),
        Number(attrs.width), Number(attrs.height),
      );
      cx.stroke();
    } else if (tag === "line") {
      cx.beginPath();
      cx.moveTo(Number(attrs.x1), Number(attrs.y1));
      cx.lineTo(Number(attrs.x2), Number(attrs.y2));
      cx.stroke();
    } else if (attrs.d !== undefined) {
      cx.stroke(new NshPath2D(String(attrs.d)));
    }
  }
  cx.restore();
}

export type IconProps = {
  className?: string;
  /** px 크기(기본 16) — 클래스 size-*보다 우선한다 */
  size?: number | string;
  /** 직접 색 지정 — 미지정 시 className의 text-* 토큰, 그마저 없으면 foreground */
  color?: string;
  strokeWidth?: number;
  style?: Record<string, unknown>;
  testID?: string;
};

function makeNshIcon(name: keyof typeof NSH_LUCIDE_ICONS) {
  return function NshIcon(props: IconProps) {
    const {
      className,
      size = 16,
      color,
      strokeWidth = 2,
      style,
      testID,
    } = props;
    const data = NSH_LUCIDE_ICONS[name];
    const resolvedColor = color ?? iconColor(className);
    const numericSize = typeof size === "string" ? Number(size) || 16 : size;
    return (
      <Canvas
        class={nshClass(cn("size-4", className))}
        style={{ width: numericSize, height: numericSize, ...style }}
        testID={testID}
        accessibilityElementsHidden
        draw={(cx, size) =>
          drawIcon(
            cx as unknown as NshCanvasContext, size.width, size.height,
            data, resolvedColor, strokeWidth,
          )
        }
      />
    );
  };
}

export const CheckIcon = makeNshIcon("Check");
export const ChevronDownIcon = makeNshIcon("ChevronDown");
export const ChevronUpIcon = makeNshIcon("ChevronUp");
export const ChevronRightIcon = makeNshIcon("ChevronRight");
export const ChevronLeftIcon = makeNshIcon("ChevronLeft");
export const XIcon = makeNshIcon("X");
export const SearchIcon = makeNshIcon("Search");
export const MinusIcon = makeNshIcon("Minus");
export const CircleIcon = makeNshIcon("Circle");
export const MoreHorizontalIcon = makeNshIcon("MoreHorizontal");
export const ArrowLeftIcon = makeNshIcon("ArrowLeft");
export const ArrowRightIcon = makeNshIcon("ArrowRight");
export const ArrowUpIcon = makeNshIcon("ArrowUp");
export const ArrowDownIcon = makeNshIcon("ArrowDown");
export const InfoIcon = makeNshIcon("Info");
export const AlertCircleIcon = makeNshIcon("AlertCircle");
export const CheckCircle2Icon = makeNshIcon("CheckCircle2");
export const XCircleIcon = makeNshIcon("XCircle");
export const Loader2Icon = makeNshIcon("Loader2");
export const PanelLeftIcon = makeNshIcon("PanelLeft");
export const GripVerticalIcon = makeNshIcon("GripVertical");
export const BoldIcon = makeNshIcon("Bold");
export const ItalicIcon = makeNshIcon("Italic");
export const StrikethroughIcon = makeNshIcon("Strikethrough");
export const Heading1Icon = makeNshIcon("Heading1");
export const Heading2Icon = makeNshIcon("Heading2");
export const ListIcon = makeNshIcon("List");
export const ListOrderedIcon = makeNshIcon("ListOrdered");
export const TextQuoteIcon = makeNshIcon("TextQuote");
export const CodeIcon = makeNshIcon("Code");
export const Undo2Icon = makeNshIcon("Undo2");
export const Redo2Icon = makeNshIcon("Redo2");
