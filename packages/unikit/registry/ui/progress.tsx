// Progress — shadcn/ui（new-york-v4） progress.tsx 유니버설 포팅 （사이클 30, T-3b）.
// 원본: shadcn-ref/ui/progress.tsx — radix Progress 엔진을 제거하고
// 진행률은 BridgeStyle 동적 인라인 스타일 계약으로 표현한다.
//
// 포팅 판단（원본 대비 차이）:
// - 원본 인디케이터는 w-full + translateX 변환으로 채움을 표현했다. 네이티브
//   변환 조합 대신 브리지 동적 값 계약（style의 백분율 width）을 쓴다 — className
//   동적 생성 금지 원칙의 공식 대체 수단. w-full·flex-1 토큰은 이 방식과 충돌해
//   제거했다.
// - 원본 value（0~100 고정）에 max 스케일（기본 100）을 추가해 백분율로 정규화하고
//   0~100 범위로 클램프한다.
// - aria-valuenowaria-valueminaria-valuemax는 사이클 40 브리지 확장（§2.1）으로
//   소급 지원 — 네이티브는 accessibilityValue로 치환된다（트랙 View에 부여）.
import { forwardRef } from "react";
import {
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";

export type ProgressProps = ViewProps & {
  /** 현재 진행값 — max 대비 백분율로 렌더（미지정 시 0%） */
  value?: number;
  /** 진행 스케일 상한（기본 100） */
  max?: number;
};

const Progress = forwardRef<BridgeViewRef, ProgressProps>(
  ({ className, value, max = 100, ...props }, ref) => {
    const scale = max > 0 ? max : 100;
    const percent = Math.min(100, Math.max(0, ((value ?? 0) / scale) * 100));
    return (
      // 트랙 — role 지정 권장 라벨은 사용처 accessibilityLabel로 전달된다.
      <View
        ref={ref}
        accessibilityRole="progressbar"
        aria-valuenow={Math.round(value ?? 0)}
        aria-valuemin={0}
        aria-valuemax={scale}
        className={cn(
          // 트랙 bg-primary/20은 다크 1.75:1·라이트 1.4:1로 채움과의 경계가
          // 흐려 value 신호가 묻힌다 — /50（양 모드 ≥3:1, G4）으로 조정.
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/50",
          className,
        )}
        {...props}
      >
        {/* 인디케이터 — 동적 백분율 폭은 BridgeStyle 전용 영역 */}
        <View
          aria-hidden
          className="h-full bg-primary web:transition-all"
          style={{ width: `${percent}%` }}
        />
      </View>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
