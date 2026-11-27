// Collapsible — shadcn/ui（new-york-v4） collapsible.tsx 유니버설 포팅 （사이클 30, T-3b）.
// 원본: shadcn-ref/ui/collapsible.tsx — radix Collapsible을 그대로
// 재노출하는 무스타일 래퍼라 이식 결과에도 스타일 토큰이 없다. radix 의존 제거의
// 가장 단순한 예로, 전개 상태（open）를 React state + context로 직접 관리한다.
// （accordion.tsx가 같은 구조의 다중 항목 확장이다.）
//
// 포팅 판단（원본 대비 차이）:
// - 콘텐츠는 open 시에만 마운트한다（마운트/언마운트 방식）.
// - 높이 접힘 전이（사이클 30 로드맵 해소）: 웹은 브리지 onLayout 계약
//   （ResizeObserver contentRect）로 측정한 콘텐츠 높이를 래퍼 style height로
//   0 ↔ px 전이하고 언마운트를 전이 완료까지 유예한다（presence 패턴）.
//   네이티브는 토글 시점의 animateLayout()（LayoutAnimation）이 전이를 담당하므로
//   측정·유예 없이 즉시 마운트/언마운트를 유지한다 — 플랫폼 분기는 select·
//   menubar 관행（Platform.OS）으로 잡는다. 측정 전용 뷰는 무패딩이어야 contentRect
//   가 패딩까지 포함한 본문 전체 높이가 된다（웹 contentRect는 패딩 제외）.
// - Trigger는 Pressable（웹 button） — 네이티브 Pressable（View 기반）에 문자열
//   children을 직접 두면 RN 런타임이 크래시하므로（"Text strings must be
//   rendered within a <Text> component"） children을 내부 Text로 감싼다（B-1）.
//   문자열 라벨 children 권장（AccordionTrigger와 동일 구조）.
import {
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
  animateLayout,
  Platform,
  Pressable,
  Text,
  View,
  type BridgeLayout,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

type CollapsibleContextValue = {
  open: boolean;
  toggle: () => void;
};

// 높이 접힘 전이 결과 — 웹 presence 렌더에 필요한 최소 계약.
type CollapseTransition = {
  /** 렌더 지속 여부（웹 닫힘 전이 중에도 true） */
  shouldRender: boolean;
  /** 전이 래퍼의 인라인 높이 — 동적 px는 임의값 클래스 대신 style 계약으로.
   *  undefined는 자연 높이(초기 오픈·전이 완료 후 해제) */
  heightStyle: { height: number } | undefined;
  /** 측정 전용 뷰의 onLayout（웹 전용 — 네이티브는 측정하지 않는다） */
  onLayout: ((layout: BridgeLayout) => void) | undefined;
};

// 높이 접힘 전이 지속시간 — web:duration-200 토큰과 같은 값（언마운트 유예 기준）.
const COLLAPSE_TRANSITION_MS = 200;

/**
 * 높이 접힘 전이 훅 — 웹은 측정 높이 0 ↔ px 전이 + 언마운트 유예, 그 외 플랫폼은
 * 즉시 마운트/언마운트（네이티브 animateLayout()가 LayoutAnimation으로 전이）.
 * 웹 prefers-reduced-motion은 마운트 후 판정해 애니메이션 경로를 완전히 우회
 * 한다（SSR 하이드레이션 불일치 방지 — 초기 렌더는 애니메이션 전제와 동일）.
 */
function useCollapseTransition(open: boolean): CollapseTransition {
  const [mounted, setMounted] = useState(open);
  // undefined = 자연 높이(정착 오픈 — SSR 첫 페인트·내용 성장·flex 잔여 반영),
  // 숫자 = 전이 목표 px, 0 = 접힘. 초기 오픈은 애니메이션 없이 자연 높이로
  // 시작한다(하이드레이션 플래시·0px SSR 방지 — 리뷰 후속).
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [reducedMotion, setReducedMotion] = useState(false);
  const measuredRef = useRef<number | null>(null);
  const prevOpenRef = useRef(open);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window.matchMedia !== "function") return;
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || reducedMotion) return;
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (wasOpen === open) return;
    // 빠른 토글 재진입 시 이전 전이의 프레임·타이머를 정리한다(cleanup).
    let raf1 = 0;
    let raf2 = 0;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let unmountTimer: ReturnType<typeof setTimeout> | undefined;
    if (open) {
      setMounted(true);
      setHeight(0);
      // 0이 커밋·페인트된 뒤(이중 rAF) 측정 px로 — 전이 발동.
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          const measured = measuredRef.current;
          if (measured == null) {
            // 측정 전 폴백 — 자연 높이로 즉시 정착(무애니메이션).
            setHeight(undefined);
            return;
          }
          setHeight(measured);
          // 전이 완료 뒤 자연 높이로 해제 — 이후 내용 성장·flex를 추종.
          settleTimer = setTimeout(
            () => setHeight(undefined),
            COLLAPSE_TRANSITION_MS,
          );
        });
      });
    } else {
      // 현재 높이를 px로 고정해 전이 기점을 만들고 다음 페인트 뒤 0으로.
      setHeight(measuredRef.current ?? 0);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setHeight(0));
      });
      // 0 전이가 끝나면 언마운트(presence).
      unmountTimer = setTimeout(
        () => setMounted(false),
        COLLAPSE_TRANSITION_MS,
      );
    }
    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      if (settleTimer !== undefined) clearTimeout(settleTimer);
      if (unmountTimer !== undefined) clearTimeout(unmountTimer);
    };
  }, [open, reducedMotion]);

  if (Platform.OS !== "web" || reducedMotion) {
    return { shouldRender: open, heightStyle: undefined, onLayout: undefined };
  }
  return {
    shouldRender: mounted,
    heightStyle: height === undefined ? undefined : { height },
    onLayout: (layout) => {
      measuredRef.current = layout.height;
    },
  };
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext(component: string): CollapsibleContextValue {
  const ctx = useContext(CollapsibleContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Collapsible> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

export type CollapsibleProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Collapsible = forwardRef<BridgeViewRef, CollapsibleProps>(
  ({ open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
    // 비제어 상태 — 제어（open 지정）면 무시된다.
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open ?? internalOpen;
    const isOpenRef = useRef(isOpen);
    isOpenRef.current = isOpen;
    const toggle = useCallback(() => {
      animateLayout();
      const next = !isOpenRef.current;
      if (open === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    }, [open, onOpenChange]);
    const contextValue = useMemo(
      () => ({ open: isOpen, toggle }),
      [isOpen, toggle],
    );
    return (
      <CollapsibleContext.Provider value={contextValue}>
        <View ref={ref} {...props}>
          {children}
        </View>
      </CollapsibleContext.Provider>
    );
  },
);
Collapsible.displayName = "Collapsible";

export type CollapsibleTriggerProps = PressableProps & {
  // 함수형 children은 내부 Text 래핑 구조와 양립하지 않아 문자열 children 권장.
  children?: ReactNode;
};

const CollapsibleTrigger = forwardRef<
  BridgePressableRef,
  CollapsibleTriggerProps
>(({ children, onPress, ...props }, ref) => {
  const { open, toggle } = useCollapsibleContext("CollapsibleTrigger");
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      aria-expanded={open}
      onPress={() => {
        toggle();
        onPress?.();
      }}
      {...props}
    >
      {/* 이중 지정: 전경색·타이포그래피는 내부 Text에（네이티브 색 상속 불가） */}
      <Text className="font-sans text-sm font-medium text-foreground">
        {children}
      </Text>
    </Pressable>
  );
});
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export type CollapsibleContentProps = ViewProps;

const CollapsibleContent = forwardRef<BridgeViewRef, CollapsibleContentProps>(
  ({ children, onLayout, ...props }, ref) => {
    const { open } = useCollapsibleContext("CollapsibleContent");
    const collapse = useCollapseTransition(open);
    if (!collapse.shouldRender) return null;
    return (
      // 3단 구조: 전이 래퍼（측정 높이·웹 전이 클래스） > 측정 뷰（무패딩 —
      // contentRect가 본문 전체 높이） > 본문（사용처 className·props 병합 지점）.
      // 네이티브는 web: 전이 클래스가 떨어져 자연 높이 중첩 뷰로 동작한다.
      <View
        className="web:overflow-hidden web:transition-all web:duration-200"
        style={collapse.heightStyle}
      >
        <View onLayout={collapse.onLayout}>
          <View ref={ref} onLayout={onLayout} {...props}>
            {children}
          </View>
        </View>
      </View>
    );
  },
);
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
