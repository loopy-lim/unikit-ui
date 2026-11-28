import { forwardRef } from "react";
import {
  TextInput,
  type BridgeTextInputRef,
  type TextInputProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

const textareaVariants = cva(
  "font-sans min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50 web:focus-visible:border-ring web:field-sizing-content web:transition-all web:outline-none web:md:text-sm",
);

const textareaInvalidClasses =
  "border-destructive focus:border-destructive focus:ring-destructive/20";

export type TextareaProps = TextInputProps & {

  invalid?: boolean;
};

const Textarea = forwardRef<BridgeTextInputRef, TextareaProps>(
  ({ className, disabled, editable, invalid, ...props }, ref) => (
    <TextInput
      ref={ref}
      multiline
      editable={disabled ? false : editable}
      aria-disabled={disabled ? true : undefined}
      className={cn(
        textareaVariants(),
        invalid && textareaInvalidClasses,
        disabled && "opacity-50 web:cursor-not-allowed",
        className,
      )}
      {...props}

      disabled={disabled}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
