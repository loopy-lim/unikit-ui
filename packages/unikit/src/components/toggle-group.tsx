// ToggleGroup — shadcn/ui new-york-v4 toggle-group을 UniKit 브리지로 이식.
// 포팅 판단:
// - radix ToggleGroup(Root/Item) 제거 — 선택 상태는 React context로 관리하고
//   하위 항목은 Toggle(./toggle)에 pressed를 주입해 재사용한다.
// - spacing prop · --gap CSS 변수 · data-spacing/first:/last: 셀렉터 제거 —
//   의사 클래스·CSS 변수는 네이티브에서 재현 불가라 연접 대신 고정 gap-1 간격의
//   독립 항목 배치로 단순화(항목의 rounded-md·테두리가 그대로 살아있다).
// - single은 이미 선택된 항목 재선택 시 onValueChange("")(radix 원본 동작 준수),
//   multiple은 배열 토글. 그룹 disabled는 항목에 일괄 전파.
import {
  createContext,
  forwardRef,
  useContext,
  useState,
} from "react";
import {
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

import { Toggle, toggleVariants, type ToggleProps } from "./toggle";

// 그룹 상태 — ToggleGroup이 공급하고 ToggleGroupItem이 소비.
type ToggleGroupContextValue = {
  type: "single" | "multiple";
  isSelected: (value: string) => boolean;
  onItemPress: (value: string) => void;
  variant: VariantProps<typeof toggleVariants>["variant"];
  size: VariantProps<typeof toggleVariants>["size"];
  disabled: boolean;
};

// 그룹 밖에서 Item을 쓴 경우의 폴백 — 눌림 없는 정적 항목으로 렌더(비권장).
const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  type: "single",
  isSelected: () => false,
  onItemPress: () => {},
  variant: "default",
  size: "default",
  disabled: false,
});

// shadcn 원본 API 준수 — type에 따라 value/onValueChange 시그니처가 갈린다.
type ToggleGroupBaseProps = ViewProps &
  VariantProps<typeof toggleVariants> & {
    /** 단일/다중 선택 — 기본 single */
    type?: "single" | "multiple";
    /** 비제어형 초기값(single: 문자열, multiple: 배열) */
    defaultValue?: string | string[];
    /** 그룹 전체 차단 — 항목에 일괄 전파 */
    disabled?: boolean;
  };

export type ToggleGroupProps = ToggleGroupBaseProps &
  (
    | {
        type?: "single";
        value?: string;
        onValueChange?: (value: string) => void;
      }
    | {
        type: "multiple";
        value?: string[];
        onValueChange?: (value: string[]) => void;
      }
  );

// 내부 상태는 string[]로 통합(single은 길이 0~1 배열) — ""·undefined는 선택 없음.
const toArray = (v: string | string[] | undefined): string[] =>
  v === undefined || v === "" ? [] : Array.isArray(v) ? v : [v];

const ToggleGroup = forwardRef<BridgeViewRef, ToggleGroupProps>(
  (
    {
      className,
      variant,
      size,
      type = "single",
      value,
      defaultValue,
      onValueChange,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = useState(() =>
      toArray(defaultValue),
    );
    const isControlled = value !== undefined;
    const selected = isControlled ? toArray(value) : uncontrolled;

    const isSelected = (itemValue: string) => selected.includes(itemValue);

    const handleItemPress = (itemValue: string) => {
      if (type === "multiple") {
        const next = isSelected(itemValue)
          ? selected.filter((v) => v !== itemValue)
          : [...selected, itemValue];
        if (!isControlled) setUncontrolled(next);
        if (onValueChange) {
          // type 브랜치가 보장하는 시그니처로 좁힌다(any 아님).
          (onValueChange as (value: string[]) => void)(next);
        }
        return;
      }
      // single — 이미 선택된 항목 재선택 시 해제(radix 동작: 빈 문자열 방출)
      const next = selected[0] === itemValue ? [] : [itemValue];
      if (!isControlled) setUncontrolled(next);
      if (onValueChange) {
        (onValueChange as (value: string) => void)(next[0] ?? "");
      }
    };

    return (
      <View
        ref={ref}
        className={cn(
          // w-fit은 uniwind 미지원 — self-start 치환으로 양쪽 플랫폼 내용 폭(M-2).
          "flex self-start flex-row items-center gap-1 rounded-md",
          className,
        )}
        {...props}
      >
        <ToggleGroupContext.Provider
          value={{
            type,
            isSelected,
            onItemPress: handleItemPress,
            variant,
            size,
            disabled,
          }}
        >
          {children}
        </ToggleGroupContext.Provider>
      </View>
    );
  },
);
ToggleGroup.displayName = "ToggleGroup";

export type ToggleGroupItemProps = Omit<
  ToggleProps,
  "pressed" | "defaultPressed" | "onPressedChange"
> & {
  /** 이 항목의 값 */
  value: string;
};

const ToggleGroupItem = forwardRef<BridgePressableRef, ToggleGroupItemProps>(
  (
    { className, variant, size, disabled, value, children, ...props },
    ref,
  ) => {
    const group = useContext(ToggleGroupContext);
    const isPressed = group.isSelected(value);
    const isDisabled = disabled || group.disabled;

    return (
      <Toggle
        ref={ref}
        variant={group.variant ?? variant}
        size={group.size ?? size}
        pressed={isPressed}
        disabled={isDisabled}
        className={cn(
          // 원본 항목 오버라이드: min-w-9 → min-w-0, px-2 → px-3. z-index는 웹 전용.
          "w-auto min-w-0 shrink-0 px-3 web:focus:z-10 web:focus-visible:z-10",
          className,
        )}
        {...props}
      >
        {children}
      </Toggle>
    );
  },
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
