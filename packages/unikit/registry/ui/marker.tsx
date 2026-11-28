import {
  createContext,
  forwardRef,
  useContext,
  type ReactNode,
} from "react";
import {
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const markerVariants = cva(
  "relative flex flex-row min-h-4 w-full items-center gap-2",
  {
    variants: {
      variant: {
        default: "",

        separator: "",
        border: "border-b border-border pb-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const MarkerContext = createContext<
  VariantProps<typeof markerVariants>["variant"] | null
>(null);

export type MarkerProps = ViewProps &
  VariantProps<typeof markerVariants> & {
    children?: ReactNode;
  };

const Marker = forwardRef<BridgeViewRef, MarkerProps>(
  ({ className, variant = "default", children, ...props }, ref) => (
    <MarkerContext.Provider value={variant}>
      <View
        ref={ref}
        className={cn(markerVariants({ variant }), className)}
        {...props}
      >
        {variant === "separator" && (
          <View aria-hidden className="h-px min-w-0 flex-1 bg-border" />
        )}
        {children}
        {variant === "separator" && (
          <View aria-hidden className="h-px min-w-0 flex-1 bg-border" />
        )}
      </View>
    </MarkerContext.Provider>
  ),
);
Marker.displayName = "Marker";

export type MarkerIconProps = ViewProps;

const MarkerIcon = forwardRef<BridgeViewRef, MarkerIconProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      aria-hidden
      className={cn("size-4 shrink-0 items-center justify-center", className)}
      {...props}
    />
  ),
);
MarkerIcon.displayName = "MarkerIcon";

export type MarkerContentProps = TextProps & {
  children?: ReactNode;
};

const MarkerContent = forwardRef<BridgeTextRef, MarkerContentProps>(
  ({ className, ...props }, ref) => {
    const variant = useContext(MarkerContext);
    return (
      <Text
        ref={ref}
        className={cn(
          "min-w-0 text-sm text-muted-foreground web:wrap-break-word",
          variant === "separator" && "flex-none text-center",
          className,
        )}
        {...props}
      />
    );
  },
);
MarkerContent.displayName = "MarkerContent";

export { Marker, MarkerIcon, MarkerContent, markerVariants };
