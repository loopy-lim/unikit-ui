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
} from "react";
import {
  Pressable,
  Slot,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { AnchoredOverlay, type OverlayAlign, type OverlayPlacement } from "@/lib/overlay";
import { cn } from "@/lib/utils";

type HoverCardContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;

  scheduleOpen: () => void;

  scheduleClose: () => void;

  cancelClose: () => void;

  entry: "pointer" | null;

  baseId: string;

  triggerRef: MutableRefObject<BridgePressableRef | null>;
};

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCardContext(component: string): HoverCardContextValue {
  const ctx = useContext(HoverCardContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <HoverCard> 안에서 사용해야 합니다.`);
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

export type HoverCardProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  openDelay?: number;

  closeDelay?: number;
};

const HoverCard = forwardRef<BridgeViewRef, HoverCardProps>(
  (
    { open, defaultOpen, onOpenChange, openDelay = 200, closeDelay = 300, children, ...props },
    ref,
  ) => {

    const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
    const isOpen = open ?? internalOpen;
    const stateRef = useRef({ open, isOpen, onOpenChange });
    stateRef.current = { open, isOpen, onOpenChange };
    const setOpen = useCallback((next: boolean) => {
      const state = stateRef.current;
      if (state.open === undefined) setInternalOpen(next);
      if (next !== state.isOpen) state.onOpenChange?.(next);
    }, []);

    const [entry, setEntry] = useState<"pointer" | null>(null);
    const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearOpenTimer = useCallback(() => {
      if (openTimerRef.current !== null) {
        clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
    }, []);
    const clearCloseTimer = useCallback(() => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }, []);
    useEffect(
      () => () => {
        clearOpenTimer();
        clearCloseTimer();
      },
      [clearOpenTimer, clearCloseTimer],
    );
    const scheduleOpen = useCallback(() => {
      clearCloseTimer();

      setEntry("pointer");
      if (stateRef.current.isOpen) return;
      clearOpenTimer();
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        setOpen(true);
      }, openDelay);
    }, [clearCloseTimer, clearOpenTimer, openDelay, setOpen]);
    const scheduleClose = useCallback(() => {
      clearOpenTimer();
      if (!stateRef.current.isOpen) return;
      clearCloseTimer();
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        setEntry(null);
        setOpen(false);
      }, closeDelay);
    }, [clearCloseTimer, clearOpenTimer, closeDelay, setOpen]);
    const cancelClose = useCallback(clearCloseTimer, [clearCloseTimer]);

    const baseId = useId();
    const triggerRef = useRef<BridgePressableRef | null>(null);
    const contextValue = useMemo<HoverCardContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        scheduleOpen,
        scheduleClose,
        cancelClose,
        entry,
        baseId,
        triggerRef,
      }),
      [isOpen, setOpen, scheduleOpen, scheduleClose, cancelClose, entry, baseId],
    );
    return (
      <HoverCardContext.Provider value={contextValue}>
        <View ref={ref} {...props}>{children}</View>
      </HoverCardContext.Provider>
    );
  },
);
HoverCard.displayName = "HoverCard";

export type HoverCardTriggerProps = PressableProps & {

  asChild?: boolean;
};

const HoverCardTrigger = forwardRef<BridgePressableRef, HoverCardTriggerProps>(
  (
    { asChild = false, onPress, onLongPress, onHoverIn, onHoverOut, ...props },
    ref,
  ) => {
    const hoverCard = useHoverCardContext("HoverCardTrigger");

    const behavioral = {
      accessibilityRole: "button" as const,
      "aria-expanded": hoverCard.open,
      "aria-controls": `${hoverCard.baseId}-hover-card-content`,

      onHoverIn: () => {
        hoverCard.scheduleOpen();
        onHoverIn?.();
      },
      onHoverOut: () => {
        hoverCard.scheduleClose();
        onHoverOut?.();
      },
      onPress: () => {

        if (hoverCard.entry !== "pointer") {
          hoverCard.setOpen(!hoverCard.open);
        }
        onPress?.();
      },
      onLongPress: () => {
        hoverCard.setOpen(true);
        onLongPress?.();
      },
    };
    if (asChild) {
      return (
        <Slot ref={composeRefs(hoverCard.triggerRef, ref)} {...behavioral} {...props} />
      );
    }
    return (
      <Pressable ref={composeRefs(hoverCard.triggerRef, ref)} {...behavioral} {...props} />
    );
  },
);
HoverCardTrigger.displayName = "HoverCardTrigger";

const hoverCardContentVariants = cva(

  "pointer-events-auto w-64 rounded-md border border-border bg-popover p-4 text-popover-foreground unikit-popover-in web:outline-none web:shadow-md",
);

export type HoverCardContentProps = ViewProps & {

  side?: OverlayPlacement;

  align?: OverlayAlign;

  sideOffset?: number;
};

const HoverCardContent = forwardRef<BridgeViewRef, HoverCardContentProps>(
  (
    { className, side = "bottom", align = "center", sideOffset = 4, children, nativeID, ...props },
    ref,
  ) => {
    const hoverCard = useHoverCardContext("HoverCardContent");
    return (
      <AnchoredOverlay
        visible={hoverCard.open}
        onClose={() => hoverCard.setOpen(false)}
        anchorRef={hoverCard.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        triggerRef={hoverCard.triggerRef}

        focusOnOpen={false}
        className="z-50"
      >
        <View
          ref={ref}
          nativeID={nativeID ?? `${hoverCard.baseId}-hover-card-content`}

          onHoverIn={() => hoverCard.cancelClose()}
          onHoverOut={() => hoverCard.scheduleClose()}
          className={cn(hoverCardContentVariants(), className)}
          {...props}
        >
          {children}
        </View>
      </AnchoredOverlay>
    );
  },
);
HoverCardContent.displayName = "HoverCardContent";

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  hoverCardContentVariants,
};
