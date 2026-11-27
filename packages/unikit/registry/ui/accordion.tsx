// Accordion — shadcn/ui（new-york-v4） accordion.tsx 유니버설 포팅 （사이클 30, T-3b）.
// 원본: shadcn-ref/ui/accordion.tsx — radix Accordion 엔진을 제거하고
// 전개 상태는 React state + context로 직접 관리한다（collapsible.tsx의 다중 항목
// 확장 구조）. 원본의 data-state·셀렉터 클래스는 조건부 클래스·아이콘 회전으로 전개.
//
// 포팅 판단（원본 대비 차이）:
// - ChevronDownIcon은 브리지 lucide 아이콘 프리미티브를 쓰고 open 시 rotate-180
//   회전（원본 ［&［data-state=open］>svg］:rotate-180의 조건부 클래스 전개）.
// - 트리거 focus 링은 원본 규격（ring-3 · ring-ring/50 · 무오프셋 ·
//   focus-visible:border-ring）을 web: 접두로 준수한다（사이클 72）.
// - 항목 구분선의 마지막 항목 제외（last 변형）는 위치 셀렉터라 네이티브 재현 불가
//   — 제거. 마지막 항목 하단선 제거는 사용처 className 오버라이드로 한다.
// - 콘텐츠 높이 접힘 전이（사이클 30 로드맵 해소）: 웹은 브리지 onLayout 계약
//   （ResizeObserver contentRect）으로 측정한 콘텐츠 높이를 래퍼 style height로
//   0 ↔ px 전이（web:transition-all）하고 언마운트를 전이 완료까지 유예한다.
//   원본의 이중 뷰（애니메이션용 바깥쪽 + 패딩 안쪽）를 3단（전이 래퍼 > 무패딩 측정
//   뷰 > 패딩 본문）으로 재현하고 사용처 className은 같은 패딩 토큰 위에 병합된다.
//   네이티브는 토글 시점의 animateLayout()（LayoutAnimation）이 전이를 담당하므로
//   즉시 마운트/언마운트를 유지한다（플랫폼 분기는 select·menubar 관행）.
// - single 모드의 collapsible은 기본 true（shadcn 관용 — 원본 radix 기본값은 false）.
// - aria-controls ↔ 콘텐츠 nativeID를 루트 useId 토대로 결정적으로 연결한다.
import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  animateLayout,
  ChevronDownIcon,
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

import { cn } from "@/lib/utils";

type AccordionContextValue = {
  type: "single" | "multiple";
  collapsible: boolean;
  openItems: string[];
  toggleItem: (value: string) => void;
  /** 트리거 aria-controls ↔ 콘텐츠 nativeID 연결용 토대 ID */
  baseId: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(component: string): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Accordion> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

type AccordionItemContextValue = {
  value: string;
  open: boolean;
  toggle: () => void;
  contentId: string;
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

const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null,
);

function useAccordionItemContext(
  component: string,
): AccordionItemContextValue {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <AccordionItem> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

// 콘텐츠 패널 ID — value의 공백은 ID에 쓸 수 없어 치환.
function contentIdOf(baseId: string, value: string) {
  return `${baseId}-accordion-content-${value.replace(/\s+/g, "-")}`;
}

function toItems(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export type AccordionProps = ViewProps & {
  type?: "single" | "multiple";
  /** single 모드에서 펼친 항목 다시 접기 허용 여부（기본 true — shadcn 관용） */
  collapsible?: boolean;
  /** single 모드에서는 문자열 1개, multiple 모드에서는 펼친 value 배열 */
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
};

const Accordion = forwardRef<BridgeViewRef, AccordionProps>(
  (
    { type = "single", collapsible = true, value, defaultValue, onValueChange, children, ...props },
    ref,
  ) => {
    // 비제어 상태 — 제어（value 지정）면 무시된다.
    const [internalItems, setInternalItems] = useState(() =>
      toItems(defaultValue),
    );
    const openItems = value !== undefined ? toItems(value) : internalItems;
    const openItemsRef = useRef(openItems);
    openItemsRef.current = openItems;
    const toggleItem = useCallback(
      (itemValue: string) => {
        animateLayout();
        const currentItems = openItemsRef.current;
        const isOpen = currentItems.includes(itemValue);
        let next: string[];
        if (isOpen) {
          // single 비접이형（collapsible=false）은 마지막 펼침 항목을 유지한다.
          if (type === "single" && !collapsible) return;
          next = currentItems.filter((v) => v !== itemValue);
        } else {
          next =
            type === "single"
              ? [itemValue]
              : [...currentItems, itemValue];
        }
        if (value === undefined) setInternalItems(next);
        if (type === "single") onValueChange?.(next[0] ?? "");
        else onValueChange?.(next);
      },
      [type, collapsible, value, onValueChange],
    );
    const baseId = useId();
    const contextValue = useMemo(
      () => ({ type, collapsible, openItems, toggleItem, baseId }),
      [type, collapsible, openItems, toggleItem, baseId],
    );
    return (
      <AccordionContext.Provider value={contextValue}>
        <View ref={ref} {...props}>
          {children}
        </View>
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

export type AccordionItemProps = ViewProps & {
  value: string;
};

const AccordionItem = forwardRef<BridgeViewRef, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const accordion = useAccordionContext("AccordionItem");
    const open = accordion.openItems.includes(value);
    const toggle = useCallback(
      () => accordion.toggleItem(value),
      [accordion.toggleItem, value],
    );
    const contentId = contentIdOf(accordion.baseId, value);
    const itemContextValue = useMemo(
      () => ({ value, open, toggle, contentId }),
      [value, open, toggle, contentId],
    );
    return (
      <AccordionItemContext.Provider value={itemContextValue}>
        <View
          ref={ref}
          className={cn("border-b border-border", className)}
          {...props}
        >
          {children}
        </View>
      </AccordionItemContext.Provider>
    );
  },
);
AccordionItem.displayName = "AccordionItem";

export type AccordionTriggerProps = PressableProps & {
  // 함수형 children은 내부 Text 래핑 구조와 양립하지 않아 문자열 children 권장.
  children?: ReactNode;
};

const AccordionTrigger = forwardRef<BridgePressableRef, AccordionTriggerProps>(
  ({ className, children, disabled, onPress, ...props }, ref) => {
    const item = useAccordionItemContext("AccordionTrigger");
    const content =
      typeof children === "string" || typeof children === "number" ? (
        <Text className="flex-1 font-sans text-left text-sm font-medium text-foreground web:hover:underline">
          {children}
        </Text>
      ) : (
        <View className="flex-1 flex-row items-center gap-2">
          {Children.map(children, (child) =>
            typeof child === "string" || typeof child === "number" ? (
              <Text className="font-sans text-left text-sm font-medium text-foreground web:hover:underline">
                {child}
              </Text>
            ) : (
              child
            ),
          )}
        </View>
      );
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        aria-expanded={item.open}
        aria-controls={item.contentId}
        disabled={disabled}
        onPress={() => {
          item.toggle();
          onPress?.();
        }}
        className={cn(
          "flex-row items-center justify-between gap-4 rounded-md py-4 web:transition-all",
          "web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {/* 이중 지정: 전경색·밑줄은 내부 Text에（네이티브는 색 상속 불가） */}
        {content}
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            item.open && "rotate-180",
          )}
        />
      </Pressable>
    );
  },
);
AccordionTrigger.displayName = "AccordionTrigger";

export type AccordionContentProps = ViewProps;

const AccordionContent = forwardRef<BridgeViewRef, AccordionContentProps>(
  ({ className, children, nativeID, onLayout, ...props }, ref) => {
    const item = useAccordionItemContext("AccordionContent");
    const collapse = useCollapseTransition(item.open);
    if (!collapse.shouldRender) return null;
    return (
      // 3단 구조: 전이 래퍼（측정 높이·overflow 숨김 — 원본이 애니메이션용 바깥
      // 뷰에 주던 overflow-hidden을 승계） > 무패딩 측정 뷰（contentRect가 패딩까지
      // 포함한 본문 전체 높이） > 패딩 본문（사용처 className 병합 지점）.
      // 네이티브는 web: 전이 클래스가 떨어져 자연 높이 중첩 뷰로 동작한다.
      <View
        className="overflow-hidden web:transition-all web:duration-200"
        style={collapse.heightStyle}
      >
        <View onLayout={collapse.onLayout}>
          <View
            ref={ref}
            nativeID={nativeID ?? item.contentId}
            className={cn("pb-4 pt-0", className)}
            onLayout={onLayout}
            {...props}
          >
            {children}
          </View>
        </View>
      </View>
    );
  },
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
