// Spinner — shadcn/ui（new-york-v4） spinner.tsx 유니버설 포팅 （사이클 40, T-3c）.
// 원본: shadcn-ref/ui/spinner.tsx — lucide-react Loader2Icon（svg, stroke currentColor）
// 회전 표시기.
//
// 포팅 판단（원본 대비 차이）:
// - lucide 아이콘 import 금지（저장소 관행 — 새 의존성 없이 이식） 대신 브리지
//   View 하나로 원호를 직접 조형한다: rounded-full 원형 테두리에서 상단만
//   border-t-transparent로 비운 3/4 원호（원본 Loader2Icon 실루엣 근사）.
// - 원본 토큰 size-4animate-spin은 유지하되 animate-spin은 웹 전용 web: 접두
//   （skeleton web:animate-pulse 관행）로 웹은 CSS keyframes가 회전을 담당한다.
//   네이티브는 uniwind가 keyframes를 구동 못 해 브리지 LoopRotate（RN Animated
//   useNativeDriver — UI 스레드）로 같은 회전을 구동한다（양쪽 동일 시각 효과）.
// - 색: 원본 svg는 currentColor를 상속받지만 RN borderColor는 currentcolor 값을
//   보증하지 않아 배제 — 기본 전경 토큰 border-foreground로 대체（양 모드 대비
//   확보）. Primary 버튼 등 다른 전경 컨텍스트에서는 소비자가 className 계단으로
//   border-*-foreground로 교체하면 된다（tailwind-merge가 색 충돌을 정리하고
//   border-t-transparent는 별도 그룹이라 유지된다）.
// - 크기는 원본과 같이 prop이 없고 size-4 기본 + className 계단（size-6 등）으로
//   확대축소한다.
// - 접근성: 원본 그대로 role="status" + 기본 라벨 "Loading"（accessibilityLabel
//   prop으로 교체 가능）. BridgeRole "status"는 웹 role 속성으로 전달되고
//   네이티브에서 모르는 role은 무시된다（브리지 계약상 한계 — 링크는 RN에서도
//   accessibilityLabel로 전달돼 스크린리더가 "Loading"을 읽는다）.
import { forwardRef } from "react";
import {
  LoopRotate,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

// 원호 조형: 원형 링（rounded-full border-2） + 상단 투명 — 회전 시 3/4 원호가
// 도는 실루엣. 색은 위 포팅 판단대로 전경 토큰.
const spinnerVariants = cva(
  "size-4 rounded-full border-2 border-foreground border-t-transparent web:animate-spin",
);

export type SpinnerProps = ViewProps;

const Spinner = forwardRef<BridgeViewRef, SpinnerProps>(
  ({ className, accessibilityLabel = "Loading", ...props }, ref) => (
    <LoopRotate>
      <View
        ref={ref}
        accessibilityRole="status"
        accessibilityLabel={accessibilityLabel}
        className={cn(spinnerVariants(), className)}
        {...props}
      />
    </LoopRotate>
  ),
);
Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };
