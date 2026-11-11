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

// 원본 base 값 정비（사이클 71）: h-9·px-3 py-1·min-w-0·shadow-xs·selection·md:text-sm.
// 미지원（로드맵）: file:*（file 입력 없음）·aria-invalid:*（InputGroup 경유 처리）.
// dark:bg-input/30은 원본 자체 클래스（다크 입력 가시성 보정 — checkbox와 같은 사례）.
// web:md:text-sm은 웹 한정 — 네이티브는 상시 text-base（브리지 텍스트 스케일 규약）.
//   제한은 위 라인 외에 별도 분기 없음（G3 리뷰 지적 반영 기록）.
// focus 링은 원본 규격（ring-3 · ring-ring/50 · 무오프셋）을 준수한다（사이클 72）
// — 무접두 유지: uniwind가 ring을 네이티브 box-shadow로 구동해 네이티브 링이 보존된다.
const inputVariants = cva(
  "font-sans h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base text-foreground web:shadow-xs web:transition-all web:outline-none web:selection:bg-primary web:selection:text-primary-foreground web:md:text-sm web:disabled:cursor-not-allowed placeholder:text-muted-foreground dark:bg-input/30 focus:border-ring focus:ring-3 focus:ring-ring/50 web:focus-visible:border-ring disabled:opacity-50",
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
