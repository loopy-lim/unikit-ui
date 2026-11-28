import { Children, forwardRef } from "react";
import {
  Pressable,
  Text,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "flex flex-row native:self-start web:w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium web:transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        ghost: "text-foreground",
        link: "text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const badgeInteractiveVariants = cva(
  "web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "web:hover:bg-primary/90 active:bg-primary/90",
        secondary: "web:hover:bg-secondary/90 active:bg-secondary/90",
        destructive: "web:hover:bg-destructive/90 active:bg-destructive/90",
        outline:
          "web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
        ghost:
          "web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
        link: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const badgeTextVariants = cva(
  "font-sans text-xs font-medium web:whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",

        destructive: "text-destructive-foreground",
        outline: "text-foreground",
        ghost: "text-foreground",
        link: "text-primary underline-offset-4 web:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const badgeInteractiveTextVariants = cva("", {
  variants: {
    variant: {
      default: "",
      secondary: "",
      destructive: "",
      outline: "web:hover:text-accent-foreground active:text-accent-foreground",
      ghost: "web:hover:text-accent-foreground active:text-accent-foreground",
      link: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type BadgeProps = ViewProps &
  VariantProps<typeof badgeVariants> & {

    onPress?: () => void;
  };

const Badge = forwardRef<BridgeViewRef, BadgeProps>(
  ({ className, variant, onPress, children, ...props }, ref) => {
    const interactive = onPress !== undefined;
    const textClass = cn(
      badgeTextVariants({ variant }),
      interactive && badgeInteractiveTextVariants({ variant }),
    );
    const content = Children.map(children, (child) =>
      typeof child === "string" || typeof child === "number" ? (
        <Text className={textClass}>{child}</Text>
      ) : (
        child
      ),
    );
    if (!interactive) {
      return (
        <View
          ref={ref}
          className={cn(badgeVariants({ variant }), className)}
          {...props}
        >
          {content}
        </View>
      );
    }
    return (
      <Pressable
        ref={ref}
        accessibilityRole="link"
        onPress={onPress}
        className={cn(
          badgeVariants({ variant }),
          badgeInteractiveVariants({ variant }),
          className,
        )}
        {...props}
      >
        {content}
      </Pressable>
    );
  },
);
Badge.displayName = "Badge";

export {
  Badge,
  badgeVariants,
  badgeInteractiveVariants,
  badgeTextVariants,
  badgeInteractiveTextVariants,
};
