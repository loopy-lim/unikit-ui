// Checkbox — src/components/checkbox.tsx의 nsh 네이티브 포팅(사이클 102).
// 기반: nsh/base의 Checkbox(indicator 파트 + checked:/indeterminate: 상태
// 전파). 체크·중간 글리프는 indicator 슬롯에 Check/Minus 아이콘으로 넣는다
// (JSX 안에서 조건 분기 — indeterminate의 런타임 전환도 따라간다).
//
// 포팅 판단(원본 대비 차이):
// - 미체크 링은 원본과 같은 G4 대비 조정(border-foreground/50 —
//   border-input은 라이트 1.27:1로 배경에 묻힘), 체크/중간은
//   border-primary bg-primary(nsh checked:/indeterminate: 변형).
// - 크기는 원본과 동일하게 단일 size-4 박스·rounded-sm.
// - 터치 타깃 44px 보정: 16px 박스 → hitSlop 14px.
import { Checkbox as NshCheckbox } from "nsh/base";
import { signal } from "nsh";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { nshClass } from "../lib";
import { CheckIcon, MinusIcon } from "../icons";
import type { Element } from "../types";

const checkboxVariants = cva(
  "flex size-4 shrink-0 flex-row items-center justify-center rounded-sm border border-foreground/50 checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
);

const checkboxIconVariants = cva("size-3 text-primary-foreground");

// 터치 타깃 44px 보정: (44 − 16) / 2 = 14px.
const HIT_SLOP = 14;

export type CheckboxProps = {
  className?: string;
  /** 제어형 체크 상태 */
  checked?: boolean;
  /** 비제어형 초기 상태 */
  defaultChecked?: boolean;
  /** 중간 상태 — − 글리프(shadcn checked="indeterminate" 대응) */
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  testID?: string;
  /** 터치 타깃 확장(px) — 미지정 시 기본 보정 */
  hitSlop?: number;
  /** 라벨(문자열 권장 — 스크린리더가 읽는다) */
  children?: Element;
};

export function Checkbox(props: CheckboxProps) {
  const uncontrolled = signal(props.defaultChecked ?? false);
  return (
    <NshCheckbox
      class={cn(checkboxVariants(), nshClass(props.className))}
      checked={props.checked !== undefined ? props.checked : uncontrolled()}
      indeterminate={props.indeterminate}
      disabled={props.disabled}
      testID={props.testID}
      hitSlop={props.hitSlop ?? HIT_SLOP}
      indicatorClass="flex items-center justify-center"
      indicator={
        props.indeterminate ? (
          <MinusIcon className={cn(checkboxIconVariants())} />
        ) : (
          <CheckIcon className={cn(checkboxIconVariants())} />
        )
      }
      onChange={(event: { checked: boolean }) => {
        uncontrolled.set(event.checked);
        props.onCheckedChange?.(event.checked);
      }}
    >
      {props.children}
    </NshCheckbox>
  );
}

export { checkboxVariants };
