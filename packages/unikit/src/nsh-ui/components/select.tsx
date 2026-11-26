// Select — src/components/native-select.tsx의 nsh 네이티브 포팅(사이클 102).
// 기반: nsh/base의 Select(items/value/onChange + trigger 슬롯 — 검색·클리어·
// 배치는 nsh가 소유한다).
//
// 포팅 판단(원본 대비 차이):
// - 옵션은 children이 아니라 options 데이터({value,label,disabled})로 받는다
//   — 실측: nsh JSX의 children은 컴포넌트 실행 결과(렌더물)라 children에서
//   props를 추출할 수 없다. UniKit NativeSelect의 Option-children은 RN 폴백
//   관습이고, shadcn Select도 (컴파운드라) 직접 대응이 없다(로드맵: Option).
// - trigger는 nsh 기본 트리거 대신 UniKit 입력 클래스를 입힌 View+
//   ChevronDown으로 직접 제공한다(형태 동일성).
// - invalid 조건부 클래스·size 전개(h-8/h-9)는 원본 관행 유지.
// - w-fit은 미지원 — self-start 치환(원본과 동일).
import { Select as NshSelect, type SelectItem } from "nsh/base";
import { signal, Text, View } from "nsh";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";
import { ChevronDownIcon } from "../icons";
import type { Element } from "../types";

const selectTriggerVariants = cva(
  "flex flex-row items-center gap-2 self-start rounded-md border border-input bg-transparent px-3 py-1 text-foreground focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-9 py-2",
        sm: "h-8 py-1",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const selectTriggerTextVariants = cva("font-sans flex-1 text-foreground", {
  variants: {
    size: {
      default: "text-sm",
      sm: "text-sm",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = VariantProps<typeof selectTriggerVariants> & {
  className?: string;
  /** 옵션 목록(데이터 — children이 아니라 prop으로 준다) */
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** invalid=true일 때 파괴색 보더 */
  invalid?: boolean;
  testID?: string;
  children?: Element;
};

export function Select(props: SelectProps) {
  // props는 getter다 — options을 몸체에서 즉시 풀면 시그널 교체를 못 따라간다
  // (초기 목록에 고정). 접근자로 두고 넘기는 시점(items={items()}·selected())마다
  // 다시 계산해 options 갱신을 추적한다.
  const items = () =>
    props.options.map((option): SelectItem => ({
      value: option.value,
      title: option.label,
      disabled: option.disabled,
    }));
  // 비제어 선택을 반영한다(제어형 value 우선) — 트리거 텍스트는 양쪽 모두 갱신.
  const picked = signal<string | null>(props.defaultValue ?? null);
  const chosen = () => (props.value !== undefined ? props.value : picked());
  const selected = () =>
    items().find((item) => item.value === chosen()) ?? null;
  return (
    <NshSelect
      class={nshClass(props.className)}
      items={items()}
      value={chosen()}
      placeholder={props.placeholder}
      disabled={props.disabled}
      testID={props.testID}
      itemClass="text-sm text-foreground"
      onChange={(event: { value: string | null }) => {
        picked.set(event.value);
        if (event.value !== null) props.onValueChange?.(event.value);
      }}
      trigger={
        <View
          class={cn(
            selectTriggerVariants({ size: props.size }),
            props.invalid && "border-destructive focus:ring-destructive/20",
          )}
        >
          <Text class={cn(selectTriggerTextVariants({ size: props.size }))}>
            {selected()?.title ?? props.placeholder ?? ""}
          </Text>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </View>
      }
    />
  );
}

export { selectTriggerVariants };
