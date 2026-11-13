// AspectRatio — shadcn/ui（new-york-v4） aspect-ratio.tsx 유니버설 포팅 （사이클 30, T-3b）.
// 원본: shadcn-ref/ui/aspect-ratio.tsx — radix AspectRatio 엔진을
// 제거하고 비율은 BridgeStyle 동적 인라인 스타일 계약으로 표현한다.
//
// 포팅 판단（원본 대비 차이）:
// - 원본（radix）은 웹 구형 호환을 위해 패딩 핵으로 비율을 만들었다. 브리지 계약의
//   aspectRatio는 숫자 값이 웹 DOM（단위 없는 비율）·RN（원시 프로퍼티） 양쪽에
//   유효해 style 지정으로 대체한다（정적 스타일이 아닌 사용자 지정 비율 값이므로
//   className 원칙의 동적 값 예외에 해당）.
// - 원본의 overflow hidden은 className（overflow-hidden）으로 유지.
import { forwardRef } from "react";
import {
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";

export type AspectRatioProps = ViewProps & {
  /** 가로세로 비율（가로 ÷ 세로, 기본 1 — 정사각형） */
  ratio?: number;
};

const AspectRatio = forwardRef<BridgeViewRef, AspectRatioProps>(
  ({ ratio = 1, className, style, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("overflow-hidden", className)}
      // 사용자 style이 있으면 병합 — 비율은 컴포넌트 계약값이 우선한다.
      style={{ ...style, aspectRatio: ratio }}
      {...props}
    >
      {children}
    </View>
  ),
);
AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
