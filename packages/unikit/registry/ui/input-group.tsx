// InputGroup — shadcn/ui（new-york-v4） input-group.tsx 유니버설 포팅 （사이클 40, T-2a）.
// 원본: shadcn-ref/ui/input-group.tsx — InputButtonTextarea（기존 컴포넌트,
// 수정 금지）가 내부에 조립되는 래퍼 구조를 그대로 유지한다.
//
// 포팅 판단（원본 대비 차이）:
// - 원본의 has-*  group-data-*  ［&>］ 셀렉터 스타일은 네이티브에 data 속성
//   DOM 셀렉터가 없어 context + 조건부 클래스로 근사한다. 원본 셀렉터
//   （has-［>［data-align=］］has-［>textarea］）가 직계 자식만 보므로, 루트가
//   children을 1단 순회해 정렬textareaaria-invalid를 정적으로 수집해
//   context로 내려준다 — 첫 렌더（SSR 포함）부터 반영되고 매 렌더 재수집된다.
//   임의 래퍼로 감싼 자식은 원본 셀렉터와 동일하게 감지되지 않는다（한계）.
// - 포커스 링: 원본은 컨트롤 포커스 시 그룹에 링을 옮기지만（셀렉터） 브리지
//   TextInputProps에 onFocus/onBlur 계약이 없어 그룹이 포커스를 알 수 없다.
//   대신 컨트롤 자체의 슬림 링（ring-1오프셋 0）으로 근사한다（한계로드맵）.
// - Addon 눌림 → input 포커스 이동（원본 DOM querySelector）은 이식 불가 —
//   View에는 onPress 계약이 없고 Pressable（button）로 바꾸면 내부
//   InputGroupButton과 웹에서 버튼 중첩이 된다. 폐기（한계）.
// - 원본 role="group"은 브리지 BridgeRole에 "group"을 추가（완료 보고 제기
//   반영）해 지정한다 — 네이티브는 RN이 모르는 role을 무시한다（한계）.
// - 임의값 근사: addon의 ml/mr-［-0.45rem］［-0.35rem］은 버튼/kbd 포함 감지
//   （has-［>button］）와 함께 재현 불가해 제거 — 버튼이 애던 패딩에 붙는다.
//   rounded-［calc（var（--radius）-5px）］ → rounded-sm（표준 계단）. block-start/end의
//   group-has-［>input］ 패딩 미세조정（pt-2.5/pb-2.5）은 pt-3/pb-3으로 통일.
//   ［&>svg］［&>kbd］ 셀렉터 계열은 svg 미지원 포팅이라 제거.
// - InputGroupButton의 type="button"은 브리지 Pressable이 웹에서 항상
//   type="button"으로 렌더해 생략（동등）. data-size 속성은 cva size로 전개.
// - dark: 제거, 웹 전용 토큰（cursorselect-noneshadowtransition）은 web: 접두.
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  type ReactNode,
} from "react";
import {
  Text,
  View,
  type BridgePressableRef,
  type BridgeTextInputRef,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { Button, type ButtonProps } from "./button";
import { Input, type InputProps } from "./input";
import { Textarea, type TextareaProps } from "./textarea";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// 그룹 파생 상태 — 직계 자식 정적 수집（머리 주석）
// ---------------------------------------------------------------------------

type InputGroupAlign = "inline-start" | "inline-end" | "block-start" | "block-end";

type InputGroupAligns = {
  inlineStart: boolean;
  inlineEnd: boolean;
  blockStart: boolean;
  blockEnd: boolean;
};

/** align 문자열 → 파생 상태 키（케밥→캐멀） */
const ALIGN_STATE_KEYS: Record<InputGroupAlign, keyof InputGroupAligns> = {
  "inline-start": "inlineStart",
  "inline-end": "inlineEnd",
  "block-start": "blockStart",
  "block-end": "blockEnd",
};

type InputGroupDerived = InputGroupAligns & {
  hasTextarea: boolean;
  hasInvalid: boolean;
};

/**
 * 직계 자식에서 그룹 상태를 정적으로 수집한다 — 원본 has-［>］ 직계 셀렉터와
 * 동일 범위. align（InputGroupAddon）textareaaria-invalid（Input/Textarea）.
 */
function collectGroupChildren(children: ReactNode): InputGroupDerived {
  const derived: InputGroupDerived = {
    inlineStart: false,
    inlineEnd: false,
    blockStart: false,
    blockEnd: false,
    hasTextarea: false,
    hasInvalid: false,
  };
  Children.toArray(children).forEach((child) => {
    if (!isValidElement(child)) return;
    const props = child.props as {
      align?: InputGroupAlign | null;
      "aria-invalid"?: boolean;
    };
    if (child.type === InputGroupAddon) {
      const align = props.align ?? "inline-start";
      derived[ALIGN_STATE_KEYS[align]] = true;
    } else if (child.type === InputGroupTextarea) {
      derived.hasTextarea = true;
      if (props["aria-invalid"] === true) derived.hasInvalid = true;
    } else if (child.type === InputGroupInput) {
      if (props["aria-invalid"] === true) derived.hasInvalid = true;
    }
  });
  return derived;
}

type InputGroupContextValue = InputGroupDerived;

const InputGroupContext = createContext<InputGroupContextValue | null>(null);

/**
 * 자식 중 문자열/숫자를 내부 Text로 감싼다 — 네이티브는 Text 없이 문자열을
 * 렌더할 수 없고 색 상속도 되지 않는다（이중 지정）. 요소 자식은 그대로 둔다.
 */
function wrapTextChildren(children: ReactNode, textClassName: string) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <Text className={textClassName}>{child}</Text>
    ) : (
      child
    ),
  );
}

// ---------------------------------------------------------------------------
// 컴포넌트
// ---------------------------------------------------------------------------

export type InputGroupProps = ViewProps;

const InputGroup = forwardRef<BridgeViewRef, InputGroupProps>(
  ({ className, children, ...props }, ref) => {
    // 매 렌더 재수집 — 조건부 렌더링제어 prop（aria-invalid） 변화를 즉시 반영.
    const derived = collectGroupChildren(children);
    const column = derived.blockStart || derived.blockEnd;
    return (
      <InputGroupContext.Provider value={derived}>
        <View
          ref={ref}
          accessibilityRole="group"
          className={cn(
            "relative w-full min-w-0 rounded-md border border-input web:transition-all web:outline-none",
            column ? "flex-col" : "flex-row items-center",
            // 원본 h-9 → has-［>textarea］/block 정렬 시 h-auto. min-h-9로 바닥 유지.
            column || derived.hasTextarea ? "min-h-9" : "h-9",
            // 원본 aria-invalid: border-destructive + ring-destructive/20.
            derived.hasInvalid && "border-destructive web:ring-destructive/20",
            className,
          )}
          {...props}
        >
          {children}
        </View>
      </InputGroupContext.Provider>
    );
  },
);
InputGroup.displayName = "InputGroup";

const inputGroupAddonVariants = cva(
  "flex flex-row h-auto items-center justify-center gap-2 py-1.5 web:cursor-text web:select-none",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3",
        "inline-end": "order-last pr-3",
        "block-start": "order-first w-full justify-start px-3 pt-3",
        "block-end": "order-last w-full justify-start px-3 pb-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

export type InputGroupAddonProps = ViewProps &
  VariantProps<typeof inputGroupAddonVariants>;

const InputGroupAddon = forwardRef<BridgeViewRef, InputGroupAddonProps>(
  ({ className, align = "inline-start", children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    >
      {wrapTextChildren(
        children,
        "font-sans text-sm font-medium text-muted-foreground",
      )}
    </View>
  ),
);
InputGroupAddon.displayName = "InputGroupAddon";

// 원본 size 4종 — rounded-［calc（var（--radius）-5px）］ → rounded-sm 근사（머리 주석）.
const inputGroupButtonVariants = cva("flex-row items-center gap-2", {
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-sm px-2",
      sm: "h-8 gap-1.5 rounded-md px-2.5",
      "icon-xs": "size-6 rounded-sm p-0",
      "icon-sm": "size-8 rounded-md p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

export type InputGroupButtonProps = Omit<ButtonProps, "size"> &
  VariantProps<typeof inputGroupButtonVariants>;

const InputGroupButton = forwardRef<BridgePressableRef, InputGroupButtonProps>(
  ({ className, variant = "ghost", size = "xs", ...props }, ref) => (
    // Button 기본 size（default） 토큰（h-10 px-4）은 cn/twMerge가 이 값으로 대체한다.
    <Button
      ref={ref}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  ),
);
InputGroupButton.displayName = "InputGroupButton";

export type InputGroupTextProps = ViewProps;

const InputGroupText = forwardRef<BridgeViewRef, InputGroupTextProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center gap-2", className)}
      {...props}
    >
      {/* 이중 지정: 전경색은 내부 Text에（네이티브 색 상속 불가） */}
      <Text className="font-sans text-sm text-muted-foreground">
        {children}
      </Text>
    </View>
  ),
);
InputGroupText.displayName = "InputGroupText";

export type InputGroupInputProps = InputProps;

const InputGroupInput = forwardRef<BridgeTextInputRef, InputGroupInputProps>(
  ({ className, ...props }, ref) => {
    const group = useContext(InputGroupContext);
    return (
      <Input
        ref={ref}
        {...props}
        className={cn(
          "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 web:shadow-none",
          // 포커스 링 근사 — 그룹 이동 불가로 컨트롤 자체 슬림 링（머리 주석）.
          "focus:ring-1 focus:ring-ring focus:ring-offset-0",
          // 애던 정렬에 따른 패딩 보정（원본 ［&>input］:pl-2 등 치환）.
          group?.inlineStart && "pl-2",
          group?.inlineEnd && "pr-2",
          group?.blockStart && "pb-3",
          group?.blockEnd && "pt-3",
          className,
        )}
      />
    );
  },
);
InputGroupInput.displayName = "InputGroupInput";

export type InputGroupTextareaProps = TextareaProps;

const InputGroupTextarea = forwardRef<
  BridgeTextInputRef,
  InputGroupTextareaProps
>(({ className, ...props }, ref) => {
  const group = useContext(InputGroupContext);
  return (
    <Textarea
      ref={ref}
      {...props}
      className={cn(
        "min-h-0 min-w-0 flex-1 resize-none rounded-none border-0 bg-transparent px-3 py-3 web:shadow-none",
        "focus:ring-1 focus:ring-ring focus:ring-offset-0",
        group?.inlineStart && "pl-2",
        group?.inlineEnd && "pr-2",
        group?.blockStart && "pb-3",
        group?.blockEnd && "pt-3",
        className,
      )}
    />
  );
});
InputGroupTextarea.displayName = "InputGroupTextarea";

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
