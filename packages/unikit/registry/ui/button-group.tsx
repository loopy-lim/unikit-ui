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

const buttonGroupVariants = cva("flex native:self-start web:w-fit items-stretch", {
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

function buttonGroupAttachClasses(
  index: number,
  total: number,
  orientation: ButtonGroupOrientation,
): string {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const horizontal = orientation === "horizontal";
  return cn(

    "web:focus-visible:relative web:focus-visible:z-10",
    !isFirst &&
      (horizontal ? "rounded-l-none border-l-0" : "rounded-t-none border-t-0"),
    !isLast && (horizontal ? "rounded-r-none" : "rounded-b-none"),
  );
}

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

export type ButtonGroupTextProps = ViewProps & {
  children?: ReactNode;
};

const ButtonGroupText = forwardRef<BridgeViewRef, ButtonGroupTextProps>(
  ({ className, children, ...props }, ref) => {
    const content = Children.map(children, (child) =>
      typeof child === "string" || typeof child === "number" ? (
        <Text className="font-sans text-sm font-medium text-foreground">
          {child}
        </Text>
      ) : (
        child
      ),
    );
    return (
      <View
        ref={ref}
        className={cn(

          "flex flex-row items-center gap-2 rounded-md border border-border bg-muted px-4",
          className,
        )}
        {...props}
      >
        {content}
      </View>
    );
  },
);
ButtonGroupText.displayName = "ButtonGroupText";

export type ButtonGroupSeparatorProps = ViewProps & {

  orientation?: "horizontal" | "vertical";
};

const ButtonGroupSeparator = forwardRef<
  BridgeViewRef,
  ButtonGroupSeparatorProps
>(({ className, orientation = "vertical", ...props }, ref) => (
  <View
    ref={ref}
    className={cn(

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
