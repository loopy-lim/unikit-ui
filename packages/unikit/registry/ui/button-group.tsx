// ButtonGroup — shadcn/ui new-york-v4 button-group을 UniKit UI 유니버설로 이식.
//
// 포팅 판단（자식 셀렉터 제거）:
// - 원본의 붙임（attach） 처리는 자식 셀렉터（［&>*:not（:first-child）］:
//   rounded-l-none 등）로 동작한다. 네이티브에 자식 셀렉터가 없으므로
//   ButtonGroup이 Children.map으로 각 자식 요소에 위치 클래스（첫/끝 모서리
//   정리·테두리 중복 제거·포커스 z-순서）를 cloneElement로 주입한다 —
//   CSS 셀렉터 없이 양쪽에서 동일하게 동작한다（Button 등 기존 컴포넌트의
//   className 병합 규칙（twMerge）과 맞물려 나중 값이 이긴다）.
// - data-slot 기반 중첩 그룹 간격 토큰（gap-2）과 select-trigger
//   관련 토큰은 data-slot 없이 표현 불가 → 제거.
// - ButtonGroupText의 asChild（radix Slot） 제거 — View+Text 구조 고정
//   （이중 지정: 전경색은 내부 Text에）.
// - ButtonGroupSeparator가 감싸던 Separator는 인라인 View（bg-border）로 대리
//   （신규 파일 6종 제한 — separator.tsx 생성 불가）.
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Text,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// 그룹 뼈대 — 원본의 방향 변형. 모서리 붙임 토큰은 아래 주입 로직으로 이동.
// w-fit은 uniwind 미지원 — self-start 치환으로 양쪽 플랫폼 내용 폭을 맞춘다（M-2）.
const buttonGroupVariants = cva("flex self-start items-stretch", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

type ButtonGroupOrientation = "horizontal" | "vertical";

// 위치별 붙임 클래스 — 원본 자식 셀렉터의 치환.
// 첫 자식은 시작 모서리를, 끝 자식은 끝 모서리를 유지하고 나머지 모서리를
// 없애 붙은 모양을 만든다. 이웃 테두리 중복（border-l-0/border-t-0）도 정리.
function buttonGroupAttachClasses(
  index: number,
  total: number,
  orientation: ButtonGroupOrientation,
): string {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const horizontal = orientation === "horizontal";
  return cn(
    // 포커스 받은 자식이 위로 — 원본 ［&>*］:focus-visible:relative/z-10 치환
    "web:focus-visible:relative web:focus-visible:z-10",
    !isFirst &&
      (horizontal ? "rounded-l-none border-l-0" : "rounded-t-none border-t-0"),
    !isLast && (horizontal ? "rounded-r-none" : "rounded-b-none"),
  );
}

// ---------------------------------------------------------------------------
// ButtonGroup — 버튼 무리 컨테이너. 자식에 붙임 클래스를 주입한다.
// ---------------------------------------------------------------------------
export type ButtonGroupProps = ViewProps &
  VariantProps<typeof buttonGroupVariants> & {
    children?: ReactNode;
  };

const ButtonGroup = forwardRef<BridgeViewRef, ButtonGroupProps>(
  ({ className, orientation, children, ...props }, ref) => {
    const resolvedOrientation: ButtonGroupOrientation =
      orientation ?? "horizontal";
    const items = Children.toArray(children);
    const attached = items.map((child, index) => {
      // 문자열 등 비（非）요소 자식은 그대로 둔다（Children.toArray가 null·
      // boolean은 이미 걷어냈다）. React 19 타입은 unknown props로 좁히므로
      // className을 받는 요소로 단언해 cloneElement한다.
      if (!isValidElement(child)) {
        return child;
      }
      const typedChild = child as ReactElement<{ className?: string }>;
      return cloneElement(typedChild, {
        className: cn(
          typedChild.props.className,
          buttonGroupAttachClasses(index, items.length, resolvedOrientation),
        ),
      });
    });
    return (
      <View
        ref={ref}
        className={cn(buttonGroupVariants({ orientation }), className)}
        {...props}
      >
        {attached}
      </View>
    );
  },
);
ButtonGroup.displayName = "ButtonGroup";

// ---------------------------------------------------------------------------
// ButtonGroupText — 그룹 안 텍스트 조각（예: 승수 "×2"）. View+Text 구조.
// ---------------------------------------------------------------------------
export type ButtonGroupTextProps = ViewProps & {
  children?: ReactNode;
};

const ButtonGroupText = forwardRef<BridgeViewRef, ButtonGroupTextProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        // 원본 flex items-center gap-2 — 브리지 flex-col 기본이라 flex-row 명시.
        "flex flex-row items-center gap-2 rounded-md border border-border bg-muted px-4",
        className,
      )}
      {...props}
    >
      {/* 이중 지정 원칙: 배경·테두리는 View, 전경색은 내부 Text에 */}
      <Text className="font-sans text-sm font-medium text-foreground">
        {children}
      </Text>
    </View>
  ),
);
ButtonGroupText.displayName = "ButtonGroupText";

// ---------------------------------------------------------------------------
// ButtonGroupSeparator — 그룹 안 구분선. 기본 vertical（가로 무리의 세로 줄）.
// ---------------------------------------------------------------------------
export type ButtonGroupSeparatorProps = ViewProps & {
  /** 구분선 방향 — 원본 기본값 vertical 유지（self-stretch로 교차축 채움） */
  orientation?: "horizontal" | "vertical";
};

const ButtonGroupSeparator = forwardRef<
  BridgeViewRef,
  ButtonGroupSeparatorProps
>(({ className, orientation = "vertical", ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      // 원본 구분선 색은 bg-input.
      "self-stretch bg-input",
      orientation === "vertical" ? "w-px" : "h-px w-full",
      className,
    )}
    {...props}
  />
));
ButtonGroupSeparator.displayName = "ButtonGroupSeparator";

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
};
