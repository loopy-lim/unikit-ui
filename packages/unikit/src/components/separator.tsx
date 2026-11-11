// Separator — shadcn/ui new-york-v4 separator 포팅（shadcn-ref/ui/separator.tsx）.
// 포팅 판단:
// - radix-ui Separator 엔진 제거 — 상호작용이 없는 장식선이므로 Pressable이 아니라
//   View로 이식하고, 원본의 data-orientation 셀렉터（가로 h-px w-full /
//   세로 h-full w-px）를 orientation prop 조건부 클래스로 전개한다（토큰 유지）.
// - 접근성: BridgeRole "separator" 계약 사용. radix의 decorative 기본값（true）을
//   따라 장식용이면 role 없이 aria-hidden으로 은닉하고, decorative={false}일 때만
//   role="separator"를 노출한다（원본과 같은 의미 구분）.
import { forwardRef } from "react";
import {
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const separatorVariants = cva("shrink-0 bg-border", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export type SeparatorProps = ViewProps &
  VariantProps<typeof separatorVariants> & {
    /** 장식 구분선（기본값）이면 스크린리더에서 은닉, false면 role 노출 */
    decorative?: boolean;
  };

const Separator = forwardRef<BridgeViewRef, SeparatorProps>(
  ({ className, orientation, decorative = true, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole={decorative ? undefined : "separator"}
      aria-hidden={decorative ? true : undefined}
      className={cn(separatorVariants({ orientation }), className)}
      {...props}
    />
  ),
);
Separator.displayName = "Separator";

export { Separator, separatorVariants };
