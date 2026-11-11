// Skeleton — shadcn/ui new-york-v4 skeleton 포팅（/tmp/shadcn-ref/src/skeleton）.
// 포팅 판단:
// - 원본은 단일 <div className="animate-pulse rounded-md bg-accent"> — 브리지 View
//   하나로 대응되며 자식 텍스트가 없어 이중 지정 대상도 없다（className 병합만）.
// - animate-pulse는 web: 접두 — 웹은 CSS keyframes가 맥동을 담당하고 네이티브는
//   uniwind가 keyframes를 구동 못 해 브리지 LoopPulse（RN Animated useNativeDriver
//   — CSS animate-pulse와 같은 2s·50% opacity .5·베지어）로 같은 맥동을 구동한다.
import { forwardRef } from "react";
import {
  LoopPulse,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

// dark: 변형 금지 원칙 — 다크 배경은 accent 토큰 값 전환으로 처리한다.
// （사이클 71 G3: dark:bg-muted-foreground/60 제거 — 원본 skeleton은 dark: 클래스가 없다）
const skeletonVariants = cva(
  "rounded-md bg-accent web:animate-pulse",
);

export type SkeletonProps = ViewProps;

const Skeleton = forwardRef<BridgeViewRef, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <LoopPulse>
      <View
        ref={ref}
        className={cn(skeletonVariants(), className)}
        {...props}
      />
    </LoopPulse>
  ),
);
Skeleton.displayName = "Skeleton";

export { Skeleton, skeletonVariants };
