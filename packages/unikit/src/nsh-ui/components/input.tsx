// Input — src/components/input.tsx의 nsh 네이티브 포팅(사이클 102).
// 기반: nsh/base의 Input(class 스타일링, value/onChange({value}) 제어 계약).
//
// 포팅 판단(원본 대비 차이):
// - onChangeText → onChange({value}) 치환, secureTextEntry → masked,
//   inputMode → KEYBOARD_TYPE, editable={false} → disabled 치환(bridge 계약 승계).
// - web: 접두 토큰·dark:bg-input/30 제거, focus 링은 nsh focus:* 변형으로.
// - 포커스 ref 노출은 InputRef를 그대로 넘긴다(로드맵: ref forward 유틸).
// - 한글 IME 등 조합 입력의 onCompositionChange는 기본 계약만 유지.
import { Input as NshInput } from "nsh/base";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { KEYBOARD_TYPE, autoCapitalizeOf, nshClass } from "../lib";

const inputVariants = cva(
  "font-sans h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50",
);

export type InputProps = {
  /** 추가 클래스 */
  className?: string;
  /** 제어값 */
  value?: string;
  /** 비제어 초기값 */
  defaultValue?: string;
  /** 입력 콜백(제어값을 되돌려 준다) */
  onChangeText?: (text: string) => void;
  placeholder?: string;
  /** 비밀번호 마스킹(secureTextEntry) */
  secureTextEntry?: boolean;
  inputMode?: "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  /** autoCapitalize — "default"는 미지정과 같다 */
  autoCapitalize?: "default" | "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  maxLength?: number;
  /** 비활성화(editable={false} 치환) */
  disabled?: boolean;
  /** 제출 키 */
  returnKeyType?: "default" | "done" | "go" | "next" | "search" | "send";
  testID?: string;
  style?: unknown;
};

export function Input(props: InputProps) {
  return (
    <NshInput
      class={cn(inputVariants(), nshClass(props.className))}
      style={props.style as never}
      value={props.value}
      defaultValue={props.defaultValue}
      placeholder={props.placeholder}
      masked={props.secureTextEntry}
      keyboardType={
        props.inputMode ? KEYBOARD_TYPE[props.inputMode] : undefined
      }
      autoCapitalize={autoCapitalizeOf(props.autoCapitalize)}
      autoCorrect={props.autoCorrect}
      maxLength={props.maxLength}
      disabled={props.disabled}
      returnKeyType={props.returnKeyType}
      testID={props.testID}
      onChange={
        props.onChangeText
          ? (event: { value: string }) => props.onChangeText!(event.value)
          : undefined
      }
    />
  );
}

export { inputVariants };
