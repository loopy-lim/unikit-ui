// Toggle — shadcn/ui new-york-v4 toggle을 UniKit 브리지로 이식.
// 포팅 판단:
// - radix Toggle 제거 — 눌림 상태는 React state（제어/비제어）로 관리.
// - 원본의 data-state=on 셀렉터 → pressed 조건부 클래스（bg-accent·text-accent-foreground）.
// - ［&_svg］:* 규칙은 아이콘 없는 글리프 구조（내부 Text）에서 대상이 없어 제외.
// - 이중 지정 원칙（§0.5）: 눌림 배경은 Pressable, 전경색（hover 포함）은 내부 Text에
//   명시（네이티브는 컨테이너 색이 자식 Text로 상속되지 않는다）.
// - 원본 base의 aria-invalid:border-destructive·ring-destructive/20은 v0.1 API에
//   invalid 상태가 없어 미지원 — 로드맵.
import { forwardRef, useState, type ReactNode } from "react";
import {
  Pressable,
  Text,
  type BridgePressableRef,
  type PressableProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

// 컨테이너（Pressable） — 원본 base의 hover:bg-muted（기본 변형 호버）를 포함.
// outline 변형의 hover:bg-accent는 변형 클래스가 뒤에 오므로 twMerge가 대체한다.
const toggleVariants = cva(
  "flex flex-row items-center justify-center gap-2 rounded-md web:whitespace-nowrap web:transition-all web:outline-none web:hover:bg-muted web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent web:shadow-xs web:hover:bg-accent",
      },
      size: {
        default: "h-9 min-w-9 px-2",
        sm: "h-8 min-w-8 px-1.5",
        lg: "h-10 min-w-10 px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// 내부 Text — 변형별 hover 전경색（원본 base의 hover:text-muted-foreground와
// outline 변형의 hover:text-accent-foreground 대응）. pressed 오버라이드
// （text-accent-foreground）는 렌더 시 조건부로 뒤에 합성한다.
const toggleTextVariants = cva("font-sans text-sm font-medium", {
  variants: {
    variant: {
      default: "text-foreground web:hover:text-muted-foreground",
      outline: "text-foreground web:hover:text-accent-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// 터치 타깃 44px 보정 — h-9/h-8/h-10（button.tsx 관례와 동일 스케일）.
const HIT_SLOP = { default: 4, sm: 4, lg: 0 } as const;

export type ToggleProps = Omit<PressableProps, "onPress" | "aria-pressed"> &
  VariantProps<typeof toggleVariants> & {
    /** 제어형 눌림 상태（지정 시 내부 state를 대체） */
    pressed?: boolean;
    /** 비제어형 초기 눌림 상태 */
    defaultPressed?: boolean;
    /** 눌림 전환 콜백 */
    onPressedChange?: (pressed: boolean) => void;
    children?: ReactNode;
  };

const Toggle = forwardRef<BridgePressableRef, ToggleProps>(
  (
    {
      className,
      variant,
      size,
      pressed,
      defaultPressed = false,
      onPressedChange,
      disabled,
      hitSlop,
      children,
      ...props
    },
    ref,
  ) => {
    // 제어/비제어 통합 — toggle-group이 pressed를 주입할 때도 이 경로로 제어된다.
    const [uncontrolled, setUncontrolled] = useState(defaultPressed);
    const isControlled = pressed !== undefined;
    const isPressed = isControlled ? pressed : uncontrolled;
    const resolvedSize = size ?? "default";

    const handlePress = () => {
      const next = !isPressed;
      if (!isControlled) setUncontrolled(next);
      onPressedChange?.(next);
    };

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        aria-pressed={isPressed}
        aria-disabled={disabled ? true : undefined}
        disabled={disabled}
        hitSlop={hitSlop ?? HIT_SLOP[resolvedSize]}
        onPress={handlePress}
        className={cn(
          toggleVariants({ variant, size }),
          // 원본의 on 상태 bg-accent 전개 — bg-transparent를 twMerge가 대체.
          isPressed && "bg-accent",
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        <Text
          className={cn(
            toggleTextVariants({ variant }),
            isPressed && "text-accent-foreground",
          )}
        >
          {children}
        </Text>
      </Pressable>
    );
  },
);
Toggle.displayName = "Toggle";

export { Toggle, toggleVariants, toggleTextVariants };
