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
  type ReactNode,
  type RefObject,
} from "react";
import {
  Pressable,
  Text,
  View,
  useDrag,
  type BridgePressableRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { ModalOverlay, type ModalOverlayPosition } from "../lib/overlay";
import { cn } from "../lib/utils";

type DrawerContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;

  contentId: string;

  titleId: string;

  descriptionId: string;

  triggerRef: RefObject<unknown>;
  setTriggerElement: (element: unknown) => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(component: string): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Drawer> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

const DrawerDirectionContext = createContext<"top" | "right" | "bottom" | "left">(
  "bottom",
);

const drawerContentVariants = cva(
  "pointer-events-auto relative flex-col bg-background",
  {
    variants: {
      direction: {
        top: "w-full mb-24 max-h-96 rounded-b-lg border-b unikit-sheet-in-top",
        bottom: "w-full mt-24 max-h-96 rounded-t-lg border-t unikit-sheet-in-bottom",
        left: "h-full w-3/4 border-r unikit-sheet-in-left sm:max-w-sm",
        right: "h-full w-3/4 border-l unikit-sheet-in-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      direction: "bottom",
    },
  },
);

export type DrawerProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Drawer = forwardRef<BridgeViewRef, DrawerProps>(
  ({ open, defaultOpen = false, onOpenChange, children, ...props }, ref) => {

    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open ?? internalOpen;
    const stateRef = useRef({ open, isOpen, onOpenChange });
    stateRef.current = { open, isOpen, onOpenChange };
    const setOpen = useCallback((next: boolean) => {
      const state = stateRef.current;
      if (state.open === undefined) setInternalOpen(next);
      if (next !== state.isOpen) state.onOpenChange?.(next);
    }, []);
    const baseId = useId();
    const triggerRef = useRef<unknown>(null);
    const setTriggerElement = useCallback((element: unknown) => {
      triggerRef.current = element;
    }, []);
    const contextValue = useMemo<DrawerContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        contentId: `${baseId}-drawer-content`,
        titleId: `${baseId}-drawer-title`,
        descriptionId: `${baseId}-drawer-description`,
        triggerRef,
        setTriggerElement,
      }),
      [isOpen, setOpen, baseId, setTriggerElement],
    );
    return (
      <DrawerContext.Provider value={contextValue}>
        <View ref={ref} {...props}>
          {children}
        </View>
      </DrawerContext.Provider>
    );
  },
);
Drawer.displayName = "Drawer";

export type DrawerTriggerProps = PressableProps & {

  children?: ReactNode;
};

const DrawerTrigger = forwardRef<BridgePressableRef, DrawerTriggerProps>(
  ({ className, children, disabled, onPress, ...props }, forwardedRef) => {
    const drawer = useDrawerContext("DrawerTrigger");

    const setRef = (element: BridgePressableRef | null) => {
      drawer.setTriggerElement(element);
      if (typeof forwardedRef === "function") forwardedRef(element);
      else if (forwardedRef) forwardedRef.current = element;
    };
    return (
      <Pressable
        ref={setRef}
        accessibilityRole="button"
        aria-expanded={drawer.open}
        aria-controls={drawer.contentId}
        disabled={disabled}
        onPress={() => {
          drawer.setOpen(true);
          onPress?.();
        }}
        className={className}
        {...props}
      >
        {typeof children === "string" || typeof children === "number" ? (
          <Text className="font-sans text-sm font-medium text-foreground">
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
DrawerTrigger.displayName = "DrawerTrigger";

export type DrawerCloseProps = PressableProps & {

  children?: ReactNode;
};

const DrawerClose = forwardRef<BridgePressableRef, DrawerCloseProps>(
  ({ className, children, disabled, onPress, ...props }, ref) => {
    const drawer = useDrawerContext("DrawerClose");
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => {
          drawer.setOpen(false);
          onPress?.();
        }}
        className={className}
        {...props}
      >
        {typeof children === "string" || typeof children === "number" ? (
          <Text className="font-sans text-sm font-medium text-foreground">
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
DrawerClose.displayName = "DrawerClose";

export type DrawerDirection = "top" | "right" | "bottom" | "left";

export function computeDrawerDragOffset(
  direction: DrawerDirection,
  dx: number,
  dy: number,
): number {
  switch (direction) {
    case "bottom":
      return dy >= 0 ? dy : dy * 0.18;
    case "top":
      return dy <= 0 ? dy : dy * 0.18;
    case "right":
      return dx >= 0 ? dx : dx * 0.18;
    case "left":
      return dx <= 0 ? dx : dx * 0.18;
  }
}

export function shouldDismissDrawer(
  direction: DrawerDirection,
  dx: number,
  dy: number,
  vx = 0,
  vy = 0,
): boolean {
  let primary = 0;
  let velocity = 0;
  switch (direction) {
    case "bottom":
      primary = dy;
      velocity = vy;
      break;
    case "top":
      primary = -dy;
      velocity = -vy;
      break;
    case "right":
      primary = dx;
      velocity = vx;
      break;
    case "left":
      primary = -dx;
      velocity = -vx;
      break;
  }
  return primary > 80 || (velocity > 0.5 && primary > 24);
}

export type DrawerContentProps = ViewProps & {
  direction?: DrawerDirection;
};

const DrawerContent = forwardRef<BridgeViewRef, DrawerContentProps>(
  ({ className, style, children, direction = "bottom", nativeID, ...props }, ref) => {
    const drawer = useDrawerContext("DrawerContent");
    const [dragOffset, setDragOffset] = useState(0);

    useEffect(() => {
      if (!drawer.open) setDragOffset(0);
    }, [drawer.open]);

    const { dragHandlers, dragging } = useDrag({
      onMove: (event) => {
        setDragOffset(computeDrawerDragOffset(direction, event.dx, event.dy));
      },
      onEnd: (event) => {
        if (
          event &&
          shouldDismissDrawer(direction, event.dx, event.dy, event.vx, event.vy)
        ) {
          drawer.setOpen(false);
        }
        setDragOffset(0);
      },
    });

    const isVertical = direction === "top" || direction === "bottom";
    const mergedStyle =
      dragOffset !== 0
        ? {
            ...style,
            ...(isVertical
              ? { translateY: dragOffset }
              : { translateX: dragOffset }),
          }
        : style;

    return (
      <ModalOverlay
        visible={drawer.open}
        onClose={() => drawer.setOpen(false)}
        position={direction as ModalOverlayPosition}

        className="z-50"
        backdropClassName="z-50"
        triggerRef={drawer.triggerRef}
        accessibilityRole="dialog"
        aria-labelledby={drawer.titleId}
      >
        <DrawerDirectionContext.Provider value={direction}>
          <View
            ref={ref}
            nativeID={nativeID ?? drawer.contentId}
            aria-describedby={drawer.descriptionId}
            className={cn(
              drawerContentVariants({ direction }),
              !dragging && "transition-transform duration-200",
              className,
            )}
            style={mergedStyle}
            {...props}
          >
            {direction === "bottom" && (
              <View
                aria-hidden
                {...(dragHandlers as ViewProps)}
                className="w-full items-center pt-4"
              >
                <View className="h-2 w-24 shrink-0 rounded-full bg-muted" />
              </View>
            )}
            {children}
            {direction === "top" && (
              <View
                aria-hidden
                {...(dragHandlers as ViewProps)}
                className="mt-auto w-full items-center pt-2 pb-4"
              >
                <View className="h-2 w-24 shrink-0 rounded-full bg-muted" />
              </View>
            )}
            {(direction === "left" || direction === "right") && (
              <View
                aria-hidden
                {...(dragHandlers as ViewProps)}
                className={cn(
                  "absolute top-0 bottom-0 w-5 items-center justify-center",
                  direction === "left" ? "right-0" : "left-0",
                )}
              >
                <View className="h-12 w-1.5 shrink-0 rounded-full bg-muted" />
              </View>
            )}
          </View>
        </DrawerDirectionContext.Provider>
      </ModalOverlay>
    );
  },
);
DrawerContent.displayName = "DrawerContent";

export type DrawerHeaderProps = ViewProps;

const DrawerHeader = forwardRef<BridgeViewRef, DrawerHeaderProps>(
  ({ className, ...props }, ref) => {
    const direction = useContext(DrawerDirectionContext);
    return (
      <View
        ref={ref}
        className={cn(

          "gap-0.5 p-4",
          (direction === "bottom" || direction === "top") && "text-center",
          "md:gap-1.5 md:text-left",
          className,
        )}
        {...props}
      />
    );
  },
);
DrawerHeader.displayName = "DrawerHeader";

export type DrawerFooterProps = ViewProps;

const DrawerFooter = forwardRef<BridgeViewRef, DrawerFooterProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("mt-auto gap-2 p-4", className)} {...props} />
  ),
);
DrawerFooter.displayName = "DrawerFooter";

export type DrawerTitleProps = TextProps;

const DrawerTitle = forwardRef<BridgeTextRef, DrawerTitleProps>(
  ({ className, nativeID, ...props }, ref) => {
    const drawer = useDrawerContext("DrawerTitle");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? drawer.titleId}
        className={cn("font-sans font-semibold text-foreground", className)}
        {...props}
      />
    );
  },
);
DrawerTitle.displayName = "DrawerTitle";

export type DrawerDescriptionProps = TextProps;

const DrawerDescription = forwardRef<BridgeTextRef, DrawerDescriptionProps>(
  ({ className, nativeID, ...props }, ref) => {
    const drawer = useDrawerContext("DrawerDescription");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? drawer.descriptionId}
        className={cn("font-sans text-sm text-muted-foreground", className)}
        {...props}
      />
    );
  },
);
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  drawerContentVariants,
};
