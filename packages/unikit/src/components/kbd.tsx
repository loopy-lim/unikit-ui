import { forwardRef } from "react";
import {
  Text,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

const kbdVariants = cva(
  "flex-row h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 web:pointer-events-none web:select-none",
);

const kbdTextVariants = cva(
  "font-sans text-xs font-medium text-muted-foreground",
);

const kbdGroupVariants = cva("flex-row native:self-start web:w-fit items-center gap-1");

export type KbdProps = ViewProps;
export type KbdGroupProps = ViewProps;

const Kbd = forwardRef<BridgeViewRef, KbdProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(kbdVariants(), className)}
      {...props}
    >
      <Text className={cn(kbdTextVariants())}>{children}</Text>
    </View>
  ),
);
Kbd.displayName = "Kbd";

const KbdGroup = forwardRef<BridgeViewRef, KbdGroupProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(kbdGroupVariants(), className)}
      {...props}
    />
  ),
);
KbdGroup.displayName = "KbdGroup";

export { Kbd, KbdGroup, kbdVariants, kbdTextVariants, kbdGroupVariants };
