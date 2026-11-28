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

        className={cn(error && "text-destructive", className)}
        {...props}
      />
    );
  },
);
FormLabel.displayName = "FormLabel";

type ControlChildProps = {
  className?: string;
  nativeID?: string;
  accessibilityLabelledBy?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export type FormControlProps = {

  children?: ReactNode;
  className?: string;

};

const FormControl = forwardRef<BridgeViewRef, FormControlProps>(
  ({ className, children, ...props }, _ref) => {
    const { error, formItemId, formLabelId, formDescriptionId, formMessageId } =
      useFormField();

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
