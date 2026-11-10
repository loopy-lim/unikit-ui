// MessageScroller — shadcn/ui（new-york-v4） message-scroller.tsx 유니버설 포팅
// （사이클 40, T-3d）. 원본: shadcn-ref/ui/message-scroller.tsx
//
// 포팅 판단（원본 대비 차이이유）:
// - 원본은 헤드리스 엔진 "@shadcn/react/message-scroller"（Provider/Root/
//   Viewport/Content/Item/Button + 훅 3종）을 감싼 얇은 스타일 층이다. 본
//   포팅은 엔진 없이 브리지 ScrollView를 직접 소비해 재구성했다（설계 확정）.
// - Viewport = 브리지 ScrollView. ref.scrollTo로 시작/끝 이동을 재현 —
//   "끝"은 매우 큰 y（1e9） 지정으로 양쪽 모두 끝까지 클램프되는 동작을 쓴다.
// - 자동 하단 이동: Viewport가 children 수（React.Children.count） 변화를
//   감지해 Provider의 stickToEnd가 true면 끝으로 scrollTo한다（최초 마운트는
//   비애니메이션）. 원본의 "끝 근처 여부" 판단은 onScroll 계약이 무인자라
//   스크롤 오프셋을 읽을 수 없어 재현 불가 — 소비자가 setStickToEnd（false）로
//   끊는 구조로 순화했다（한계）.
// - useMessageScrollerVisibility의 자동 가시성 계산도 같은 계약 한계로
//   불가 — { atStart, atEnd, setVisibility }를 노출해 소비자가 onScroll에서
//   판단갱신하는 구조로 순화. 기본값은 채팅 관례（맨 아래） atEnd=true.
// - useMessageScrollerScrollable（콘텐츠가 뷰포트보다 큰지）은 콘텐츠 크기
//   측정 계약이 없어 항상 true를 반환하는 스텝이다（원본 API 유지）.
// - MessageScrollerButton: lucide 아이콘 대신 "↓"/"↑" 글리프 문자 기본값,
//   sr-only 대신 accessibilityLabel 사용. 원본 icon-sm 사이즈render prop은
//   없어 Button（secondary） + size-8 토큰으로 근사. 커스텀 이징（임의값）은
//   제거 — 표준 transition만（네이티브은 즉시 전환）.
// - MessageScrollerItem의 scrollAnchorcontent-visibility（임의값성능
//   최적화）은 계약 밖이라 제거 — 순수 레이아웃 토큰만 유지.
// - scroll-fade-bscrollbar-thin 등 커스텀 유틸과 data-autoscrolling:*
//   셀렉터는 정의가 없어 제거. overscroll-contain은 웹 전용 → web: 접두.
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
  ScrollView,
  View,
  type BridgePressableRef,
  type BridgeScrollViewRef,
  type BridgeViewRef,
  type ScrollViewProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";

/** scrollTo "끝" 근사 — 양 플랫폼 모두 콘텐츠 끝까지 클램프되는 충분히 큰 값 */
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

// Provider가 제공하는 상태 — 스크롤 제어의 단일 출처（원본 헤드리스 엔진 대리）.
type MessageScrollerContextValue = {
  scrollTo: (options: MessageScrollerScrollOptions) => void;
  scrollToStart: (animated?: boolean) => void;
  scrollToEnd: (animated?: boolean) => void;
  /** 끝 고정（새 항목이 오면 자동 하단 이동） — 소비자가 onScroll 판단으로 제어 */
  stickToEnd: boolean;
  setStickToEnd: (value: boolean) => void;
  atStart: boolean;
  atEnd: boolean;
  /** 가시성（시작/끝 버튼 표시 판단） 갱신 — 계약상 자동 계산 불가 */
  setVisibility: (visibility: Partial<MessageScrollerVisibilityValue>) => void;
  /** Viewport가 자신의 스크롤 ref를 등록하는 통로 */
  registerViewport: (ref: BridgeScrollViewRef | null) => void;
};

// Provider 없이 사용했을 때의 안전 폴백（모두 no-op）.
const NOOP_SCROLLER: MessageScrollerContextValue = {
  scrollTo: () => {},
  scrollToStart: () => {},
  scrollToEnd: () => {},
  stickToEnd: true,
  setStickToEnd: () => {},
  atStart: false,
  atEnd: true,
  setVisibility: () => {},
  registerViewport: () => {},
};

const MessageScrollerContext =
  createContext<MessageScrollerContextValue>(NOOP_SCROLLER);

// ---------------------------------------------------------------------------
// MessageScrollerProvider — 스크롤 상태 제공자（원본 Primitive.Provider 대리）.
// 원본은 props 통과형이었으나 엔진이 없어 상태를 직접 소유한다.
// ---------------------------------------------------------------------------
export type MessageScrollerProviderProps = {
  children?: ReactNode;
};

function MessageScrollerProvider({ children }: MessageScrollerProviderProps) {
  const viewportRef = useRef<BridgeScrollViewRef | null>(null);
  const [stickToEnd, setStickToEnd] = useState(true);
  // 기본값은 채팅 관례 — 맨 아래에서 시작（끝 버튼 숨김）.
  const [visibility, setVisibilityState] = useState<MessageScrollerVisibilityValue>(
    { atStart: false, atEnd: true },
  );
  const value = useMemo<MessageScrollerContextValue>(
    () => ({
      scrollTo: (options) => viewportRef.current?.scrollTo(options),
      scrollToStart: (animated = true) =>
        viewportRef.current?.scrollTo({ y: 0, animated }),
      scrollToEnd: (animated = true) =>
        viewportRef.current?.scrollTo({ y: SCROLL_END_OFFSET, animated }),
      stickToEnd,
      setStickToEnd,
      atStart: visibility.atStart,
      atEnd: visibility.atEnd,
      setVisibility: (next) =>
        setVisibilityState((prev) => ({ ...prev, ...next })),
      registerViewport: (ref) => {
        viewportRef.current = ref;
      },
    }),
    [stickToEnd, visibility],
  );
  return (
    <MessageScrollerContext.Provider value={value}>
      {children}
    </MessageScrollerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// MessageScroller — 루트 컨테이너（버튼 오버레이의 배경이 되는 상대 배치）.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// MessageScrollerViewport — 브리지 ScrollView 직접 소비. children 수 변화에
// 따른 자동 하단 이동（stickToEnd）을 여기서 수행한다.
// ---------------------------------------------------------------------------
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
    // 소비자 ref와 Provider 등록을 한 콜백 ref로 병렬 연결한다.
    const setViewport = useCallback(
      (node: BridgeScrollViewRef | null) => {
        scroller.registerViewport(node);
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          // React 18의 readonly RefObject.current를 쓰기 위해 구조 캐스팅.
          (ref as { current: BridgeScrollViewRef | null }).current = node;
        }
      },
      [scroller, ref],
    );
    // children 수 변화 = 새 메시지 도착으로 간주（원본 오프셋 판단의 근사）.
    const childCount = Children.count(children);
    const didMountRef = useRef(false);
    useEffect(() => {
      if (scroller.stickToEnd) {
        // 최초 마운트는 점프, 이후 도착은 부드럽게（원본 자동 스크롤 동작）.
        scroller.scrollToEnd(!didMountRef.current);
      }
      didMountRef.current = true;
      // scroller 함수들은 viewportRef.current를 읽으므로 최신 상태를 참조한다.
    }, [childCount, scroller.stickToEnd]); // eslint-disable-line react-hooks/exhaustive-deps
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
        onScroll={onScroll}
        {...props}
      >
        {children}
      </ScrollView>
    );
  },
);
MessageScrollerViewport.displayName = "MessageScrollerViewport";

// ---------------------------------------------------------------------------
// MessageScrollerContent — 메시지 목록 본문（간격은 gap-8, 원본 토큰）.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// MessageScrollerItem — 개별 항목（원본 scrollAnchorcontent-visibility 제거）.
// ---------------------------------------------------------------------------
export type MessageScrollerItemProps = ViewProps;

const MessageScrollerItem = forwardRef<BridgeViewRef, MessageScrollerItemProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("min-w-0 shrink-0", className)} {...props} />
  ),
);
MessageScrollerItem.displayName = "MessageScrollerItem";

// ---------------------------------------------------------------------------
// MessageScrollerButton — 시작/끝 이동 버튼. 표시 여부는 context 가시성
// （atEnd/atStart） 또는 소비자 active prop으로 제어한다.
// ---------------------------------------------------------------------------
export type MessageScrollerButtonProps = ButtonProps & {
  direction?: "start" | "end";
  /** 표시 여부 수동 제어 — 생략 시 context 가시성으로 산출 */
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
          "absolute left-1/2 size-8 -translate-x-1/2 p-0 web:transition-opacity web:duration-200 web:rtl:translate-x-1/2",
          direction === "end" ? "bottom-4" : "top-4",
          isVisible
            ? "web:opacity-100"
            : "pointer-events-none web:scale-95 web:opacity-0",
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
        {children ?? (direction === "end" ? "↓" : "↑")}
      </Button>
    );
  },
);
MessageScrollerButton.displayName = "MessageScrollerButton";

// ---------------------------------------------------------------------------
// 훅 3종 — 원본 export명 유지（하단 export 블록에서 재export）.
// ---------------------------------------------------------------------------
/** 스크롤 제어 접근（scrollTo/scrollToStart/scrollToEnd끝 고정 상태） */
function useMessageScroller(): MessageScrollerContextValue {
  return useContext(MessageScrollerContext);
}

/**
 * 콘텐츠가 뷰포트보다 큰지（스크롤 가능한지）. 브리지 onScroll 계약이
 * 무인자라 콘텐츠 크기를 측정할 수 없어 항상 true를 반환한다（스텁 —
 * 원본 API 유지, 실제 판단은 소비자 몫）.
 */
function useMessageScrollerScrollable(): boolean {
  return true;
}

/** 시작/끝 가시성 — 소비자가 onScroll에서 판단해 setVisibility로 갱신한다. */
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
