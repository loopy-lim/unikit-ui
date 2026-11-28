import { forwardRef, type ReactNode } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  Pressable,
  Text,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants, buttonTextVariants } from "./button";

const paginationVariants = cva("mx-auto w-full flex-row justify-center");
const paginationContentVariants = cva("flex-row items-center gap-1");

const paginationGlyphVariants = cva("text-base leading-none text-foreground");

const paginationLabelVariants = cva(
  "font-sans text-sm font-medium text-foreground web:whitespace-nowrap web:hidden web:sm:inline",
);
const paginationEllipsisVariants = cva(
  "h-9 w-9 flex-row items-center justify-center",
);
const paginationEllipsisTextVariants = cva(
  "text-base leading-none text-foreground",
);

const HIT_SLOP = {
  xs: 10,
  sm: 6,
  default: 4,
  lg: 2,
  icon: 4,
  "icon-xs": 10,
  "icon-sm": 6,
  "icon-lg": 2,
} as const;

export type PaginationProps = ViewProps;
export type PaginationContentProps = ViewProps;
export type PaginationItemProps = ViewProps;
export type PaginationEllipsisProps = ViewProps;

export type PaginationLinkProps = PressableProps &
  Pick<VariantProps<typeof buttonVariants>, "size"> & {

    isActive?: boolean;
    children?: ReactNode;
  };
export type PaginationPreviousProps = PaginationLinkProps & {

  label?: string;
};
export type PaginationNextProps = PaginationLinkProps & {

  label?: string;
};

const Pagination = forwardRef<BridgeViewRef, PaginationProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityLabel="pagination"
      className={cn(paginationVariants(), className)}
      {...props}
    />
  ),
);
Pagination.displayName = "Pagination";

const PaginationContent = forwardRef<BridgeViewRef, PaginationContentProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(paginationContentVariants(), className)}
      {...props}
    />
  ),
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = forwardRef<BridgeViewRef, PaginationItemProps>(
  ({ ...props }, ref) => <View ref={ref} {...props} />,
);
PaginationItem.displayName = "PaginationItem";

const PaginationLink = forwardRef<BridgePressableRef, PaginationLinkProps>(
  (
    { className, isActive, size = "icon", children, hitSlop, ...props },
    ref,
  ) => {
    const variant = isActive ? "outline" : "ghost";
    const resolvedSize = size ?? "icon";
    return (
      <Pressable
        ref={ref}
        accessibilityRole="link"
        aria-current={isActive ? "page" : undefined}
        hitSlop={hitSlop ?? HIT_SLOP[resolvedSize]}
        className={cn(
          buttonVariants({ variant, size }),

          isActive && "border-foreground/50",
          className,
        )}
        {...props}
      >
        {typeof children === "string" || typeof children === "number" ? (
          <Text className={cn(buttonTextVariants({ variant }))}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = forwardRef<
  BridgePressableRef,
  PaginationPreviousProps
>(({ className, label = "Previous", ...props }, ref) => (
  <PaginationLink
    ref={ref}
    accessibilityLabel="Go to previous page"
    size="default"
    className={cn("gap-1 px-2.5 web:sm:pl-2.5", className)}
    {...props}
  >
    <ChevronLeftIcon className="size-4" />
    <Text className={cn(paginationLabelVariants())}>{label}</Text>
  </PaginationLink>
));
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = forwardRef<BridgePressableRef, PaginationNextProps>(
  ({ className, label = "Next", ...props }, ref) => (
    <PaginationLink
      ref={ref}
      accessibilityLabel="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 web:sm:pr-2.5", className)}
      {...props}
    >
      <Text className={cn(paginationLabelVariants())}>{label}</Text>
      <ChevronRightIcon className="size-4" />
    </PaginationLink>
  ),
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = forwardRef<BridgeViewRef, PaginationEllipsisProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      aria-hidden
      className={cn(paginationEllipsisVariants(), className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4 text-muted-foreground" />
    </View>
  ),
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  paginationVariants,
  paginationContentVariants,
  paginationGlyphVariants,
  paginationLabelVariants,
  paginationEllipsisVariants,
  paginationEllipsisTextVariants,
};
