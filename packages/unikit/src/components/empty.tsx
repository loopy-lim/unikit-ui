import { forwardRef, type ReactNode } from "react";
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

export type EmptyProps = ViewProps;

const Empty = forwardRef<BridgeViewRef, EmptyProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center web:text-balance web:md:p-12",
        className,
      )}
      {...props}
    />
  ),
);
Empty.displayName = "Empty";

export type EmptyHeaderProps = ViewProps;

const EmptyHeader = forwardRef<BridgeViewRef, EmptyHeaderProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex max-w-sm flex-col items-center gap-2 text-center",
        className,
      )}
      {...props}
    />
  ),
);
EmptyHeader.displayName = "EmptyHeader";

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-10 rounded-lg bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type EmptyMediaProps = ViewProps &
  VariantProps<typeof emptyMediaVariants> & {

    children?: ReactNode;
  };

const EmptyMedia = forwardRef<BridgeViewRef, EmptyMediaProps>(
  ({ className, variant, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    >
      <Text className="font-sans text-2xl leading-none text-foreground">
        {children}
      </Text>
    </View>
  ),
);
EmptyMedia.displayName = "EmptyMedia";

export type EmptyTitleProps = TextProps & {
  children?: ReactNode;
};

const EmptyTitle = forwardRef<BridgeTextRef, EmptyTitleProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "font-sans text-lg font-medium text-foreground text-center web:tracking-tight",
        className,
      )}
      {...props}
    />
  ),
);
EmptyTitle.displayName = "EmptyTitle";

export type EmptyDescriptionProps = TextProps & {
  children?: ReactNode;
};

const EmptyDescription = forwardRef<BridgeTextRef, EmptyDescriptionProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "font-sans text-sm leading-relaxed text-center text-muted-foreground web:text-balance",
        className,
      )}
      {...props}
    />
  ),
);
EmptyDescription.displayName = "EmptyDescription";

export type EmptyContentProps = ViewProps;

const EmptyContent = forwardRef<BridgeViewRef, EmptyContentProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex min-w-0 w-full max-w-sm flex-col items-center gap-4 text-sm web:text-balance",
        className,
      )}
      {...props}
    />
  ),
);
EmptyContent.displayName = "EmptyContent";

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};
