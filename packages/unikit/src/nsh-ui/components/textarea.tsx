// Textarea — src/components/textarea.tsx의 nsh 네이티브 포팅(사이클 102).
// 기반: nsh/base Input의 multiline 모드(여러 줄, return이 줄바꿈 삽입).
// 포팅 판단: web: 접두·field-sizing-content 제거, invalid 조건부 클래스는
// 원본 관행(textarea.tsx)을 유지한다.
import { Input as NshInput } from "nsh/base";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";

const textareaVariants = cva(
  "font-sans min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50",
);

const textareaInvalidClasses =
  "border-destructive focus-visible:ring-destructive/20";

export type TextareaProps = {
  className?: string;
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  /** invalid=true일 때 파괴색 보더(ring) */
  invalid?: boolean;
  testID?: string;
  style?: unknown;
};

export function Textarea(props: TextareaProps) {
  return (
    <NshInput
      class={cn(
        textareaVariants(),
        props.invalid && textareaInvalidClasses,
        nshClass(props.className),
      )}
      style={props.style as never}
      multiline
      value={props.value}
      defaultValue={props.defaultValue}
      placeholder={props.placeholder}
      maxLength={props.maxLength}
      disabled={props.disabled}
      testID={props.testID}
      onChange={
        props.onChangeText
          ? (event: { value: string }) => props.onChangeText!(event.value)
          : undefined
      }
    />
  );
}

export { textareaVariants };
