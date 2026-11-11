// Pagination — shadcn/ui new-york-v4 pagination 포팅（/tmp/shadcn-ref/src/pagination）.
// 7종 export. lucide 아이콘 제거.
// 포팅 판단:
// - 원본은 <a>에 buttonVariants를 얹는다 — 포팅은 Pressable role="link"에
//   ./button의 buttonVariants（컨테이너） + buttonTextVariants（내부 Text 전경색,
//   이중 지정）를 함께 얹는다. import 경로 "./button"은 양 트리（src·registry）에서
//   동일하다.
// - 원본의 data-active·aria-current="page" → isActive?: boolean prop 조건부
//   클래스（ghost↔outline 변형 전환）로 재현하고, aria-current="page"는 사이클 40
//   브리지 확장（§2.1）으로 소급 지정한다（웹 전용 — RN 계약 없음, 시각 강조가 담당）.
// - 아이콘: ChevronLeftIcon·ChevronRightIcon·MoreHorizontalIcon — 브리지 SVG
//   아이콘 프리미티브（lucide 의존 제거）. Previous/Next 라벨은 원본의
//   sm 미만 숨김（hidden sm:block）을 web:hidden web:sm:inline으로 재현 —
//   네이티브에서는 항상 표시된다（터치 가독성）.
// - PaginationLink의 children이 문자열（숫자 포함）이면 이중 지정 원칙대로 내부
//   Text로 감싸고, ReactNode면 그대로 렌더한다（Previous/Next는 아이콘+라벨
//   두 Text를 flex 간격으로 배치하기 위해 노드를 직접 넘긴다）.
// - 원본 <nav>의 role="navigation"은 BridgeRole에 없어 미지원 — 라벨만 유지.
//   sr-only 보조 텍스트는 웹 전용 클래스라 생략（Ellipsis는 어차피 aria-hidden）.
// - 터치 타깃 44px 보정은 button.tsx와 같은 hitSlop 기준（§3.1）.
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

import { cn } from "../lib/utils";
import { buttonVariants, buttonTextVariants } from "./button";

const paginationVariants = cva("mx-auto w-full flex-row justify-center");
const paginationContentVariants = cva("flex-row items-center gap-1");

// 방향 아이콘 전경색 cva — export API 호환용（이름 유지; 본문 ChevronIcon은
// 브리지 SVG 아이콘 프리미티브로 대체되어 있다）.
const paginationGlyphVariants = cva("text-base leading-none text-foreground");
// Previous/Next 라벨 — 웹에서는 sm 미만 숨김（원본 hidden sm:block 재현）.
const paginationLabelVariants = cva(
  "font-sans text-sm font-medium text-foreground web:whitespace-nowrap web:hidden web:sm:inline",
);
const paginationEllipsisVariants = cva(
  "h-9 w-9 flex-row items-center justify-center",
);
const paginationEllipsisTextVariants = cva(
  "text-base leading-none text-foreground",
);

// 터치 타깃 보정 — button.tsx의 HIT_SLOP과 같은 기준（44px − 시각높이）/2.
const HIT_SLOP = {
  default: 2,
  sm: 4,
  lg: 0,
  icon: 2,
} as const;

export type PaginationProps = ViewProps;
export type PaginationContentProps = ViewProps;
export type PaginationItemProps = ViewProps;
export type PaginationEllipsisProps = ViewProps;

export type PaginationLinkProps = PressableProps &
  Pick<VariantProps<typeof buttonVariants>, "size"> & {
    /** 현재 페이지 — 원본 data-active 대체（outline 변형으로 강조） */
    isActive?: boolean;
    children?: ReactNode;
  };
export type PaginationPreviousProps = PaginationLinkProps & {
  /** 이전 라벨 텍스트（기본 "Previous" — 현지화 시 지정, G4） */
  label?: string;
};
export type PaginationNextProps = PaginationLinkProps & {
  /** 다음 라벨 텍스트（기본 "Next" — 현지화 시 지정, G4） */
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

// 원본 <li>처럼 기본 클래스 없이 props를 그대로 통과시킨다.
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
          // 활성 페이지 강조 테두리 — outline 변형의 border-input은 1.27:1로
          // 현재 페이지 표시가 배경에 묻힌다. foreground/50（≥3:1, G4）로 조정.
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

// 페이지 생략 아이콘 — MoreHorizontalIcon.
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
