import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type BridgePressableRef,
  type BridgeScrollViewRef,
  type BridgeTextRef,
  type BridgeViewRef,
  type PressableProps,
  type ScrollViewProps,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

export type AttachmentState =
  | "idle"
  | "uploading"
  | "processing"
  | "error"
  | "done";
export type AttachmentSize = "default" | "sm" | "xs";
export type AttachmentOrientation = "horizontal" | "vertical";

type AttachmentContextValue = {
  size: AttachmentSize;
  orientation: AttachmentOrientation;
  state: AttachmentState;
  hasContent: boolean;
  hasMedia: boolean;
  reportContentMounted: (mounted: boolean) => void;
  reportMediaMounted: (mounted: boolean) => void;
};

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

const ATTACHMENT_PADDING_CONTENT: Record<AttachmentSize, string> = {
  default: "px-2.5 py-2",
  sm: "px-2 py-1.5",
  xs: "px-1.5 py-1",
};
const ATTACHMENT_PADDING_MEDIA: Record<AttachmentSize, string> = {
  default: "p-2",
  sm: "p-1.5",
  xs: "p-1",
};

const ATTACHMENT_MEDIA_SIZE: Record<AttachmentSize, string> = {
  default: "w-10",
  sm: "w-8",
  xs: "w-7",
};

const ATTACHMENT_TITLE_TEXT: Record<AttachmentSize, string> = {
  default: "text-sm",
  sm: "text-xs",
  xs: "text-xs",
};

const attachmentVariants = cva(
  "relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl border bg-card web:snap-start web:transition-colors web:hover:bg-muted/50 web:focus-within:ring-1 web:focus-within:ring-ring/50",
  {
    variants: {
      size: {
        default: "gap-2",
        sm: "gap-2.5",
        xs: "gap-1.5 rounded-lg",
      },
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-24 flex-col",
      },
      state: {
        idle: "border-dashed",
        uploading: "",
        processing: "",
        error: "border-destructive/30",
        done: "",
      },
    },
    defaultVariants: {
      size: "default",
      orientation: "horizontal",
      state: "done",
    },
  },
);

export type AttachmentProps = ViewProps &
  VariantProps<typeof attachmentVariants> & {
    state?: AttachmentState;
    children?: ReactNode;
  };

const Attachment = forwardRef<BridgeViewRef, AttachmentProps>(
  (
    { className, size, orientation, state, ...props },
    ref,
  ) => {
    const [hasContent, setHasContent] = useState(false);
    const [hasMedia, setHasMedia] = useState(false);

    const resolvedSize = size ?? "default";
    const resolvedOrientation = orientation ?? "horizontal";
    const resolvedState = state ?? "done";
    const contextValue = useMemo<AttachmentContextValue>(
      () => ({
        size: resolvedSize,
        orientation: resolvedOrientation,
        state: resolvedState,
        hasContent,
        hasMedia,

        reportContentMounted: setHasContent,
        reportMediaMounted: setHasMedia,
      }),
      [resolvedSize, resolvedOrientation, resolvedState, hasContent, hasMedia],
    );
    return (
      <AttachmentContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(
            attachmentVariants({
              size: resolvedSize,
              orientation: resolvedOrientation,
              state: resolvedState,
            }),

            resolvedOrientation === "vertical" && hasContent && "w-30",
            hasContent && ATTACHMENT_PADDING_CONTENT[resolvedSize],
            hasMedia && ATTACHMENT_PADDING_MEDIA[resolvedSize],
            className,
          )}
          {...props}
        />
      </AttachmentContext.Provider>
    );
  },
);
Attachment.displayName = "Attachment";

const attachmentMediaVariants = cva(
  "relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted",
  {
    variants: {
      variant: {
        icon: "",
        image: "opacity-60",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  },
);

export type AttachmentMediaProps = ViewProps &
  VariantProps<typeof attachmentMediaVariants> & {
    children?: ReactNode;
  };

const AttachmentMedia = forwardRef<BridgeViewRef, AttachmentMediaProps>(
  ({ className, variant = "icon", children, ...props }, ref) => {
    const attachment = useContext(AttachmentContext);
    const report = attachment?.reportMediaMounted;

    useEffect(() => {
      report?.(true);
      return () => report?.(false);
    }, [report]);
    const size = attachment?.size ?? "default";
    const orientation = attachment?.orientation ?? "horizontal";
    const state = attachment?.state ?? "done";

    const imageReady =
      variant === "image" && (state === "done" || state === "idle");
    return (
      <View
        ref={ref}
        className={cn(
          attachmentMediaVariants({ variant }),
          ATTACHMENT_MEDIA_SIZE[size],
          orientation === "vertical" && "w-full",
          size === "xs" && "rounded-md",
          state === "error" && "bg-destructive/10",
          imageReady && "opacity-100",
          className,
        )}
        {...props}
      >
        {children}
      </View>
    );
  },
);
AttachmentMedia.displayName = "AttachmentMedia";

export type AttachmentContentProps = ViewProps;

const AttachmentContent = forwardRef<BridgeViewRef, AttachmentContentProps>(
  ({ className, ...props }, ref) => {
    const attachment = useContext(AttachmentContext);
    const report = attachment?.reportContentMounted;

    useEffect(() => {
      report?.(true);
      return () => report?.(false);
    }, [report]);
    return (
      <View
        ref={ref}
        className={cn(
          "max-w-full min-w-0 flex-1 leading-tight",
          attachment?.orientation === "vertical" && "px-1",
          className,
        )}
        {...props}
      />
    );
  },
);
AttachmentContent.displayName = "AttachmentContent";

export type AttachmentTitleProps = TextProps & {
  children?: ReactNode;
};

const AttachmentTitle = forwardRef<BridgeTextRef, AttachmentTitleProps>(
  ({ className, children, ...props }, ref) => {
    const attachment = useContext(AttachmentContext);
    return (
      <Text
        ref={ref}
        className={cn(
          "max-w-full min-w-0 font-medium text-card-foreground web:truncate",
          attachment && ATTACHMENT_TITLE_TEXT[attachment.size],
          className,
        )}
        {...props}
      >
        {children}
      </Text>
    );
  },
);
AttachmentTitle.displayName = "AttachmentTitle";

export type AttachmentDescriptionProps = TextProps & {
  children?: ReactNode;
};

const AttachmentDescription = forwardRef<BridgeTextRef, AttachmentDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    const attachment = useContext(AttachmentContext);
    return (
      <Text
        ref={ref}
        className={cn(
          "mt-0.5 min-w-0 max-w-full text-xs text-muted-foreground web:truncate",
          attachment?.state === "error" && "text-destructive/80",
          className,
        )}
        {...props}
      >
        {children}
      </Text>
    );
  },
);
AttachmentDescription.displayName = "AttachmentDescription";

export type AttachmentActionsProps = ViewProps;

const AttachmentActions = forwardRef<BridgeViewRef, AttachmentActionsProps>(
  ({ className, ...props }, ref) => {
    const attachment = useContext(AttachmentContext);
    return (
      <View
        ref={ref}
        className={cn(
          "relative z-20 flex flex-row shrink-0 items-center",
          attachment?.orientation === "vertical" &&
            "absolute top-3 right-3 gap-1",
          className,
        )}
        {...props}
      />
    );
  },
);
AttachmentActions.displayName = "AttachmentActions";

export type AttachmentActionProps = ButtonProps;

const AttachmentAction = forwardRef<BridgePressableRef, AttachmentActionProps>(
  ({ className, variant, ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant ?? "ghost"}
      className={cn(className)}
      {...props}
    />
  ),
);
AttachmentAction.displayName = "AttachmentAction";

export type AttachmentTriggerProps = PressableProps;

const AttachmentTrigger = forwardRef<BridgePressableRef, AttachmentTriggerProps>(
  ({ className, ...props }, ref) => (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      className={cn("absolute inset-0 z-10 web:outline-none", className)}
      {...props}
    />
  ),
);
AttachmentTrigger.displayName = "AttachmentTrigger";

export type AttachmentGroupProps = ScrollViewProps;

const AttachmentGroup = forwardRef<BridgeScrollViewRef, AttachmentGroupProps>(
  ({ className, contentContainerClassName, ...props }, ref) => (
    <ScrollView
      ref={ref}
      horizontal
      className={cn(
        "web:snap-x web:snap-mandatory web:scroll-px-1 web:overscroll-x-contain",
        className,
      )}
      contentContainerClassName={cn("gap-3 py-1", contentContainerClassName)}
      {...props}
    />
  ),
);
AttachmentGroup.displayName = "AttachmentGroup";

export {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
};
