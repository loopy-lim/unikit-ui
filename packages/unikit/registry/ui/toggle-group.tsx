import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Toggle, toggleVariants, type ToggleProps } from "./toggle";

type ToggleGroupContextValue = {
  type: "single" | "multiple";
  isSelected: (value: string) => boolean;
  onItemPress: (value: string) => void;
  variant: VariantProps<typeof toggleVariants>["variant"];
  size: VariantProps<typeof toggleVariants>["size"];
  disabled: boolean;
};

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  type: "single",
  isSelected: () => false,
  onItemPress: () => {},
  variant: "default",
  size: "default",
  disabled: false,
});

type ToggleGroupBaseProps = ViewProps &
  VariantProps<typeof toggleVariants> & {

    type?: "single" | "multiple";

    defaultValue?: string | string[];

    disabled?: boolean;
  };

export type ToggleGroupProps = ToggleGroupBaseProps &
  (
    | {
        type?: "single";
        value?: string;
        onValueChange?: (value: string) => void;
      }
    | {
        type: "multiple";
        value?: string[];
        onValueChange?: (value: string[]) => void;
      }
  );

const toArray = (v: string | string[] | undefined): string[] =>
  v === undefined || v === "" ? [] : Array.isArray(v) ? v : [v];

const ToggleGroup = forwardRef<BridgeViewRef, ToggleGroupProps>(
  (
    {
      className,
      variant,
      size,
      type = "single",
      value,
      defaultValue,
      onValueChange,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = useState(() =>
      toArray(defaultValue),
    );
    const isControlled = value !== undefined;
    const selected = useMemo(
      () => (isControlled ? toArray(value) : uncontrolled),
      [isControlled, value, uncontrolled],
    );
    const selectedRef = useRef(selected);
    selectedRef.current = selected;

    const isSelected = useCallback(
      (itemValue: string) => selected.includes(itemValue),
      [selected],
    );

    const handleItemPress = useCallback(
      (itemValue: string) => {
        const current = selectedRef.current;
        if (type === "multiple") {
          const next = current.includes(itemValue)
            ? current.filter((v) => v !== itemValue)
            : [...current, itemValue];
          if (!isControlled) setUncontrolled(next);
          if (onValueChange) {

            (onValueChange as (value: string[]) => void)(next);
          }
          return;
        }

        const next = current[0] === itemValue ? [] : [itemValue];
        if (!isControlled) setUncontrolled(next);
        if (onValueChange) {
          (onValueChange as (value: string) => void)(next[0] ?? "");
        }
      },
      [type, isControlled, onValueChange],
    );

    const contextValue = useMemo(
      () => ({
        type,
        isSelected,
        onItemPress: handleItemPress,
        variant,
        size,
        disabled,
      }),
      [type, isSelected, handleItemPress, variant, size, disabled],
    );

    return (
      <View
        ref={ref}
        className={cn(

          "flex native:self-start web:w-fit flex-row items-center gap-1 rounded-md",
          className,
        )}
        {...props}
      >
        <ToggleGroupContext.Provider value={contextValue}>
          {children}
        </ToggleGroupContext.Provider>
      </View>
    );
  },
);
ToggleGroup.displayName = "ToggleGroup";

export type ToggleGroupItemProps = Omit<
  ToggleProps,
  "pressed" | "defaultPressed" | "onPressedChange"
> & {

  value: string;
};

const ToggleGroupItem = forwardRef<BridgePressableRef, ToggleGroupItemProps>(
  (
    { className, variant, size, disabled, value, children, ...props },
    ref,
  ) => {
    const group = useContext(ToggleGroupContext);
    const isPressed = group.isSelected(value);
    const isDisabled = disabled || group.disabled;
    const onItemPress = group.onItemPress;
    const handlePressedChange = useCallback(
      () => onItemPress(value),
      [onItemPress, value],
    );

    return (
      <Toggle
        ref={ref}
        variant={group.variant ?? variant}
        size={group.size ?? size}
        pressed={isPressed}
        onPressedChange={handlePressedChange}
        disabled={isDisabled}
        className={cn(

          "w-auto min-w-0 shrink-0 px-3 web:focus:z-10 web:focus-visible:z-10",
          className,
        )}
        {...props}
      >
        {children}
      </Toggle>
    );
  },
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
