// Card — shadcn/ui new-york-v4 card를 UniKit UI 유니버설로 이식. 하위 5종 포함 총 6종 export.
// 포팅 판단:
// - Card의 text-card-foreground는 §0.5（상속 차단）로 자식 Text에 닿지 않아 클래스에서
//   제외 — 대신 CardTitle·Description 내부 Text에 전경색을 이중 지정한다.
// - 원본 헤더의 @container·grid·has-data-[slot=card-action] 셀렉터는 네이티브에 없어
//   flex-col items-start로 대응하고, [.border-b]:pb-6 조건 셀렉터는 미지원.
// - CardAction（col-start-2 등 헤더 grid 셀 배치 전용）은 헤더 grid 없이는 동작하지
//   않아 미이식 — 로드맵. 소비자는 헤더를 flex-row justify-between으로 조합해 대체.
// - CardFooter의 [.border-t]:pt-6 조건 셀렉터도 미지원（간격 필요 시 소비자가 지정）.
// - CardContent 안의 본문 텍스트는 사용처에서 색·폰트를 명시한다（§1.2 표기 규칙）.
import { forwardRef } from "react";
import {
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

// 원본 뼈대: flex flex-col gap-6 ... py-6 — 세로 패딩은 루트, 가로 패딩(px-6)은
// 헤더·콘텐츠·푸터가 담당하고 자식 사이 간격은 루트 gap-6가 낸다.
const cardVariants = cva(
  "flex flex-col gap-6 rounded-xl border border-border bg-card py-6",
);
const cardHeaderVariants = cva("flex flex-col items-start gap-2 px-6");
// 원본은 leading-none font-semibold뿐（크기 클래스 없음 — 상속 크기）. text-2xl·
// tracking-tight는 구버전 표류로 제거했고, text-foreground만 이중 지정 추가분이다.
const cardTitleVariants = cva("font-sans text-foreground leading-none font-semibold");
const cardDescriptionVariants = cva("font-sans text-sm text-muted-foreground");
const cardContentVariants = cva("px-6");
const cardFooterVariants = cva("flex flex-row items-center px-6");

export type CardProps = ViewProps;
export type CardHeaderProps = ViewProps;
export type CardTitleProps = TextProps;
export type CardDescriptionProps = TextProps;
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
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(cardHeaderVariants(), className)}
      {...props}
    />
  ),
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
  CardContent,
  CardFooter,
  cardVariants,
  cardHeaderVariants,
  cardTitleVariants,
  cardDescriptionVariants,
  cardContentVariants,
  cardFooterVariants,
};
