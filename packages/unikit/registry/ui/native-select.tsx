import { forwardRef, type ReactNode } from "react";
import {
  ChevronDownIcon,
  Select,
  SelectOptGroup,
  SelectOption,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const nativeSelectVariants = cva(
  "w-full min-w-0 web:appearance-none rounded-md border border-input bg-transparent px-3 text-sm text-foreground web:transition-all web:outline-none web:selection:bg-primary web:selection:text-primary-foreground web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
);

export type NativeSelectProps = ViewProps & {

  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;

  size?: "sm" | "default";

  invalid?: boolean;
};

const NativeSelect = forwardRef<BridgeViewRef, NativeSelectProps>(
  (
    {
      className,
      size = "default",
      invalid,
      value,
      defaultValue,
      onValueChange,
      disabled,
      accessibilityLabel,
      nativeID,
      testID,
      children,
    },
    ref,
  ) => (
    <View
      ref={ref}

      className={cn("relative native:self-start web:w-fit", disabled && "opacity-50")}
    >
      <Select
        className={cn(
          nativeSelectVariants(),
          size === "sm" ? "h-8 py-1" : "h-9 py-2",

          "pr-9",
          invalid && "border-destructive web:focus-visible:ring-destructive/20",
          disabled && "web:pointer-events-none web:cursor-not-allowed",
          className,
        )}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        nativeID={nativeID}
        testID={testID}
      >
        {children}
      </Select>
      {
                                                                           }
      <View
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 right-3.5 items-center justify-center"
      >
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground opacity-50 web:select-none" />
      </View>
    </View>
  ),
);
NativeSelect.displayName = "NativeSelect";

export type NativeSelectOptionProps = {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
};

const NativeSelectOption = forwardRef<BridgeViewRef, NativeSelectOptionProps>(
  ({ value, disabled, children }, _ref) => (
    <SelectOption value={value} disabled={disabled}>
      {children}
    </SelectOption>
  ),
);
NativeSelectOption.displayName = "NativeSelectOption";

export type NativeSelectOptGroupProps = {

  label?: string;
  disabled?: boolean;
  children?: ReactNode;
};

const NativeSelectOptGroup = forwardRef<
  BridgeViewRef,
  NativeSelectOptGroupProps
>(({ label = "", disabled, children }, _ref) => (
  <SelectOptGroup label={label} disabled={disabled}>
    {children}
  </SelectOptGroup>
));
NativeSelectOptGroup.displayName = "NativeSelectOptGroup";

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
