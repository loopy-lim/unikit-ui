import { forwardRef } from "react";
import {
  ChevronRightIcon,
  MoreHorizontalIcon,
  Pressable,
  Text,
  View,
  type BridgePressableRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

const breadcrumbListVariants = cva(

  "flex-row flex-wrap items-center gap-1.5 text-sm text-muted-foreground web:break-words web:sm:gap-2.5",
);
const breadcrumbItemVariants = cva("flex-row items-center gap-1.5");

const breadcrumbLinkVariants = cva("flex-row items-center");
const breadcrumbLinkTextVariants = cva(
  "font-sans text-sm text-muted-foreground web:transition-colors web:hover:text-foreground active:text-foreground",
);

const breadcrumbPageVariants = cva(
  "font-sans text-sm font-normal text-foreground",
);

const breadcrumbSeparatorVariants = cva("flex-row items-center");
const breadcrumbSeparatorTextVariants = cva(
  "font-sans text-sm leading-none text-muted-foreground",
);
const breadcrumbEllipsisVariants = cva(
  "h-9 w-9 flex-row items-center justify-center",
);
const breadcrumbEllipsisTextVariants = cva(
  "font-sans text-base leading-none text-muted-foreground",
);

export type BreadcrumbProps = ViewProps;
export type BreadcrumbListProps = ViewProps;
export type BreadcrumbItemProps = ViewProps;
export type BreadcrumbLinkProps = PressableProps;
export type BreadcrumbPageProps = TextProps;
export type BreadcrumbSeparatorProps = ViewProps;
export type BreadcrumbEllipsisProps = ViewProps;

const Breadcrumb = forwardRef<BridgeViewRef, BreadcrumbProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityLabel="breadcrumb"
      className={className}
      {...props}
    />
  ),
);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = forwardRef<BridgeViewRef, BreadcrumbListProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(breadcrumbListVariants(), className)}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = forwardRef<BridgeViewRef, BreadcrumbItemProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(breadcrumbItemVariants(), className)}
      {...props}
    />
  ),
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = forwardRef<BridgePressableRef, BreadcrumbLinkProps>(
  ({ className, children, ...props }, ref) => (
    <Pressable
      ref={ref}
      accessibilityRole="link"
      className={cn(breadcrumbLinkVariants(), className)}
      {...props}
    >
      <Text className={cn(breadcrumbLinkTextVariants())}>{children}</Text>
    </Pressable>
  ),
);
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = forwardRef<BridgeTextRef, BreadcrumbPageProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(breadcrumbPageVariants(), className)}
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = forwardRef<BridgeViewRef, BreadcrumbSeparatorProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      aria-hidden
      className={cn(breadcrumbSeparatorVariants(), className)}
      {...props}
    >
      {children ?? (
        <ChevronRightIcon className="size-3.5 text-muted-foreground" />
      )}
    </View>
  ),
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = forwardRef<BridgeViewRef, BreadcrumbEllipsisProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      aria-hidden
      className={cn(breadcrumbEllipsisVariants(), className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4 text-muted-foreground" />
    </View>
  ),
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  breadcrumbListVariants,
  breadcrumbItemVariants,
  breadcrumbLinkVariants,
  breadcrumbLinkTextVariants,
  breadcrumbPageVariants,
  breadcrumbSeparatorVariants,
  breadcrumbSeparatorTextVariants,
  breadcrumbEllipsisVariants,
  breadcrumbEllipsisTextVariants,
};
