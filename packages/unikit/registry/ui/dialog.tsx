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

import { Button } from "./button";
import { ModalOverlay } from "@/lib/overlay";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;

  contentId: string;

  titleId: string;

  descriptionId: string;

  triggerRef: RefObject<unknown>;
  setTriggerElement: (element: unknown) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(component: string): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error(`<${component}>는 <Dialog> 안에서 사용해야 합니다.`);
  }
  return ctx;
}

export type DialogProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Dialog = forwardRef<BridgeViewRef, DialogProps>(
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
    const contextValue = useMemo<DialogContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        contentId: `${baseId}-dialog-content`,
        titleId: `${baseId}-dialog-title`,
        descriptionId: `${baseId}-dialog-description`,
        triggerRef,
        setTriggerElement,
      }),
      [isOpen, setOpen, baseId, setTriggerElement],
    );
    return (
      <DialogContext.Provider value={contextValue}>
        <View ref={ref} {...props}>
          {children}
        </View>
      </DialogContext.Provider>
    );
  },
);
Dialog.displayName = "Dialog";

export type DialogTriggerProps = PressableProps & {

  children?: ReactNode;
};

const DialogTrigger = forwardRef<BridgePressableRef, DialogTriggerProps>(
  ({ className, children, disabled, onPress, ...props }, forwardedRef) => {
    const dialog = useDialogContext("DialogTrigger");

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
  },
);
DialogTrigger.displayName = "DialogTrigger";

export type DialogCloseProps = PressableProps & {

  children?: ReactNode;
};

const DialogClose = forwardRef<BridgePressableRef, DialogCloseProps>(
  ({ className, children, disabled, onPress, ...props }, ref) => {
    const dialog = useDialogContext("DialogClose");
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => {
          dialog.setOpen(false);
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
DialogClose.displayName = "DialogClose";

export type DialogContentProps = ViewProps & {
  showCloseButton?: boolean;
};

const DialogContent = forwardRef<BridgeViewRef, DialogContentProps>(
  (
    { className, children, showCloseButton = true, nativeID, ...props },
    ref,
  ) => {
    const dialog = useDialogContext("DialogContent");
    return (
      <ModalOverlay
        visible={dialog.open}
        onClose={() => dialog.setOpen(false)}
        position="center"

        className="z-50 p-4"
        backdropClassName="z-50"
        triggerRef={dialog.triggerRef}
        accessibilityRole="dialog"
        aria-labelledby={dialog.titleId}
      >
        <View
          ref={ref}
          nativeID={nativeID ?? dialog.contentId}
          aria-describedby={dialog.descriptionId}
          className={cn(

            "pointer-events-auto relative w-full gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-lg unikit-dialog-in web:outline-none",
            className,
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogClose
              accessibilityLabel="Close"
              className={cn(
                "absolute top-3 right-3 rounded-sm p-1 opacity-70",
                "web:transition-opacity web:hover:bg-accent web:hover:opacity-100",
                "web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:ring-offset-background",
              )}
            >
              <XIcon className="size-4 text-muted-foreground" />
            </DialogClose>
          )}
        </View>
      </ModalOverlay>
    );
  },
);
DialogContent.displayName = "DialogContent";

export type DialogHeaderProps = ViewProps;

const DialogHeader = forwardRef<BridgeViewRef, DialogHeaderProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("gap-2 text-center sm:text-left", className)}
      {...props}
    />
  ),
);
DialogHeader.displayName = "DialogHeader";

export type DialogFooterProps = ViewProps & {
  showCloseButton?: boolean;
};

const DialogFooter = forwardRef<BridgeViewRef, DialogFooterProps>(
  ({ className, showCloseButton = false, children, ...props }, ref) => {

    const dialog = useContext(DialogContext);
    return (
      <View
        ref={ref}
        className={cn(
          "gap-2 flex-col-reverse sm:flex-row sm:justify-end",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && dialog && (
          <Button variant="outline" onPress={() => dialog.setOpen(false)}>
            Close
          </Button>
        )}
      </View>
    );
  },
);
DialogFooter.displayName = "DialogFooter";

export type DialogTitleProps = TextProps;

const DialogTitle = forwardRef<BridgeTextRef, DialogTitleProps>(
  ({ className, nativeID, ...props }, ref) => {
    const dialog = useDialogContext("DialogTitle");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? dialog.titleId}
        className={cn(
          "font-sans text-lg leading-none font-semibold text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
DialogTitle.displayName = "DialogTitle";

export type DialogDescriptionProps = TextProps;

const DialogDescription = forwardRef<BridgeTextRef, DialogDescriptionProps>(
  ({ className, nativeID, ...props }, ref) => {
    const dialog = useDialogContext("DialogDescription");
    return (
      <Text
        ref={ref}
        nativeID={nativeID ?? dialog.descriptionId}
        className={cn("font-sans text-sm text-muted-foreground", className)}
        {...props}
      />
    );
  },
);
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
