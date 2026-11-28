import { forwardRef } from "react";
import {
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const separatorVariants = cva("shrink-0 bg-border", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export type SeparatorProps = ViewProps &
  VariantProps<typeof separatorVariants> & {

    decorative?: boolean;
  };

const Separator = forwardRef<BridgeViewRef, SeparatorProps>(
  ({ className, orientation, decorative = true, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole={decorative ? undefined : "separator"}
      aria-hidden={decorative ? true : undefined}
      className={cn(separatorVariants({ orientation }), className)}
      {...props}
    />
  ),
);
Separator.displayName = "Separator";

export { Separator, separatorVariants };
