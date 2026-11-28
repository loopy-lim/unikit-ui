import { forwardRef } from "react";
import {
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

export type AspectRatioProps = ViewProps & {

  ratio?: number;
};

const AspectRatio = forwardRef<BridgeViewRef, AspectRatioProps>(
  ({ ratio = 1, className, style, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("overflow-hidden", className)}

      style={{ ...style, aspectRatio: ratio }}
      {...props}
    >
      {children}
    </View>
  ),
);
AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
