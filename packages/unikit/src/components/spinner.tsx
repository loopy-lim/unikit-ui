import { forwardRef } from "react";
import {
  Loader2Icon,
  LoopRotate,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

const spinnerVariants = cva("size-4 text-foreground");

export type SpinnerProps = ViewProps;

const Spinner = forwardRef<BridgeViewRef, SpinnerProps>(
  ({ className, accessibilityLabel = "Loading", ...props }, ref) => (
    <LoopRotate>
      <View
        ref={ref}
        accessibilityRole="status"
        accessibilityLabel={accessibilityLabel}
        className="items-center justify-center"
        {...props}
      >
        <Loader2Icon
          className={cn(spinnerVariants(), "web:animate-spin", className)}
          aria-hidden
        />
      </View>
    </LoopRotate>
  ),
);
Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };
