import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

type RadioGroupContextValue = {

  value: string;

  disabled: boolean;

  onItemPress: (value: string) => void;
};

const RadioGroupContext = createContext<RadioGroupContextValue>({
  value: "",
  disabled: false,
  onItemPress: () => {},
});

export type RadioGroupProps = ViewProps & {

  value?: string;

  defaultValue?: string;

  onValueChange?: (value: string) => void;

  disabled?: boolean;
};

const RadioGroup = forwardRef<BridgeViewRef, RadioGroupProps>(
  (
    {
      className,
      value,
      defaultValue = "",
      onValueChange,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {

    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const isControlled = value !== undefined;
    const selectedValue = isControlled ? value : uncontrolled;

    const handleItemPress = useCallback(
      (itemValue: string) => {
        if (!isControlled) setUncontrolled(itemValue);
        onValueChange?.(itemValue);
      },
      [isControlled, onValueChange],
    );

    const contextValue = useMemo(
      () => ({
        value: selectedValue,
        disabled,
        onItemPress: handleItemPress,
      }),
      [selectedValue, disabled, handleItemPress],
    );

    return (
      <View
        ref={ref}
        accessibilityRole="radiogroup"
        className={cn("gap-3", className)}
        {...props}
      >
        <RadioGroupContext.Provider value={contextValue}>
          {children}
        </RadioGroupContext.Provider>
      </View>
    );
  },
);
RadioGroup.displayName = "RadioGroup";

const HIT_SLOP = 14;

export type RadioGroupItemProps = Omit<
  PressableProps,
  "onPress" | "aria-checked"
> & {

  value: string;
};

const RadioGroupItem = forwardRef<BridgePressableRef, RadioGroupItemProps>(
  ({ className, value, disabled, hitSlop, ...props }, ref) => {
    const group = useContext(RadioGroupContext);
    const isChecked = group.value === value;
    const isDisabled = disabled || group.disabled;

    return (
      <Pressable
        ref={ref}
        accessibilityRole="radio"
        aria-checked={isChecked}
        aria-disabled={isDisabled ? true : undefined}
        disabled={isDisabled}
        hitSlop={hitSlop ?? HIT_SLOP}
        onPress={() => group.onItemPress(value)}
        className={cn(

          "flex size-4 shrink-0 flex-row items-center justify-center rounded-full border border-foreground/50 web:transition-all web:outline-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
          isDisabled &&
            "web:pointer-events-none web:cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >
        {
                                                }
        {isChecked ? (
          <View aria-hidden className="size-2 rounded-full bg-primary" />
        ) : null}
      </Pressable>
    );
  },
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
