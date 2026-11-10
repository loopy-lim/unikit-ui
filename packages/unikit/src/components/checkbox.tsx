// Checkbox — shadcn/ui new-york-v4 checkbox를 UniKit 브리지로 이식.
// 포팅 판단:
// - radix-ui Checkbox(Root/Indicator) 제거 — 체크 상태는 React state(제어/비제어)로
//   직접 관리하고, 원본의 data-state=checked 셀렉터는 조건부 클래스 문자열로 전개
//   (네이티브에 data 속성이 없어 상태 셀렉터를 쓸 수 없다).
// - CheckIcon(lucide) 제거 — ✓ 글리프를 Text children으로 대체(새 의존성 금지).
// - aria-invalid:* 클래스는 v0.1 API에 invalid 상태가 없어 제외.
// - 이중 지정 원칙(§0.5): 체크 배경·테두리는 Pressable, 글리프 색은 내부 Text에 명시.
import { forwardRef, useState } from "react";
import {
  Pressable,
  Text,
  type BridgePressableRef,
  type PressableProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

// 원본 크기 토큰 유지: size-4(16px) 박스·rounded-sm(UniKit 토큰 --radius-sm=4px)·border-input,
// 체크 시 border/bg-primary.
// 라벨 없음 — 라벨은 소비자가 Label과 조합한다(checkbox 원본과 동일한 계약).
export type CheckboxProps = Omit<PressableProps, "onPress" | "aria-checked"> & {
  /** 제어형 체크 상태(지정 시 내부 state를 대체) */
  checked?: boolean;
  /** 비제어형 초기 체크 상태 */
  defaultChecked?: boolean;
  /** 체크 전환 콜백 — indeterminate 상태에서 누르면 false가 전달된다 */
  onCheckedChange?: (checked: boolean) => void;
  /** 중간 상태 — aria-checked="mixed" + − 글리프(shadcn checked="indeterminate" 대응) */
  indeterminate?: boolean;
};

// 터치 타깃 44px 보정: 16px 박스 → hitSlop = (44 − 16) / 2 = 14px.
const HIT_SLOP = 14;

const Checkbox = forwardRef<BridgePressableRef, CheckboxProps>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      onCheckedChange,
      indeterminate = false,
      disabled,
      hitSlop,
      ...props
    },
    ref,
  ) => {
    // 제어(checked 지정)/비제어(내부 state) 통합 — 웹·네이티브 한 벌 로직.
    const [uncontrolled, setUncontrolled] = useState(defaultChecked);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : uncontrolled;

    const handlePress = () => {
      const next = !isChecked;
      if (!isControlled) setUncontrolled(next);
      onCheckedChange?.(next);
    };

    return (
      <Pressable
        ref={ref}
        accessibilityRole="checkbox"
        aria-checked={indeterminate ? "mixed" : isChecked}
        aria-disabled={disabled ? true : undefined}
        disabled={disabled}
        hitSlop={hitSlop ?? HIT_SLOP}
        onPress={handlePress}
        className={cn(
          "flex size-4 shrink-0 flex-row items-center justify-center rounded-sm border web:shadow-xs web:transition-shadow web:outline-none web:focus-visible:border-ring web:focus-visible:ring-2 web:focus-visible:ring-ring/50",
          // 미체크 링은 border-input(라이트 1.27:1)이 배경에 묻혀 경계가 안
          // 보이므로 foreground/50(양 모드 ≥3:1, G4)로 조정.
          indeterminate || isChecked
            ? "border-primary bg-primary"
            : "border-foreground/50 dark:bg-input/30",
          disabled && "web:pointer-events-none web:cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >
        {/* 글리프 — 체크 ✓ / 중간 −. 원본 Indicator처럼 상태일 때만 렌더. */}
        {indeterminate || isChecked ? (
          <Text className="font-sans text-sm font-bold leading-none text-primary-foreground">
            {indeterminate ? "−" : "✓"}
          </Text>
        ) : null}
      </Pressable>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
