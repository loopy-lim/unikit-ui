// Separator — src/components/separator.tsx의 nsh 네이티브 포팅(사이클 102).
// 장식 구분선(기본)은 스크린리더에서 은닉한다. decorative={false}의
// role="separator" 노출은 nsh AccessibilityRole에 해당 값이 없어 미지원이다
// (로드맵 — role="group"+라벨 근사 여부는 소비 사례가 생기면 판단).
import { View } from "nsh";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";

const separatorVariants = cva("shrink-0 bg-border", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export type SeparatorProps = VariantProps<typeof separatorVariants> & {
  className?: string;
  /** 장식(기본)이면 은닉(false는 형태만 유지 — 역할 노출 미지원, 머리 주석) */
  decorative?: boolean;
  testID?: string;
};

export function Separator(props: SeparatorProps) {
  return (
    <View
      class={cn(separatorVariants({ orientation: props.orientation }), nshClass(props.className))}
      testID={props.testID}
      accessibilityElementsHidden={props.decorative !== false}
    />
  );
}

export { separatorVariants };
