import { forwardRef, useState, type ReactNode } from "react";
import {
  Pressable,
  Text,
  type BridgePressableRef,
  type PressableProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "flex flex-row items-center justify-center gap-2 rounded-md web:whitespace-nowrap web:transition-all web:outline-none web:hover:bg-muted web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent web:hover:bg-accent",
      },
      size: {
        default: "h-9 min-w-9 px-2",
        sm: "h-8 min-w-8 px-1.5",
        lg: "h-10 min-w-10 px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const toggleTextVariants = cva("font-sans text-sm font-medium", {
  variants: {
    variant: {
      default: "text-foreground web:hover:text-muted-foreground",
      outline: "text-foreground web:hover:text-accent-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const HIT_SLOP = { default: 4, sm: 4, lg: 0 } as const;

export type ToggleProps = Omit<PressableProps, "onPress" | "aria-pressed"> &
  VariantProps<typeof toggleVariants> & {

    pressed?: boolean;

    defaultPressed?: boolean;

    onPressedChange?: (pressed: boolean) => void;
    children?: ReactNode;
  };

const Toggle = forwardRef<BridgePressableRef, ToggleProps>(
  (
    {
      className,
      variant,
      size,
      pressed,
      defaultPressed = false,
      onPressedChange,
      disabled,
      hitSlop,
      children,
      ...props
    },
    ref,
  ) => {

    const [uncontrolled, setUncontrolled] = useState(defaultPressed);
    const isControlled = pressed !== undefined;
    const isPressed = isControlled ? pressed : uncontrolled;
    const resolvedSize = size ?? "default";

    const handlePress = () => {
      const next = !isPressed;
      if (!isControlled) setUncontrolled(next);
      onPressedChange?.(next);
    };

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        aria-pressed={isPressed}
        aria-disabled={disabled ? true : undefined}
        disabled={disabled}
        hitSlop={hitSlop ?? HIT_SLOP[resolvedSize]}
        onPress={handlePress}
        className={cn(
          toggleVariants({ variant, size }),

          isPressed && "bg-accent",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {

                                                               }
        {typeof children === "string" || typeof children === "number" ? (
          <Text
            className={cn(
              toggleTextVariants({ variant }),
              isPressed && "text-accent-foreground",
            )}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
Toggle.displayName = "Toggle";

export { Toggle, toggleVariants, toggleTextVariants };
