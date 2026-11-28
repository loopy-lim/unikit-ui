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
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  Pressable,
  Slot,
  Text,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import {
  AnchoredOverlay,
  useOverlayPlacement,
  type OverlayAlign,
  type OverlayPlacement,
} from "@/lib/overlay";
import { cn } from "@/lib/utils";

type TooltipPolicyContextValue = {

  delayDuration: number;

  skipDelayDuration: number;

  displayDuration: number;

  markOpened: () => void;

  isSkipped: () => boolean;
};

const TooltipPolicyContext = createContext<TooltipPolicyContextValue | null>(null);

const TOOLTIP_POLICY_DEFAULT: TooltipPolicyContextValue = {
  delayDuration: 0,
  skipDelayDuration: 300,
  displayDuration: 3000,
  markOpened: () => {},
  isSkipped: () => false,
};

export type TooltipProviderProps = {
  children?: ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
  displayDuration?: number;
};

function TooltipProvider({
  children,
  delayDuration = 0,
  skipDelayDuration = 300,
  displayDuration = 3000,
}: TooltipProviderProps) {
  const skipUntilRef = useRef(0);
  const value = useMemo<TooltipPolicyContextValue>(
    () => ({
      delayDuration,
      skipDelayDuration,
      displayDuration,
      markOpened: () => {
        skipUntilRef.current = Date.now() + skipDelayDuration;
      },
      isSkipped: () => Date.now() < skipUntilRef.current,
    }),
    [delayDuration, skipDelayDuration, displayDuration],
  );
  return (
    <TooltipPolicyContext.Provider value={value}>
      {children}
    </TooltipPolicyContext.Provider>
  );
}

type TooltipContextValue = {
  open: boolean;

  show: (source?: "pointer") => void;

  hide: () => void;

  entry: "pointer" | "press" | null;

  contentId: string;

  triggerRef: MutableRefObject<BridgePressableRef | null>;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext(component: string): TooltipContextValue {
  const ctx = useContext(TooltipContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Tooltip> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

function composeRefs<T>(
  local: MutableRefObject<T | null>,
  forwarded: ForwardedRef<T>,
) {
  return (node: T | null) => {
    local.current = node;
    if (typeof forwarded === "function") forwarded(node);
    else if (forwarded) forwarded.current = node;
  };
}

export type TooltipProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  delayDuration?: number;
};

const Tooltip = forwardRef<BridgeViewRef, TooltipProps>(
  ({ open, defaultOpen, onOpenChange, delayDuration, children, ...props }, ref) => {

    const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
    const isOpen = open ?? internalOpen;
    const policy = useContext(TooltipPolicyContext) ?? TOOLTIP_POLICY_DEFAULT;
    const resolvedDelay = delayDuration ?? policy.delayDuration;
    const baseId = useId();
    const triggerRef = useRef<BridgePressableRef | null>(null);

    const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearDelayTimer = useCallback(() => {
      if (delayTimerRef.current !== null) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    }, []);
    useEffect(() => clearDelayTimer, [clearDelayTimer]);

    const stateRef = useRef({ isOpen, open, onOpenChange });
    stateRef.current = { isOpen, open, onOpenChange };
    const applyOpen = useCallback(
      (next: boolean) => {
        const state = stateRef.current;
        if (state.open === undefined) setInternalOpen(next);
        if (next !== state.isOpen) state.onOpenChange?.(next);
        stateRef.current = { ...state, isOpen: next };
        if (next) policy.markOpened();
      },
      [policy],
    );
    const applyOpenRef = useRef(applyOpen);
    applyOpenRef.current = applyOpen;

    const [entry, setEntry] = useState<"pointer" | "press" | null>(null);
    const displayDuration = policy.displayDuration;
    useEffect(() => {
      if (!isOpen || displayDuration <= 0) return;
      if (entry === "pointer") return;
      const id = setTimeout(() => applyOpenRef.current(false), displayDuration);
      return () => clearTimeout(id);
    }, [isOpen, displayDuration, entry]);

    const show = useCallback(
      (source?: "pointer") => {

        setEntry(source ?? "press");
        clearDelayTimer();
        if (stateRef.current.isOpen) return;

        if (policy.isSkipped()) {
          applyOpen(true);
          return;
        }
        delayTimerRef.current = setTimeout(() => {
          delayTimerRef.current = null;
          applyOpen(true);
        }, resolvedDelay);
      },
      [clearDelayTimer, policy, applyOpen, resolvedDelay],
    );
    const hide = useCallback(() => {
      clearDelayTimer();
      setEntry(null);
      applyOpen(false);
    }, [clearDelayTimer, applyOpen]);

    const contextValue = useMemo<TooltipContextValue>(
      () => ({
        open: isOpen,
        show,
        hide,
        entry,
        contentId: `${baseId}-tooltip-content`,
        triggerRef,
      }),
      [isOpen, show, hide, entry, baseId],
    );

    return (
      <TooltipContext.Provider value={contextValue}>
        <View ref={ref} {...props}>{children}</View>
      </TooltipContext.Provider>
    );
  },
);
Tooltip.displayName = "Tooltip";

export type TooltipTriggerProps = PressableProps & {

  asChild?: boolean;
};

const TooltipTrigger = forwardRef<BridgePressableRef, TooltipTriggerProps>(
  (
    { asChild = false, onPress, onLongPress, onHoverIn, onHoverOut, onFocus, onBlur, ...props },
    ref,
  ) => {
    const tooltip = useTooltipContext("TooltipTrigger");

    const behavioral = {

      "aria-describedby": tooltip.open ? tooltip.contentId : undefined,

      onHoverIn: () => {
        tooltip.show("pointer");
        onHoverIn?.();
      },
      onHoverOut: () => {
        tooltip.hide();
        onHoverOut?.();
      },
      onFocus: () => {
        tooltip.show("pointer");
        onFocus?.();
      },
      onBlur: () => {
        tooltip.hide();
        onBlur?.();
      },
      onPress: () => {

        if (tooltip.entry !== "pointer") {
          if (tooltip.open) tooltip.hide();
          else tooltip.show();
        }
        onPress?.();
      },
      onLongPress: () => {
        tooltip.show();
        onLongPress?.();
      },
    };
    if (asChild) {
      return (
        <Slot ref={composeRefs(tooltip.triggerRef, ref)} {...behavioral} {...props} />
      );
    }
    return (
      <Pressable ref={composeRefs(tooltip.triggerRef, ref)} {...behavioral} {...props} />
    );
  },
);
TooltipTrigger.displayName = "TooltipTrigger";

const tooltipContentVariants = cva(

  "pointer-events-auto relative w-fit rounded-md bg-foreground px-3 py-1.5 text-background unikit-popover-in web:outline-none web:text-balance",
);

const tooltipContentTextVariants = cva("font-sans text-xs text-background");

function TooltipArrow({ fallbackSide }: { fallbackSide: OverlayPlacement }) {
  const resolvedSide = useOverlayPlacement() ?? fallbackSide;
  if (resolvedSide !== "top" && resolvedSide !== "bottom") return null;
  return (
    <View
      aria-hidden
      className={cn(
        "absolute inset-x-0 flex-row justify-center",
        resolvedSide === "top" ? "-bottom-1" : "-top-1",
      )}
    >
      <View className="size-2 rotate-45 bg-foreground" />
    </View>
  );
}

export type TooltipContentProps = ViewProps & {

  side?: OverlayPlacement;

  align?: OverlayAlign;

  sideOffset?: number;
};

const TooltipContent = forwardRef<BridgeViewRef, TooltipContentProps>(
  (
    { className, side = "top", align = "center", sideOffset = 0, children, nativeID, ...props },
    ref,
  ) => {
    const tooltip = useTooltipContext("TooltipContent");
    return (
      <AnchoredOverlay
        visible={tooltip.open}
        onClose={tooltip.hide}
        anchorRef={tooltip.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        triggerRef={tooltip.triggerRef}

        focusOnOpen={false}
        className="z-50"
      >
        <View
          ref={ref}
          accessibilityRole="tooltip"
          nativeID={nativeID ?? tooltip.contentId}
          className={cn(tooltipContentVariants(), className)}
          {...props}
        >
          <Text className={tooltipContentTextVariants()}>{children}</Text>
          <TooltipArrow fallbackSide={side} />
        </View>
      </AnchoredOverlay>
    );
  },
);
TooltipContent.displayName = "TooltipContent";

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  tooltipContentVariants,
  tooltipContentTextVariants,
};
