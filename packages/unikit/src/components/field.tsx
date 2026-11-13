// Field — shadcn/ui new-york-v4 field（248줄）을 UniKit UI 유니버설로 이식.
//
// 포팅 판단（radix/base 엔진 의존 제거）:
// - Radix Field가 data-* 속성으로 흘리던 상태（invalid·disabled）는 Field의
//   boolean prop → 최소한의 React context로 전달하고, 소비 컴포넌트
//   （FieldLabel·FieldTitle）가 조건부 클래스로 받는다. 원본의
//   data-invalid=true → text-destructive（루트 상속）·
//   group-data disabled → opacity-50 치환이다.
// - FieldLabel은 원본처럼 ./label의 Label을 재사용한다（양쪽 트리 동일 상대
//   경로 — registry 복사 구조에서도 성립）.
// - fieldset/legend 시맨틱은 브리지 프리미티브（bridge role 계약에 group 없음）로
//   표현 불가 → FieldSet은 View, FieldLegend는 Text로 평면화.
// - orientation "responsive"（@container 쿼리）은 컨테이너 쿼리가 없어 제거 —
//   vertical/horizontal만 유지. horizontal의 라벨 flex-auto는 context
//   orientation으로 FieldLabel이 받는다（원본 자식 셀렉터 치환）.
// - has-자손·nth-last-2·자식 앵커 등 자식/상태 셀렉터 토큰은 제거（네이티브에
//   data 속성·셀렉터 없음）.
// - FieldSeparator가 감싸던 Separator는 인라인 View（h-px bg-border）로 대리
//   （신규 파일 6종 제한 — separator.tsx 생성 불가）.
// - FieldError의 목록 글머리（list-disc）는 글리프 "• " 접두로 치환.
import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import { Label, type LabelProps } from "./label";

// Field가 제공하는 상태 — 라벨·타이틀 스타일 연동의 단일 출처.
type FieldContextValue = {
  invalid: boolean;
  disabled: boolean;
  orientation: "vertical" | "horizontal";
};

const FieldContext = createContext<FieldContextValue | null>(null);

// ---------------------------------------------------------------------------
// FieldSet — 폼 묶음（원본 <fieldset> → View 평면화）.
// ---------------------------------------------------------------------------
export type FieldSetProps = ViewProps;

const FieldSet = forwardRef<BridgeViewRef, FieldSetProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    />
  ),
);
FieldSet.displayName = "FieldSet";

// ---------------------------------------------------------------------------
// FieldLegend — 묶음 제목（원본 <legend> → Text 평면화）.
// ---------------------------------------------------------------------------
const fieldLegendVariants = cva("font-medium", {
  variants: {
    variant: {
      legend: "text-base",
      label: "text-sm",
    },
  },
  defaultVariants: {
    variant: "legend",
  },
});

export type FieldLegendProps = TextProps &
  VariantProps<typeof fieldLegendVariants>;

const FieldLegend = forwardRef<BridgeTextRef, FieldLegendProps>(
  ({ className, variant, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "mb-3 font-sans text-foreground",
        fieldLegendVariants({ variant }),
        className,
      )}
      {...props}
    />
  ),
);
FieldLegend.displayName = "FieldLegend";

// ---------------------------------------------------------------------------
// FieldGroup — 필드 묶음（원본 gap-7 유지, 중첩 gap-4 셀렉터는 제거）.
// ---------------------------------------------------------------------------
export type FieldGroupProps = ViewProps;

const FieldGroup = forwardRef<BridgeViewRef, FieldGroupProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex w-full flex-col gap-7", className)}
      {...props}
    />
  ),
);
FieldGroup.displayName = "FieldGroup";

// ---------------------------------------------------------------------------
// Field — 단일 폼 필드 루트. 상태 제공자역을 겸한다.
// ---------------------------------------------------------------------------
// 원본의 자식 w-full 셀렉터（［&>*］:w-full）는 제거 — Input/Textarea가 기본
// w-full이므로 실사용에 영향 없다. role="group"은 bridge role 계약에 없어 생략.
const fieldVariants = cva("flex w-full gap-3", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row items-center",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export type FieldProps = ViewProps &
  VariantProps<typeof fieldVariants> & {
    /** 오류 상태 — 라벨·타이틀 전경색을 destructive로（원본 data-invalid 치환） */
    invalid?: boolean;
    /** 비활성 상태 — 라벨·타이틀 불투명도（원본 data-disabled 치환） */
    disabled?: boolean;
  };

const Field = forwardRef<BridgeViewRef, FieldProps>(
  ({ className, orientation, invalid, disabled, ...props }, ref) => {
    const resolvedOrientation = orientation ?? "vertical";
    const contextValue = useMemo<FieldContextValue>(
      () => ({
        invalid: invalid === true,
        disabled: disabled === true,
        orientation: resolvedOrientation,
      }),
      [invalid, disabled, resolvedOrientation],
    );
    return (
      <FieldContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(fieldVariants({ orientation }), className)}
          {...props}
        />
      </FieldContext.Provider>
    );
  },
);
Field.displayName = "Field";

// ---------------------------------------------------------------------------
// FieldContent — 라벨 옆 본문 영역（컨트롤·설명·오류 묶음）.
// ---------------------------------------------------------------------------
export type FieldContentProps = ViewProps;

const FieldContent = forwardRef<BridgeViewRef, FieldContentProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex flex-1 flex-col gap-1.5 leading-snug",
        className,
      )}
      {...props}
    />
  ),
);
FieldContent.displayName = "FieldContent";

// ---------------------------------------------------------------------------
// FieldLabel — 필드 라벨. Label（./label） 재사용 + Field 상태 연동.
// ---------------------------------------------------------------------------
export type FieldLabelProps = LabelProps;

const FieldLabel = forwardRef<BridgeTextRef, FieldLabelProps>(
  ({ className, ...props }, ref) => {
    const field = useContext(FieldContext);
    return (
      <Label
        ref={ref}
        className={cn(
          "w-fit leading-snug",
          // horizontal 배치에서 라벨이 남은 폭을 차지（원본 자식 셀렉터 치환）
          field?.orientation === "horizontal" && "flex-auto",
          field?.invalid && "text-destructive",
          field?.disabled && "opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
FieldLabel.displayName = "FieldLabel";

// ---------------------------------------------------------------------------
// FieldTitle — 라벨 대신 쓰는 제목형 텍스트（상태 연동은 Label과 동일）.
// ---------------------------------------------------------------------------
export type FieldTitleProps = TextProps;

const FieldTitle = forwardRef<BridgeTextRef, FieldTitleProps>(
  ({ className, ...props }, ref) => {
    const field = useContext(FieldContext);
    return (
      <Text
        ref={ref}
        className={cn(
          "w-fit font-sans text-sm font-medium leading-snug text-foreground",
          field?.invalid && "text-destructive",
          field?.disabled && "opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
FieldTitle.displayName = "FieldTitle";

// ---------------------------------------------------------------------------
// FieldDescription — 보조 설명.
// ---------------------------------------------------------------------------
export type FieldDescriptionProps = TextProps;

const FieldDescription = forwardRef<BridgeTextRef, FieldDescriptionProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "font-sans text-sm font-normal leading-normal text-muted-foreground web:text-balance",
        className,
      )}
      {...props}
    />
  ),
);
FieldDescription.displayName = "FieldDescription";

// ---------------------------------------------------------------------------
// FieldSeparator — 사이 구분선（가운데 문구 optional）.
// ---------------------------------------------------------------------------
export type FieldSeparatorProps = ViewProps & {
  /** 가운데 문구 — 원본과 같이 children이 있으면 선 위에 표시 */
  children?: ReactNode;
};

const FieldSeparator = forwardRef<BridgeViewRef, FieldSeparatorProps>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={cn("relative -my-2 h-5", className)} {...props}>
      {/* 인라인 구분선 — 원본 Separator 대리（신규 파일 제한） */}
      <View className="absolute inset-x-0 top-1/2 h-px bg-border" />
      {children ? (
        <Text className="relative mx-auto w-fit bg-background px-2 font-sans text-sm text-muted-foreground">
          {children}
        </Text>
      ) : null}
    </View>
  ),
);
FieldSeparator.displayName = "FieldSeparator";

// ---------------------------------------------------------------------------
// FieldError — 검증 오류 표시（role="alert"）. children 우선, 없으면 errors로 조립.
// ---------------------------------------------------------------------------
export type FieldErrorProps = ViewProps & {
  /** 유효성 오류 목록 — message 기준 중복 제거（원본 로직 그대로） */
  errors?: Array<{ message?: string } | undefined>;
};

const FieldError = forwardRef<BridgeViewRef, FieldErrorProps>(
  ({ className, children, errors, ...props }, ref) => {
    const content = useMemo<ReactNode>(() => {
      // 이중 지정 원칙: children은 문자열 권장 — 내부 Text가 색을 담당한다.
      if (children) {
        return (
          <Text className="font-sans text-sm text-destructive">{children}</Text>
        );
      }
      if (!errors?.length) {
        return null;
      }
      const uniqueErrors = [
        ...new Map(errors.map((error) => [error?.message, error])).values(),
      ];
      if (uniqueErrors.length === 1) {
        return (
          <Text className="font-sans text-sm text-destructive">
            {uniqueErrors[0]?.message}
          </Text>
        );
      }
      // 다중 오류 — 원본 ul/list-disc를 글리프 "• " 목록으로 치환.
      return (
        <View className="ml-4 flex flex-col gap-1">
          {uniqueErrors.map((error, index) =>
            error?.message ? (
              <Text
                key={index}
                className="font-sans text-sm text-destructive"
              >{`• ${error.message}`}</Text>
            ) : null,
          )}
        </View>
      );
    }, [children, errors]);

    if (!content) {
      return null;
    }

    return (
      <View
        ref={ref}
        accessibilityRole="alert"
        className={cn("text-sm font-normal", className)}
        {...props}
      >
        {content}
      </View>
    );
  },
);
FieldError.displayName = "FieldError";

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};
