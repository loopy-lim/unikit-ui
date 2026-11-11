// Bubble — shadcn/ui（new-york-v4） bubble.tsx 유니버설 포팅 （사이클 40, T-3d）.
// 원본: shadcn-ref/ui/bubble.tsx
//
// 포팅 판단（원본 대비 차이이유）:
// - div/span → 브리지 View/Text. BubbleContent는 문자열 children을 바로 쓰게
//   View（배경테두리） + 내부 Text（전경색） 이중 지정（AvatarGroupCount 패턴）.
// - 원본은 Bubble의 variant가 `*:data-［slot=bubble-content］:bg-*` 자식
//   셀렉터로 BubbleContent에 색을 입힌다. 네이티브에 data 속성이 없어
//   BubbleContext { variant, align } + 조회 테이블로 재현 — BubbleContent가
//   variant를 읽어 자기 배경/전경을 적용한다（avatar.tsx 패턴）.
// - asChild（radix Slot） 제거 — View 렌더 고정（버블을 버튼/링크로 만드는
//   `［&>［data-slot=bubble-content］:is（button,a）:hover］` 토큰도 함께 제거.
// - tinted의 oklch（from var（--primary） ） 임의값color-mix hover는 표준
//   계단 근사 — bg-primary/10 원색 틴트로, hover는 폐기（임의값 금지 규칙）.
// - dark: 변형 전부 제거（웹은 라이트 토큰만 사용, 규칙 6）.
// - max-w-［80%］ 임의값 → max-w-lg 표준 계단 근사.
// - group-data-［align=end］/message:self-end는 Message context 대신 자체
//   align prop/self-end로 자립（Bubble 단독 사용도 지원）.
// - wrap-break-word링크 focus 링은 웹 전용 → web: 접두 또는 제거.
// - 원본 has-［button］:p-0（버튼 포함 시 패딩 제거）는 has 임의값 셀렉터라 px-1.5 py-0.5 고정으로 근사（T-4 감사 반영）.
import {
  createContext,
  forwardRef,
  useContext,
  type ReactNode,
} from "react";
import {
  Text,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

export type BubbleVariant =
  | "default"
  | "secondary"
  | "muted"
  | "tinted"
  | "outline"
  | "ghost"
  | "destructive";

// Bubble이 제공하는 상태 — BubbleContent 색정렬의 단일 출처.
type BubbleContextValue = {
  variant: BubbleVariant;
  align: "start" | "end";
};

const BubbleContext = createContext<BubbleContextValue | null>(null);

// BubbleContent 배경테두리（원본 variant별 셀렉터 토큰의 조회 테이블）.
const BUBBLE_CONTENT_BG: Record<BubbleVariant, string> = {
  default: "bg-primary",
  secondary: "bg-secondary",
  muted: "bg-muted",
  tinted: "bg-primary/10",
  outline: "border-border bg-background",
  ghost: "rounded-none border-none bg-transparent p-0",
  destructive: "bg-destructive/10",
};

// BubbleContent 전경색（내부 Text에 — 이중 지정 원칙）.
const BUBBLE_CONTENT_FG: Record<BubbleVariant, string> = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  muted: "text-foreground",
  tinted: "text-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-destructive",
};

// ---------------------------------------------------------------------------
// BubbleGroup — 버블 묶음（연속 발화）.
// ---------------------------------------------------------------------------
export type BubbleGroupProps = ViewProps;

const BubbleGroup = forwardRef<BridgeViewRef, BubbleGroupProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  ),
);
BubbleGroup.displayName = "BubbleGroup";

// ---------------------------------------------------------------------------
// Bubble — 버블 래퍼. 색은 BubbleContent가 variant를 읽어 적용한다.
// 원본 대비 색 토큰은 테이블로 이동했고 flex 레이아웃 토큰만 남았다.
// ---------------------------------------------------------------------------
const bubbleVariants = cva(
  "relative flex w-fit min-w-0 max-w-lg flex-col gap-1",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        muted: "",
        tinted: "",
        outline: "",
        ghost: "max-w-full",
        destructive: "",
      },
      align: {
        start: "",
        end: "self-end",
      },
    },
    defaultVariants: {
      variant: "default",
      align: "start",
    },
  },
);

export type BubbleProps = ViewProps &
  VariantProps<typeof bubbleVariants> & {
    children?: ReactNode;
  };

const Bubble = forwardRef<BridgeViewRef, BubbleProps>(
  ({ className, variant, align, ...props }, ref) => {
    // VariantProps는 null을 허용하므로 기본값 병합 후 context에 제공한다.
    const resolvedVariant = variant ?? "default";
    const resolvedAlign = align ?? "start";
    const contextValue =
      resolvedVariant === "default" && resolvedAlign === "start"
        ? DEFAULT_BUBBLE_CONTEXT
        : { variant: resolvedVariant, align: resolvedAlign };
    return (
      <BubbleContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(
            bubbleVariants({ variant: resolvedVariant, align: resolvedAlign }),
            className,
          )}
          {...props}
        />
      </BubbleContext.Provider>
    );
  },
);
Bubble.displayName = "Bubble";

// 자주 쓰이는 기본 조합 — Provider value 참조 안정화（불필요한 재렌더 방지）.
const DEFAULT_BUBBLE_CONTEXT: BubbleContextValue = {
  variant: "default",
  align: "start",
};

// ---------------------------------------------------------------------------
// BubbleContent — 실제 메시지 본문（문자열 children 권장）. variant 색 연동.
// ---------------------------------------------------------------------------
export type BubbleContentProps = ViewProps & {
  children?: ReactNode;
};

const BubbleContent = forwardRef<BridgeViewRef, BubbleContentProps>(
  ({ className, children, ...props }, ref) => {
    const bubble = useContext(BubbleContext);
    const variant = bubble?.variant ?? "default";
    return (
      <View
        ref={ref}
        className={cn(
          "w-fit max-w-full min-w-0 overflow-hidden rounded-xl border border-transparent px-3 py-2",
          BUBBLE_CONTENT_BG[variant],
          bubble?.align === "end" && "self-end",
          className,
        )}
        {...props}
      >
        <Text
          className={cn(
            "font-sans text-sm leading-relaxed web:wrap-break-word",
            BUBBLE_CONTENT_FG[variant],
          )}
        >
          {children}
        </Text>
      </View>
    );
  },
);
BubbleContent.displayName = "BubbleContent";

// ---------------------------------------------------------------------------
// BubbleReactions — 버블에 붙는 리액션 배지（위치는 side/align 변형）.
// ---------------------------------------------------------------------------
const bubbleReactionsVariants = cva(
  "absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-sm ring-3 ring-card",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "left-3",
        end: "right-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  },
);

export type BubbleReactionsProps = ViewProps & {
  align?: "start" | "end";
  side?: "top" | "bottom";
  children?: ReactNode;
};

const BubbleReactions = forwardRef<BridgeViewRef, BubbleReactionsProps>(
  ({ className, side, align, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  ),
);
BubbleReactions.displayName = "BubbleReactions";

export { BubbleGroup, Bubble, BubbleContent, BubbleReactions };
