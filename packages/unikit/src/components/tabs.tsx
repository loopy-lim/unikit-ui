import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type ReactNode,
} from "react";
import {
  animateLayout,
  Platform,
  Pressable,
  Text,
  View,
  type BridgeKeyEvent,
  type BridgeLayout,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

type TabTriggerRecord = {
  value: string;
  disabled: boolean;
  ref: { current: BridgePressableRef | null };
};

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;

  baseId: string;
  registerTrigger: (
    value: string,
    disabled: boolean,
    ref: { current: BridgePressableRef | null },
  ) => () => void;
  handleTriggerKeyDown: (currentValue: string, event: BridgeKeyEvent) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Tabs> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

function composeRefs(
  ...refs: Array<
    ForwardedRef<BridgePressableRef> | { current: BridgePressableRef | null }
  >
) {
  return (node: BridgePressableRef | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else ref.current = node;
    }
  };
}

function contentIdOf(baseId: string, value: string) {
  return `${baseId}-tabs-content-${value.replace(/\s+/g, "-")}`;
}

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

type TabsListContextValue = { variant: "default" | "line" | null };
const TabsListContext = createContext<TabsListContextValue>({ variant: null });

export type TabsProps = ViewProps & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

const Tabs = forwardRef<BridgeViewRef, TabsProps>(
  ({ value, defaultValue, onValueChange, className, children, ...props }, ref) => {

    const [internalValue, setInternalValue] = useState(defaultValue ?? "");
    const current = value ?? internalValue;
    const currentRef = useRef(current);
    currentRef.current = current;
    const setValue = useCallback(
      (next: string) => {
        animateLayout();
        if (value === undefined) setInternalValue(next);
        if (next !== currentRef.current) onValueChange?.(next);
      },
      [value, onValueChange],
    );
    const triggersRef = useRef<TabTriggerRecord[]>([]);
    const registerTrigger = useCallback(
      (
        triggerValue: string,
        disabled: boolean,
        triggerRef: { current: BridgePressableRef | null },
      ) => {
        const list = triggersRef.current;
        const existingIndex = list.findIndex((item) => item.value === triggerValue);
        const record: TabTriggerRecord = {
          value: triggerValue,
          disabled,
          ref: triggerRef,
        };
        if (existingIndex >= 0) {
          list[existingIndex] = record;
        } else {
          list.push(record);
        }
        return () => {
          const idx = triggersRef.current.findIndex(
            (item) => item.ref === triggerRef,
          );
          if (idx >= 0) triggersRef.current.splice(idx, 1);
        };
      },
      [],
    );
    const handleTriggerKeyDown = useCallback(
      (currentValue: string, event: BridgeKeyEvent) => {
        const enabled = triggersRef.current.filter((item) => !item.disabled);
        if (enabled.length === 0) return;
        const currentIdx = enabled.findIndex((item) => item.value === currentValue);
        let nextIdx = -1;
        if (event.key === "ArrowRight") {
          nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % enabled.length;
        } else if (event.key === "ArrowLeft") {
          nextIdx =
            currentIdx < 0
              ? enabled.length - 1
              : (currentIdx - 1 + enabled.length) % enabled.length;
        } else if (event.key === "Home") {
          nextIdx = 0;
        } else if (event.key === "End") {
          nextIdx = enabled.length - 1;
        } else {
          return;
        }
        event.preventDefault();
        const target = enabled[nextIdx];
        if (!target) return;
        setValue(target.value);
        const focusable = target.ref.current as { focus?: () => void } | null;
        focusable?.focus?.();
      },
      [setValue],
    );
    const baseId = useId();
    const contextValue = useMemo(
      () => ({
        value: current,
        setValue,
        baseId,
        registerTrigger,
        handleTriggerKeyDown,
      }),
      [current, setValue, baseId, registerTrigger, handleTriggerKeyDown],
    );
    return (
      <TabsContext.Provider value={contextValue}>
        <View ref={ref} className={cn("gap-2", className)} {...props}>
          {children}
        </View>
      </TabsContext.Provider>
    );
  },
);
Tabs.displayName = "Tabs";

const tabsListVariants = cva(
  "flex-row native:self-start web:w-fit items-center justify-center rounded-lg p-1 h-9",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type TabsListProps = ViewProps & VariantProps<typeof tabsListVariants>;

const TabsList = forwardRef<BridgeViewRef, TabsListProps>(
  ({ className, variant, ...props }, ref) => {
    const resolved = variant ?? "default";
    const listContextValue = useMemo(
      () => ({ variant: resolved }),
      [resolved],
    );
    return (
      <TabsListContext.Provider value={listContextValue}>
        <View
          ref={ref}
          accessibilityRole="tablist"
          className={cn(tabsListVariants({ variant: resolved }), className)}
          {...props}
        />
      </TabsListContext.Provider>
    );
  },
);
TabsList.displayName = "TabsList";

export type TabsTriggerProps = PressableProps & {
  value: string;

  children?: ReactNode;
};

const TabsTrigger = forwardRef<BridgePressableRef, TabsTriggerProps>(
  ({ value, className, children, disabled, onPress, onKeyDown, ...props }, ref) => {
    const tabs = useTabsContext("TabsTrigger");
    const list = useContext(TabsListContext);
    const active = tabs.value === value;
    const localRef = useRef<BridgePressableRef | null>(null);
    const registerTrigger = tabs.registerTrigger;
    useEffect(
      () => registerTrigger(value, disabled === true, localRef),
      [registerTrigger, value, disabled],
    );
    return (
      <Pressable
        ref={composeRefs(ref, localRef)}
        accessibilityRole="tab"
        aria-selected={active}
        aria-controls={contentIdOf(tabs.baseId, value)}
        disabled={disabled}
        onPress={() => {
          tabs.setValue(value);
          onPress?.();
        }}
        onKeyDown={(event) => {
          tabs.handleTriggerKeyDown(value, event);
          onKeyDown?.(event);
        }}
        className={cn(
          "relative flex-row flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 web:transition-all",
          "web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50 web:focus-visible:outline-1 web:outline-ring",

          active && list.variant !== "line" && "bg-background",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >

        <Text
          className={cn(
            "font-sans text-sm font-medium text-foreground/60 web:whitespace-nowrap web:hover:text-foreground",
            active && "text-foreground",
          )}
        >
          {children}
        </Text>
        {list.variant === "line" && (
          <View
            aria-hidden
            className={cn(
              "absolute inset-x-0 bottom-0 h-0.5 bg-foreground",
              active ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </Pressable>
    );
  },
);
TabsTrigger.displayName = "TabsTrigger";

export type TabsContentProps = ViewProps & {
  value: string;
};

const TabsContent = forwardRef<BridgeViewRef, TabsContentProps>(
  ({ value, className, children, nativeID, onLayout, ...props }, ref) => {
    const tabs = useTabsContext("TabsContent");
    const collapse = useCollapseTransition(tabs.value === value);
    if (!collapse.shouldRender) return null;
    return (

      <View
        className="web:overflow-hidden web:transition-all web:duration-200"
        style={collapse.heightStyle}
      >
        <View onLayout={collapse.onLayout}>
          <View
            ref={ref}
            accessibilityRole="tabpanel"
            nativeID={nativeID ?? contentIdOf(tabs.baseId, value)}
            className={cn("flex-1 web:outline-none", className)}
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
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
