// Breadcrumb — shadcn/ui new-york-v4 breadcrumb 포팅（/tmp/shadcn-ref/src/breadcrumb）.
// 7종 export. radix Slot·lucide 아이콘 제거.
// 포팅 판단:
// - 아이콘 금지 규칙에 따라 ChevronRight → "›", MoreHorizontal → "⋯" 글리프 Text.
// - BreadcrumbLink는 Pressable role="link" + onPress（무인자）. radix Slot（asChild）은
//   미지원 — 사용처 라우팅은 onPress에서 호출한다.
// - BreadcrumbPage의 aria-current는 브리지 계약에 없어 현재 페이지를 시각（색·
//   굵기）으로만 표현한다. 원본의 role="link"·aria-disabled도 Text 계약에 없어
//   생략（활성 아닌 링크로 오독 방지）.
// - 원본 <nav>의 내재 role（navigation）도 BridgeRole에 없어 미지원 — 라벨만
//   유지. 스크린리더 전용（sr-only） 보조 텍스트는 웹 전용 클래스라 생략하되,
//   원본처럼 장식 요소（Separator·Ellipsis）에는 aria-hidden을 지정한다.
// - 웹 전용 토큰（transition·hover·break-words·sm: 반응형）은 web: 접두.
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
  "flex-row flex-wrap items-center gap-1.5 web:break-words web:sm:gap-2.5",
);
const breadcrumbItemVariants = cva("flex-row items-center gap-1.5");

// 링크 컨테이너（Pressable） — 투명 배경·무테두리, 전경색은 내부 Text에.
const breadcrumbLinkVariants = cva("flex-row items-center");
const breadcrumbLinkTextVariants = cva(
  "font-sans text-sm text-muted-foreground web:transition-colors web:hover:text-foreground active:text-foreground",
);

// 현재 페이지 — 원본 font-normal text-foreground（시각적 구분만）.
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

// 구분 아이콘 — children 미지정 시 기본 ChevronRightIcon.
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

// 생략 아이콘 — MoreHorizontalIcon.
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
