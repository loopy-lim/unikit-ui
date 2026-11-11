// Textarea — shadcn/ui new-york-v4 textarea를 UniKit 유니버설로 이식.
//
// 포팅 판단:
// - <textarea> 요소 대신 브리지 TextInput에 multiline을 준다（웹 <textarea> ·
//   네이티브 RN TextInput multiline — bridge/types.ts 계약）. Input（src/components/
//   input.tsx）과 같은 패턴: focus 링 토큰은 Input을 따르고, 원본 고유 토큰
//   （min-h-16 최소 높이）은 보존.
// - 원본의 aria-invalid:* 속성 셀렉터 스타일은 data 속성을 쓸 수 없어
//   invalid?: boolean prop → 조건부 클래스（붉은 테두리·링）로 치환.
// - 웹 전용 효과（field-sizing-content, shadow-xs, transition-*, outline-none,
//   disabled 커서, md: 반응형 본문 크기）는 web: 접두.
// - disabled 치환 계약（native: editable={false} · web: textarea［disabled］ +
//   aria-disabled）은 Input과 동일. 시각 효과（opacity-50）는 조건부 클래스로
//   양쪽 플랫폼에 적용한다.
import { forwardRef } from "react";
import {
  TextInput,
  type BridgeTextInputRef,
  type TextInputProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

// 컨테이너 — Input과 동일한 focus 링（원본 규격 ring-3 무오프셋, 사이클 72）+
// 원본의 min-h-16. 색은 TextInput 자체가 글자 요소이므로 text-foreground를 여기에
// 명시（이중 지정 원칙）.
const textareaVariants = cva(
  "font-sans min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50 web:focus-visible:border-ring web:field-sizing-content web:shadow-xs web:transition-all web:outline-none web:md:text-sm",
);

// invalid=true일 때 덧씌우는 조건부 클래스 — 원본 aria-invalid:* 치환.
// twMerge가 border-input/focus:ring-ring 충돌을 뒤 값으로 정리한다.
const textareaInvalidClasses =
  "border-destructive focus:border-destructive focus:ring-destructive/20";

// TextInputProps 그대로 + invalid（원본 aria-invalid 상태 visual 치환）.
export type TextareaProps = TextInputProps & {
  /** 오류 상태 — 붉은 테두리·링을 조건부 클래스로 적용 */
  invalid?: boolean;
};

const Textarea = forwardRef<BridgeTextInputRef, TextareaProps>(
  ({ className, disabled, editable, invalid, ...props }, ref) => (
    <TextInput
      ref={ref}
      multiline
      editable={disabled ? false : editable}
      aria-disabled={disabled ? true : undefined}
      className={cn(
        textareaVariants(),
        invalid && textareaInvalidClasses,
        disabled && "opacity-50 web:cursor-not-allowed",
        className,
      )}
      {...props}
      // 브리지 계약에 editable 치환으로 반영됐으므로 disabled는 그대로 전달
      // （웹 textarea［disabled］ · RN은 위 editable={false}가 차단）
      disabled={disabled}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
