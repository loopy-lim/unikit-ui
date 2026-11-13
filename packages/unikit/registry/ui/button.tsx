// Button — shadcn/ui new-york-v4 button을 UniKit 유니버설로 이식（사이클 71 원본값 정비）.
// 이중 지정 원칙（§0.5）: 배경·테두리는 Pressable, 전경색·밑줄은 내부 Text에 명시.
// （DOM 브리지에서도 span은 부모 상속이 막히므로 전경색 명시가 양쪽에 필요）
// 미지원（로드맵）: aria-invalid:*（invalid 상태 없음）·has-［>svg］:*·［&_svg］:*（자식
// 셀렉터 — 아이콘은 글리프 Text）·dark:*（다크는 토큰 값 전환 아키텍처로 처리）.
// focus 링은 원본 규격을 준수한다（사이클 72）: ring-3（비대괄호 계단）·ring-ring/50
// ·무오프셋·focus-visible:border-ring — destructive는 ring-destructive/20.
// link 변형의 밑줄은 원본대로 hover에서만 — 네이티브는 hover가 없어 밑줄이 없다
// （상시 밑줄이 필요하면 소비자가 className="underline"을 더한다）.
import { forwardRef, type ReactNode } from "react";
import {
  Pressable,
  Text,
  type BridgePressableRef,
  type PressableProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Pressable（컨테이너） — 원본 base의 shrink-0·transition-all을 포함하고, hover는
// web: 접두, active（눌림 어포던스 근사）는 양쪽에서 동작한다. focus 링은 원본 규격
// （ring-3 무오프셋）을 web: 접두로 준수한다.
const buttonVariants = cva(
  "flex flex-row shrink-0 items-center justify-center gap-2 rounded-md web:select-none web:transition-all web:outline-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-primary web:hover:bg-primary/90 active:bg-primary/90",
        secondary: "bg-secondary web:hover:bg-secondary/80 active:bg-secondary/80",
        destructive:
          "bg-destructive web:hover:bg-destructive/90 active:bg-destructive/90 web:focus-visible:ring-destructive/20",
        // 원본 outline: border bg-background shadow-xs hover:bg-accent
        // hover:text-accent-foreground — text 스위치는 내부 Text 변형에 이중 지정.
        outline:
          "border border-border bg-background web:hover:bg-accent active:bg-accent",
        ghost: "web:hover:bg-accent active:bg-accent",
        link: "",
      },
      // 원본 사이즈 값 그대로（default h-9 / xs h-6 / sm h-8 / lg h-10 / icon size-9）.
      // 원본의 has-［>svg］:px-*·svg 크기 기본값（size-3/4）은 자식 셀렉터라 미지원.
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-6 gap-1 rounded-md px-2",
        sm: "h-8 gap-1.5 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// 내부 Text — 변형별 전경색. active:* 눌림 전파 — 네이티브는 uniwind（Pressable 상태）, 웹은 <button>의 :active.
const buttonTextVariants = cva(
  "font-sans text-sm font-medium web:whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        // 원본 text-white의 토큰 동등물（--destructive-foreground = 98% 백색）.
        destructive: "text-destructive-foreground",
        outline:
          "text-foreground active:text-accent-foreground web:hover:text-accent-foreground",
        ghost:
          "text-foreground active:text-accent-foreground web:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 web:hover:underline",
      },
      // xs·icon-xs의 원본 text-xs — 컨테이너 클래스는 네이티브 Text에 닿지 않아
      // 내부 Text에 이중 지정（§0.5）한다.
      size: {
        default: "",
        xs: "text-xs",
        sm: "",
        lg: "",
        icon: "",
        "icon-xs": "text-xs",
        "icon-sm": "",
        "icon-lg": "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// 터치 타깃 44px 보정（§3.1）: hitSlop = max（0, （44 − 시각높이px） / 2） — 각 방향 px.
const HIT_SLOP = {
  xs: 10,
  sm: 6,
  default: 4,
  lg: 2,
  icon: 4,
  "icon-xs": 10,
  "icon-sm": 6,
  "icon-lg": 2,
} as const;

// Pressable의 함수형 children（（state） => ReactNode）은 내부 Text 래핑 구조（§3.1）와
// 양립하지 않으므로 children은 ReactNode로 한정한다（v0.1은 문자열 children 사용）.
export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    children?: ReactNode;
  };

const Button = forwardRef<BridgePressableRef, ButtonProps>(
  (
    { className, variant, size, disabled, hitSlop, children, ...props },
    ref,
  ) => {
    const resolvedSize = size ?? "default";
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={disabled}
        aria-disabled={disabled ? true : undefined}
        hitSlop={hitSlop ?? HIT_SLOP[resolvedSize]}
        className={cn(
          buttonVariants({ variant, size }),
          disabled && "web:pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        <Text className={cn(buttonTextVariants({ variant, size }))}>
          {children}
        </Text>
      </Pressable>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants, buttonTextVariants };
