import { createContext, forwardRef, useContext, useState } from "react";
import {
  LoopPulse,
  MinusIcon,
  Text,
  TextInput,
  View,
  type BridgeTextInputRef,
  type BridgeViewRef,
  type TextInputProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

type OTPSlotState = {
  char?: string;
  hasFakeCaret: boolean;
  isActive: boolean;
};

type InputOTPContextValue = {
  slots: OTPSlotState[];
  invalid: boolean;
};

const InputOTPContext = createContext<InputOTPContextValue | null>(null);

export type InputOTPProps = ViewProps & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;

  maxLength: number;

  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  inputMode?: TextInputProps["inputMode"];

  autoComplete?: string;

  accessibilityLabelledBy?: string;

  invalid?: boolean;

  containerClassName?: string;
};

const InputOTP = forwardRef<BridgeTextInputRef, InputOTPProps>(
  (
    {
      className,
      style,
      containerClassName,
      value,
      defaultValue,
      onChange,
      onComplete,
      maxLength,
      disabled,
      autoFocus,
      inputMode,
      autoComplete,
      invalid,
      nativeID,
      testID,
      accessibilityLabelledBy,
      children,
      ...props
    },
    ref,
  ) => {
    const cellCount = Math.max(1, maxLength);

    const [internalValue, setInternalValue] = useState(defaultValue ?? "");
    const [focused, setFocused] = useState(Boolean(autoFocus));
    const current = value ?? internalValue;
    const commit = (text: string) => {
      const next = text.slice(0, cellCount);
      if (value === undefined) setInternalValue(next);
      if (next !== current) {
        onChange?.(next);
        if (next.length === cellCount) onComplete?.(next);
      }
    };

    const insertion = Math.min(current.length, cellCount - 1);
    const slots = Array.from({ length: cellCount }, (_, index) => ({
      char: current[index],
      isActive: focused && index === insertion,
      hasFakeCaret: focused && index === insertion && !current[index] && !disabled,
    }));
    return (
      <InputOTPContext.Provider
        value={{ slots, invalid: invalid ?? false }}
      >
        <View
          className={cn(

            "relative flex-row items-center gap-2",
            disabled && "opacity-50",
            containerClassName,
          )}
          style={style}
          {...props}
        >
          {children}
          {
                                                           }
          <TextInput
            ref={ref}
            className={cn(
              "absolute inset-0 bg-transparent opacity-0 web:cursor-default",
              className,
            )}
            value={current}
            onChangeText={commit}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={cellCount}
            editable={disabled ? false : undefined}
            disabled={disabled}
            autoFocus={autoFocus}
            inputMode={inputMode}
            autoComplete={autoComplete}
            nativeID={nativeID}
            testID={testID}
            accessibilityLabelledBy={accessibilityLabelledBy}
            aria-invalid={invalid ? true : undefined}
          />
        </View>
      </InputOTPContext.Provider>
    );
  },
);
InputOTP.displayName = "InputOTP";

const inputOTPGroupVariants = cva("flex-row items-center");

export type InputOTPGroupProps = ViewProps;

const InputOTPGroup = forwardRef<BridgeViewRef, InputOTPGroupProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(inputOTPGroupVariants(), className)}
      {...props}
    />
  ),
);
InputOTPGroup.displayName = "InputOTPGroup";

export type InputOTPSlotProps = ViewProps & {
  index: number;
};

const InputOTPSlot = forwardRef<BridgeViewRef, InputOTPSlotProps>(
  ({ index, className, ...props }, ref) => {

    const otp = useContext(InputOTPContext);
    const { char, hasFakeCaret, isActive } = otp?.slots[index] ?? {};
    const cellCount = otp?.slots.length ?? 0;
    return (
      <View
        ref={ref}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center border-y border-r border-input web:transition-all web:outline-none",

          index === 0 && "rounded-l-md border-l",
          cellCount > 0 && index === cellCount - 1 && "rounded-r-md",
          isActive && "z-10 border-ring ring-3 ring-ring/50",
          otp?.invalid && "border-destructive",
          isActive && otp?.invalid && "ring-destructive/20",
          className,
        )}
        {...props}
      >
        {char ? (
          <Text className="font-sans text-sm text-foreground">{char}</Text>
        ) : null}
        {hasFakeCaret && (
          <View
            aria-hidden
            className="absolute inset-0 items-center justify-center"
          >
            {
                                                         }
            <LoopPulse durationMs={1250}>
              <View className="h-4 w-px bg-foreground" />
            </LoopPulse>
          </View>
        )}
      </View>
    );
  },
);
InputOTPSlot.displayName = "InputOTPSlot";

export type InputOTPSeparatorProps = ViewProps;

const InputOTPSeparator = forwardRef<BridgeViewRef, InputOTPSeparatorProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="separator"
      className={cn("flex-row items-center", className)}
      {...props}
    >
      <MinusIcon className="size-4 text-muted-foreground web:select-none" />
    </View>
  ),
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
