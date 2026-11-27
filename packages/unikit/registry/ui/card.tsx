// Card — shadcn/ui new-york-v4 card를 UniKit UI 유니버설로 이식. 하위 6종 포함 총 7종 export.
// 포팅 판단:
// - Card의 text-card-foreground는 §0.5（상속 차단）로 자식 Text에 닿지 않아 클래스에서
//   제외 — 대신 CardTitle·Description 내부 Text에 전경색을 이중 지정한다.
// - 원본 헤더의 @container·grid·has-data-[slot=card-action] 셀렉터는 네이티브에 없어
//   flex-col items-start로 대응하고, [.border-b]:pb-6 조건 셀렉터는 미지원.
// - CardAction（잔여 갭 해소）: 원본 col-start-2 row-span-2 self-start justify-self-end
//   （헤더 grid의 액션 슬롯 — @container 쿼리라 재현 불가）을 타입 동일 자식 감지
//   （select.tsx 관행 — CardAction은 같은 파일 컴포넌트라 성립）＋ 조건부 클래스로
//   치환한다. 헤더가 CardAction을 감지하면 flex-row justify-between으로 전환: 텍스트
//   블록（제목·설명 등 비액션 자식）을 왼쪽 flex-col 그룹으로 감싸고 CardAction을
//   행 끝（self-start — 원본의 시작 정렬 유지）에 둔다（원본 grid-cols-[1fr_auto]
//   2열 배치의 시각 의도）. 감지 못하는 래퍼 구조（map 등 간접 배치）에서는 기존
//   세로 스택으로 동작한다（CardAction은 self-start 요소로 남는다）.
// - CardFooter의 [.border-t]:pt-6 조건 셀렉터도 미지원（간격 필요 시 소비자가 지정）.
// - CardContent 안의 본문 텍스트는 사용처에서 색·폰트를 명시한다（§1.2 표기 규칙）.
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

import { cn } from "@/lib/utils";

// 원본 뼈대: flex flex-col gap-6 ... py-6 — 세로 패딩은 루트, 가로 패딩(px-6)은
// 헤더·콘텐츠·푸터가 담당하고 자식 사이 간격은 루트 gap-6가 낸다.
const cardVariants = cva(
  "flex flex-col gap-6 rounded-xl border border-border bg-card py-6",
);
const cardHeaderVariants = cva("flex flex-col items-start gap-2 px-6");
// 원본 헤더 grid-cols-［1fr_auto］ 배치의 flex 등가물 — CardAction 자식 감지 시 전개.
const cardHeaderActionVariants = cva(
  "flex flex-row items-start justify-between gap-2 px-6",
);
// CardAction — 원본 col-start-2 row-span-2 row-start-1 self-start justify-self-end.
// grid 셀 토큰은 flex 문맥 등가물（self-start）로 치환하고, 행 끝 배치는 헤더의
// justify-between이 담당한다（머리 주석）. 자식은 원본 grid item과 같은 블록 흐름으로.
const cardActionVariants = cva("flex flex-col self-start");
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
    // CardAction 자식 타입 동일 감지（select.tsx 관행） — 같은 파일 컴포넌트라
    // forwardRef 객체 동일 비교가 성립한다. 간접 배치（map 등）는 감지되지 않아
    // 기본 세로 스택으로 동작한다（머리 주석）.
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
            {/* 텍스트 블록（제목·설명） — 원본 grid 1열의 등가물（세로 스택 유지） */}
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
