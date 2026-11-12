// Switch — shadcn/ui new-york-v4 switch를 UniKit 브리지로 이식.
// 포팅 판단:
// - radix Switch（Root/Thumb） 제거 — 토글 상태는 React state（제어/비제어）로 관리.
// - 원본의 data-state·data-size·group-data 셀렉터 전개 — 크기는 cva size
//   변형（default/sm）으로, 트랙 배경과 썸 위치는 상태 조건부 클래스로.
// - 썸 이동은 원본의 translate-x 계산값 대신 트랙 justify-start/end +
//   px-0.5（안쪽 2px 여백） — transform·calc 없이 양 플랫폼에서 동일한 레이아웃.
//   이에 따라 썸 미끄러짐 애니메이션（transition-transform）은 재현 불가해 제거.
// - 이중 지정 원칙（§0.5）: 트랙 배경은 Pressable, 썸 배경은 내부 View에 명시.
import { forwardRef, useState } from "react";
import {
  animateLayout,
  Pressable,
  View,
  type BridgePressableRef,
  type PressableProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

// 트랙（Pressable） — 원본 크기 토큰: default 18.4px（h-4.5 근사）·w-8, sm h-3.5·w-6.
const switchTrackVariants = cva(
  "flex shrink-0 flex-row items-center rounded-full border border-transparent px-0.5 web:transition-all web:outline-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
  {
    variants: {
      size: {
        default: "h-4.5 w-8",
        sm: "h-3.5 w-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

// 썸（View） — 원본의 size=default→size-4 · sm→size-3 대응.
const switchThumbVariants = cva("rounded-full", {
  variants: {
    size: {
      default: "size-4",
      sm: "size-3",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export type SwitchProps = Omit<PressableProps, "onPress" | "aria-checked"> &
  VariantProps<typeof switchTrackVariants> & {
    /** 제어형 토글 상태（지정 시 내부 state를 대체） */
    checked?: boolean;
    /** 비제어형 초기 토글 상태 */
    defaultChecked?: boolean;
    /** 토글 전환 콜백 */
    onCheckedChange?: (checked: boolean) => void;
  };

// 터치 타깃 44px 보정: default 트랙 18.4px → 13px, sm 14px → 15px.
const HIT_SLOP = { default: 13, sm: 15 } as const;

const Switch = forwardRef<BridgePressableRef, SwitchProps>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      onCheckedChange,
      disabled,
      size,
      hitSlop,
      ...props
    },
    ref,
  ) => {
    // 제어/비제어 통합 — 자식 없음（원본과 동일하게 트랙+썸만 렌더）.
    const [uncontrolled, setUncontrolled] = useState(defaultChecked);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : uncontrolled;
    const resolvedSize = size ?? "default";

    const handlePress = () => {
      animateLayout();
      const next = !isChecked;
      if (!isControlled) setUncontrolled(next);
      onCheckedChange?.(next);
    };

    return (
      <Pressable
        ref={ref}
        accessibilityRole="switch"
        aria-checked={isChecked}
        aria-disabled={disabled ? true : undefined}
        disabled={disabled}
        hitSlop={hitSlop ?? HIT_SLOP[resolvedSize]}
        onPress={handlePress}
        className={cn(
          switchTrackVariants({ size }),
          // 원본 상태 셀렉터（checked→bg-primary / unchecked→bg-input） 전개 —
          // 썸 이동도 같은 조건의 justify-start/end 및 웹 translate-x 전이로 표현.
          // 꺼짐 트랙은 bg-input（라이트 1.27:1·다크 1.2:1）이 배경에 묻혀
          // "꺼짐" 상태를 오독시켜 foreground/50（양 모드 ≥3:1, G4）로 조정.
          isChecked
            ? "justify-end bg-primary web:justify-start"
            : "justify-start bg-foreground/50",
          disabled && "web:pointer-events-none web:cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >
        {/* 썸 — 장식 요소（aria-hidden）. 다크 모드 썸 색은 상태별로 다르다（원본 준수）. */}
        <View
          aria-hidden
          className={cn(
            switchThumbVariants({ size }),
            "web:transition-transform web:duration-200",
            isChecked
              ? resolvedSize === "sm"
                ? "bg-background dark:bg-primary-foreground web:translate-x-2.5"
                : "bg-background dark:bg-primary-foreground web:translate-x-3.5"
              : "bg-background dark:bg-foreground web:translate-x-0",
          )}
        />
      </Pressable>
    );
  },
);
Switch.displayName = "Switch";

export { Switch, switchTrackVariants, switchThumbVariants };
