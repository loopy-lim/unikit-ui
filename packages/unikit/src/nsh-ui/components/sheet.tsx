// Sheet — src/components/sheet.tsx의 nsh 네이티브 포팅(사이클 102).
// 기반: nsh/base의 Sheet(가장자리 배치·detents·백드롭·스와이프 닫기 소유).
//
// 포팅 판단(원본 대비 차이):
// - 원본은 Trigger/Close 컴파운드(radix)다 — open/onOpenChange 계약 + 본문
//   스타일 파트만 노출한다(dialog.tsx와 같은 구성).
// - side 가장자리 클래스(h-full w-3/4 + border)는 원본 값 그대로.
// - sm:max-w-sm 반응형 접두은 미지원 — 제거.
import { Sheet as NshSheet } from "nsh/base";
import { Text, View } from "nsh";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";
import type { Element } from "../types";

const sheetPanelVariants = cva(
  "flex flex-col gap-4 border-border bg-background p-4",
  {
    variants: {
      side: {
        top: "w-full border-t",
        bottom: "w-full border-b",
        left: "h-full w-3/4 border-r",
        right: "h-full w-3/4 border-l",
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  },
);

export type SheetProps = VariantProps<typeof sheetPanelVariants> & {
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  testID?: string;
  children?: Element;
};

export function Sheet(props: SheetProps) {
  return (
    <NshSheet
      side={props.side ?? "bottom"}
      class={cn(sheetPanelVariants({ side: props.side }), nshClass(props.className))}
      testID={props.testID}
      open={props.open ?? props.defaultOpen ?? false}
      onOpenChange={(event: { open: boolean }) => props.onOpenChange?.(event.open)}
    >
      {props.children}
    </NshSheet>
  );
}

export type SheetTextProps = { className?: string; testID?: string; children?: Element };

export function SheetHeader(props: SheetTextProps) {
  return (
    <View class={cn("flex flex-col gap-2", nshClass(props.className))} testID={props.testID}>
      {props.children}
    </View>
  );
}

export function SheetFooter(props: SheetTextProps) {
  return (
    <View
      class={cn("flex flex-col-reverse gap-2", nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </View>
  );
}

export function SheetTitle(props: SheetTextProps) {
  return (
    <Text
      class={cn("font-sans text-lg font-semibold text-foreground", nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </Text>
  );
}

export function SheetDescription(props: SheetTextProps) {
  return (
    <Text
      class={cn("font-sans text-sm text-muted-foreground", nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </Text>
  );
}

export { sheetPanelVariants };
