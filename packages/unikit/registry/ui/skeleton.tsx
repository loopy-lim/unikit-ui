// Skeleton — shadcn/ui new-york-v4 skeleton 포팅(/tmp/shadcn-ref/src/skeleton).
// 포팅 판단:
// - 원본은 단일 <div className="animate-pulse rounded-md bg-accent"> — 브리지 View
//   하나로 대응되며 자식 텍스트가 없어 이중 지정 대상도 없다(className 병합만).
// - animate-pulse는 web: 접두 — uniwind의 keyframes 애니메이션은 미보증이라
//   네이티브에서는 정적 회색 블록으로 렌더된다(로드맵: 네이티브 펄스 애니메이션).
import { forwardRef } from "react";
import {
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

// 다크 bg-accent(zinc-800)는 배경 대비 1.34:1로 블록이 거의 안 보인다(G4) —
// 다크 한정 muted-foreground/60(≥3:1)으로 올린다. 라이트는 감사 통과값 유지.
const skeletonVariants = cva(
  "rounded-md bg-accent dark:bg-muted-foreground/60 web:animate-pulse",
);

export type SkeletonProps = ViewProps;

const Skeleton = forwardRef<BridgeViewRef, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(skeletonVariants(), className)}
      {...props}
    />
  ),
);
Skeleton.displayName = "Skeleton";

export { Skeleton, skeletonVariants };
