import { createContext, forwardRef, useContext } from "react";
import {
  AlertCircleIcon,
  InfoIcon,
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const alertVariants = cva(
  "relative w-full flex-row items-start gap-3 rounded-lg border px-4 py-3",
  {
    variants: {
      variant: {
        default: "bg-card",

        destructive: "bg-card",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const alertGlyphVariants = cva("text-base leading-none", {
  variants: {
    variant: {
      default: "text-card-foreground",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const alertTitleVariants = cva(
  "font-sans text-sm font-medium leading-none web:line-clamp-1 web:tracking-tight",
  {
    variants: {
      variant: {
        default: "text-card-foreground",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const alertDescriptionVariants = cva(
  "font-sans text-sm text-muted-foreground",
  {
    variants: {
      variant: {
        default: "",
        destructive: "text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const AlertContext = createContext<
  NonNullable<VariantProps<typeof alertVariants>["variant"]>
>("default");

export type AlertProps = ViewProps & VariantProps<typeof alertVariants>;
export type AlertTitleProps = TextProps;
export type AlertDescriptionProps = TextProps;

const Alert = forwardRef<BridgeViewRef, AlertProps>(
  ({ className, variant, children, ...props }, ref) => (
    <AlertContext.Provider value={variant ?? "default"}>
      <View
        ref={ref}
        accessibilityRole="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <View aria-hidden className="mt-0.5 shrink-0">
          {variant === "destructive" ? (
            <AlertCircleIcon className="size-4 text-destructive" />
          ) : (
            <InfoIcon className="size-4 text-foreground" />
          )}
        </View>
        <View className="flex flex-col gap-0.5">{children}</View>
      </View>
    </AlertContext.Provider>
  ),
);
Alert.displayName = "Alert";

const AlertTitle = forwardRef<BridgeTextRef, AlertTitleProps>(
  ({ className, ...props }, ref) => {
    const variant = useContext(AlertContext);
    return (
      <Text
        ref={ref}
        className={cn(alertTitleVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = forwardRef<BridgeTextRef, AlertDescriptionProps>(
  ({ className, ...props }, ref) => {
    const variant = useContext(AlertContext);
    return (
      <Text
        ref={ref}
        className={cn(alertDescriptionVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
AlertDescription.displayName = "AlertDescription";

export {
  Alert,
  AlertTitle,
  AlertDescription,
  alertVariants,
  alertGlyphVariants,
  alertTitleVariants,
  alertDescriptionVariants,
};
