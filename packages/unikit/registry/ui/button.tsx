import { Children, forwardRef, type ReactNode } from "react";
import {
  Pressable,
  Text,
  type BridgePressableRef,
  type PressableProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex flex-row shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium web:select-none web:transition-all web:outline-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground web:hover:bg-primary/90 active:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground web:hover:bg-secondary/80 active:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground web:hover:bg-destructive/90 active:bg-destructive/90 web:focus-visible:ring-destructive/20",

        outline:
          "border border-border bg-background text-foreground web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
        ghost:
          "text-foreground web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
        link: "text-primary underline-offset-4 web:hover:underline",
      },

      size: {
        default: "h-9 px-4 py-2",
        xs: "h-6 gap-1 rounded-md px-2 text-xs",
        sm: "h-8 gap-1.5 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md text-xs",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva(
  "font-sans text-sm font-medium web:whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",

        destructive: "text-destructive-foreground",
        outline:
          "text-foreground active:text-accent-foreground web:hover:text-accent-foreground",
        ghost:
          "text-foreground active:text-accent-foreground web:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 web:hover:underline",
      },

      size: {
        default: "",
        xs: "text-xs",
        sm: "",
        lg: "",
        icon: "",
        "icon-xs": "text-xs",
        "icon-sm": "",
        "icon-lg": "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const HIT_SLOP = {
  xs: 10,
  sm: 6,
  default: 4,
  lg: 2,
  icon: 4,
  "icon-xs": 10,
  "icon-sm": 6,
  "icon-lg": 2,
} as const;

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    children?: ReactNode;
  };

const Button = forwardRef<BridgePressableRef, ButtonProps>(
  (
    { className, variant, size, disabled, hitSlop, children, ...props },
    ref,
  ) => {
    const resolvedSize = size ?? "default";
    const textClass = cn(buttonTextVariants({ variant, size }));
    const content = Children.map(children, (child) =>
      typeof child === "string" || typeof child === "number" ? (
        <Text className={textClass}>{child}</Text>
      ) : (
        child
      ),
    );
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={disabled}
        aria-disabled={disabled ? true : undefined}
        hitSlop={hitSlop ?? HIT_SLOP[resolvedSize]}
        className={cn(
          buttonVariants({ variant, size }),
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {content}
      </Pressable>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants, buttonTextVariants };
