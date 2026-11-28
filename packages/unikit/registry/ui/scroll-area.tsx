import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Platform,
  ScrollView,
  View,
  type BridgeScrollEvent,
  type BridgeScrollViewRef,
  type BridgeViewRef,
  type ScrollViewProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";

type ScrollAreaContextValue = {
  subscribe: (listener: (event: BridgeScrollEvent) => void) => () => void;
};

const ScrollAreaContext = createContext<ScrollAreaContextValue | null>(null);

export type ScrollAreaProps = ScrollViewProps;

const ScrollArea = forwardRef<BridgeScrollViewRef, ScrollAreaProps>(
  ({ className, style, children, onScroll, ...props }, ref) => {
    const listenersRef = useRef(
      new Set<(event: BridgeScrollEvent) => void>(),
    );

    const handleScroll = useCallback(
      (event: BridgeScrollEvent) => {
        for (const listener of listenersRef.current) listener(event);
        onScroll?.(event);
      },
      [onScroll],
    );
    const contextValue = useMemo<ScrollAreaContextValue>(
      () => ({
        subscribe: (listener) => {
          listenersRef.current.add(listener);
          return () => {
            listenersRef.current.delete(listener);
          };
        },
      }),
      [],
    );
    const isWeb = Platform.OS === "web";

    const isScrollBar = (child: ReactNode) =>
      isValidElement(child) && child.type === ScrollBar;
    const items = Children.toArray(children);
    const bars = items.filter(isScrollBar);
    const content = items.filter((child) => !isScrollBar(child));

    const hasOwnVerticalBar = bars.some(
      (bar) =>
        isValidElement(bar) &&
        ((bar as ReactElement<{ orientation?: string }>).props.orientation ??
          "vertical") === "vertical",
    );
    return (
      <ScrollAreaContext.Provider value={contextValue}>
        <View
          className={cn("relative flex flex-col overflow-hidden", className)}
          style={style}
        >
          {

                                                             }
          <ScrollView
            ref={ref}
            className="w-full flex-1 min-h-0"

            style={isWeb ? { scrollbarWidth: "none" } : undefined}
            onScroll={handleScroll}
            {...props}
          >
            {content}
          </ScrollView>
          {

                                             }
          {isWeb && !hasOwnVerticalBar && <ScrollBar orientation="vertical" />}
          {bars}
        </View>
      </ScrollAreaContext.Provider>
    );
  },
);
ScrollArea.displayName = "ScrollArea";

export type ScrollBarProps = ViewProps & {

  orientation?: "vertical" | "horizontal";
};

const ScrollBar = forwardRef<BridgeViewRef, ScrollBarProps>(
  ({ className, orientation = "vertical", ...props }, ref) => {
    const area = useContext(ScrollAreaContext);
    const [event, setEvent] = useState<BridgeScrollEvent | null>(null);
    useEffect(() => {
      if (!area) return;
      return area.subscribe(setEvent);
    }, [area]);

    if (!area || Platform.OS !== "web") return null;

    const axis = orientation === "vertical" ? "y" : "x";
    const offset = event?.contentOffset[axis] ?? 0;
    const contentSize =
      orientation === "vertical"
        ? (event?.contentSize.height ?? 0)
        : (event?.contentSize.width ?? 0);
    const viewportSize =
      orientation === "vertical"
        ? (event?.layoutMeasurement.height ?? 0)
        : (event?.layoutMeasurement.width ?? 0);
    const scrollable = contentSize - viewportSize > 1;
    const length = scrollable && contentSize > 0
      ? (viewportSize / contentSize) * 100
      : 0;
    const rawPosition =
      scrollable && contentSize > 0 ? (offset / contentSize) * 100 : 0;
    const position = Math.min(Math.max(rawPosition, 0), 100 - length);
    return (
      <View
        ref={ref}
        aria-hidden
        pointerEvents="none"
        className={cn(

          "absolute touch-none p-px web:select-none",
          orientation === "vertical"
            ? "top-0 bottom-0 right-0 w-2.5 border-l border-l-transparent"
            : "left-0 right-0 bottom-0 h-2.5 border-t border-t-transparent",
          className,
        )}
        {...props}
      >
        {
                                               }
        <View
          className="absolute rounded-full bg-border"
          style={
            orientation === "vertical"
              ? { top: `${position}%`, height: `${length}%`, left: 1, right: 1 }
              : { left: `${position}%`, width: `${length}%`, top: 1, bottom: 1 }
          }
        />
      </View>
    );
  },
);
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
