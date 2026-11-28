import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  isValidElement,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  GripVerticalIcon,
  View,
  measureInWindow,
  useDrag,
  type BridgeDragEvent,
  type BridgeKeyEvent,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

const DEFAULT_MIN_SIZE = 10;
const DEFAULT_MAX_SIZE = 90;

type ResizableContextValue = {
  direction: "horizontal" | "vertical";

  sizes: (number | null)[];

  constraints: { minSize: number; maxSize: number }[];
  beginResize: (index: number) => void;
  moveResize: (index: number, event: BridgeDragEvent) => void;

  keyResize: (index: number, deltaPercent: number) => void;
};

const ResizableContext = createContext<ResizableContextValue | null>(null);

function useResizableContext(component: string): ResizableContextValue {
  const ctx = useContext(ResizableContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <ResizablePanelGroup> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type PanelConstraint = {
  defaultSize?: number;
  minSize: number;
  maxSize: number;
};

export type ResizablePanelGroupProps = ViewProps & {

  direction?: "horizontal" | "vertical";
  children?: ReactNode;
};

const ResizablePanelGroup = forwardRef<BridgeViewRef, ResizablePanelGroupProps>(
  ({ className, direction = "horizontal", children, ...props }, ref) => {

    const { decorated, constraints } = useMemo(() => {
      const panelConstraints: PanelConstraint[] = [];
      let panelCount = 0;
      const items = Children.toArray(children).map((child) => {
        if (!isValidElement(child)) return child;
        const element = child as ReactElement;
        if (element.type === ResizablePanel) {
          const panel = element.props as ResizablePanelProps;
          panelConstraints.push({
            defaultSize: panel.defaultSize,
            minSize: panel.minSize ?? DEFAULT_MIN_SIZE,
            maxSize: panel.maxSize ?? DEFAULT_MAX_SIZE,
          });
          const indexed = cloneElement(
            element as ReactElement<ResizablePanelProps>,
            { index: panelCount },
          );
          panelCount += 1;
          return indexed;
        }
        if (element.type === ResizableHandle) {

          return cloneElement(
            element as ReactElement<ResizableHandleProps>,
            { index: panelCount - 1 },
          );
        }
        return child;
      });
      return { decorated: items, constraints: panelConstraints };
    }, [children]);

    const [sizes, setSizes] = useState<(number | null)[]>(() => {
      const share = Math.floor(100 / Math.max(1, constraints.length));
      return constraints.map((constraint, index) =>
        index === constraints.length - 1
          ? null
          : (constraint.defaultSize ?? share),
      );
    });

    const containerRef = useRef<BridgeViewRef>(null);
    const axisRef = useRef(0);
    const startRef = useRef(0);
    const sizesRef = useRef(sizes);
    sizesRef.current = sizes;
    const measureContainer = useCallback(() => {
      measureInWindow(containerRef.current, (_x, _y, width, height) => {
        axisRef.current = direction === "horizontal" ? width : height;
      });
    }, [direction]);
    useEffect(measureContainer, [measureContainer]);

    const beginResize = useCallback(
      (index: number) => {
        measureContainer();
        startRef.current = sizesRef.current[index] ?? 0;
      },
      [measureContainer],
    );
    const moveResize = useCallback(
      (index: number, event: BridgeDragEvent) => {
        const axis = axisRef.current;
        if (index < 0 || index >= constraints.length || axis <= 0) return;
        const delta = direction === "horizontal" ? event.dx : event.dy;
        const { minSize, maxSize } = constraints[index]!;
        const next = Math.min(
          maxSize,
          Math.max(minSize, startRef.current + (delta / axis) * 100),
        );
        setSizes((prev) =>

          prev[index] == null ? prev : prev.map((size, i) => (i === index ? next : size)),
        );
      },
      [direction, constraints],
    );
    const keyResize = useCallback(
      (index: number, deltaPercent: number) => {
        if (index < 0 || index >= constraints.length) return;
        const { minSize, maxSize } = constraints[index]!;
        setSizes((prev) =>

          prev[index] == null
            ? prev
            : prev.map((size, i) =>
                i === index
                  ? Math.min(maxSize, Math.max(minSize, (size ?? 0) + deltaPercent))
                  : size,
              ),
        );
      },
      [constraints],
    );

    const combinedRef = useCallback(
      (node: BridgeViewRef | null) => {
        containerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as { current: BridgeViewRef | null }).current = node;
      },
      [ref],
    );

    const contextValue = useMemo(
      () => ({
        direction,
        sizes,
        constraints,
        beginResize,
        moveResize,
        keyResize,
      }),
      [direction, sizes, constraints, beginResize, moveResize, keyResize],
    );

    return (
      <ResizableContext.Provider value={contextValue}>
        <View
          ref={combinedRef}
          className={cn(
            "flex h-full w-full",

            direction === "vertical" ? "flex-col" : "flex-row",
            className,
          )}
          {...props}
        >
          {decorated}
        </View>
      </ResizableContext.Provider>
    );
  },
);
ResizablePanelGroup.displayName = "ResizablePanelGroup";

export type ResizablePanelProps = ViewProps & {

  defaultSize?: number;

  minSize?: number;

  maxSize?: number;

  index?: number;
};

const ResizablePanel = forwardRef<BridgeViewRef, ResizablePanelProps>(
  (
    {

      defaultSize: _defaultSize,
      minSize: _minSize,
      maxSize: _maxSize,
      index = -1,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const ctx = useResizableContext("ResizablePanel");
    const size = index >= 0 ? (ctx.sizes[index] ?? null) : null;

    const isLast = size === null;
    return (
      <View
        ref={ref}
        className={cn(isLast ? "flex-1" : "grow-0 shrink-0", className)}
        style={
          isLast ? style : { ...style, flexBasis: `${size}%` }
        }
        {...props}
      />
    );
  },
);
ResizablePanel.displayName = "ResizablePanel";

export type ResizableHandleProps = ViewProps & {

  withHandle?: boolean;

  index?: number;
};

const ResizableHandle = forwardRef<BridgeViewRef, ResizableHandleProps>(
  ({ withHandle, index = -1, className, onKeyDown, ...props }, ref) => {
    const ctx = useResizableContext("ResizableHandle");
    const { dragHandlers } = useDrag({
      onBegin: () => ctx.beginResize(index),
      onMove: (event) => ctx.moveResize(index, event),
    });
    const horizontal = ctx.direction === "horizontal";
    const handleKeyDown = (event: BridgeKeyEvent) => {
      onKeyDown?.(event);

      if ((event as { defaultPrevented?: boolean }).defaultPrevented) return;
      const step = event.shiftKey ? 10 : 2;
      if (horizontal && event.key === "ArrowLeft")
        ctx.keyResize(index, -step);
      else if (horizontal && event.key === "ArrowRight")
        ctx.keyResize(index, step);
      else if (!horizontal && event.key === "ArrowUp")
        ctx.keyResize(index, -step);
      else if (!horizontal && event.key === "ArrowDown")
        ctx.keyResize(index, step);
      else return;
      event.preventDefault();
    };
    return (
      <View
        ref={ref}
        accessibilityRole="separator"
        focusable
        aria-valuenow={ctx.sizes[index] ?? undefined}
        aria-valuemin={ctx.constraints[index]?.minSize}
        aria-valuemax={ctx.constraints[index]?.maxSize}
        onKeyDown={handleKeyDown}
        {...dragHandlers}
        className={cn(
          "relative flex touch-none items-center justify-center select-none web:outline-none web:focus-visible:ring-1 web:focus-visible:ring-ring web:focus-visible:ring-offset-1",
          horizontal
            ? "w-1 web:cursor-col-resize"
            : "h-1 web:cursor-row-resize",
          className,
        )}
        {...props}
      >
        {
                                                     }
        <View
          aria-hidden
          className={cn(
            "absolute bg-border",
            horizontal
              ? "inset-y-0 left-1/2 -ml-px w-px"
              : "inset-x-0 top-1/2 -mt-px h-px",
          )}
        />
        {withHandle && (
          <View
            aria-hidden
            className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border border-border bg-border"
          >
            <GripVerticalIcon
              className={cn(
                "size-2.5 text-muted-foreground",
                !horizontal && "rotate-90",
              )}
            />
          </View>
        )}
      </View>
    );
  },
);
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
