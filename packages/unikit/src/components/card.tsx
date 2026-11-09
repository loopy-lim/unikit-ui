// Card — docs/sdd/02-design.md v2 §3.2 그대로. 하위 컴포넌트 5종 포함 총 6종 export.
// Card의 text-card-foreground는 §0.5(상속 차단)로 자식 Text에 닿지 않아 클래스에서 제외됨.
// CardContent 안의 본문 텍스트는 사용처에서 색·폰트를 명시한다(§1.2 표기 규칙).
import { forwardRef, type ComponentProps } from "react";
import { Text, View, type TextInstance, type ViewInstance } from "react-native";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

const cardVariants = cva("rounded-xl border border-border bg-card shadow-sm");
const cardHeaderVariants = cva("flex flex-col gap-1.5 p-6");
const cardTitleVariants = cva(
  "font-sans text-foreground text-2xl web:tracking-tight font-semibold",
);
const cardDescriptionVariants = cva("font-sans text-sm text-muted-foreground");
const cardContentVariants = cva("p-6 pt-0");
const cardFooterVariants = cva("flex-row items-center gap-2 p-6 pt-0");

export type CardProps = ComponentProps<typeof View>;
export type CardHeaderProps = ComponentProps<typeof View>;
export type CardTitleProps = ComponentProps<typeof Text>;
export type CardDescriptionProps = ComponentProps<typeof Text>;
export type CardContentProps = ComponentProps<typeof View>;
export type CardFooterProps = ComponentProps<typeof View>;

const Card = forwardRef<ViewInstance, CardProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(cardVariants(), className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = forwardRef<ViewInstance, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(cardHeaderVariants(), className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<TextInstance, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(cardTitleVariants(), className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<TextInstance, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(cardDescriptionVariants(), className)}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<ViewInstance, CardContentProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(cardContentVariants(), className)}
      {...props}
    />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<ViewInstance, CardFooterProps>(
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
  CardContent,
  CardFooter,
  cardVariants,
  cardHeaderVariants,
  cardTitleVariants,
  cardDescriptionVariants,
  cardContentVariants,
  cardFooterVariants,
};
