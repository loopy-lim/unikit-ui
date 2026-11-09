// Label — docs/sdd/02-design.md v2 §3.4 그대로.
//
// 입력창 연결 방법(§3.4 — RN 프리미티브만으로 <label for>를 렌더할 수 없는 대안):
// 1. (필수) Label에 nativeID를 지정하고 대상 Input에 accessibilityLabelledBy로 같은 값을 전달
//    예: <Label nativeID="unikit-label-name">이름</Label>
//        <Input accessibilityLabelledBy="unikit-label-name" ... />
//    → 웹 DOM에서 id ↔ aria-labelledby로 연결된다.
// 2. (권장) Label의 onPress에서 입력창 ref의 focus()를 호출하면 클릭→포커스가 이어진다.
//    (Input은 forwardRef로 focus() 노출)
import { forwardRef, type ComponentProps } from "react";
import { Text, type TextInstance } from "react-native";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "font-sans text-sm font-medium leading-none text-foreground",
);

export type LabelProps = ComponentProps<typeof Text>;

const Label = forwardRef<TextInstance, LabelProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label, labelVariants };
