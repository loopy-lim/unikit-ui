// Badge — shadcn/ui new-york-v4 badge를 UniKit 유니버설로 이식（사이클 71 원본값 정비）.
// 이중 지정 원칙（§0.5）: 배경·테두리는 View, 전경색은 내부 Text에 명시（Button과 동일 패턴）.
// 미지원（로드맵）: ［a&］:hover:*（링크 래퍼 조건 — 뱃지는 Pressable이 아니어서 hover
// 배경·전경 전환·hover 밑줄이 없다）·aria-invalid:*（invalid 상태 없음）·
// ［&>svg］:size-3（아이콘은 글리프 Text）·dark:*（다크는 토큰 값 전환 아키텍처）.
// focus 링은 라이브러리 규약을 유지한다（원본 ring-［3px］과 다름）.
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

import { cn } from "../lib/utils";

// View（컨테이너） — 원본 w-fit은 uniwind 미지원 → self-start 치환（M-2 규약）.
const badgeVariants = cva(
  "flex flex-row self-start shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 web:transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary",
        secondary: "bg-secondary",
        destructive: "bg-destructive",
        outline: "border-border",
        ghost: "",
        link: "",
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
  ({ className, variant, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      <Text className={cn(badgeTextVariants({ variant }))}>{children}</Text>
    </View>
  ),
);
Badge.displayName = "Badge";

export { Badge, badgeVariants, badgeTextVariants };
