// Button — src/components/button.tsx의 nsh 네이티브 포팅(사이클 102).
// 기반: nsh/base의 Button은 "눌림·disabled·selected·역할을 소유하고 모양은
// 앱의 class에 맡기는" 헤드리스 프레스 타깃이다 — UniKit 변형(cva) 클래스를
// 그대로 얹고, 터치 타깃 44px 보정(hitSlop)과 내부 Text 이중 지정(§0.5)을
// 원본과 동일하게 유지한다.
//
// 포팅 판단(원본 대비 차이):
// - web: 접두 토큰 제거(nsh 무관 — select-none·transition-all 등). hover:*·
//   active:* 는 nsh가 자체 지원하므로 무접두로 유지.
// - forwardRef 노출 없음(nsh는 ref를 그대로 넘긴다 — ViewRef).
// - hitSlop 계산은 원본과 같은 값표를 쓰되, 사용자 지정값을 우선한다.
// - children에 문자열·숫자를 권장한다(내부 Text 래핑 — 전경색 이중 지정).
import { Button as NshButton } from "nsh/base";
import { Text } from "nsh";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";
import type { Element } from "../types";

const buttonVariants = cva(
  "flex flex-row shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // 원본 사이즈 값 그대로(default h-9 / xs h-6 / sm h-8 / lg h-10 / icon size-9).
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-6 gap-1 rounded-md px-2 text-xs",
        sm: "h-8 gap-1.5 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md text-xs",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// 내부 Text — 변형별 전경색 이중 지정. active: 눌림 전파.
const buttonTextVariants = cva("font-sans text-sm font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground active:text-accent-foreground hover:text-accent-foreground",
      ghost: "text-foreground active:text-accent-foreground hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      default: "",
      xs: "text-xs",
      sm: "",
      lg: "",
      icon: "",
      "icon-xs": "text-xs",
      "icon-sm": "",
      "icon-lg": "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

// 터치 타깃 44px 보정(§3.1): hitSlop = max(0, (44 − 시각높이px) / 2).
const HIT_SLOP = {
  xs: 10,
  sm: 6,
  default: 4,
  lg: 2,
  icon: 4,
  "icon-xs": 10,
  "icon-sm": 6,
  "icon-lg": 2,
} as const;

export type ButtonProps = VariantProps<typeof buttonVariants> & {
  /** 추가 클래스 — nsh 문법으로 정규화 후 병합된다 */
  className?: string;
  /** 눌렸을 때 */
  onPress?: () => void;
  /** 비활성화 */
  disabled?: boolean;
  /** UI 테스트 셀렉터(id:x) */
  testID?: string;
  /** 화면 낭독기가 읽는 이름 — 눌림 대상에 글자가 없을 때(아이콘 버튼) 반드시 준다 */
  accessibilityLabel?: string;
  /** 터치 타깃 확장(px) — 미지정 시 크기별 기본 보정 */
  hitSlop?: number;
  /** 문자열·숫자를 권장(내부 Text 래핑) */
  children?: Element;
};

export function Button(props: ButtonProps) {
  return (
    <NshButton
      class={cn(
        buttonVariants({ variant: props.variant, size: props.size }),
        props.disabled && "opacity-50",
        nshClass(props.className),
      )}
      testID={props.testID}
      accessibilityLabel={props.accessibilityLabel}
      disabled={props.disabled}
      hitSlop={props.hitSlop ?? HIT_SLOP[props.size ?? "default"]}
      onPress={props.onPress}
    >
      {typeof props.children === "string" ||
      typeof props.children === "number" ? (
        <Text
          class={cn(
            buttonTextVariants({ variant: props.variant, size: props.size }),
          )}
        >
          {props.children}
        </Text>
      ) : (
        props.children
      )}
    </NshButton>
  );
}

export { buttonVariants, buttonTextVariants };
