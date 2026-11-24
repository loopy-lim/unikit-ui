// Dialog — src/components/dialog.tsx의 nsh 네이티브 포팅(사이클 102).
// 기반: nsh/base의 Dialog(모달 소유 — backdrop·Escape·포커스 관리 담당).
//
// 포팅 판단(원본 대비 차이):
// - 원본은 Trigger/Close 컴파운드(radix)다 — nsh판은 열림을 앱이 소유하는
//   open/onOpenChange 계약만 노출하고 본문 스타일 파트(Header/Title/
//   Description/Footer)를 제공한다(헤드리스 파트 구성 — 로드맵: Trigger).
// - grid gap-4 → flex-col gap-4 동등 재현(원본 포팅 관행 승계).
// - sm:max-w-lg 반응형 접두은 미지원 — w-full로 두고 앱이 조정한다.
import { Dialog as NshDialog } from "nsh/base";
import { Text, View } from "nsh";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";
import type { Element } from "../types";

const dialogContentVariants = cva(
  "flex w-full flex-col gap-4 rounded-lg border border-border bg-background p-6",
);

const dialogTitleVariants = cva("font-sans text-lg font-semibold text-foreground");
const dialogDescriptionVariants = cva("font-sans text-sm text-muted-foreground");

export type DialogProps = {
  className?: string;
  /** 제어형 열림 — 앱이 소유한다 */
  open?: boolean;
  /** 기본 열림 */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  testID?: string;
  /** DialogHeader/Title/Description/Footer/본문 */
  children?: Element;
};

export function Dialog(props: DialogProps) {
  return (
    <NshDialog
      class={cn(dialogContentVariants(), nshClass(props.className))}
      testID={props.testID}
      open={props.open ?? props.defaultOpen ?? false}
      onOpenChange={(event: { open: boolean }) => props.onOpenChange?.(event.open)}
    >
      {props.children}
    </NshDialog>
  );
}

export type DialogTextProps = { className?: string; testID?: string; children?: Element };

export function DialogHeader(props: DialogTextProps) {
  return (
    <View
      class={cn("flex flex-col gap-2", nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </View>
  );
}

export function DialogFooter(props: DialogTextProps) {
  return (
    <View
      class={cn("flex flex-col-reverse gap-2", nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </View>
  );
}

export function DialogTitle(props: DialogTextProps) {
  return (
    <Text class={cn(dialogTitleVariants(), nshClass(props.className))} testID={props.testID}>
      {props.children}
    </Text>
  );
}

export function DialogDescription(props: DialogTextProps) {
  return (
    <Text
      class={cn(dialogDescriptionVariants(), nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </Text>
  );
}

export { dialogContentVariants };
