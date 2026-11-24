// Switch — src/components/switch.tsx의 nsh 네이티브 포팅(사이클 102).
// 기반: nsh/base의 Switch(track/thumb 파트 + checked:/active:/disabled:
// 상태 변형을 파트에 자동 전파한다).
//
// 포팅 판단(원본 대비 차이):
// - 원본은 Pressable+justify-start/end로 썸을 옮긴다 — nsh Switch는 파트
//   클래스에 checked: 변형을 전파하므로 thumb의 checked:translate-x-* 로
//   옮긴다. 이동량은 실측 기하로 산출: w-8(32) − px-0.5×2(4) − size-4(16) =
//   12px = translate-x-3, sm은 w-6(24) − 4 − size-3(12) = 8px = translate-x-2.
// - 꺼짐 트랙은 원본과 같은 G4 대비 조정(bg-foreground/50 — bg-input은
//   라이트 1.27:1로 배경에 묻힘), 켜짐은 checked:bg-primary.
// - 비제어 상태는 signal(제어형 checked 우선). hitSlop 터치 타깃 보정 유지.
import { Switch as NshSwitch } from "nsh/base";
import { signal } from "nsh";
import { cva, type VariantProps } from "class-variance-authority";


import { cn } from "../../lib/utils";
import { nshClass } from "../lib";

const switchTrackVariants = cva(
  "flex shrink-0 flex-row items-center justify-start rounded-full border border-transparent bg-foreground/50 px-0.5 checked:bg-primary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
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

const switchThumbVariants = cva(
  "rounded-full bg-background checked:translate-x-3 disabled:opacity-50",
  {
    variants: {
      size: {
        default: "size-4",
        sm: "size-3 checked:translate-x-2",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

// 터치 타깃 44px 보정(§3.1): default h-4.5(18px)·sm h-3.5(14px).
const HIT_SLOP = { default: 13, sm: 15 } as const;

export type SwitchProps = VariantProps<typeof switchTrackVariants> & {
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
  /** 트랙 뒤 라벨(문자열 권장) */
  children?: import("nsh/types").JSX.Element;
};

export function Switch(props: SwitchProps) {
  const uncontrolled = signal(props.defaultChecked ?? false);
  const resolvedSize = props.size ?? "default";
  return (
    <NshSwitch
      class={nshClass(props.className)}
      checked={props.checked !== undefined ? props.checked : uncontrolled()}
      disabled={props.disabled}
      testID={props.testID}
      hitSlop={props.hitSlop ?? HIT_SLOP[resolvedSize]}
      trackClass={cn(switchTrackVariants({ size: props.size }))}
      thumbClass={cn(switchThumbVariants({ size: props.size }))}
      onChange={(event: { checked: boolean }) => {
        uncontrolled.set(event.checked);
        props.onCheckedChange?.(event.checked);
      }}
    >
      {props.children}
    </NshSwitch>
  );
}

export { switchTrackVariants, switchThumbVariants };
