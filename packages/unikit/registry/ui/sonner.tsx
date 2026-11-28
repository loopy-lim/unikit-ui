import {
  forwardRef,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  LoopRotate,
  Portal,
  Pressable,
  Text,
  View,
  XCircleIcon,
  XIcon,
  useDrag,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

export type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading";

export type ToastOptions = {

  description?: string;

  duration?: number;
};

type ToastItem = {
  id: number;
  title: string;
  variant: ToastVariant;
  description?: string;

  duration?: number;
};

let toasts: ToastItem[] = [];
let toastCounter = 0;
const listeners = new Set<() => void>();

const EMPTY_TOASTS: ToastItem[] = [];

const emit = () => {
  listeners.forEach((listener) => listener());
};

const dismissToast = (id: number) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
};

const updateToast = (id: number, patch: Partial<Omit<ToastItem, "id">>) => {
  toasts = toasts.map((toast) => (toast.id === id ? { ...toast, ...patch } : toast));
  emit();
};

const createToast = (
  title: string,
  variant: ToastVariant,
  options?: ToastOptions,
): number => {
  toastCounter += 1;
  const id = toastCounter;
  toasts = [
    ...toasts,
    {
      id,
      title,
      variant,
      description: options?.description,
      duration: options?.duration,
    },
  ];
  emit();
  return id;
};

function toast(message: string, options?: ToastOptions): number;
function toast(options: ToastOptions & { title?: string }): number;
function toast(
  messageOrOptions: string | (ToastOptions & { title?: string }),
  maybeOptions?: ToastOptions,
): number {
  if (typeof messageOrOptions === "string") {
    return createToast(messageOrOptions, "default", maybeOptions);
  }
  const { title, ...rest } = messageOrOptions;
  return createToast(title ?? "", "default", rest);
}

toast.success = (message: string, options?: ToastOptions) =>
  createToast(message, "success", options);
toast.error = (message: string, options?: ToastOptions) =>
  createToast(message, "error", options);
toast.warning = (message: string, options?: ToastOptions) =>
  createToast(message, "warning", options);
toast.info = (message: string, options?: ToastOptions) =>
  createToast(message, "info", options);
toast.loading = (message: string, options?: ToastOptions) =>
  createToast(message, "loading", { ...options, duration: options?.duration ?? Infinity });

toast.dismiss = (id?: number) => {
  if (id === undefined) {
    toasts = [];
  } else {
    toasts = toasts.filter((toast) => toast.id !== id);
  }
  emit();
};

toast.promise = <T,>(
  promise: Promise<T>,
  config: {
    loading?: string;
    success?: string | ((data: T) => string);
    error?: string | ((error: unknown) => string);
  },
): Promise<T> => {
  const id = createToast(config.loading ?? "", "loading", { duration: Infinity });
  promise
    .then((data) => {
      const message =
        typeof config.success === "function" ? config.success(data) : config.success;
      updateToast(id, {
        variant: "success",
        ...(message !== undefined ? { title: message } : {}),

        duration: undefined,
      });
    })
    .catch((error: unknown) => {
      const message =
        typeof config.error === "function" ? config.error(error) : config.error;
      updateToast(id, {
        variant: "error",
        ...(message !== undefined ? { title: message } : {}),
        duration: undefined,
      });
    });
  return promise;
};

export { toast };

export type ToasterProps = ViewProps & {
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

  richColors?: boolean;

  closeButton?: boolean;

  duration?: number;
};

const POSITION_CLASSES: Record<NonNullable<ToasterProps["position"]>, string> = {
  "top-left": "items-start justify-start",
  "top-center": "items-center justify-start",
  "top-right": "items-end justify-start",
  "bottom-left": "items-start justify-end",
  "bottom-center": "items-center justify-end",
  "bottom-right": "items-end justify-end",
};

function ToastIcon({
  variant,
  className,
}: {
  variant: ToastVariant;
  className?: string;
}) {
  switch (variant) {
    case "success":
      return <CheckCircle2Icon className={className} />;
    case "error":
      return <XCircleIcon className={className} />;
    case "warning":
      return <AlertCircleIcon className={className} />;
    case "info":
      return <InfoIcon className={className} />;
    case "loading":
      return (
        <LoopRotate>
          <Loader2Icon className={cn(className, "web:animate-spin")} />
        </LoopRotate>
      );
    default:
      return null;
  }
}

const subscribeToasts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getClientToasts = () => toasts;
const getServerToasts = () => EMPTY_TOASTS;
const FIXED_WRAPPER_STYLE = { position: "fixed", left: 0, top: 0, right: 0, bottom: 0 } as const;

const toastCardVariants = cva(
  "pointer-events-auto relative flex-row items-start gap-3 rounded-lg border bg-popover px-4 py-3 shadow-lg unikit-toast-in web:max-w-sm",
  {
    variants: {
      rich: {
        true: "",
        false: "",
      },
      variant: {
        default: "",

        success: "",
        error: "",
        warning: "",
        info: "",
        loading: "",
      },
    },
    compoundVariants: [
      {
        rich: true,
        variant: "success",
        class: "border-emerald-600 bg-emerald-600",
      },
      { rich: true, variant: "error", class: "border-red-600 bg-red-600" },
      { rich: true, variant: "warning", class: "border-amber-500 bg-amber-500" },
      { rich: true, variant: "info", class: "border-sky-500 bg-sky-500" },
    ],
    defaultVariants: {
      rich: false,
      variant: "default",
    },
  },
);

type ToastCardProps = {
  toastItem: ToastItem;
  position: NonNullable<ToasterProps["position"]>;
  richColors: boolean;
  closeButton: boolean;
  defaultDuration: number;
};

function ToastCard({
  toastItem,
  position,
  richColors,
  closeButton,
  defaultDuration,
}: ToastCardProps) {

  const [dragY, setDragY] = useState(0);
  const upward = position.startsWith("top");
  const { dragHandlers, dragging } = useDrag({
    onMove: (event) => {
      const primary = upward ? -event.dy : event.dy;
      setDragY(primary >= 0 ? event.dy : event.dy * 0.2);
    },
    onEnd: (event) => {
      const dy = event?.dy ?? dragY;
      const vy = event?.vy ?? 0;
      const primary = upward ? -dy : dy;
      const primaryV = upward ? -vy : vy;
      if (primary > 48 || (primaryV > 0.45 && primary > 16)) {
        dismissToast(toastItem.id);
      } else {
        setDragY(0);
      }
    },
  });

  const duration = toastItem.duration ?? defaultDuration;
  useEffect(() => {
    if (!Number.isFinite(duration)) return;
    const timer = setTimeout(() => dismissToast(toastItem.id), duration);
    return () => clearTimeout(timer);
  }, [toastItem.id, toastItem.variant, toastItem.description, duration]);

  const colored = richColors && toastItem.variant !== "default" && toastItem.variant !== "loading";

  const titleColor = colored ? "text-white" : "text-popover-foreground";
  const descriptionColor = colored ? "text-white/80" : "text-muted-foreground";
  const dragStyle =
    dragY !== 0
      ? {
          translateY: dragY,
          opacity: Math.max(0.35, 1 - Math.abs(dragY) / 160),
        }
      : undefined;

  return (
    <View
      accessibilityRole={toastItem.variant === "error" || toastItem.variant === "warning" ? "alert" : "status"}
      className={cn(
        "w-full",
        toastCardVariants({ rich: richColors, variant: toastItem.variant }),
        !dragging && "transition-transform duration-200",
      )}
      style={dragStyle}
      {...(dragHandlers as ViewProps)}
    >
      {toastItem.variant !== "default" && (
        <View aria-hidden className="shrink-0 pt-0.5">
          <ToastIcon
            variant={toastItem.variant}
            className={cn("size-4", colored ? "text-white" : "text-foreground")}
          />
        </View>
      )}
      <View className="min-w-0 flex-1 flex-col gap-1">
        {toastItem.title !== "" && (
          <Text className={cn("font-sans text-sm font-semibold", titleColor)}>
            {toastItem.title}
          </Text>
        )}
        {toastItem.description && (
          <Text className={cn("font-sans text-xs", descriptionColor)}>
            {toastItem.description}
          </Text>
        )}
      </View>
      {closeButton && (
        <Pressable
          accessibilityLabel="닫기"
          onPress={() => dismissToast(toastItem.id)}
          className="shrink-0 rounded-xs p-1"
        >
          <XIcon className={cn("size-3.5", titleColor)} />
        </Pressable>
      )}
    </View>
  );
}

const Toaster = forwardRef<BridgeViewRef, ToasterProps>(
  (
    {
      position = "bottom-right",
      richColors = false,
      closeButton = false,
      duration = 4000,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const currentToasts = useSyncExternalStore(
      subscribeToasts,
      getClientToasts,
      getServerToasts,
    );

    return (

      <Portal visible={currentToasts.length > 0} modal={false}>
        {
                                             }
        <View
          ref={ref}
          pointerEvents="box-none"
          className={cn(
            "gap-2 p-4 web:z-50",
            POSITION_CLASSES[position],
            className,
          )}
          style={FIXED_WRAPPER_STYLE}
          {...props}
        >
          {currentToasts.map((toastItem) => (
            <ToastCard
              key={toastItem.id}
              toastItem={toastItem}
              position={position}
              richColors={richColors}
              closeButton={closeButton}
              defaultDuration={duration}
            />
          ))}
          {children}
        </View>
      </Portal>
    );
  },
);
Toaster.displayName = "Toaster";

export { Toaster };
