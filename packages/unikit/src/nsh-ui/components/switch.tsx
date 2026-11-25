// Switch — src/components/switch.tsx의 nsh 네이티브 포팅(사이클 102, 103 수정).
// 기반: nsh/base의 Switch(track/thumb 파트 + checked:/active:/disabled:
// 상태 변형을 파트에 자동 전파한다).
//
// 포팅 판단(원본 대비 차이):
// - 원본은 Pressable+justify-start/end로 썸을 옮긴다 — nsh Switch는 파트
//   클래스에 checked: 변형을 전파하므로 thumb의 checked:translate-x-* 로
//   옮긴다. 이동량은 React 포팅(justify-end)과 같은 위치로: 트랙 내용 폭에서
//   썸 폭을 뺀 만큼 — 테두리 1px·px-0.5를 포함해 default 26 − 16 = 10px
//   (translate-x-2.5), sm 18 − 12 = 6px(translate-x-1.5).
// - 썸 색: 라이트는 원본과 같은 bg-background. 다크는 원본의 dark:data-[state]
//   변형(켜짐 bg-primary-foreground·꺼짐 bg-foreground)을 colorScheme() 조건부
//   클래스로 재현한다 — dark: 클래스는 nshClass가 제거하므로 변형으로 못 쓴다.
// - 꺼짐 트랙은 원본과 같은 G4 대비 조정(bg-foreground/50 — bg-input은
//   라이트 1.27:1로 배경에 묻힘), 켜짐은 checked:bg-primary.
// - 원본·React 포팅은 트랙 하나가 눌림 대상이고 라벨은 없다. nsh/base Switch는
//   라벨 슬롯을 가지므로 호스트를 행(row)으로 두고 children을 트랙 뒤 라벨로
//   둔다. className은 호스트 행에 붙는다.
// - focus-visible 링은 호스트의 group 아래 트랙에 붙인다(group-focus-visible:).
// - 비활성 dim은 호스트 행 전체(disabled:opacity-50).
// - 문자열·숫자 children은 내부 Text로 감싼다(102 결함: UnknownNode).
// - 호스트 행에 text-foreground — nsh는 뷰의 글자색을 자식 Text에 상속하므로
//   (103 실측), 클래스 없는 Text를 라벨로 넘겨도 색 스킴을 따른다(없으면 검정 고정).
// - 비제어 상태는 signal(제어형 checked 우선). hitSlop 터치 타깃 보정 유지.
import { Switch as NshSwitch } from "nsh/base";
import { colorScheme, signal } from "nsh";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { wrapLabel } from "../label";
import { nshClass } from "../lib";
import type { Element } from "../types";

const switchTrackVariants = cva(
  "flex shrink-0 flex-row items-center justify-start rounded-full border border-transparent bg-foreground/50 px-0.5 checked:bg-primary group-focus-visible:border-ring group-focus-visible:ring-3 group-focus-visible:ring-ring/50",
  {
    variants: {
      size: {
        default: "h-4.5 w-8",
        sm: "h-3.5 w-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const switchThumbVariants = cva("rounded-full bg-background", {
  variants: {
    size: {
      default: "size-4 checked:translate-x-2.5",
      sm: "size-3 checked:translate-x-1.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

// 호스트 행 — 트랙 + 라벨(text-foreground은 클래스 없는 Text 라벨이 상속한다).
const switchRowVariants = cva(
  "group flex flex-row items-center gap-2 text-foreground disabled:opacity-50",
);

// 다크 스킴 썸 — 원본 dark:data-[state=checked]:bg-primary-foreground·
// dark:data-[state=unchecked]:bg-foreground.
const switchThumbDarkVariants = cva("bg-foreground checked:bg-primary-foreground");

// 터치 타깃 44px 보정(§3.1): default h-4.5(18px)·sm h-3.5(14px).
const HIT_SLOP = { default: 13, sm: 15 } as const;

export type SwitchProps = VariantProps<typeof switchTrackVariants> & {
  /** 추가 클래스 — 호스트 행에 붙는다 */
  className?: string;
  /** 제어형 토글 상태(지정 시 내부 state를 대체) */
  checked?: boolean;
  /** 비제어형 초기 토글 상태 */
  defaultChecked?: boolean;
  /** 토글 전환 콜백 */
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  testID?: string;
  /** 터치 타깃 확장(px) — 미지정 시 크기별 기본 보정 */
  hitSlop?: number;
  /** 트랙 뒤 라벨 — 문자열을 권장한다(내부 Text 래핑) */
  children?: Element;
};

export function Switch(props: SwitchProps) {
  const uncontrolled = signal(props.defaultChecked ?? false);
  const resolvedSize = props.size ?? "default";
  return (
    <NshSwitch
      class={cn(switchRowVariants(), nshClass(props.className))}
      checked={props.checked !== undefined ? props.checked : uncontrolled()}
      disabled={props.disabled}
      testID={props.testID}
      hitSlop={props.hitSlop ?? HIT_SLOP[resolvedSize]}
      trackClass={cn(switchTrackVariants({ size: props.size }))}
      thumbClass={cn(
        switchThumbVariants({ size: props.size }),
        colorScheme() === "dark" && switchThumbDarkVariants(),
      )}
      onChange={(event: { checked: boolean }) => {
        uncontrolled.set(event.checked);
        props.onCheckedChange?.(event.checked);
      }}
    >
      {wrapLabel(props.children)}
    </NshSwitch>
  );
}

export { switchTrackVariants, switchThumbVariants };
