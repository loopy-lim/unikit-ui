import { forwardRef } from "react";
import { Text, type BridgeTextRef, type TextProps } from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(

  "font-sans text-sm font-medium leading-none text-foreground web:select-none",
);

export type LabelProps = TextProps;

const Label = forwardRef<BridgeTextRef, LabelProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label, labelVariants };
