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
  Text,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { AnchoredOverlay, type OverlayAlign, type OverlayPlacement } from "@/lib/overlay";
import { cn } from "@/lib/utils";

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;

  baseId: string;

  triggerRef: MutableRefObject<BridgePressableRef | null>;

  anchorRef: MutableRefObject<BridgeViewRef | null>;
  hasAnchor: boolean;
  setHasAnchor: (has: boolean) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(component: string): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Popover> 안에서 사용해야 합니다.`);
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

export type PopoverProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Popover = forwardRef<BridgeViewRef, PopoverProps>(
  ({ open, defaultOpen, onOpenChange, children, ...props }, ref) => {

    const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
    const isOpen = open ?? internalOpen;
    const stateRef = useRef({ open, isOpen, onOpenChange });
    stateRef.current = { open, isOpen, onOpenChange };
    const setOpen = useCallback((next: boolean) => {
      const state = stateRef.current;
      if (state.open === undefined) setInternalOpen(next);
      if (next !== state.isOpen) state.onOpenChange?.(next);
    }, []);
    const baseId = useId();
    const triggerRef = useRef<BridgePressableRef | null>(null);
    const anchorRef = useRef<BridgeViewRef | null>(null);
    const [hasAnchor, setHasAnchor] = useState(false);
    const contextValue = useMemo<PopoverContextValue>(
      () => ({ open: isOpen, setOpen, baseId, triggerRef, anchorRef, hasAnchor, setHasAnchor }),
      [isOpen, setOpen, baseId, hasAnchor],
    );
    return (
      <PopoverContext.Provider value={contextValue}>
        <View ref={ref} {...props}>{children}</View>
      </PopoverContext.Provider>
    );
  },
);
Popover.displayName = "Popover";

export type PopoverTriggerProps = PressableProps & {

  asChild?: boolean;
};

const PopoverTrigger = forwardRef<BridgePressableRef, PopoverTriggerProps>(
  ({ asChild = false, onPress, ...props }, ref) => {
    const popover = usePopoverContext("PopoverTrigger");

    const behavioral = {
      accessibilityRole: "button" as const,
      "aria-expanded": popover.open,
      "aria-controls": `${popover.baseId}-popover-content`,
      onPress: () => {
        popover.setOpen(!popover.open);
        onPress?.();
      },
    };
    if (asChild) {
      return (
        <Slot ref={composeRefs(popover.triggerRef, ref)} {...behavioral} {...props} />
      );
    }
    return (
      <Pressable ref={composeRefs(popover.triggerRef, ref)} {...behavioral} {...props} />
    );
  },
);
PopoverTrigger.displayName = "PopoverTrigger";

const popoverContentVariants = cva(

  "pointer-events-auto w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground unikit-popover-in web:outline-none web:shadow-md",
);

export type PopoverContentProps = ViewProps & {

  side?: OverlayPlacement;

  align?: OverlayAlign;

  sideOffset?: number;
};

const PopoverContent = forwardRef<BridgeViewRef, PopoverContentProps>(
  ({ className, side = "bottom", align = "center", sideOffset = 4, children, nativeID, ...props }, ref) => {
    const popover = usePopoverContext("PopoverContent");
    return (
      <AnchoredOverlay
        visible={popover.open}
        onClose={() => popover.setOpen(false)}
        anchorRef={popover.hasAnchor ? popover.anchorRef : popover.triggerRef}
        placement={side}
        align={align}
        offset={sideOffset}
        triggerRef={popover.triggerRef}
        className="z-50"
      >
        <View
          ref={ref}
          accessibilityRole="dialog"
          nativeID={nativeID ?? `${popover.baseId}-popover-content`}
          className={cn(popoverContentVariants(), className)}
          {...props}
        >
          {children}
        </View>
      </AnchoredOverlay>
    );
  },
);
PopoverContent.displayName = "PopoverContent";

export type PopoverAnchorProps = ViewProps;

const PopoverAnchor = forwardRef<BridgeViewRef, PopoverAnchorProps>(
  ({ children, ...props }, ref) => {
    const { anchorRef, setHasAnchor } = usePopoverContext("PopoverAnchor");

    useEffect(() => {
      setHasAnchor(true);
      return () => setHasAnchor(false);
    }, [setHasAnchor]);
    return (
      <View ref={composeRefs(anchorRef, ref)} {...props}>
        {children}
      </View>
    );
  },
);
PopoverAnchor.displayName = "PopoverAnchor";

const popoverHeaderVariants = cva("flex-col gap-1 text-sm");

export type PopoverHeaderProps = ViewProps;

const PopoverHeader = forwardRef<BridgeViewRef, PopoverHeaderProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn(popoverHeaderVariants(), className)} {...props} />
  ),
);
PopoverHeader.displayName = "PopoverHeader";

const popoverTitleVariants = cva("font-sans text-sm font-medium text-popover-foreground");

export type PopoverTitleProps = ViewProps;

const PopoverTitle = forwardRef<BridgeViewRef, PopoverTitleProps>(
  ({ className, children, ...props }, ref) => (

    <View ref={ref} className={cn(popoverTitleVariants(), className)} {...props}>
      <Text className="font-sans text-sm font-medium text-popover-foreground">
        {children}
      </Text>
    </View>
  ),
);
PopoverTitle.displayName = "PopoverTitle";

const popoverDescriptionVariants = cva("text-muted-foreground");

export type PopoverDescriptionProps = ViewProps;

const PopoverDescription = forwardRef<BridgeViewRef, PopoverDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={cn(popoverDescriptionVariants(), className)} {...props}>
      <Text className="font-sans text-sm text-muted-foreground">{children}</Text>
    </View>
  ),
);
PopoverDescription.displayName = "PopoverDescription";

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  popoverContentVariants,
  popoverHeaderVariants,
  popoverTitleVariants,
  popoverDescriptionVariants,
};
