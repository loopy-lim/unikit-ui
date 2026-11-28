import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
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
  XIcon,
  type BridgePressableRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { ModalOverlay, type ModalOverlayPosition } from "@/lib/overlay";
import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;

  contentId: string;

  titleId: string;

  descriptionId: string;

  triggerRef: RefObject<unknown>;
  setTriggerElement: (element: unknown) => void;
};

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext(component: string): SheetContextValue {
  const ctx = useContext(SheetContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Sheet> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

const sheetContentVariants = cva(
  "pointer-events-auto relative flex-col gap-4 bg-background shadow-lg",
  {
    variants: {
      side: {
        top: "w-full border-b unikit-sheet-in-top",
        bottom: "w-full border-t unikit-sheet-in-bottom",
        left: "h-full w-3/4 border-r unikit-sheet-in-left sm:max-w-sm",
        right: "h-full w-3/4 border-l unikit-sheet-in-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  },
);

export type SheetProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Sheet = forwardRef<BridgeViewRef, SheetProps>(
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
    const contextValue = useMemo<SheetContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        contentId: `${baseId}-sheet-content`,
        titleId: `${baseId}-sheet-title`,
        descriptionId: `${baseId}-sheet-description`,
        triggerRef,
        setTriggerElement,
      }),
      [isOpen, setOpen, baseId, setTriggerElement],
    );
    return (
      <SheetContext.Provider value={contextValue}>
        <View ref={ref} {...props}>
          {children}
        </View>
      </SheetContext.Provider>
    );
  },
);
Sheet.displayName = "Sheet";

export type SheetTriggerProps = PressableProps & {

  children?: ReactNode;
};

const SheetTrigger = forwardRef<BridgePressableRef, SheetTriggerProps>(
  ({ className, children, disabled, onPress, ...props }, forwardedRef) => {
    const sheet = useSheetContext("SheetTrigger");

    const setRef = (element: BridgePressableRef | null) => {
      sheet.setTriggerElement(element);
      if (typeof forwardedRef === "function") forwardedRef(element);
      else if (forwardedRef) forwardedRef.current = element;
    };
    return (
      <Pressable
        ref={setRef}
        accessibilityRole="button"
        aria-expanded={sheet.open}
        aria-controls={sheet.contentId}
        disabled={disabled}
        onPress={() => {
          sheet.setOpen(true);
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
SheetTrigger.displayName = "SheetTrigger";

export type SheetCloseProps = PressableProps & {

  children?: ReactNode;
};

const SheetClose = forwardRef<BridgePressableRef, SheetCloseProps>(
  ({ className, children, disabled, onPress, ...props }, ref) => {
    const sheet = useSheetContext("SheetClose");
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => {
          sheet.setOpen(false);
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
SheetClose.displayName = "SheetClose";

export type SheetContentProps = ViewProps & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
};

const SheetContent = forwardRef<BridgeViewRef, SheetContentProps>(
  (
    { className, children, side = "right", showCloseButton = true, nativeID, ...props },
    ref,
  ) => {
    const sheet = useSheetContext("SheetContent");
    return (
      <ModalOverlay
        visible={sheet.open}
        onClose={() => sheet.setOpen(false)}
        position={side as ModalOverlayPosition}

        className="z-50"
        backdropClassName="z-50"
        triggerRef={sheet.triggerRef}
        accessibilityRole="dialog"
        aria-labelledby={sheet.titleId}
      >
        <View
          ref={ref}
          nativeID={nativeID ?? sheet.contentId}
          aria-describedby={sheet.descriptionId}
          className={cn(sheetContentVariants({ side }), className)}
          {...props}
        >
          {children}
          {showCloseButton && (
            <SheetClose
              accessibilityLabel="Close"
              className={cn(
                "absolute top-3 right-3 rounded-sm p-1 opacity-70",
                "web:transition-opacity web:hover:bg-accent web:hover:opacity-100",
                "web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:ring-offset-background",
              )}
            >
              {
                                                        }
              <XIcon className="size-4 text-foreground" />
            </SheetClose>
          )}
        </View>
      </ModalOverlay>
    );
  },
);
SheetContent.displayName = "SheetContent";

export type SheetHeaderProps = ViewProps;

const SheetHeader = forwardRef<BridgeViewRef, SheetHeaderProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("gap-1.5 p-4", className)} {...props} />
  ),
);
SheetHeader.displayName = "SheetHeader";

export type SheetFooterProps = ViewProps;

const SheetFooter = forwardRef<BridgeViewRef, SheetFooterProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("mt-auto gap-2 p-4", className)} {...props} />
  ),
);
SheetFooter.displayName = "SheetFooter";

export type SheetTitleProps = TextProps;

const SheetTitle = forwardRef<BridgeTextRef, SheetTitleProps>(
  ({ className, nativeID, ...props }, ref) => {
    const sheet = useSheetContext("SheetTitle");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? sheet.titleId}
        className={cn(
          "font-sans font-semibold text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
SheetTitle.displayName = "SheetTitle";

export type SheetDescriptionProps = TextProps;

const SheetDescription = forwardRef<BridgeTextRef, SheetDescriptionProps>(
  ({ className, nativeID, ...props }, ref) => {
    const sheet = useSheetContext("SheetDescription");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? sheet.descriptionId}
        className={cn("font-sans text-sm text-muted-foreground", className)}
        {...props}
      />
    );
  },
);
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  sheetContentVariants,
};
