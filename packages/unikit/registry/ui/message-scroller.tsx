import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ScrollView,
  View,
  type BridgePressableRef,
  type BridgeScrollEvent,
  type BridgeScrollViewRef,
  type BridgeViewRef,
  type ScrollViewProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

const SCROLL_END_OFFSET = 1_000_000_000;

export type MessageScrollerScrollOptions = {
  x?: number;
  y?: number;
  animated?: boolean;
};

export type MessageScrollerVisibilityValue = {
  atStart: boolean;
  atEnd: boolean;
};

type MessageScrollerContextValue = {
  scrollTo: (options: MessageScrollerScrollOptions) => void;
  scrollToStart: (animated?: boolean) => void;
  scrollToEnd: (animated?: boolean) => void;

  stickToEnd: boolean;
  setStickToEnd: (value: boolean) => void;
  atStart: boolean;
  atEnd: boolean;
  scrollable: boolean;
  setScrollable: (value: boolean) => void;

  setVisibility: (visibility: Partial<MessageScrollerVisibilityValue>) => void;

  registerViewport: (ref: BridgeScrollViewRef | null) => void;
};

const NOOP_SCROLLER: MessageScrollerContextValue = {
  scrollTo: () => {},
  scrollToStart: () => {},
  scrollToEnd: () => {},
  stickToEnd: true,
  setStickToEnd: () => {},
  atStart: false,
  atEnd: true,
  scrollable: true,
  setScrollable: () => {},
  setVisibility: () => {},
  registerViewport: () => {},
};

const MessageScrollerContext =
  createContext<MessageScrollerContextValue>(NOOP_SCROLLER);

export type MessageScrollerProviderProps = {
  children?: ReactNode;
};

function MessageScrollerProvider({ children }: MessageScrollerProviderProps) {
  const viewportRef = useRef<BridgeScrollViewRef | null>(null);
  const [stickToEnd, setStickToEnd] = useState(true);
  const [scrollable, setScrollable] = useState(false);

  const [visibility, setVisibilityState] = useState<MessageScrollerVisibilityValue>(
    { atStart: false, atEnd: true },
  );
  const setVisibility = useCallback(
    (next: Partial<MessageScrollerVisibilityValue>) => {
      setVisibilityState((prev) => {
        const atStart = next.atStart ?? prev.atStart;
        const atEnd = next.atEnd ?? prev.atEnd;
        return prev.atStart === atStart && prev.atEnd === atEnd
          ? prev
          : { atStart, atEnd };
      });
    },
    [],
  );
  const registerViewport = useCallback((ref: BridgeScrollViewRef | null) => {
    viewportRef.current = ref;
  }, []);
  const value = useMemo<MessageScrollerContextValue>(
    () => ({
      scrollTo: (options) => viewportRef.current?.scrollTo(options),
      scrollToStart: (animated = true) => {
        setStickToEnd(false);
        viewportRef.current?.scrollTo({ y: 0, animated });
      },
      scrollToEnd: (animated = true) => {
        setStickToEnd(true);
        viewportRef.current?.scrollTo({ y: SCROLL_END_OFFSET, animated });
      },
      stickToEnd,
      setStickToEnd,
      atStart: visibility.atStart,
      atEnd: visibility.atEnd,
      scrollable,
      setScrollable,
      setVisibility,
      registerViewport,
    }),
    [stickToEnd, visibility, scrollable, setVisibility, registerViewport],
  );
  return (
    <MessageScrollerContext.Provider value={value}>
      {children}
    </MessageScrollerContext.Provider>
  );
}

export type MessageScrollerProps = ViewProps;

const MessageScroller = forwardRef<BridgeViewRef, MessageScrollerProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "relative flex size-full min-h-0 flex-col overflow-hidden",
        className,
      )}
      {...props}
    />
  ),
);
MessageScroller.displayName = "MessageScroller";

export type MessageScrollerViewportProps = ScrollViewProps;

const MessageScrollerViewport = forwardRef<
  BridgeScrollViewRef,
  MessageScrollerViewportProps
>(
  (
    {
      className,
      contentContainerClassName,
      onScroll,
      children,
      ...props
    },
    ref,
  ) => {
    const scroller = useContext(MessageScrollerContext);

    const setViewport = useCallback(
      (node: BridgeScrollViewRef | null) => {
        scroller.registerViewport(node);
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {

          (ref as { current: BridgeScrollViewRef | null }).current = node;
        }
      },
      [scroller, ref],
    );

    const childCount = Children.count(children);
    const didMountRef = useRef(false);
    useEffect(() => {
      if (scroller.stickToEnd) {

        scroller.scrollToEnd(didMountRef.current);
      }
      didMountRef.current = true;

    }, [childCount, scroller.stickToEnd]);

    const handleScroll = (event: BridgeScrollEvent) => {
      const { contentOffset, contentSize, layoutMeasurement } = event;
      const isScrollable = contentSize.height > layoutMeasurement.height + 1;
      const atStart = contentOffset.y <= 16;
      const atEnd =
        !isScrollable ||
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 24;
      scroller.setScrollable(isScrollable);
      scroller.setVisibility({ atStart, atEnd });
      scroller.setStickToEnd(atEnd);
      onScroll?.(event);
    };

    return (
      <ScrollView
        ref={setViewport}
        className={cn(
          "size-full min-h-0 min-w-0 web:overscroll-contain web:contain-content",
          className,
        )}
        contentContainerClassName={cn(
          "min-h-full",
          contentContainerClassName,
        )}
        onScroll={handleScroll}
        {...props}
      >
        {children}
      </ScrollView>
    );
  },
);
MessageScrollerViewport.displayName = "MessageScrollerViewport";

export type MessageScrollerContentProps = ViewProps;

const MessageScrollerContent = forwardRef<
  BridgeViewRef,
  MessageScrollerContentProps
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("flex min-h-full flex-col gap-8 web:h-max", className)}
    {...props}
  />
));
MessageScrollerContent.displayName = "MessageScrollerContent";

export type MessageScrollerItemProps = ViewProps;

const MessageScrollerItem = forwardRef<BridgeViewRef, MessageScrollerItemProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("min-w-0 shrink-0", className)} {...props} />
  ),
);
MessageScrollerItem.displayName = "MessageScrollerItem";

export type MessageScrollerButtonProps = ButtonProps & {
  direction?: "start" | "end";

  active?: boolean;
};

const MessageScrollerButton = forwardRef<
  BridgePressableRef,
  MessageScrollerButtonProps
>(
  (
    {
      className,
      direction = "end",
      active,
      onPress,
      accessibilityLabel,
      children,
      ...props
    },
    ref,
  ) => {
    const scroller = useContext(MessageScrollerContext);
    const isVisible =
      active ?? (direction === "end" ? !scroller.atEnd : !scroller.atStart);
    return (
      <Button
        ref={ref}
        variant="secondary"
        accessibilityLabel={
          accessibilityLabel ??
          (direction === "end" ? "맨 아래로 스크롤" : "맨 위로 스크롤")
        }
        className={cn(
          "absolute left-1/2 size-8 -translate-x-1/2 p-0 transition-all duration-200 web:rtl:translate-x-1/2",
          direction === "end" ? "bottom-4" : "top-4",
          isVisible
            ? "opacity-100"
            : "pointer-events-none scale-95 opacity-0",
          className,
        )}
        onPress={() => {
          onPress?.();
          if (direction === "end") {
            scroller.scrollToEnd();
          } else {
            scroller.scrollToStart();
          }
        }}
        {...props}
      >
        {children ??
          (direction === "end" ? (
            <ArrowDownIcon className="size-4" />
          ) : (
            <ArrowUpIcon className="size-4" />
          ))}
      </Button>
    );
  },
);
MessageScrollerButton.displayName = "MessageScrollerButton";

function useMessageScroller(): MessageScrollerContextValue {
  return useContext(MessageScrollerContext);
}

function useMessageScrollerScrollable(): boolean {
  return useContext(MessageScrollerContext).scrollable;
}

function useMessageScrollerVisibility(): MessageScrollerVisibilityValue & {
  setVisibility: MessageScrollerContextValue["setVisibility"];
} {
  const { atStart, atEnd, setVisibility } = useContext(MessageScrollerContext);
  return { atStart, atEnd, setVisibility };
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
};
