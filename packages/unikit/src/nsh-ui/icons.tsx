// 유니버설 벡터 아이콘 — lucide 경로 데이터를 nsh canvas(Path2D)로 그린다.
// 구현은 src/bridge/nsh.tsx(제거됨, 사이클 101)에서 계승했다.
//
// 계약(실측 — 101 §3, 103 §2):
// - draw 안에서 token()으로 읽은 토큰이 바뀌면(색 스킴 전환) draw가 다시
//   실행된다. 색 해석은 반드시 draw 안에서 한다 — 바깥에서 한 번 계산하면
//   다크 모드에서 색이 고정된다(102 결함, 103에서 수정).
// - Path2D는 전역이 아니라 nsh 모듈 export다 — SVG d 문자열을 네이티브가 파싱.
// - 캔버스에 currentColor 상속이 없어 className의 text-* 토큰을 token()으로
//   직접 해석한다. 미지정 시 foreground 폴백.
// - 크기는 className의 size-* 클래스가 정한다(기본 size-4). size prop을 준
//   때만 인라인 style이 클래스를 덮어쓴다 — 인라인이 늘 우선하면 size-8 같은
//   클래스가 무시된다(102 결함, 103에서 수정).
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
  /** px 크기 — 지정하면 className의 size-*보다 우선한다(생략 시 클래스 기본 size-4) */
  size?: number | string;
  /** 직접 색 지정 — 미지정 시 className의 text-* 토큰, 그마저 없으면 foreground */
  color?: string;
  strokeWidth?: number;
  style?: Record<string, unknown>;
  testID?: string;
};

function makeNshIcon(name: keyof typeof NSH_LUCIDE_ICONS) {
  return function NshIcon(props: IconProps) {
    const data = NSH_LUCIDE_ICONS[name];
    // props는 getter다 — 구조 분해하면 반응성이 끊긴다. 색·클래스는 draw·class
    // 읽는 시점에 props에서 다시 읽어 className 교체·스킴 전환을 따라간다.
    const numericSize =
      props.size === undefined
        ? undefined
        : typeof props.size === "string"
          ? Number(props.size) || 16
          : props.size;
    return (
      <Canvas
        class={nshClass(cn("size-4", props.className))}
        style={
          numericSize === undefined
            ? props.style
            : { width: numericSize, height: numericSize, ...props.style }
        }
        testID={props.testID}
        accessibilityElementsHidden
        draw={(cx, box) =>
          drawIcon(
            cx as unknown as NshCanvasContext, box.width, box.height,
            data, props.color ?? iconColor(props.className), props.strokeWidth ?? 2,
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
