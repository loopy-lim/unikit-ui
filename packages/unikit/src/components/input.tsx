// Input — docs/sdd/02-design.md v2 §3.3 그대로.
// forwardRef로 입력 인스턴스（focus（）·blur（））를 노출 — §3.4 Label의
// onPress → ref.focus（） 라벨-입력창 클릭 연결용.
import { forwardRef } from "react";
import {
  Platform,
  TextInput,
  type BridgeTextInputRef,
  type TextInputProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

// 원본 base 값 정비（사이클 71）: h-9·px-3 py-1·min-w-0·shadow-xs·selection·md:text-sm.
// file:* 이식（잔여 갭 해소）: type="file" 지정 시 원본 file:* 토큰
// （::file-selector-button 스타일링 — 웹 전용 의사 요소）을 web: 접두 조건부
// 클래스로 전개한다. 웹 브리지 TextInput이 미계약 prop을 ...rest로 DOM에 흘려
// 보내 type이 <input type="file">로 흐른다（검증 — bridge/web.tsx TextInput）.
// 네이티브은 file 입력 자체가 없다（RN TextInput에 대응 관습 없음 — 웹 전용，
// 소비자 플랫폼 분기 권장）. 미지원（로드맵）: aria-invalid:*（InputGroup 경유 처리）.
// dark:bg-input/30은 원본 자체 클래스（다크 입력 가시성 보정 — checkbox와 같은 사례）.
// web:md:text-sm은 웹 한정 — 네이티브는 상시 text-base（브리지 텍스트 스케일 규약）.
//   제한은 위 라인 외에 별도 분기 없음（G3 리뷰 지적 반영 기록）.
// focus 링은 원본 규격（ring-3 · ring-ring/50 · 무오프셋）을 준수한다（사이클 72）
// — 무접두 유지: uniwind가 ring을 네이티브 box-shadow로 구동해 네이티브 링이 보존된다.
const inputVariants = cva(
  "font-sans h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base text-foreground web:transition-all web:outline-none web:selection:bg-primary web:selection:text-primary-foreground web:md:text-sm web:disabled:cursor-not-allowed placeholder:text-muted-foreground dark:bg-input/30 focus:border-ring focus:ring-3 focus:ring-ring/50 web:focus-visible:border-ring disabled:opacity-50",
  {
    variants: {
      // 원본 file:* 그대로（웹 전용 의사 요소라 web: 접두） — type="file"에서만 전개.
      type: {
        file: "web:file:inline-flex web:file:h-7 web:file:border-0 web:file:bg-transparent web:file:text-sm web:file:font-medium web:file:text-foreground",
      },
    },
  },
);

// InputProps — TextInputProps 그대로 + type（웹 <input type> 전달 — file 스타일링
// 내장， 네이티브은 수용하지 않는다）. 웹 관용 disabled의 치환 계약
// （native: 아래 editable={false} · web: input［disabled］ + aria-disabled）은
// bridge/types.ts의 disabled 주석이 단일 출처다.
export type InputProps = TextInputProps & {
  /** 웹 <input type>（예: "file"） — 웹에서만 DOM으로 흐른다（머리 주석） */
  type?: string;
};

const Input = forwardRef<BridgeTextInputRef, InputProps>(
  ({ className, type, disabled, editable, ...props }, ref) => (
    <TextInput
      ref={ref}
      // type은 브리지 계약 밖 속성 — 웹에서만 흘려보내고（select.tsx name 관행）
      // 네이티브은 폐기한다（RN TextInput에 file 입력 없음）.
      {...(type !== undefined && Platform.OS === "web" ? { type } : {})}
      editable={disabled ? false : editable}
      aria-disabled={disabled ? true : undefined}
      className={cn(
        inputVariants({ type: type === "file" ? "file" : undefined }),
        className,
      )}
      {...props}
      // 브리지 계약에는 editable 치환으로 이미 반영됐으므로 disabled는 그대로 전달
      // （웹 input［disabled］ · RN은 위 editable={false}가 차단）
      disabled={disabled}
    />
  ),
);
Input.displayName = "Input";

export { Input, inputVariants };
