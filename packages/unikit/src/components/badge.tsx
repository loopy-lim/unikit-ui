// Badge — shadcn/ui new-york-v4 badge를 UniKit UI 유니버설로 이식（사이클 71 원본값 정비）.
// 이중 지정 원칙（§0.5）: 배경·테두리는 View, 전경색은 내부 Text에 명시（Button과 동일 패턴）.
// 미지원（로드맵）: ［a&］:hover:*（링크 래퍼 조건 — 뱃지는 Pressable이 아니어서 hover
// 배경·전경 전환·hover 밑줄이 없다）·aria-invalid:*（invalid 상태 없음）·
// ［&>svg］:size-3（아이콘은 글리프 Text）·dark:*（다크는 토큰 값 전환 아키텍처）.
// focus 링은 없다 — Badge는 Pressable이 아니어서 스스로 포커스를 받지 않고, 원본의
// focus-visible:ring-［3px］도 포커스 가능 래퍼（a/button）를 통해서만 발동한다（사이클 72 정정）.
import { Children, forwardRef } from "react";
import {
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

// View（컨테이너） — 웹은 w-fit으로 정렬 보존, 네이티브는 self-start 유지.
const badgeVariants = cva(
  "flex flex-row native:self-start web:w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium web:transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        ghost: "text-foreground",
        link: "text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// 내부 Text — 원본 text-xs font-medium. link의 밑줄은 원본대로 hover에서만
// （네이티브는 hover가 없어 밑줄이 없다 — 상시 밑줄은 소비자가 underline 추가）.
const badgeTextVariants = cva(
  "font-sans text-xs font-medium web:whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        // 원본 text-white의 토큰 동등물（--destructive-foreground = 98% 백색）.
        destructive: "text-destructive-foreground",
        outline: "text-foreground",
        ghost: "text-foreground",
        link: "text-primary underline-offset-4 web:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = ViewProps & VariantProps<typeof badgeVariants>;

const Badge = forwardRef<BridgeViewRef, BadgeProps>(
  ({ className, variant, children, ...props }, ref) => {
    const textClass = cn(badgeTextVariants({ variant }));
    const content = Children.map(children, (child) =>
      typeof child === "string" || typeof child === "number" ? (
        <Text className={textClass}>{child}</Text>
      ) : (
        child
      ),
    );
    return (
      <View
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      >
        {content}
      </View>
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants, badgeTextVariants };
