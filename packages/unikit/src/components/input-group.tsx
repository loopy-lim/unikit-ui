import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Text,
  View,
  type BridgePressableRef,
  type BridgeTextInputRef,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { Button, type ButtonProps } from "./button";
import { Input, type InputProps } from "./input";
import { Textarea, type TextareaProps } from "./textarea";
import { cn } from "../lib/utils";

type InputGroupAlign = "inline-start" | "inline-end" | "block-start" | "block-end";

type InputGroupAligns = {
  inlineStart: boolean;
  inlineEnd: boolean;
  blockStart: boolean;
  blockEnd: boolean;
};

const ALIGN_STATE_KEYS: Record<InputGroupAlign, keyof InputGroupAligns> = {
  "inline-start": "inlineStart",
  "inline-end": "inlineEnd",
  "block-start": "blockStart",
  "block-end": "blockEnd",
};

type InputGroupDerived = InputGroupAligns & {
  hasTextarea: boolean;
  hasInvalid: boolean;
};

function collectGroupChildren(children: ReactNode): InputGroupDerived {
  const derived: InputGroupDerived = {
    inlineStart: false,
    inlineEnd: false,
    blockStart: false,
    blockEnd: false,
    hasTextarea: false,
    hasInvalid: false,
  };
  Children.toArray(children).forEach((child) => {
    if (!isValidElement(child)) return;
    const props = child.props as {
      align?: InputGroupAlign | null;
      "aria-invalid"?: boolean;
    };
    if (child.type === InputGroupAddon) {
      const align = props.align ?? "inline-start";
      derived[ALIGN_STATE_KEYS[align]] = true;
    } else if (child.type === InputGroupTextarea) {
      derived.hasTextarea = true;
      if (props["aria-invalid"] === true) derived.hasInvalid = true;
    } else if (child.type === InputGroupInput) {
      if (props["aria-invalid"] === true) derived.hasInvalid = true;
    }
  });
  return derived;
}

type InputGroupContextValue = InputGroupDerived & {

  setFocused: (focused: boolean) => void;
};

const InputGroupContext = createContext<InputGroupContextValue | null>(null);

function wrapTextChildren(children: ReactNode, textClassName: string) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <Text className={textClassName}>{child}</Text>
    ) : (
      child
    ),
  );
}

export type InputGroupProps = ViewProps;

const InputGroup = forwardRef<BridgeViewRef, InputGroupProps>(
  ({ className, children, ...props }, ref) => {

    const derived = collectGroupChildren(children);
    const column = derived.blockStart || derived.blockEnd;

    const [focused, setFocused] = useState(false);
    const contextValue = useMemo<InputGroupContextValue>(
      () => ({ ...derived, setFocused }),
      [derived, setFocused],
    );
    return (
      <InputGroupContext.Provider value={contextValue}>
        <View
          ref={ref}
          accessibilityRole="group"
          className={cn(
            "relative w-full min-w-0 rounded-md border border-input web:transition-all web:outline-none",
            column ? "flex-col" : "flex-row items-center",

            column || derived.hasTextarea ? "min-h-9" : "h-9",

            derived.hasInvalid && "border-destructive web:ring-destructive/20",

            focused && "ring-1 ring-ring",
            className,
          )}
          {...props}
        >
          {children}
        </View>
      </InputGroupContext.Provider>
    );
  },
);
InputGroup.displayName = "InputGroup";

const inputGroupAddonVariants = cva(
  "flex flex-row h-auto items-center justify-center gap-2 py-1.5 web:cursor-text web:select-none",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3",
        "inline-end": "order-last pr-3",
        "block-start": "order-first w-full justify-start px-3 pt-3",
        "block-end": "order-last w-full justify-start px-3 pb-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

export type InputGroupAddonProps = ViewProps &
  VariantProps<typeof inputGroupAddonVariants>;

const InputGroupAddon = forwardRef<BridgeViewRef, InputGroupAddonProps>(
  ({ className, align = "inline-start", children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    >
      {wrapTextChildren(
        children,
        "font-sans text-sm font-medium text-muted-foreground",
      )}
    </View>
  ),
);
InputGroupAddon.displayName = "InputGroupAddon";

const inputGroupButtonVariants = cva("flex-row items-center gap-2", {
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-sm px-2",
      sm: "h-8 gap-1.5 rounded-md px-2.5",
      "icon-xs": "size-6 rounded-sm p-0",
      "icon-sm": "size-8 rounded-md p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

export type InputGroupButtonProps = Omit<ButtonProps, "size"> &
  VariantProps<typeof inputGroupButtonVariants>;

const InputGroupButton = forwardRef<BridgePressableRef, InputGroupButtonProps>(
  ({ className, variant = "ghost", size = "xs", ...props }, ref) => (

    <Button
      ref={ref}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  ),
);
InputGroupButton.displayName = "InputGroupButton";

export type InputGroupTextProps = ViewProps;

const InputGroupText = forwardRef<BridgeViewRef, InputGroupTextProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center gap-2", className)}
      {...props}
    >

      {wrapTextChildren(children, "font-sans text-sm text-muted-foreground")}
    </View>
  ),
);
InputGroupText.displayName = "InputGroupText";

export type InputGroupInputProps = InputProps;

const InputGroupInput = forwardRef<BridgeTextInputRef, InputGroupInputProps>(
  ({ className, onFocus, onBlur, ...props }, ref) => {
    const group = useContext(InputGroupContext);
    return (
      <Input
        ref={ref}
        {...props}
        onFocus={() => {
          group?.setFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          group?.setFocused(false);
          onBlur?.();
        }}
        className={cn(
          "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 web:shadow-none",

          group?.inlineStart && "pl-2",
          group?.inlineEnd && "pr-2",
          group?.blockStart && "pb-3",
          group?.blockEnd && "pt-3",
          className,
        )}
      />
    );
  },
);
InputGroupInput.displayName = "InputGroupInput";

export type InputGroupTextareaProps = TextareaProps;

const InputGroupTextarea = forwardRef<
  BridgeTextInputRef,
  InputGroupTextareaProps
>(({ className, onFocus, onBlur, ...props }, ref) => {
  const group = useContext(InputGroupContext);
  return (
    <Textarea
      ref={ref}
      {...props}
      onFocus={() => {
        group?.setFocused(true);
        onFocus?.();
      }}
      onBlur={() => {
        group?.setFocused(false);
        onBlur?.();
      }}
      className={cn(
        "min-h-0 min-w-0 flex-1 resize-none rounded-none border-0 bg-transparent px-3 py-3 web:shadow-none",
        group?.inlineStart && "pl-2",
        group?.inlineEnd && "pr-2",
        group?.blockStart && "pb-3",
        group?.blockEnd && "pt-3",
        className,
      )}
    />
  );
});
InputGroupTextarea.displayName = "InputGroupTextarea";

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
