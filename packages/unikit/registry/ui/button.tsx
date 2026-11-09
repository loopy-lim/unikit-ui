// Button — docs/sdd/02-design.md v2 §3.1 그대로.
// 이중 지정 원칙(§0.5): 배경·테두리는 Pressable, 전경색·밑줄은 내부 Text에 명시.
// (DOM 브리지에서도 span은 부모 상속이 막히므로 전경색 명시가 양쪽에 필요)
import { forwardRef, type ReactNode } from "react";
import {
  Pressable,
  Text,
  type BridgePressableRef,
  type PressableProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Pressable(컨테이너) — base + focus-visible(전역)은 §3.1 표의 문자열을 그대로 사용.
const buttonVariants = cva(
  "flex flex-row items-center justify-center gap-2 rounded-md web:select-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary web:hover:bg-primary/90 active:bg-primary/90",
        secondary: "bg-secondary web:hover:bg-secondary/80 active:bg-secondary/80",
        destructive:
          "bg-destructive web:hover:bg-destructive/90 active:bg-destructive/90",
        outline:
          "border border-input bg-background web:hover:bg-accent active:bg-accent",
        ghost: "web:hover:bg-accent active:bg-accent",
        link: "",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// 내부 Text — 변형별 전경색. active:* 눌림 전파 — 네이티브는 uniwind(Pressable 상태), 웹은 <button>의 :active.
const buttonTextVariants = cva(
  "font-sans text-sm font-medium web:whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        destructive: "text-destructive-foreground",
        outline: "text-foreground active:text-accent-foreground",
        ghost: "text-foreground active:text-accent-foreground",
        link: "text-primary underline underline-offset-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// 터치 타깃 44px 보정(§3.1): hitSlop = max(0, (44 − 시각높이px) / 2) — 각 방향 px.
const HIT_SLOP = {
  sm: 4,
  default: 2,
  lg: 0,
  icon: 2,
} as const;

// Pressable의 함수형 children((state) => ReactNode)은 내부 Text 래핑 구조(§3.1)와
// 양립하지 않으므로 children은 ReactNode로 한정한다(v0.1은 문자열 children 사용).
export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    children?: ReactNode;
  };

const Button = forwardRef<BridgePressableRef, ButtonProps>(
  (
    { className, variant, size, disabled, hitSlop, children, ...props },
    ref,
  ) => {
    const resolvedSize = size ?? "default";
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={disabled}
        aria-disabled={disabled ? true : undefined}
        hitSlop={hitSlop ?? HIT_SLOP[resolvedSize]}
        className={cn(
          buttonVariants({ variant, size }),
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        <Text className={cn(buttonTextVariants({ variant }))}>{children}</Text>
      </Pressable>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants, buttonTextVariants };
