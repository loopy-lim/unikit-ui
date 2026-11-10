// Carousel — shadcn/ui（new-york-v4） carousel.tsx 유니버설 포팅 （사이클 40, T-3b）.
// 원본: shadcn-ref/ui/carousel.tsx
//
// 포팅 판단（원본 대비 차이이유）:
// - embla-carousel-react 제거 — 스크롤 축은 브리지 ScrollView 프리미티브를 직접
//   소비한다（웹 overflow div + ref.scrollTo smooth / 네이티브 RN ScrollView
//   horizontal + pagingEnabled）. CarouselContent가 ScrollView（뷰포트）를 렌더하고
//   CarouselItem이 그 직계 자식이 된다（원본 이중 div 구조와 동일 역할）.
// - 이전/다음 이동: embla api 대신 ScrollView ref.scrollTo（{x|y, animated}）로
//   절대 오프셋 이동. 스텝 폭은 "스크롤 뷰포트 폭（또는 높이） = 한 슬라이드"
//   근사（basis-full 기본 전제） — 루트 View를 measureInWindow로 측정한다.
//   콘텐츠 폭 상한은 CarouselContent가 보고한 항목 수 × 스텝으로 근사한다.
//   사용자가 CarouselItem에 basis-1/2 등 반응형 폭을 주면 실제 슬라이드 폭과
//   어긋나는 한계（계약상 스크롤 오프셋콘텐츠 폭 읽기 불가 — 판단 기록）.
// - canScrollPrev/next: 자체 추적 오프셋 기준 계산. onScroll이 무인자 계약이라
//   직접 스와이프 후 버튼 press 시 목표 오프셋이 실제와 어긋나 점프할 수
//   있다（한계 — 스크롤 오프셋 읽기 계약 부재, 브리지 확장 제안은 보고서 참조）.
// - optspluginssetApi: embla 전용 프로퍼티는 제거. setApi는 근사 api
//   （{ scrollPrev, scrollNext, canScrollPrev, canScrollNext }）를 전달하는
//   형태로만 유지한다（CarouselApi 타입도 이 근사 형태로 재정의）.
// - 키보드 탐색: 원본은 루트 div onKeyDownCapture로 Arrow 좌우를 잡는다.
//   ViewProps에 onKeyDown 계약이 없어 캐스팅 전개（drawer dragHandlers 관행）로
//   웹 div에만 도달시키고 네이티브에서는 no-op다. ArrowUp/Down（세로）Home/End
//   등은 미지원.
// - lucide ArrowLeft/ArrowRight → ←/→ 글리프（수평）, 세로 orientation은 원본의
//   rotate-90 토큰 대신 ↑/↓ 글리프 교체로 근사（텍스트 회전은 플랫폼 편차）.
//   sr-only 라벨은 accessibilityLabel로 대체（dialogsheet 관행）. 원본
//   role="region"aria-roledescription（carousel/slide）은 BridgeRole에 해당
//   역할이 없어 accessibilityLabel（"carousel"/"slide"）로만 근사한다.
// - 원본 -ml-4/pl-4（수평）-mt-4/pt-4（수직） 간격 토큰은 유지 — 음수 마진은
//   contentContainerClassName（ScrollView 내부 컨테이너）에, 패딩은 Item에 둔다.
// - 스냅: pagingEnabled（웹 scroll-snap / RN pagingEnabled） + Item web:snap-start.
//   웹 snap-smooth와 scrollTo smooth가 공존해 최종 위치는 스냅 포인트로 수렴.
// - translate-y-1/2-left-12 등 위치 토큰은 원본 유지（uniwind transform 지원은
//   미보증 — 네이티브에서 버튼이 캐러셀 밖에 그려지는 근사 동작）.
import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
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
  type BridgeScrollViewRef,
  type BridgeViewRef,
  type ScrollViewProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { Button, type ButtonProps } from "./button";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// 컨텍스트 — 원본 useCarousel과 동일한 소비 API
// ---------------------------------------------------------------------------

/** 근사 api — 원본（embla api）과 달리 우리 구현이 노출하는 조작만 담는다. */
export type CarouselApi = {
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

type CarouselContextValue = {
  orientation: "horizontal" | "vertical";
  /** CarouselContent의 ScrollView ref — Previous/Next가 scrollTo로 소비 */
  carouselRef: MutableRefObject<BridgeScrollViewRef | null>;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  /** CarouselContent가 항목 수를 보고（이동 상한 근사용） */
  reportItemCount: (count: number) => void;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarousel(): CarouselContextValue {
  const ctx = useContext(CarouselContext);
  if (!ctx) {
    throw new Error("useCarousel은 <Carousel> 안에서 사용해야 합니다.");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Carousel 루트
// ---------------------------------------------------------------------------

export type CarouselProps = ViewProps & {
  orientation?: "horizontal" | "vertical";
  /** 근사 api를 상위로 올려주는 콜백（원본 setApi의 축소 형태） */
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
    // 루트 ref — 뷰포트 폭/높이 측정용（measureInWindow은 요소를 받는다）.
    const rootRef = useRef<BridgeViewRef | null>(null);
    // 버튼 이동의 목표 절대 오프셋 추적（실제 스크롤 오프셋 읽기 계약 부재）.
    const offsetRef = useRef(0);
    const countRef = useRef(0);

    const setRef = (element: BridgeViewRef | null) => {
      rootRef.current = element;
      if (typeof forwardedRef === "function") forwardedRef(element);
      else if (forwardedRef) forwardedRef.current = element;
    };

    const reportItemCount = useCallback((count: number) => {
      countRef.current = count;
    }, []);

    // 방향 이동 — 뷰포트 크기 측정 후 절대 오프셋 scrollTo.
    const scrollBy = useCallback(
      (direction: 1 | -1) => {
        const el = rootRef.current;
        if (!el) return;
        measureInWindow(el, (_x, _y, width, height) => {
          const viewport =
            orientation === "horizontal" ? width : height;
          if (viewport <= 0) return;
          // 콘텐츠 폭 근사: 항목 수 × 뷰포트（basis-full 전제） — 끝 슬라이드가
          // 보이는 지점을 상한으로 쓴다.
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

    // 원본과 동일한 ArrowLeft/Right 캡처 — ViewProps에 onKeyDown 계약이 없어
    // 캐스팅 전개로 웹 div에만 도달시킨다（네이티브 no-op）.
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

    return (
      <CarouselContext.Provider
        value={{
          orientation,
          carouselRef,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          reportItemCount,
        }}
      >
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

// ---------------------------------------------------------------------------
// Content — 브리지 ScrollView（가로/세로 축）
// ---------------------------------------------------------------------------

export type CarouselContentProps = ScrollViewProps;

const CarouselContent = forwardRef<BridgeScrollViewRef, CarouselContentProps>(
  ({ className, children, ...props }, ref) => {
    const { carouselRef, orientation, reportItemCount } = useCarousel();

    // 항목 수 보고 — 이동 가능 상한 근사의 근거.
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
        // 교차축 overflow는 브리지 ScrollView가 축 전환 시 스스로 잠근다.
        className={cn("relative", className)}
        contentContainerClassName={
          orientation === "horizontal" ? "flex-row -ml-4" : "flex-col -mt-4"
        }        {...props}
      >
        {children}
      </ScrollView>
    );
  },
);
CarouselContent.displayName = "CarouselContent";

// ---------------------------------------------------------------------------
// Item — 슬라이드（토큰 폭은 원본 값: basis-full, 소비자가 basis-1/2 등으로 오버라이드）
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Previous / Next — Button 재사용 + 글리프
// ---------------------------------------------------------------------------

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
