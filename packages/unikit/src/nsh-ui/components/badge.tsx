// Badge — src/components/badge.tsx의 nsh 네이티브 포팅(사이클 102).
// 순수 스타일 컴포넌트(View+Text 이중 지정). native:self-start→self-start,
// web: 접두 제거.
import { Text, View } from "nsh";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";
import type { Element } from "../types";

const badgeVariants = cva(
  "flex flex-row self-start shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        ghost: "text-foreground",
        link: "text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const badgeTextVariants = cva("font-sans text-xs font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      ghost: "text-foreground",
      link: "text-primary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type BadgeProps = VariantProps<typeof badgeVariants> & {
  className?: string;
  testID?: string;
  /** 문자열·숫자를 권장(내부 Text 래핑) */
  children?: Element;
};

export function Badge(props: BadgeProps) {
  return (
    <View
      class={cn(badgeVariants({ variant: props.variant }), nshClass(props.className))}
      testID={props.testID}
    >
      {typeof props.children === "string" || typeof props.children === "number" ? (
        <Text class={cn(badgeTextVariants({ variant: props.variant }))}>
          {props.children}
        </Text>
      ) : (
        props.children
      )}
    </View>
  );
}

export { badgeVariants };
