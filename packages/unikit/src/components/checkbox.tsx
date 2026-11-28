import { forwardRef, useState } from "react";
import {
  CheckIcon,
  MinusIcon,
  Pressable,
  type BridgePressableRef,
  type PressableProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

export type CheckboxProps = Omit<PressableProps, "onPress" | "aria-checked"> & {

  checked?: boolean;

  defaultChecked?: boolean;

  onCheckedChange?: (checked: boolean) => void;

  indeterminate?: boolean;
};

const HIT_SLOP = 14;

const Checkbox = forwardRef<BridgePressableRef, CheckboxProps>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      onCheckedChange,
      indeterminate = false,
      disabled,
      hitSlop,
      ...props
    },
    ref,
  ) => {

    const [uncontrolled, setUncontrolled] = useState(defaultChecked);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : uncontrolled;

    const handlePress = () => {
      const next = !isChecked;
      if (!isControlled) setUncontrolled(next);
      onCheckedChange?.(next);
    };

    return (
      <Pressable
        ref={ref}
        accessibilityRole="checkbox"
        aria-checked={indeterminate ? "mixed" : isChecked}
        aria-disabled={disabled ? true : undefined}
        disabled={disabled}
        hitSlop={hitSlop ?? HIT_SLOP}
        onPress={handlePress}
        className={cn(
          "flex size-4 shrink-0 flex-row items-center justify-center rounded-sm border web:transition-colors web:outline-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",

          indeterminate || isChecked
            ? "border-primary bg-primary"
            : "border-foreground/50 dark:bg-input/30",
          disabled && "web:pointer-events-none web:cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >
        {
                                                         }
        {indeterminate ? (
          <MinusIcon className="size-3.5 text-primary-foreground" />
        ) : isChecked ? (
          <CheckIcon className="size-3.5 text-primary-foreground" />
        ) : null}
      </Pressable>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
