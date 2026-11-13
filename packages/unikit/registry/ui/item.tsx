// Item — shadcn/ui new-york-v4 item（193줄）을 UniKit 유니버설로 이식.
//
// 포팅 판단:
// - asChild（radix Slot） 제거 — View 렌더 고정.
// - data-variant/data-size 속성·group/item·group-has-·［&_svg］·［&>a］ 셀렉터
//   제거（네이티브에 data 속성 없음）. 토큰은 cva 변형으로 그대로 보존.
// - ItemMedia는 순수 컨테이너 — 소비자가 글리프 Text 또는 Image를 넣는다
//   （이중 지정: 글리프 색·크기는 소비자 Text에 명시）. image 변형의
//   ［&_img］:size-full은 내부 Image에 직접 지정하도록 안내로 대체.
// - line-clamp-2·text-balance는 웹 전용 → web: 접두（네이티브은 전문 전체 표시）.
// - ItemSeparator는 인라인 View（h-px bg-border） — 원본 Separator 대리
//   （신규 파일 6종 제한）.
// - focus-visible 링·transition은 웹 전용 → web: 접두.
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

// ---------------------------------------------------------------------------
// ItemGroup — 리스트 묶음（role="list"）.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ItemSeparator — 항목 사이 가로 구분선（원본 Separator 대리）.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Item — 리스트 아이템 카드（원본 변형·토큰 그대로）.
// ---------------------------------------------------------------------------
const itemVariants = cva(
  // 원본은 브라우저 flex-direction:row 기본 의존 — 브리지 flex-col 기본 대응으로
  // flex-row를 명시해 media·content·actions가 가로로 배치되게 한다.
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

// ---------------------------------------------------------------------------
// ItemMedia — 미디어 영역（글리프 Text 또는 Image를 소비자가 선택）.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ItemContent — 제목·설명 본문 영역.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ItemTitle — 항목 제목（원본 flex/gap는 Text 레이아웃이라 제거, 토큰만 유지）.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ItemDescription — 항목 보조 설명.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ItemActions — 우측 액션 영역.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ItemHeader — 항목 헤더（basis-full로 첫 줄을 차지）.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ItemFooter — 항목 푸터（헤더와 동일 구조）.
// ---------------------------------------------------------------------------
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
