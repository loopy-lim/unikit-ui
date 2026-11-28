import { forwardRef } from "react";
import {
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";

export type ProgressProps = ViewProps & {

  value?: number;

  max?: number;
};

const Progress = forwardRef<BridgeViewRef, ProgressProps>(
  ({ className, value, max = 100, ...props }, ref) => {
    const scale = max > 0 ? max : 100;
    const percent = Math.min(100, Math.max(0, ((value ?? 0) / scale) * 100));
    return (

      <View
        ref={ref}
        accessibilityRole="progressbar"
        aria-valuenow={Math.round(value ?? 0)}
        aria-valuemin={0}
        aria-valuemax={scale}
        className={cn(

          "relative h-2 w-full overflow-hidden rounded-full bg-primary/50",
          className,
        )}
        {...props}
      >

        <View
          aria-hidden
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </View>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
