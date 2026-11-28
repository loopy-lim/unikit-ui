import { Children, forwardRef, isValidElement, type ReactNode } from "react";
import {
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

const cardVariants = cva(
  "flex flex-col gap-6 rounded-xl border border-border bg-card py-6",
);
const cardHeaderVariants = cva("flex flex-col items-start gap-2 px-6");

const cardHeaderActionVariants = cva(
  "flex flex-row items-start justify-between gap-2 px-6",
);

const cardActionVariants = cva("flex flex-col self-start");

const cardTitleVariants = cva("font-sans text-foreground leading-none font-semibold");
const cardDescriptionVariants = cva("font-sans text-sm text-muted-foreground");
const cardContentVariants = cva("px-6");
const cardFooterVariants = cva("flex flex-row items-center px-6");

export type CardProps = ViewProps;
export type CardHeaderProps = ViewProps;
export type CardTitleProps = TextProps;
export type CardDescriptionProps = TextProps;
export type CardActionProps = ViewProps;
export type CardContentProps = ViewProps;
export type CardFooterProps = ViewProps;

const Card = forwardRef<BridgeViewRef, CardProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(cardVariants(), className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = forwardRef<BridgeViewRef, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {

    const isCardAction = (child: ReactNode) =>
      isValidElement(child) && child.type === CardAction;
    const items = Children.toArray(children);
    const actions = items.filter(isCardAction);
    const content = items.filter((child) => !isCardAction(child));
    return (
      <View
        ref={ref}
        className={cn(
          actions.length > 0
            ? cardHeaderActionVariants()
            : cardHeaderVariants(),
          className,
        )}
        {...props}
      >
        {actions.length > 0 ? (
          <>

            <View className="flex flex-col items-start gap-2">{content}</View>
            {actions}
          </>
        ) : (
          children
        )}
      </View>
    );
  },
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<BridgeTextRef, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(cardTitleVariants(), className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<BridgeTextRef, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(cardDescriptionVariants(), className)}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

const CardAction = forwardRef<BridgeViewRef, CardActionProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(cardActionVariants(), className)}
      {...props}
    />
  ),
);
CardAction.displayName = "CardAction";

const CardContent = forwardRef<BridgeViewRef, CardContentProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(cardContentVariants(), className)}
      {...props}
    />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<BridgeViewRef, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(cardFooterVariants(), className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  cardVariants,
  cardHeaderVariants,
  cardHeaderActionVariants,
  cardTitleVariants,
  cardDescriptionVariants,
  cardActionVariants,
  cardContentVariants,
  cardFooterVariants,
};
