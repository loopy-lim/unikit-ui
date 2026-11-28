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

function contentIdOf(baseId: string, value: string) {
  return `${baseId}-accordion-content-${value.replace(/\s+/g, "-")}`;
}

function toItems(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export type AccordionProps = ViewProps & {
  type?: "single" | "multiple";

  collapsible?: boolean;

  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
};

const Accordion = forwardRef<BridgeViewRef, AccordionProps>(
  (
    { type = "single", collapsible = true, value, defaultValue, onValueChange, children, ...props },
    ref,
  ) => {

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
