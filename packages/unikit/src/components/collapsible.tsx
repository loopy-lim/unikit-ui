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

type CollapseTransition = {

  shouldRender: boolean;

  heightStyle: { height: number } | undefined;

  onLayout: ((layout: BridgeLayout) => void) | undefined;
};

const COLLAPSE_TRANSITION_MS = 200;

function useCollapseTransition(open: boolean): CollapseTransition {
  const [mounted, setMounted] = useState(open);

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

    let raf1 = 0;
    let raf2 = 0;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let unmountTimer: ReturnType<typeof setTimeout> | undefined;
    if (open) {
      setMounted(true);
      setHeight(0);

      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          const measured = measuredRef.current;
          if (measured == null) {

            setHeight(undefined);
            return;
          }
          setHeight(measured);

          settleTimer = setTimeout(
            () => setHeight(undefined),
            COLLAPSE_TRANSITION_MS,
          );
        });
      });
    } else {

      setHeight(measuredRef.current ?? 0);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setHeight(0));
      });

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
