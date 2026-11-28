import { forwardRef } from "react";
import {
  Platform,
  TextInput,
  type BridgeTextInputRef,
  type TextInputProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "font-sans h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base text-foreground web:transition-all web:outline-none web:selection:bg-primary web:selection:text-primary-foreground web:md:text-sm web:disabled:cursor-not-allowed placeholder:text-muted-foreground dark:bg-input/30 focus:border-ring focus:ring-3 focus:ring-ring/50 web:focus-visible:border-ring disabled:opacity-50",
  {
    variants: {

      type: {
        file: "web:file:inline-flex web:file:h-7 web:file:border-0 web:file:bg-transparent web:file:text-sm web:file:font-medium web:file:text-foreground",
      },
    },
  },
);

export type InputProps = TextInputProps & {

  type?: string;
};

const Input = forwardRef<BridgeTextInputRef, InputProps>(
  ({ className, type, disabled, editable, ...props }, ref) => (
    <TextInput
      ref={ref}

      {...(type !== undefined && Platform.OS === "web" ? { type } : {})}
      editable={disabled ? false : editable}
      aria-disabled={disabled ? true : undefined}
      className={cn(
        inputVariants({ type: type === "file" ? "file" : undefined }),
        className,
      )}
      {...props}

      disabled={disabled}
    />
  ),
);
Input.displayName = "Input";

export { Input, inputVariants };
