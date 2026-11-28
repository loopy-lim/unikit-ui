import { forwardRef } from "react";
import {
  LoopPulse,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const skeletonVariants = cva(
  "rounded-md bg-accent web:animate-pulse",
);

export type SkeletonProps = ViewProps;

const Skeleton = forwardRef<BridgeViewRef, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <LoopPulse>
      <View
        ref={ref}
        className={cn(skeletonVariants(), className)}
        {...props}
      />
    </LoopPulse>
  ),
);
Skeleton.displayName = "Skeleton";

export { Skeleton, skeletonVariants };
