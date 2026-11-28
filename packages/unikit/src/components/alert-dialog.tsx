import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
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
  type BridgePressableRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { Button, type ButtonProps } from "./button";
import { ModalOverlay } from "../lib/overlay";
import { cn } from "../lib/utils";

type AlertDialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;

  contentId: string;

  titleId: string;

  descriptionId: string;

  triggerRef: RefObject<unknown>;
  setTriggerElement: (element: unknown) => void;
};

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(component: string): AlertDialogContextValue {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error(
      `<${component}>는 <AlertDialog> 안에서 사용해야 합니다.`,
    );
  }
  return ctx;
}

const AlertDialogSizeContext = createContext<"default" | "sm">("default");

const alertDialogContentVariants = cva(
  "pointer-events-auto relative w-full gap-4 rounded-lg border bg-background p-6 shadow-lg unikit-dialog-in web:outline-none",
  {
    variants: {
      size: {
        default: "sm:max-w-lg",
        sm: "max-w-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const alertDialogHeaderVariants = cva(
  "flex-col items-center gap-1.5 text-center",
  {
    variants: {
      size: {
        default: "sm:items-start sm:text-left",
        sm: "",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const alertDialogFooterVariants = cva("gap-2", {
  variants: {
    size: {
      default: "flex-col-reverse sm:flex-row sm:justify-end",
      sm: "flex flex-row web:grid web:grid-cols-2",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export type AlertDialogProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const AlertDialog = forwardRef<BridgeViewRef, AlertDialogProps>(
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
    const contextValue = useMemo<AlertDialogContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        contentId: `${baseId}-alert-dialog-content`,
        titleId: `${baseId}-alert-dialog-title`,
        descriptionId: `${baseId}-alert-dialog-description`,
        triggerRef,
        setTriggerElement,
      }),
      [isOpen, setOpen, baseId, setTriggerElement],
    );
    return (
      <AlertDialogContext.Provider value={contextValue}>
        <View ref={ref} {...props}>
          {children}
        </View>
      </AlertDialogContext.Provider>
    );
  },
);
AlertDialog.displayName = "AlertDialog";

export type AlertDialogTriggerProps = PressableProps & {

  children?: ReactNode;
};

const AlertDialogTrigger = forwardRef<
  BridgePressableRef,
  AlertDialogTriggerProps
>(({ className, children, disabled, onPress, ...props }, forwardedRef) => {
  const dialog = useAlertDialogContext("AlertDialogTrigger");

  const setRef = (element: BridgePressableRef | null) => {
    dialog.setTriggerElement(element);
    if (typeof forwardedRef === "function") forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  };
  return (
    <Pressable
      ref={setRef}
      accessibilityRole="button"
      aria-expanded={dialog.open}
      aria-controls={dialog.contentId}
      disabled={disabled}
      onPress={() => {
        dialog.setOpen(true);
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
});
AlertDialogTrigger.displayName = "AlertDialogTrigger";

export type AlertDialogContentProps = ViewProps & {
  size?: "default" | "sm";
};

const AlertDialogContent = forwardRef<BridgeViewRef, AlertDialogContentProps>(
  ({ className, children, size = "default", nativeID, ...props }, ref) => {
    const dialog = useAlertDialogContext("AlertDialogContent");
    return (
      <ModalOverlay
        visible={dialog.open}
        onClose={() => dialog.setOpen(false)}
        position="center"

        className="z-50 p-4"
        backdropClassName="z-50"
        triggerRef={dialog.triggerRef}
        accessibilityRole="alertdialog"
        aria-labelledby={dialog.titleId}
        dismissOnBackdrop={false}
        dismissOnEscape={false}
      >
        <AlertDialogSizeContext.Provider value={size}>
          <View
            ref={ref}
            nativeID={nativeID ?? dialog.contentId}
            aria-describedby={dialog.descriptionId}
            className={cn(alertDialogContentVariants({ size }), className)}
            {...props}
          >
            {children}
          </View>
        </AlertDialogSizeContext.Provider>
      </ModalOverlay>
    );
  },
);
AlertDialogContent.displayName = "AlertDialogContent";

export type AlertDialogHeaderProps = ViewProps;

const AlertDialogHeader = forwardRef<BridgeViewRef, AlertDialogHeaderProps>(
  ({ className, children, ...props }, ref) => {
    const size = useContext(AlertDialogSizeContext);

    const isMedia = (child: ReactNode) =>
      isValidElement(child) && child.type === AlertDialogMedia;
    const items = Children.toArray(children);
    const medias = items.filter(isMedia);
    const content = items.filter((child) => !isMedia(child));

    const sideBySide = medias.length > 0 && size === "default";
    return (
      <View
        ref={ref}
        className={cn(
          alertDialogHeaderVariants({ size }),

          sideBySide &&
            "sm:flex-row sm:items-start sm:gap-6",
          className,
        )}
        {...props}
      >
        {sideBySide ? (
          <>
            {medias}

            <View className="flex flex-col items-center gap-1.5 sm:items-start">
              {content}
            </View>
          </>
        ) : (
          children
        )}
      </View>
    );
  },
);
AlertDialogHeader.displayName = "AlertDialogHeader";

export type AlertDialogFooterProps = ViewProps;

const AlertDialogFooter = forwardRef<BridgeViewRef, AlertDialogFooterProps>(
  ({ className, ...props }, ref) => {
    const size = useContext(AlertDialogSizeContext);
    return (
      <View
        ref={ref}
        className={cn(alertDialogFooterVariants({ size }), className)}
        {...props}
      />
    );
  },
);
AlertDialogFooter.displayName = "AlertDialogFooter";

export type AlertDialogTitleProps = TextProps;

const AlertDialogTitle = forwardRef<BridgeTextRef, AlertDialogTitleProps>(
  ({ className, nativeID, ...props }, ref) => {
    const dialog = useAlertDialogContext("AlertDialogTitle");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? dialog.titleId}

        className={cn(
          "font-sans text-lg font-semibold text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
AlertDialogTitle.displayName = "AlertDialogTitle";

export type AlertDialogDescriptionProps = TextProps;

const AlertDialogDescription = forwardRef<
  BridgeTextRef,
  AlertDialogDescriptionProps
>(({ className, nativeID, ...props }, ref) => {
  const dialog = useAlertDialogContext("AlertDialogDescription");
  return (
    <Text
      ref={ref}
      nativeID={nativeID ?? dialog.descriptionId}
      className={cn("font-sans text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
AlertDialogDescription.displayName = "AlertDialogDescription";

export type AlertDialogMediaProps = ViewProps;

const AlertDialogMedia = forwardRef<BridgeViewRef, AlertDialogMediaProps>(
  ({ className, ...props }, ref) => {
    const size = useContext(AlertDialogSizeContext);
    return (

      <View
        ref={ref}
        className={cn(
          "mb-2 flex size-16 items-center justify-center self-center rounded-md bg-muted",
          size === "default" && "sm:self-start sm:shrink-0",
          className,
        )}
        {...props}
      />
    );
  },
);
AlertDialogMedia.displayName = "AlertDialogMedia";

export type AlertDialogActionProps = ButtonProps;

const AlertDialogAction = forwardRef<
  BridgePressableRef,
  AlertDialogActionProps
>(
  (
    { className, variant = "default", size = "default", onPress, ...props },
    ref,
  ) => {
    const dialog = useAlertDialogContext("AlertDialogAction");
    const dialogSize = useContext(AlertDialogSizeContext);
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(dialogSize === "sm" && "flex-1", className)}
        onPress={() => {
          dialog.setOpen(false);
          onPress?.();
        }}
        {...props}
      />
    );
  },
);
AlertDialogAction.displayName = "AlertDialogAction";

export type AlertDialogCancelProps = ButtonProps;

const AlertDialogCancel = forwardRef<
  BridgePressableRef,
  AlertDialogCancelProps
>(
  (
    { className, variant = "outline", size = "default", onPress, ...props },
    ref,
  ) => {
    const dialog = useAlertDialogContext("AlertDialogCancel");
    const dialogSize = useContext(AlertDialogSizeContext);
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(dialogSize === "sm" && "flex-1", className)}
        onPress={() => {
          dialog.setOpen(false);
          onPress?.();
        }}
        {...props}
      />
    );
  },
);
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  alertDialogContentVariants,
  alertDialogHeaderVariants,
  alertDialogFooterVariants,
};
