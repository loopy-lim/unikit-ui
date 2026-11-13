// InputOTP — shadcn/ui（new-york-v4） input-otp.tsx 유니버설 포팅 （사이클 40, T-2a）.
// 원본: shadcn-ref/ui/input-otp.tsx — input-otp 라이브러리（OTPInput
// OTPInputContext）를 제거하고 단일 숨은 TextInput 방식으로 직접 구현한다.
//
// 포팅 판단（원본 대비 차이）:
// - 구현 방식 선택: 셀별 입력（셋당 TextInput） 대신 단일 숨은 입력 — 셀 개수
//   maxLength의 투명 TextInput을 셀 위에 absolute로 겹치고 셀은 표시 전용
//   View로 그린다. 이유: （1） 네이티브에서 셀별 입력은 maxLength=1 때문에 붙여넣기
//   SMS 자동입력이 잘리는데 반해 단일 입력은 양측에서 자연 분배되고, （2） 백스페이스
//   화살표캐럿 등 키보드 조작을 입력 요소가 자체 처리해 셀 간 포커스 이동
//   로직（ref focus）이 불필요하다. 투명 요소도 터치를 받으므로（양측 확인） 셀 어디를
//   눌러도 입력이 포커스된다.
// - 원본 OTPInputContext（{ slots: ［{ char, hasFakeCaret, isActive }］ }）와 동일한
//   context를 제공해 InputOTPSlot 구조를 원본에 최대한 맞췄다.
// - 활성 셀/가짜 캐럿: 브리지 TextInputProps에 onFocus/onBlur 계약이 없어 포커스
//   이벤트를 알 수 없다. 대신 "삽입 위치 모델"로 근사 — 첫 빈 셀（모두 찼으면 마지막
//   셀）을 활성으로 표시한다. 미포커스 상태에도 캐럿이 보일 수 있다（한계）.
// - 캐럿 깜빡임（animate-caret-blink）: 웹은 keyframes가 하드 온오프로 깜빡이고
//   네이티브는 브리지 LoopPulse（RN Animated）로 부드러운 맥동 근사（주기 1.25s
//   준용 — 네이티브 근사 차이）.
// - 슬롯의 first:/last: 위치 셀렉터는 uniwind 미지원（확인） — 인덱스 0/끝이 곧
//   첫/마지막 셀이라는 성질（input-otp 슬롯 인덱스는 전역 연속）로 조건부 클래스
//   전개（rounded-l-md border-l / rounded-r-md）.
// - aria-invalid:* 셀렉터 스타일은 invalid?: boolean prop（textarea.tsx 관행）으로
//   받아 context 전파 + 조건부 클래스로 치환. ring-［3px］→ring-3（비대괄호 계단 —
//   사이클 72 원본 규격 정렬）, dark: 제거.
// - 구분선 아이콘은 브리지 SVG MinusIcon 프리미티브를 그대로 쓴다.
//   autoComplete="one-time-code"（SMS 자동입력 힌트）는
//   브리지 계약에 없어 미지원（로드맵）.
// - 데이터 규칙: 입력 문자를 걸러내지 않는다（원본 기본 동일）, value는
//   maxLength로 절단된 문자열을 유지한다.
import { createContext, forwardRef, useContext, useState } from "react";
import {
  LoopPulse,
  MinusIcon,
  Text,
  TextInput,
  View,
  type BridgeTextInputRef,
  type BridgeViewRef,
  type TextInputProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

// 원본 input-otp의 OTPInputContext 슬롯 상태와 동일 형태.
type OTPSlotState = {
  char?: string;
  hasFakeCaret: boolean;
  isActive: boolean;
};

type InputOTPContextValue = {
  slots: OTPSlotState[];
  invalid: boolean;
};

const InputOTPContext = createContext<InputOTPContextValue | null>(null);

export type InputOTPProps = ViewProps & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** 셀 개수（원본 OTPInput maxLength） */
  maxLength: number;
  /** 모든 셀이 채워졌을 때 1회 발화 */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  inputMode?: TextInputProps["inputMode"];
  /** 숨은 입력 ↔ Label 연결（웹 aria-labelledby — bridge/types.ts 계약） */
  accessibilityLabelledBy?: string;
  /** 오류 상태（원본 aria-invalid:* 치환） — 셀 테두리링 */
  invalid?: boolean;
  /** 컨테이너（셀 래퍼） 클래스 — 원본 containerClassName */
  containerClassName?: string;
};

const InputOTP = forwardRef<BridgeTextInputRef, InputOTPProps>(
  (
    {
      className,
      style,
      containerClassName,
      value,
      defaultValue,
      onChange,
      onComplete,
      maxLength,
      disabled,
      autoFocus,
      inputMode,
      invalid,
      nativeID,
      testID,
      accessibilityLabelledBy,
      children,
      ...props
    },
    ref,
  ) => {
    const cellCount = Math.max(1, maxLength);
    // 비제어 상태 — 제어（value 지정）면 무시된다.
    const [internalValue, setInternalValue] = useState(defaultValue ?? "");
    const current = value ?? internalValue;
    const commit = (text: string) => {
      const next = text.slice(0, cellCount);
      if (value === undefined) setInternalValue(next);
      if (next !== current) {
        onChange?.(next);
        if (next.length === cellCount) onComplete?.(next);
      }
    };
    // 삽입 위치 모델 — 첫 빈 셀, 모두 찼으면 마지막 셀（머리 주석）.
    const insertion = Math.min(current.length, cellCount - 1);
    const slots = Array.from({ length: cellCount }, (_, index) => ({
      char: current[index],
      isActive: index === insertion,
      hasFakeCaret: index === insertion && !current[index] && !disabled,
    }));
    return (
      <InputOTPContext.Provider
        value={{ slots, invalid: invalid ?? false }}
      >
        <View
          className={cn(
            // 원본 루트 flex items-center gap-2 — 구분선(Separator)과 셀 그룹 사이 간격.
            "relative flex-row items-center gap-2",
            disabled && "opacity-50",
            containerClassName,
          )}
          style={style}
          {...props}
        >
          {children}
          {/* 숨은 입력 — 셀 위를 덮는 투명 오버레이. 자식 이후에 렌더해 양측에서
              최상단(터치 수신)이 되게 한다. 웹 caret도 opacity로 가려진다. */}
          <TextInput
            ref={ref}
            className={cn(
              "absolute inset-0 bg-transparent opacity-0 web:cursor-default",
              className,
            )}
            value={current}
            onChangeText={commit}
            maxLength={cellCount}
            editable={disabled ? false : undefined}
            disabled={disabled}
            autoFocus={autoFocus}
            inputMode={inputMode}
            nativeID={nativeID}
            testID={testID}
            accessibilityLabelledBy={accessibilityLabelledBy}
            aria-invalid={invalid ? true : undefined}
          />
        </View>
      </InputOTPContext.Provider>
    );
  },
);
InputOTP.displayName = "InputOTP";

const inputOTPGroupVariants = cva("flex-row items-center");

export type InputOTPGroupProps = ViewProps;

const InputOTPGroup = forwardRef<BridgeViewRef, InputOTPGroupProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(inputOTPGroupVariants(), className)}
      {...props}
    />
  ),
);
InputOTPGroup.displayName = "InputOTPGroup";

export type InputOTPSlotProps = ViewProps & {
  index: number;
};

const InputOTPSlot = forwardRef<BridgeViewRef, InputOTPSlotProps>(
  ({ index, className, ...props }, ref) => {
    // InputOTP 밖 사용 시 조용히 빈 셀（원본의 optional chaining 관행과 동일）.
    const otp = useContext(InputOTPContext);
    const { char, hasFakeCaret, isActive } = otp?.slots[index] ?? {};
    const cellCount = otp?.slots.length ?? 0;
    return (
      <View
        ref={ref}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center border-y border-r border-input web:transition-all web:outline-none",
          // first:/last: 근사 — 인덱스로 전개（머리 주석）.
          index === 0 && "rounded-l-md border-l",
          cellCount > 0 && index === cellCount - 1 && "rounded-r-md",
          isActive && "z-10 border-ring ring-3 ring-ring/50",
          otp?.invalid && "border-destructive",
          isActive && otp?.invalid && "ring-destructive/20",
          className,
        )}
        {...props}
      >
        {char ? (
          <Text className="font-sans text-sm text-foreground">{char}</Text>
        ) : null}
        {hasFakeCaret && (
          <View
            aria-hidden
            className="absolute inset-0 items-center justify-center"
          >
            {/* 가짜 캐럿 — 웹은 animate-caret-blink(하드 깜빡임), 네이티브는
                LoopPulse(부드러운 맥동)로 근사（원본 1.25s 주기 준용） */}
            <LoopPulse durationMs={1250}>
              <View className="h-4 w-px bg-foreground" />
            </LoopPulse>
          </View>
        )}
      </View>
    );
  },
);
InputOTPSlot.displayName = "InputOTPSlot";

export type InputOTPSeparatorProps = ViewProps;

const InputOTPSeparator = forwardRef<BridgeViewRef, InputOTPSeparatorProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="separator"
      className={cn("flex-row items-center", className)}
      {...props}
    >
      <MinusIcon className="size-4 text-muted-foreground web:select-none" />
    </View>
  ),
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
