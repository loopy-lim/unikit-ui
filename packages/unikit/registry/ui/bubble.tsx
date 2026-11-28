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

import { cn } from "@/lib/utils";

export type BubbleVariant =
  | "default"
  | "secondary"
  | "muted"
  | "tinted"
  | "outline"
  | "ghost"
  | "destructive";

type BubbleContextValue = {
  variant: BubbleVariant;
  align: "start" | "end";
};

const BubbleContext = createContext<BubbleContextValue | null>(null);

const BUBBLE_CONTENT_BG: Record<BubbleVariant, string> = {
  default: "bg-primary",
  secondary: "bg-secondary",
  muted: "bg-muted",
  tinted: "bg-primary/10",
  outline: "border-border bg-background",
  ghost: "rounded-none border-none bg-transparent p-0",
  destructive: "bg-destructive/10",
};

const BUBBLE_CONTENT_FG: Record<BubbleVariant, string> = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  muted: "text-foreground",
  tinted: "text-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-destructive",
};

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

const DEFAULT_BUBBLE_CONTEXT: BubbleContextValue = {
  variant: "default",
  align: "start",
};

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

const bubbleReactionsVariants = cva(
  "absolute z-10 flex flex-row w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-sm ring-3 ring-card",
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
