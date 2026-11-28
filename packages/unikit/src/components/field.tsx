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

type FieldContextValue = {
  invalid: boolean;
  disabled: boolean;
  orientation: "vertical" | "horizontal";
};

const FieldContext = createContext<FieldContextValue | null>(null);

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

    invalid?: boolean;

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

export type FieldLabelProps = LabelProps;

const FieldLabel = forwardRef<BridgeTextRef, FieldLabelProps>(
  ({ className, ...props }, ref) => {
    const field = useContext(FieldContext);
    return (
      <Label
        ref={ref}
        className={cn(
          "w-fit leading-snug",

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

export type FieldSeparatorProps = ViewProps & {

  children?: ReactNode;
};

const FieldSeparator = forwardRef<BridgeViewRef, FieldSeparatorProps>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={cn("relative -my-2 h-5", className)} {...props}>

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

export type FieldErrorProps = ViewProps & {

  errors?: Array<{ message?: string } | undefined>;
};

const FieldError = forwardRef<BridgeViewRef, FieldErrorProps>(
  ({ className, children, errors, ...props }, ref) => {
    const content = useMemo<ReactNode>(() => {

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
