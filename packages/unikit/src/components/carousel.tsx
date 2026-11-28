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
  type MutableRefObject,
} from "react";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ScrollView,
  View,
  measureInWindow,
  type BridgePressableRef,
  type BridgeScrollEvent,
  type BridgeScrollViewRef,
  type BridgeViewRef,
  type ScrollViewProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { Button, type ButtonProps } from "./button";
import { cn } from "../lib/utils";

export type CarouselApi = {
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

type CarouselContextValue = {
  orientation: "horizontal" | "vertical";

  carouselRef: MutableRefObject<BridgeScrollViewRef | null>;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;

  reportItemCount: (count: number) => void;

  handleScroll: (event: BridgeScrollEvent) => void;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarousel(): CarouselContextValue {
  const ctx = useContext(CarouselContext);
  if (!ctx) {
    throw new Error("useCarousel은 <Carousel> 안에서 사용해야 합니다.");
  }
  return ctx;
}

export type CarouselProps = ViewProps & {
  orientation?: "horizontal" | "vertical";

  setApi?: (api: CarouselApi) => void;
};

const Carousel = forwardRef<BridgeViewRef, CarouselProps>(
  (
    { orientation = "horizontal", setApi, className, children, ...props },
    forwardedRef,
  ) => {
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const carouselRef = useRef<BridgeScrollViewRef | null>(null);

    const rootRef = useRef<BridgeViewRef | null>(null);

    const offsetRef = useRef(0);
    const viewportRef = useRef(0);
    const countRef = useRef(0);

    const setRef = (element: BridgeViewRef | null) => {
      rootRef.current = element;
      if (typeof forwardedRef === "function") forwardedRef(element);
      else if (forwardedRef) forwardedRef.current = element;
    };

    const reportItemCount = useCallback((count: number) => {
      countRef.current = count;
      setCanScrollPrev(offsetRef.current > 2);
      setCanScrollNext(
        count > 1 &&
          (viewportRef.current <= 0 ||
            offsetRef.current < (count - 1) * viewportRef.current - 2),
      );
    }, []);

    const handleScroll = useCallback(
      (event: BridgeScrollEvent) => {
        const offset =
          orientation === "horizontal"
            ? event.contentOffset.x
            : event.contentOffset.y;
        const viewport =
          orientation === "horizontal"
            ? event.layoutMeasurement.width
            : event.layoutMeasurement.height;
        const total =
          orientation === "horizontal"
            ? event.contentSize.width
            : event.contentSize.height;
        if (viewport > 0) viewportRef.current = viewport;
        offsetRef.current = offset;
        const maxOffset = Math.max(
          total - viewport,
          (countRef.current - 1) * (viewport || 1),
          0,
        );
        setCanScrollPrev(offset > 2);
        setCanScrollNext(offset < maxOffset - 2);
      },
      [orientation],
    );

    const scrollBy = useCallback(
      (direction: 1 | -1) => {
        const el = rootRef.current;
        if (!el) return;
        measureInWindow(el, (_x, _y, width, height) => {
          const viewport =
            orientation === "horizontal" ? width : height;
          if (viewport <= 0) return;
          viewportRef.current = viewport;

          const max = Math.max((countRef.current - 1) * viewport, 0);
          const next = Math.min(
            Math.max(offsetRef.current + direction * viewport, 0),
            max,
          );
          offsetRef.current = next;
          if (orientation === "horizontal") {
            carouselRef.current?.scrollTo({ x: next, animated: true });
          } else {
            carouselRef.current?.scrollTo({ y: next, animated: true });
          }
          setCanScrollPrev(next > 0);
          setCanScrollNext(next < max);
        });
      },
      [orientation],
    );

    const scrollPrev = useCallback(() => scrollBy(-1), [scrollBy]);
    const scrollNext = useCallback(() => scrollBy(1), [scrollBy]);

    const handleKeyDown = useCallback(
      (event: { key: string; preventDefault: () => void }) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    useEffect(() => {
      if (!setApi) return;
      setApi({ scrollPrev, scrollNext, canScrollPrev, canScrollNext });
    }, [setApi, scrollPrev, scrollNext, canScrollPrev, canScrollNext]);

    const contextValue = useMemo(
      () => ({
        orientation,
        carouselRef,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        reportItemCount,
        handleScroll,
      }),
      [
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        reportItemCount,
        handleScroll,
      ],
    );

    return (
      <CarouselContext.Provider value={contextValue}>
        <View
          ref={setRef}
          accessibilityLabel="carousel"
          className={cn("relative", className)}
          {...props}
          {...({ onKeyDown: handleKeyDown } as ViewProps)}
        >
          {children}
        </View>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

export type CarouselContentProps = ScrollViewProps;

const CarouselContent = forwardRef<BridgeScrollViewRef, CarouselContentProps>(
  ({ className, children, onScroll, ...props }, ref) => {
    const { carouselRef, orientation, reportItemCount, handleScroll } = useCarousel();

    useEffect(() => {
      reportItemCount(Children.count(children));
    }, [children, reportItemCount]);

    const setRef = (element: BridgeScrollViewRef | null) => {
      carouselRef.current = element;
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    };

    return (
      <ScrollView
        ref={setRef}
        horizontal={orientation === "horizontal"}
        pagingEnabled
        onScroll={(event) => {
          handleScroll(event);
          onScroll?.(event);
        }}

        className={cn("relative", className)}
        contentContainerClassName={
          orientation === "horizontal" ? "flex-row -ml-4" : "flex-col -mt-4"
        }
        {...props}
      >
        {children}
      </ScrollView>
    );
  },
);
CarouselContent.displayName = "CarouselContent";

export type CarouselItemProps = ViewProps;

const CarouselItem = forwardRef<BridgeViewRef, CarouselItemProps>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();
    return (
      <View
        ref={ref}
        accessibilityLabel="slide"
        className={cn(
          "min-w-0 shrink-0 grow-0 basis-full web:snap-start",
          orientation === "horizontal" ? "pl-4" : "pt-4",
          className,
        )}
        {...props}
      />
    );
  },
);
CarouselItem.displayName = "CarouselItem";

export type CarouselPreviousProps = ButtonProps;

const CarouselPrevious = forwardRef<BridgePressableRef, CarouselPreviousProps>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        accessibilityLabel="Previous slide"
        disabled={!canScrollPrev}
        onPress={scrollPrev}
        className={cn(
          "absolute size-8 rounded-full",
          orientation === "horizontal"
            ? "top-1/2 -left-12 -translate-y-1/2"
            : "-top-12 left-1/2 -translate-x-1/2",
          className,
        )}
        {...props}
      >
        {orientation === "horizontal" ? (
          <ArrowLeftIcon className="size-4" />
        ) : (
          <ArrowUpIcon className="size-4" />
        )}
      </Button>
    );
  },
);
CarouselPrevious.displayName = "CarouselPrevious";

export type CarouselNextProps = ButtonProps;

const CarouselNext = forwardRef<BridgePressableRef, CarouselNextProps>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        accessibilityLabel="Next slide"
        disabled={!canScrollNext}
        onPress={scrollNext}
        className={cn(
          "absolute size-8 rounded-full",
          orientation === "horizontal"
            ? "top-1/2 -right-12 -translate-y-1/2"
            : "-bottom-12 left-1/2 -translate-x-1/2",
          className,
        )}
        {...props}
      >
        {orientation === "horizontal" ? (
          <ArrowRightIcon className="size-4" />
        ) : (
          <ArrowDownIcon className="size-4" />
        )}
      </Button>
    );
  },
);
CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
