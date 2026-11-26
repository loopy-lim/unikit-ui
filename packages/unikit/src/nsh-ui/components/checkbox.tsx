// Checkbox — src/components/checkbox.tsx의 nsh 네이티브 포팅(사이클 102, 103 수정).
// 기반: nsh/base의 Checkbox — 호스트(눌림 대상) + indicatorClass(상자) + indicator
// (표시) + children(라벨) 구조. checked:/indeterminate:/disabled: 변형은 파트에
// 자동 전파된다.
//
// 포팅 판단(원본 대비 차이):
// - 원본·React 포팅은 상자 하나가 눌림 대상이고 라벨은 없다(소비자가 Label과
//   조합). nsh/base Checkbox는 라벨 슬롯을 가지므로 호스트를 행(row)으로 두고
//   상자를 indicatorClass 파트, children을 상자 뒤 라벨로 둔다. className은
//   호스트 행에 붙는다(눌림 영역·레이아웃).
// - 미체크 링은 React 포팅과 같은 G4 대비 조정(border-foreground/50 — border-input은
//   라이트 1.27:1로 배경에 묻힘), 체크/중간은 border-primary bg-primary(nsh
//   checked:/indeterminate: 변형). 글리프는 원본값 size-3.5 text-primary-foreground
//   (102에서 size-3으로 축소돼 있던 것을 복원).
// - focus-visible 링은 호스트의 group 아래 상자에 붙인다(group-focus-visible:) —
//   상자가 원본 Root의 역할이다(React 포팅은 web: 접두 전용).
// - indicator는 체크·중간일 때만 넘긴다. 늘 넘기면 미선택 상자에 표시가 보인다
//   (nsh 계약: 표시는 "앱이 가진 값으로" 보여 준다 — 102 결함).
// - 비활성 dim은 호스트 행 전체(disabled:opacity-50 — 상자·라벨 함께).
// - 문자열·숫자 children은 내부 Text로 감싼다(nsh/base 파트는 문자열 children
//   거부 — 102 결함).
// - 호스트 행에 text-foreground — nsh는 뷰의 글자색을 자식 Text에 상속하므로
//   (103 실측), 클래스 없는 Text를 라벨로 넘겨도 색 스킴을 따른다(없으면 검정 고정).
// - 터치 타깃 44px 보정: 16px 박스 → hitSlop 14px.
import { Checkbox as NshCheckbox } from "nsh/base";
import { signal } from "nsh";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { CheckIcon, MinusIcon } from "../icons";
import { wrapLabel } from "../label";
import { nshClass } from "../lib";
import type { Element } from "../types";

// 상자(indicatorClass 파트) — React 포팅 checkboxVariants와 같은 역할·값.
const checkboxVariants = cva(
  "flex size-4 shrink-0 flex-row items-center justify-center rounded-sm border border-foreground/50 checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary group-focus-visible:border-ring group-focus-visible:ring-3 group-focus-visible:ring-ring/50",
);

// 호스트 행 — 상자 + 라벨(text-foreground은 클래스 없는 Text 라벨이 상속한다).
const checkboxRowVariants = cva(
  "group flex flex-row items-center gap-2 text-foreground disabled:opacity-50",
);

const checkboxIconVariants = cva("size-3.5 text-primary-foreground");

// 터치 타깃 44px 보정: (44 − 16) / 2 = 14px.
const HIT_SLOP = 14;

export type CheckboxProps = {
  /** 추가 클래스 — 호스트 행에 붙는다 */
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
  /** 라벨 — 문자열을 권장한다(내부 Text 래핑, 스크린리더가 읽는다) */
  children?: Element;
};

export function Checkbox(props: CheckboxProps) {
  const uncontrolled = signal(props.defaultChecked ?? false);
  const isChecked = () => (props.checked !== undefined ? props.checked : uncontrolled());
  return (
    <NshCheckbox
      class={cn(checkboxRowVariants(), nshClass(props.className))}
      checked={isChecked()}
      indeterminate={props.indeterminate}
      disabled={props.disabled}
      testID={props.testID}
      hitSlop={props.hitSlop ?? HIT_SLOP}
      indicatorClass={cn(checkboxVariants())}
      indicator={
        props.indeterminate ? (
          <MinusIcon className={cn(checkboxIconVariants())} />
        ) : isChecked() ? (
          <CheckIcon className={cn(checkboxIconVariants())} />
        ) : null
      }
      onChange={(event: { checked: boolean }) => {
        uncontrolled.set(event.checked);
        props.onCheckedChange?.(event.checked);
      }}
    >
      {wrapLabel(props.children)}
    </NshCheckbox>
  );
}

export { checkboxVariants };
