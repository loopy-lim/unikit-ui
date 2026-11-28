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

import { cn } from "@/lib/utils";

export type ItemGroupProps = ViewProps;

const ItemGroup = forwardRef<BridgeViewRef, ItemGroupProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="list"
      className={cn("flex flex-col", className)}
      {...props}
    />
  ),
);
ItemGroup.displayName = "ItemGroup";

export type ItemSeparatorProps = ViewProps;

const ItemSeparator = forwardRef<BridgeViewRef, ItemSeparatorProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("h-px w-full bg-border", className)}
      {...props}
    />
  ),
);
ItemSeparator.displayName = "ItemSeparator";

const itemVariants = cva(

  "flex flex-row flex-wrap items-center rounded-md border border-transparent text-sm web:transition-colors web:duration-100 web:outline-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50",
      },
      size: {
        default: "gap-4 p-4",
        sm: "gap-2.5 px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ItemProps = ViewProps & VariantProps<typeof itemVariants>;

const Item = forwardRef<BridgeViewRef, ItemProps>(
  ({ className, variant, size, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(itemVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Item.displayName = "Item";

const itemMediaVariants = cva(
  "flex flex-row shrink-0 items-center justify-center gap-2",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-8 rounded-sm border border-border bg-muted",
        image: "size-10 overflow-hidden rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type ItemMediaProps = ViewProps &
  VariantProps<typeof itemMediaVariants>;

const ItemMedia = forwardRef<BridgeViewRef, ItemMediaProps>(
  ({ className, variant, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(itemMediaVariants({ variant }), className)}
      {...props}
    />
  ),
);
ItemMedia.displayName = "ItemMedia";

export type ItemContentProps = ViewProps;

const ItemContent = forwardRef<BridgeViewRef, ItemContentProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex flex-1 flex-col gap-1", className)}
      {...props}
    />
  ),
);
ItemContent.displayName = "ItemContent";

export type ItemTitleProps = TextProps;

const ItemTitle = forwardRef<BridgeTextRef, ItemTitleProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "w-fit font-sans text-sm font-medium leading-snug text-foreground",
        className,
      )}
      {...props}
    />
  ),
);
ItemTitle.displayName = "ItemTitle";

export type ItemDescriptionProps = TextProps;

const ItemDescription = forwardRef<BridgeTextRef, ItemDescriptionProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "font-sans text-sm font-normal leading-normal text-muted-foreground web:line-clamp-2 web:text-balance",
        className,
      )}
      {...props}
    />
  ),
);
ItemDescription.displayName = "ItemDescription";

export type ItemActionsProps = ViewProps;

const ItemActions = forwardRef<BridgeViewRef, ItemActionsProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex flex-row items-center gap-2", className)}
      {...props}
    />
  ),
);
ItemActions.displayName = "ItemActions";

export type ItemHeaderProps = ViewProps;

const ItemHeader = forwardRef<BridgeViewRef, ItemHeaderProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex flex-row basis-full items-center justify-between gap-2",
        className,
      )}
      {...props}
    />
  ),
);
ItemHeader.displayName = "ItemHeader";

export type ItemFooterProps = ViewProps;

const ItemFooter = forwardRef<BridgeViewRef, ItemFooterProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex flex-row basis-full items-center justify-between gap-2",
        className,
      )}
      {...props}
    />
  ),
);
ItemFooter.displayName = "ItemFooter";

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
};
