import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ForwardedRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  View,
  measureInWindow,
  useDrag,
  type BridgeDragEvent,
  type BridgeKeyEvent,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

function composeRefs<T>(
  local: MutableRefObject<T | null>,
  forwarded: ForwardedRef<T>,
) {
  return (node: T | null) => {
    local.current = node;
    if (typeof forwarded === "function") forwarded(node);
    else if (forwarded) forwarded.current = node;
  };
}

export function nextThumbValue(
  key: string,
  current: number,
  min: number,
  max: number,
  step: number,
): number | null {
  const safeStep = step > 0 ? step : 1;
  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      return current - safeStep;
    case "ArrowRight":
    case "ArrowUp":
      return current + safeStep;
    case "Home":
      return min;
    case "End":
      return max;
    default:
      return null;
  }
}

export type SliderProps = Omit<
  ViewProps,
  "children" | "onKeyDown"
> & {

  value?: number[];

  defaultValue?: number[];

  onValueChange?: (value: number[]) => void;

  min?: number;

  max?: number;

  step?: number;

  orientation?: "horizontal" | "vertical";

  disabled?: boolean;

  children?: ReactNode;

  onKeyDown?: (event: BridgeKeyEvent) => void;
};

const Slider = forwardRef<BridgeViewRef, SliderProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      orientation = "horizontal",
      disabled,
      accessibilityLabel,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const isVertical = orientation === "vertical";

    const [internal, setInternal] = useState<number[]>(defaultValue ?? [min]);
    const isControlled = value !== undefined;
    const values = isControlled ? value : internal;

    const safeStep = step > 0 ? step : 1;
    const range = max > min ? max - min : 1;

    const stepPrecision = (String(safeStep).split(".")[1] ?? "").length;
    const pctOf = (v: number) => ((v - min) / range) * 100;
    const snap = (raw: number) => {
      const clamped = Math.min(max, Math.max(min, raw));
      const stepped =
        Math.round((clamped - min) / safeStep) * safeStep + min;
      return Number((Math.min(max, Math.max(min, stepped))).toFixed(stepPrecision));
    };

    const activeRef = useRef<number>(0);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const trackRef = useRef<BridgeViewRef | null>(null);
    const rectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
    const measureTrack = () => {
      measureInWindow(trackRef.current, (x, y, width, height, pageX, pageY) => {
        rectRef.current = { x: pageX ?? x, y: pageY ?? y, width, height };
      });
    };
    useEffect(measureTrack, [orientation]);

    const commit = (index: number, next: number) => {
      const arr = values.slice();
      arr[index] = next;
      if (!isControlled) setInternal(arr);
      onValueChange?.(arr);
    };

    const updateValue = (index: number, raw: number) => {
      const snapped = snap(raw);
      const lower = index > 0 ? values[index - 1]! : min;
      const upper = index < values.length - 1 ? values[index + 1]! : max;
      const next = Math.min(Math.max(snapped, lower), upper);
      activeRef.current = index;
      setActiveIndex(index);
      if (next !== values[index]) commit(index, next);
    };

    const handleMove = (event: BridgeDragEvent) => {
      if (disabled) return;
      const rect = rectRef.current;
      if (!rect) return;
      const axisSize = isVertical ? rect.height : rect.width;
      if (axisSize <= 0) return;
      const pct = isVertical
        ? ((rect.y + rect.height - event.y) / rect.height) * 100
        : ((event.x - rect.x) / rect.width) * 100;
      const raw = min + (Math.min(100, Math.max(0, pct)) / 100) * range;
      if (activeIndex === null) {

        let nearest = 0;
        let best = Infinity;
        values.forEach((v, i) => {
          const d = Math.abs(v - raw);
          if (d < best) {
            best = d;
            nearest = i;
          }
        });
        activeRef.current = nearest;
        setActiveIndex(nearest);
      }
      updateValue(activeRef.current, raw);
    };

    const { dragHandlers, dragging } = useDrag({
      onBegin: () => {
        setActiveIndex(null);
        measureTrack();
      },
      onMove: handleMove,
      onEnd: () => setActiveIndex(null),
    });

    const applyThumbKey = (index: number, event: BridgeKeyEvent): boolean => {
      if (disabled) return false;

      const target = Math.min(index, values.length - 1);
      const current = values[target] ?? values[0] ?? min;
      const next = nextThumbValue(event.key, current, min, max, safeStep);
      if (next === null) return false;
      updateValue(target, next);
      return true;
    };

    const handleKeyDown = (event: BridgeKeyEvent) => {
      if (applyThumbKey(activeRef.current, event)) event.preventDefault();
      onKeyDown?.(event);
    };

    const handleThumbKeyDown = (index: number) => (event: BridgeKeyEvent) => {
      if (!applyThumbKey(index, event)) return;
      event.preventDefault();
      event.stopPropagation?.();
      onKeyDown?.(event);
    };

    const first = values[0] ?? min;
    const last = values[values.length - 1] ?? min;

    return (

      <View
        ref={composeRefs(trackRef, ref)}
        accessibilityRole="group"
        onKeyDown={handleKeyDown}
        className={cn(
          isVertical
            ? "relative flex h-44 w-4 touch-none flex-col items-center select-none"
            : "relative flex h-4 w-full touch-none flex-row items-center select-none",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...dragHandlers}
        {...props}
      >

        <View
          aria-hidden
          className={cn(
            "relative grow overflow-hidden rounded-full bg-muted",
            isVertical ? "h-full w-1.5" : "h-1.5 w-full",
          )}
        >

          <View
            className={cn(
              "absolute bg-primary",
              isVertical ? "w-full" : "h-full",
            )}
            style={
              isVertical
                ? {
                    bottom: `${pctOf(first)}%`,
                    height: `${Math.max(0, pctOf(last) - pctOf(first))}%`,
                  }
                : {
                    left: `${pctOf(first)}%`,
                    width: `${Math.max(0, pctOf(last) - pctOf(first))}%`,
                  }
            }
          />
        </View>

        {values.map((v, index) => (
          <View
            key={index}
            focusable={!disabled}
            accessibilityRole="slider"
            accessibilityLabel={accessibilityLabel}
            aria-valuenow={v}
            aria-valuemin={min}
            aria-valuemax={max}
            onKeyDown={handleThumbKeyDown(index)}
            className={cn(

              "absolute size-4 rounded-full border border-primary bg-white web:ring-ring/50 web:hover:ring-4 web:focus-visible:outline-none web:focus-visible:ring-4",
              isVertical ? "left-1/2 -mb-2 -ml-2" : "top-1/2 -mt-2 -ml-2",
              dragging &&
                index === (activeIndex ?? activeRef.current) &&
                "web:ring-4",
            )}
            style={
              isVertical
                ? { bottom: `${pctOf(v)}%` }
                : { left: `${pctOf(v)}%` }
            }
          />
        ))}
      </View>
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
