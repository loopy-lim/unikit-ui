// RadioGroup — src/components/radio-group.tsx의 nsh 네이티브 포팅(사이클 102).
// 기반: nsh/base의 RadioGroup(키보드 순회·역할 소유)+Radio(checked/onChange).
// UniKit API(value/onValueChange + RadioGroupItem value)를 그대로 노출하기 위해
// context()로 선택값 getter·변경 함수·그룹 disabled를 항목에 전달한다.
//
// 포팅 판단(원본 대비 차이):
// - 컨테이너 gap-3(원본 grid gap-3의 flex-col 재현 — 원본 관행 승계).
// - 링은 원본과 같은 G4 대비 조정(border-foreground/50).
// - 터치 타깃 44px 보정: 16px 링 → hitSlop 14px(그룹 disabled는 항목에 전파).
import { RadioGroup as NshRadioGroup, Radio as NshRadio } from "nsh/base";
import { context, signal, View } from "nsh";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";
import type { Element } from "../types";

type GroupState = {
  selected: () => string | undefined;
  choose: (value: string) => void;
  disabled: () => boolean;
};

const RadioGroupContext = context<GroupState | null>(null);

const radioGroupVariants = cva("flex flex-col gap-3");

const radioItemVariants = cva(
  "flex flex-row items-center gap-2 rounded-xs focus-visible:ring-3 focus-visible:ring-ring/50",
);

// 링 — 원본 size-4·rounded-full(border-foreground/50 — G4 대비 조정).
const radioIndicatorVariants = cva(
  "flex size-4 shrink-0 flex-row items-center justify-center rounded-full border border-foreground/50 disabled:opacity-50",
);

const radioDotVariants = cva("rounded-full bg-primary size-2");

// 터치 타깃 44px 보정: (44 − 16) / 2 = 14px.
const HIT_SLOP = 14;

export type RadioGroupProps = VariantProps<typeof radioGroupVariants> & {
  className?: string;
  /** 선택된 항목의 value */
  value?: string;
  /** 비제어형 초기값 */
  defaultValue?: string;
  /** 선택 변경 콜백 */
  onValueChange?: (value: string) => void;
  /** 그룹 전체 비활성화 — 항목에 전파된다 */
  disabled?: boolean;
  testID?: string;
  /** RadioGroupItem 목록 */
  children?: Element;
};

export function RadioGroup(props: RadioGroupProps) {
  const uncontrolled = signal(props.defaultValue);
  const state: GroupState = {
    selected: () => (props.value !== undefined ? props.value : uncontrolled()),
    choose: (value: string) => {
      uncontrolled.set(value);
      props.onValueChange?.(value);
    },
    disabled: () => props.disabled ?? false,
  };
  return (
    <RadioGroupContext.Provider value={state}>
      <NshRadioGroup
        class={cn(radioGroupVariants(), nshClass(props.className))}
        testID={props.testID}
      >
        {props.children}
      </NshRadioGroup>
    </RadioGroupContext.Provider>
  );
}

export type RadioGroupItemProps = {
  className?: string;
  /** 이 항목의 값 */
  value: string;
  disabled?: boolean;
  testID?: string;
  /** 터치 타깃 확장(px) — 미지정 시 기본 보정 */
  hitSlop?: number;
  /** 라벨(문자열 권장) */
  children?: Element;
};

export function RadioGroupItem(props: RadioGroupItemProps) {
  const group = RadioGroupContext();
  if (!group) {
    throw new Error("RadioGroupItem은 RadioGroup 안에서만 쓸 수 있다");
  }
  return (
    <NshRadio
      class={cn(radioItemVariants(), nshClass(props.className))}
      checked={group.selected() === props.value}
      disabled={props.disabled ?? group.disabled()}
      testID={props.testID}
      hitSlop={props.hitSlop ?? HIT_SLOP}
      onChange={() => group.choose(props.value)}
    >
      <View class={cn(radioIndicatorVariants())}>
        {group.selected() === props.value ? (
          <View class={cn(radioDotVariants())} />
        ) : null}
      </View>
      {props.children}
    </NshRadio>
  );
}

export { radioGroupVariants };
