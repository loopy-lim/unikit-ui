// Form — shadcn/ui（new-york-v4） form.tsx 유니버설 포팅 （사이클 40, T-2c）.
// 원본: shadcn-ref/ui/form.tsx — react-hook-form 연동（useFormField 컨텍스트 —
// nameformItemIdformDescriptionIdformMessageIderror）은 그대로 유지하고
// Radix Slot<div>/<p> DOM을 브리지 프리미티브로 치환한다.
//
// 포팅 판단（원본 대비 차이이유）:
// - FormControl의 Radix Slot（단일 자식 요소에 props 병합） 제거 — 단일 자식（입력
//   프리미티브）에 cloneElement로 접근성 연결 속성을 병합 주입한다（스프레드
//   props）. 주입값: nativeID（=formItemId）accessibilityLabelledBy（=formLabelId）
//   aria-invalid（오류 시 true）aria-describedby（설명+오류 조립）. 사용측 직접
//   지정이 주입값보다 우선이다（원본 Slot 병합 순서와 동일）.
// - 원본 label［htmlFor］ ↔ input［id］ 연결은 브리지 계약（label.tsx 머리주석의
//   관용）에 따라 Label nativeID ↔ 입력 accessibilityLabelledBy 방향으로 치환
//   — 이 연결에 필요한 formLabelId 키를 useFormField 반환에 추가했다.
// - div/p → View/Text 평면화. 원본 FormItem의 "grid gap-2"는 grid가
//   네이티브 스타일링에서 미보증이라 "flex flex-col gap-2"로 근사（세로 스택
//   동일）. FormLabel의 data-error=true → text-destructive는 조건부 클래스로
//   치환（네이티브에 data 속성 없음）.
// - Form（FormProvider）FormField（Controller 래퍼）는 원본이 forwardRef가
//   아니므로 함수형 그대로 유지한다. FormControl은 ref를 지원하지 않는다
//   （원본은 Slot ref가 자식으로 흘렀다） — ref가 필요하면 자식 입력
//   프리미티브에 직접 달 것.
// - FormMessage는 원본 그대로 error.message（없으면 children）를 렌더하며
//   body가 없으면 null을 반환한다.
// - RN 한계: aria-invalidaria-describedby는 웹 전용 계약이다（types.ts —
//   RN 입력창에는 미전달）. nativeIDaccessibilityLabelledBy는 양쪽에서
//   전달돼 라벨 연결은 유지된다.
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";
import { Label, type LabelProps } from "./label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};
FormField.displayName = "FormField";

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField는 <FormField> 안에서 사용해야 합니다.");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formLabelId: `${id}-form-item-label`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

export type FormItemProps = ViewProps;

const FormItem = forwardRef<BridgeViewRef, FormItemProps>(
  ({ className, ...props }, ref) => {
    const id = useId();
    return (
      <FormItemContext.Provider value={{ id }}>
        <View
          ref={ref}
          className={cn("flex flex-col gap-2", className)}
          {...props}
        />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

export type FormLabelProps = LabelProps;

const FormLabel = forwardRef<BridgeTextRef, FormLabelProps>(
  ({ className, ...props }, ref) => {
    const { error, formLabelId } = useFormField();
    return (
      <Label
        ref={ref}
        nativeID={formLabelId}
        // 원본 data-error=true → text-destructive 조건부 치환
        className={cn(error && "text-destructive", className)}
        {...props}
      />
    );
  },
);
FormLabel.displayName = "FormLabel";

// 단일 자식 입력 프리미티브에서 병합 주입에 쓰는 계약 속성（나머지는 그대로 스프레드）
type ControlChildProps = {
  className?: string;
  nativeID?: string;
  accessibilityLabelledBy?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export type FormControlProps = {
  /** 단일 입력 프리미티브（InputTextarea 등） — 접근성 연결 속성이 병합 주입된다 */
  children?: ReactNode;
  className?: string;
  // 참고: 인덱스 시그니처（［key: string］: unknown）를 열면 forwardRef의
  // Omit<P, "ref"> 처리에서 명시적 프로퍼티까지 unknown으로 붕괴해 타입을 닫았다.
  // 여분 props의 자식 전달（스프레드）은 런타임에 그대로 유지된다 — 속성은 자식
  // 프리미티브에 직접 지정할 것.
};

const FormControl = forwardRef<BridgeViewRef, FormControlProps>(
  ({ className, children, ...props }, _ref) => {
    const { error, formItemId, formLabelId, formDescriptionId, formMessageId } =
      useFormField();

    // Slot 대리 — 감쌀 자식 엘리먼트가 없으면 그대로 반환한다
    if (!isValidElement(children)) {
      return (children ?? null) as ReactNode;
    }
    const child = children as ReactElement<ControlChildProps>;
    const injected: ControlChildProps = {
      nativeID: formItemId,
      accessibilityLabelledBy: formLabelId,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error
        ? `${formDescriptionId} ${formMessageId}`
        : formDescriptionId,
      className: cn(child.props.className, className),
    };
    // 사용측 직접 지정（props）이 주입값보다 우선 — 원본 Slot 병합 순서
    return cloneElement(child, { ...injected, ...props } as ControlChildProps);
  },
);
FormControl.displayName = "FormControl";

export type FormDescriptionProps = TextProps;

const FormDescription = forwardRef<BridgeTextRef, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();
    return (
      <Text
        ref={ref}
        nativeID={formDescriptionId}
        className={cn("font-sans text-sm text-muted-foreground", className)}
        {...props}
      />
    );
  },
);
FormDescription.displayName = "FormDescription";

export type FormMessageProps = TextProps;

const FormMessage = forwardRef<BridgeTextRef, FormMessageProps>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message ?? "") : children;

    if (!body) {
      return null;
    }

    return (
      <Text
        ref={ref}
        nativeID={formMessageId}
        className={cn("font-sans text-sm text-destructive", className)}
        {...props}
      >
        {body}
      </Text>
    );
  },
);
FormMessage.displayName = "FormMessage";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
