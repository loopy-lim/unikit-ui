// Spinner — shadcn/ui（new-york-v4） spinner.tsx 유니버설 포팅 （사이클 40, T-3c）.
// 원본: shadcn-ref/ui/spinner.tsx — lucide-react Loader2Icon（svg, stroke currentColor）
// 회전 표시기.
//
// 포팅 판단（원본 대비 차이）:
// - Loader2Icon은 브리지 primitives 경유（lucide-react / lucide-react-native）.
// - 원본 토큰 size-4·animate-spin은 유지하되 animate-spin은 웹 전용 web: 접두.
//   네이티브는 브리지 LoopRotate（RN Animated useNativeDriver）로 같은 회전을
//   구동한다.
// - 색: 기본 text-foreground. Primary 버튼 등에서는 className으로
//   text-*-foreground를 덮어쓰면 된다（아이콘에 전달）.
// - 접근성: role="status" + 기본 라벨 "Loading"（accessibilityLabel prop）.
//   아이콘은 aria-hidden, 상태 라벨은 래퍼 View가 담당한다.
import { forwardRef } from "react";
import {
  Loader2Icon,
  LoopRotate,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

const spinnerVariants = cva("size-4 text-foreground");

export type SpinnerProps = ViewProps;

const Spinner = forwardRef<BridgeViewRef, SpinnerProps>(
  ({ className, accessibilityLabel = "Loading", ...props }, ref) => (
    <LoopRotate>
      <View
        ref={ref}
        accessibilityRole="status"
        accessibilityLabel={accessibilityLabel}
        className="items-center justify-center"
        {...props}
      >
        <Loader2Icon
          className={cn(spinnerVariants(), "web:animate-spin", className)}
          aria-hidden
        />
      </View>
    </LoopRotate>
  ),
);
Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };
