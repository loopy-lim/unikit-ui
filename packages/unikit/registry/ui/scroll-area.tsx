// ScrollArea — shadcn/ui（new-york-v4） scroll-area.tsx 유니버설 포팅 （사이클 40, T-2b）.
// 원본: shadcn-ref/ui/scroll-area.tsx — radix ScrollArea 엔진을 제거하고 브리지
// ScrollView 프리미티브（웹 overflow div / 네이티브 RN ScrollView, ref.scrollTo）를
// 그대로 소비한다. 수직이 기본이고 horizontal prop으로 가로 축으로 전환한다.
//
// 포팅 판단（원본 대비 차이）:
// - 커스텀 스크롤바 이식（잔여 갭 해소 — 브리지 onScroll 정규화 계약 랜딩 후）:
//   웹에서 원본 ScrollBar 모양（트랙 w-2.5/h-2.5 + p-px, 썸 rounded-full bg-border）을
//   재현한다. 브리지 ScrollView는 웹 overflow div 하나뿐이라 썸을 그 안에 두면
//   콘텐츠와 함께 스크롤되므로（absolute 컨테이너가 곧 스크롤 컨테이너） 원본과
//   같은 구조로 바꾼다 — 래퍼 View（relative — 소비자 className·style 수신, 원본
//   Root）+ 그 안 size-full ScrollView（원본 Viewport）+ 스크롤 영역 밖 형제 절대
//   위치 ScrollBar. 썸 크기·위치는 onScroll의 BridgeScrollEvent（contentOffset·
//   contentSize·layoutMeasurement）로 백분율 계산한다: 길이% = 뷰포트/콘텐츠, 위치%
//   = 오프셋/콘텐츠 — 트랙 px 측정 없이 성립하고（최대 오프셋에서 썸 끝이 트랙 끝에
//   정확히 닿는다） 동적 값은 style 계약으로만 전달한다（임의값 클래스 금지）.
// - 썸 갱신은 구독 모델로 ScrollBar만 다시 그린다 — ScrollArea 트리 전체가 스크롤
//   프레임마다 재렌더되지 않는다. 브리지 계약에 마운트 시 콘텐츠 측정이 없어
//   （contentSize는 onScroll로만 도달） 첫 스크롤 이벤트 전까지 썸이 나타나지
//   않는다（한계 — 로드맵: ResizeObserver 계약）. 썸은 비례 크기만 가진다（원본처럼
//   드래그 조작은 없고 pointerEvents="none" 표시 전용 — 원본 touch-none은 바를
//   통한 스크롤 제스처 차단 토큰이라 표시 전용 바는 통과 처리로 치환）.
// - 웹은 기본 브라우저 스크롤바를 감춘다（원본과 같은 단일 바 시각） — 동적 style
//   scrollbar-width:none（Chrome 121+·Firefox·Safari 18.2+ 지원, 미지원 브라우저는
//   이중 표시 가능）. 네이티브는 RN ScrollView에 인디케이터 스타일 계약이 없다
//   （showsVerticalScrollIndicator 등 표시 여부 boolean뿐 — 색·크기·썸 위치 API 없음）
//   로 OS 기본 인디케이터를 유지하고 커스텀 바를 그리지 않는다（Platform 분기 —
//   select.tsx 관행. 기본 인디케이터를 끄는 것도 하지 않는다: 대체 표시가 없다）.
// - 원본은 ScrollBar orientation으로 가로 축을 표현했지만, 포팅은 브리지 ScrollView
//   관행을 따라 ScrollArea 자체의 horizontal prop으로 전환한다. ScrollBar는 원본
//   호환 orientation prop（세로 기본）을 받고, ScrollArea 직계 자식으로 배치된 것만
//   동작한다 — 타입 동일 자식 감지（select.tsx 관행）로 스크롤 콘텐츠 밖 형제로
//   재배치한다（원본 absolute 배치의 등가물）. ScrollArea는 원본처럼 세로 바 1개를
//   기본 렌더한다（가로 바는 소비자가 자식으로 추가）. 밖에서 단독 사용 시 계측
//   대상이 없어 null을 렌더한다.
// - radix의 Viewport/Corner 내부 구조는 ScrollView 프리미티브가 이미
//   뷰포트+콘텐츠 컨테이너 이중 구조（contentContainerClassName）로 제공한다.
// - 원본 뷰포트의 focus-visible 링은 ScrollView 계약에 포커스 개념이 없어
//   제거했다（스크롤 영역은 포커서블이 아니어도 무방）.
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

// ScrollArea → ScrollBar 측정 전달 — 구독 모델（스크롤 프레임마다 콘텐츠 트리를
// 다시 그리지 않게 ScrollBar만 갱신한다 — 머리 주석）.
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
    // 소비자 onScroll과 썸 구독을 동일 이벤트로 합성 — 계약（BridgeScrollEvent
    // 전달）은 종전과 동일하다.
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
    // 소비자가 배치한 ScrollBar는 스크롤 콘텐츠 밖（래퍼 직계）에서 절대 위치해야
    // 한다 — 타입 동일 감지로 형제로 재배치한다（select.tsx 관행）.
    const isScrollBar = (child: ReactNode) =>
      isValidElement(child) && child.type === ScrollBar;
    const items = Children.toArray(children);
    const bars = items.filter(isScrollBar);
    const content = items.filter((child) => !isScrollBar(child));
    // 소비자가 세로 바를 직접 두었다면 기본 세로 바를 띄우지 않는다(이중 바
    // 방지 — 리뷰 후속. orientation 미지정 기본값 "vertical" 포함 판정).
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
          {/* 루트가 플렉스 열+overflow-hidden이고 뷰포트가 flex-1 min-h-0이라
              max-h-*만 지정된 소비자 배치에서도 확정 높이를 받아 스크롤된다
              (리뷰 후속 — height:100%가 auto 부모에서 무시되던 회귀 방지). */}
          <ScrollView
            ref={ref}
            className="w-full flex-1 min-h-0"
            // 웹은 기본 브라우저 스크롤바를 감추고 커스텀 바만 보여준다（머리 주석）.
            style={isWeb ? { scrollbarWidth: "none" } : undefined}
            onScroll={handleScroll}
            {...props}
          >
            {content}
          </ScrollView>
          {/* 원본처럼 항상 세로 바 1개 — 가로 바는 소비자가 <ScrollBar
              orientation="horizontal" /> 자식으로 추가한다. 네이티브는 렌더하지
              않는다（OS 기본 인디케이터 유지 — 머리 주석）. */}
          {isWeb && !hasOwnVerticalBar && <ScrollBar orientation="vertical" />}
          {bars}
        </View>
      </ScrollAreaContext.Provider>
    );
  },
);
ScrollArea.displayName = "ScrollArea";

export type ScrollBarProps = ViewProps & {
  /** 원본 호환 — 세로 기본, "horizontal"이면 가로 바 */
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
    // 계측 대상 없음（ScrollArea 밖 단독 사용）또는 네이티브 — 렌더하지 않는다.
    if (!area || Platform.OS !== "web") return null;
    // 썸 백분율 — 트랙 px 없이 성립（머리 주석）. 스크롤 불가（콘텐츠≤뷰포트）나
    // 첫 이벤트 전에는 썸이 없다. 오버스크롤（iOS 러버밴드） 대비 양단 클램프.
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
          // 원본 트랙 토큰: touch-none p-px select-none + 세로 h-full w-2.5
          // border-l / 가로 h-2.5 border-t（transparent — 원본 값）. flex·flex-col·
          // transition-colors은 썸이 absolute（색 상태 전환 없음）라 제외했다.
          "absolute touch-none p-px web:select-none",
          orientation === "vertical"
            ? "top-0 bottom-0 right-0 w-2.5 border-l border-l-transparent"
            : "left-0 right-0 bottom-0 h-2.5 border-t border-t-transparent",
          className,
        )}
        {...props}
      >
        {/* 썸 — 원본 rounded-full bg-border. left/right 1px는 원본 p-px의 등가물
            （absolute 자식은 패딩에 매이지 않아 명시 인셋）. */}
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
