import { forwardRef, useState } from "react";
import {
  animateLayout,
  Pressable,
  View,
  type BridgePressableRef,
  type PressableProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const switchTrackVariants = cva(
  "flex shrink-0 flex-row items-center rounded-full border border-transparent px-0.5 web:transition-all web:outline-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
  {
    variants: {
      size: {
        default: "h-4.5 w-8",
        sm: "h-3.5 w-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const switchThumbVariants = cva("rounded-full", {
  variants: {
    size: {
      default: "size-4",
      sm: "size-3",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export type SwitchProps = Omit<PressableProps, "onPress" | "aria-checked"> &
  VariantProps<typeof switchTrackVariants> & {

    checked?: boolean;

    defaultChecked?: boolean;

    onCheckedChange?: (checked: boolean) => void;
  };

const HIT_SLOP = { default: 13, sm: 15 } as const;

const Switch = forwardRef<BridgePressableRef, SwitchProps>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      onCheckedChange,
      disabled,
      size,
      hitSlop,
      ...props
    },
    ref,
  ) => {

    const [uncontrolled, setUncontrolled] = useState(defaultChecked);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : uncontrolled;
    const resolvedSize = size ?? "default";

    const handlePress = () => {
      animateLayout();
      const next = !isChecked;
      if (!isControlled) setUncontrolled(next);
      onCheckedChange?.(next);
    };

    return (
      <Pressable
        ref={ref}
        accessibilityRole="switch"
        aria-checked={isChecked}
        aria-disabled={disabled ? true : undefined}
        disabled={disabled}
        hitSlop={hitSlop ?? HIT_SLOP[resolvedSize]}
        onPress={handlePress}
        className={cn(
          switchTrackVariants({ size }),

          isChecked
            ? "justify-start bg-primary"
            : "justify-start bg-foreground/50",
          disabled && "web:pointer-events-none web:cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >

        <View
          aria-hidden
          className={cn(
            switchThumbVariants({ size }),
            "transition-transform duration-200",
            isChecked
              ? "bg-background dark:bg-primary-foreground"
              : "bg-background dark:bg-foreground",
          )}
          style={{
            translateX: isChecked ? (resolvedSize === "sm" ? 10 : 14) : 0,
          }}
        />
      </Pressable>
    );
  },
);
Switch.displayName = "Switch";

export { Switch, switchTrackVariants, switchThumbVariants };
