// Badge — docs/sdd/02-design.md v2 §3.5 그대로.
// 이중 지정 원칙(§0.5): 배경·테두리는 View, 전경색은 내부 Text에 명시(Button과 동일 패턴).
import { forwardRef } from "react";
import {
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

// View(컨테이너)
const badgeVariants = cva(
  "flex flex-row items-center rounded-md border px-2.5 py-0.5",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary",
        secondary: "border-transparent bg-secondary",
        destructive: "border-transparent bg-destructive",
        outline: "border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// 내부 Text
const badgeTextVariants = cva("font-sans text-xs font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type BadgeProps = ViewProps &
  VariantProps<typeof badgeVariants>;

const Badge = forwardRef<BridgeViewRef, BadgeProps>(
  ({ className, variant, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      <Text className={cn(badgeTextVariants({ variant }))}>{children}</Text>
    </View>
  ),
);
Badge.displayName = "Badge";

export { Badge, badgeVariants, badgeTextVariants };
