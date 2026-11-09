// Input — docs/sdd/02-design.md v2 §3.3 그대로.
// forwardRef로 TextInput 인스턴스(focus()·blur())를 노출 — §3.4 Label의
// onPress → ref.focus() 라벨-입력창 클릭 연결용.
import { forwardRef, type ComponentProps } from "react";
import { TextInput, type TextInputInstance } from "react-native";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "font-sans h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background web:focus-visible:border-ring disabled:opacity-50",
);

export type InputProps = Omit<ComponentProps<typeof TextInput>, "disabled"> & {
  /**
   * 웹 관용 disabled — RN TextInput에는 이 prop이 없어 내부에서 치환한다(§3.3 비활성 명세).
   * - native: editable={false}로 치환(입력 차단)
   * - web(RNW 0.21.4): input[disabled]로 전달되어 CSS :disabled(disabled:opacity-50)와
   *   입력 차단이 모두 동작
   * - DOM 접근성: aria-disabled={true} 병행 지정(accessibilityState 객체는 RNW 미전달 — §3.6)
   */
  disabled?: boolean;
};

const Input = forwardRef<TextInputInstance, InputProps>(
  ({ className, disabled, editable, ...props }, ref) => (
    <TextInput
      ref={ref}
      editable={disabled ? false : editable}
      aria-disabled={disabled ? true : undefined}
      className={cn(inputVariants(), className)}
      {...props}
      // RN 타입에는 없는 prop이라 조건부 스프레드로 전달(미지정 시 DOM에 남기지 않는다).
      {...(disabled === undefined ? null : { disabled })}
    />
  ),
);
Input.displayName = "Input";

export { Input, inputVariants };
