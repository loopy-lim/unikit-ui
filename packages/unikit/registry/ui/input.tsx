// Input — docs/sdd/02-design.md v2 §3.3 그대로.
// forwardRef로 입력 인스턴스（focus（）·blur（））를 노출 — §3.4 Label의
// onPress → ref.focus（） 라벨-입력창 클릭 연결용.
import { forwardRef } from "react";
import {
  TextInput,
  type BridgeTextInputRef,
  type TextInputProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

const inputVariants = cva(
  "font-sans h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background web:focus-visible:border-ring disabled:opacity-50",
);

// InputProps — TextInputProps 그대로. 웹 관용 disabled의 치환 계약
// （native: 아래 editable={false} · web: input［disabled］ + aria-disabled）은
// bridge/types.ts의 disabled 주석이 단일 출처다.
export type InputProps = TextInputProps;

const Input = forwardRef<BridgeTextInputRef, InputProps>(
  ({ className, disabled, editable, ...props }, ref) => (
    <TextInput
      ref={ref}
      editable={disabled ? false : editable}
      aria-disabled={disabled ? true : undefined}
      className={cn(inputVariants(), className)}
      {...props}
      // 브리지 계약에는 editable 치환으로 이미 반영됐으므로 disabled는 그대로 전달
      // （웹 input［disabled］ · RN은 위 editable={false}가 차단）
      disabled={disabled}
    />
  ),
);
Input.displayName = "Input";

export { Input, inputVariants };
