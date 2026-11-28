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
  Text,
  View,
  type BridgeTextRef,
  type BridgeViewRef,
  type TextProps,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";

export type MessageAlign = "start" | "end";

type MessageContextValue = {
  align: MessageAlign;

  hasFooter: boolean;
  reportFooterMounted: (mounted: boolean) => void;
};

const MessageContext = createContext<MessageContextValue | null>(null);

export type MessageGroupProps = ViewProps;

const MessageGroup = forwardRef<BridgeViewRef, MessageGroupProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  ),
);
MessageGroup.displayName = "MessageGroup";

export type MessageProps = ViewProps & {
  align?: MessageAlign;
  children?: ReactNode;
};

const Message = forwardRef<BridgeViewRef, MessageProps>(
  ({ className, align = "start", ...props }, ref) => {
    const [hasFooter, setHasFooter] = useState(false);
    const contextValue = useMemo<MessageContextValue>(
      () => ({
        align,
        hasFooter,

        reportFooterMounted: setHasFooter,
      }),
      [align, hasFooter],
    );
    return (
      <MessageContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn(
            "relative flex w-full min-w-0 flex-row gap-2",
            align === "end" && "flex-row-reverse",
            className,
          )}
          {...props}
        />
      </MessageContext.Provider>
    );
  },
);
Message.displayName = "Message";

export type MessageAvatarProps = ViewProps;

const MessageAvatar = forwardRef<BridgeViewRef, MessageAvatarProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex w-fit min-w-8 shrink-0 items-center justify-center self-start overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    />
  ),
);
MessageAvatar.displayName = "MessageAvatar";

export type MessageContentProps = ViewProps;

const MessageContent = forwardRef<BridgeViewRef, MessageContentProps>(
  ({ className, ...props }, ref) => {
    const message = useContext(MessageContext);
    return (
      <View
        ref={ref}
        className={cn(
          "flex w-full shrink min-w-0 flex-col gap-2.5 web:wrap-break-word",
          message?.align === "end" && "items-end",
          className,
        )}
        {...props}
      />
    );
  },
);
MessageContent.displayName = "MessageContent";

export type MessageHeaderProps = ViewProps & {
  children?: ReactNode;
};

const MessageHeader = forwardRef<BridgeViewRef, MessageHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex flex-row max-w-full min-w-0 items-center px-3",
        className,
      )}
      {...props}
    >

      <Text className="font-sans text-xs font-medium text-muted-foreground">
        {children}
      </Text>
    </View>
  ),
);
MessageHeader.displayName = "MessageHeader";

export type MessageFooterProps = ViewProps & {
  children?: ReactNode;
};

const MessageFooter = forwardRef<BridgeViewRef, MessageFooterProps>(
  ({ className, children, ...props }, ref) => {
    const message = useContext(MessageContext);
    const report = message?.reportFooterMounted;

    useEffect(() => {
      report?.(true);
      return () => report?.(false);
    }, [report]);
    return (
      <View
        ref={ref}
        className={cn(
          "flex flex-row max-w-full min-w-0 items-center px-3",
          message?.align === "end" && "justify-end",
          className,
        )}
        {...props}
      >
        <Text className="font-sans text-xs font-medium text-muted-foreground">
          {children}
        </Text>
      </View>
    );
  },
);
MessageFooter.displayName = "MessageFooter";

export {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
};
