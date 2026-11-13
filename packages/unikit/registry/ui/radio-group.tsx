// RadioGroup — shadcn/ui new-york-v4 radio-group을 UniKit UI 브리지로 이식.
// 포팅 판단:
// - radix RadioGroup（Root/Item/Indicator） 제거 — 선택 상태는 React context로
//   직접 관리하고, 원본의 data-state=checked 셀렉터 대신 선택 점 조건부 렌더.
// - CircleIcon（lucide） 제거 — 원본 Indicator（fill-primary, size-2=8px）를
//   동일 크기의 점 View（bg-primary）로 대체（문자 글리프보다 치수가 정확하다）.
// - RadioGroup 컨테이너는 role="radiogroup"（RN 0.88 표준 역할 — 스크린리더가
//   라디오 묶음으로 발표）을 지정한다（사이클 30 G4 반영）.
// - 원본 컨테이너 "grid gap-3"에서 grid는 웹 전용이라 제거 — View 기본 flex-col
//   + gap-3으로 세로 배치를 양쪽에서 동일하게 재현.
// - aria-invalid:* 클래스는 v0.1 API에 invalid 상태가 없어 제외.
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type PressableProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";

// 그룹 상태 — RadioGroup이 공급하고 RadioGroupItem이 소비.
type RadioGroupContextValue = {
  /** 현재 선택값（선택 없음 ""） */
  value: string;
  /** 그룹 차단이 항목에 전파된다 */
  disabled: boolean;
  /** 항목 눌림 — 항목이 자기 value를 전달해 그룹이 정리한다 */
  onItemPress: (value: string) => void;
};

const RadioGroupContext = createContext<RadioGroupContextValue>({
  value: "",
  disabled: false,
  onItemPress: () => {},
});

export type RadioGroupProps = ViewProps & {
  /** 제어형 선택값 */
  value?: string;
  /** 비제어형 초기 선택값 */
  defaultValue?: string;
  /** 선택 변경 콜백 */
  onValueChange?: (value: string) => void;
  /** 그룹 전체 차단 — 항목에 일괄 전파 */
  disabled?: boolean;
};

const RadioGroup = forwardRef<BridgeViewRef, RadioGroupProps>(
  (
    {
      className,
      value,
      defaultValue = "",
      onValueChange,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    // 제어/비제어 통합 — 라디오는 항상 단일 선택이라 문자열 state면 충분하다.
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const isControlled = value !== undefined;
    const selectedValue = isControlled ? value : uncontrolled;

    const handleItemPress = useCallback(
      (itemValue: string) => {
        if (!isControlled) setUncontrolled(itemValue);
        onValueChange?.(itemValue);
      },
      [isControlled, onValueChange],
    );

    const contextValue = useMemo(
      () => ({
        value: selectedValue,
        disabled,
        onItemPress: handleItemPress,
      }),
      [selectedValue, disabled, handleItemPress],
    );

    return (
      <View
        ref={ref}
        accessibilityRole="radiogroup"
        className={cn("gap-3", className)}
        {...props}
      >
        <RadioGroupContext.Provider value={contextValue}>
          {children}
        </RadioGroupContext.Provider>
      </View>
    );
  },
);
RadioGroup.displayName = "RadioGroup";

// 터치 타깃 44px 보정: 16px 원 → hitSlop = （44 − 16） / 2 = 14px.
const HIT_SLOP = 14;

export type RadioGroupItemProps = Omit<
  PressableProps,
  "onPress" | "aria-checked"
> & {
  /** 이 항목의 값 — 그룹 value와의 일치 여부가 선택 상태가 된다 */
  value: string;
};

const RadioGroupItem = forwardRef<BridgePressableRef, RadioGroupItemProps>(
  ({ className, value, disabled, hitSlop, ...props }, ref) => {
    const group = useContext(RadioGroupContext);
    const isChecked = group.value === value;
    const isDisabled = disabled || group.disabled;

    return (
      <Pressable
        ref={ref}
        accessibilityRole="radio"
        aria-checked={isChecked}
        aria-disabled={isDisabled ? true : undefined}
        disabled={isDisabled}
        hitSlop={hitSlop ?? HIT_SLOP}
        onPress={() => group.onItemPress(value)}
        className={cn(
          // 링은 border-input（라이트 1.27:1）이 배경에 묻혀 컨트롤 경계가 안
          // 보이므로 foreground/50（양 모드 ≥3:1, G4）로 조정.
          "flex size-4 shrink-0 flex-row items-center justify-center rounded-full border border-foreground/50 web:transition-all web:outline-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
          isDisabled &&
            "web:pointer-events-none web:cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >
        {/* 선택 점 — 원본 Indicator（fill-primary size-2 = 8px） 대응.
            선택 시에만 렌더, 항목 테두리는 선택과 무관하게 유지된다. */}
        {isChecked ? (
          <View aria-hidden className="size-2 rounded-full bg-primary" />
        ) : null}
      </Pressable>
    );
  },
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
