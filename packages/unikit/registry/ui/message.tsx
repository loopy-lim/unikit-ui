// Message — shadcn/ui（new-york-v4） message.tsx 유니버설 포팅 （사이클 40, T-3d）.
// 원본: shadcn-ref/ui/message.tsx
//
// 포팅 판단（원본 대비 차이이유）:
// - div 6종 → 브리지 View/Text. 헤더푸터는 문자열 children을 바로 쓸 수
//   있게 AvatarGroupCount 패턴（View + 내부 Text）으로 이중 지정했다.
// - data-align 셀렉터（data-［align=end］:flex-row-reverse 등）는 네이티브에
//   data 속성이 없으므로 React context（MessageContext）로 재현 — Message가
//   align을 제공하고 자식이 읽어 조건부 클래스를 적용한다（avatar.tsx 패턴）.
// - MessageAvatar의 group-has-data-［slot=message-footer］:-translate-y-8
//   （푸터 있을 때 아바타 위로 보정）는 푸터 "마운트 등록"으로 근사 —
//   MessageFooter가 reportFooterMounted（true）를 보내고 Message가 소유한다.
// - MessageContent의 *:data-slot:self-end（자식 버블 우측 정렬）은 items-end
//   근사. 실제 버블 정렬은 Bubble이 스스로 처리한다（self-end）.
// - MessageHeader/Footer의 group-has-data-［variant=ghost］/message:px-0
//   （내부 버블이 ghost면 패딩 제거）은 감지 수단이 없어 제거 — 항상 px-3.
// - wrap-break-word는 웹 전용（Tailwind v4 유틸） → web: 접두. RN Text는 기본 줄바꿈.
// - MessageContent에 shrink（flex-shrink:1）추가（사이클 74）: 원본은 웹 전용이라
//   flex-shrink 기본값 1로 아바타 옆에서 저절로 수축하지만, RN(Yoga)은 기본값 0이라
//   w-full 본문이 아바타 폭만큼 행을 넘어 화면 끝까지 흘렀다. 웹 동작과 정합.
// - data-slot 속성은 브리지 props 계약에 없어 전면 제거（토큰은 유지）.
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

/** 메시지 가로 정렬 — 좌（start, 상대방） / 우（end, 나） */
export type MessageAlign = "start" | "end";

// Message가 제공하는 상태 — 자식 셀렉터 재현의 단일 출처.
type MessageContextValue = {
  align: MessageAlign;
  /** MessageFooter 마운트 여부 — 아바타 수직 보정 판단 근거 */
  hasFooter: boolean;
  reportFooterMounted: (mounted: boolean) => void;
};

const MessageContext = createContext<MessageContextValue | null>(null);

// ---------------------------------------------------------------------------
// MessageGroup — 메시지 묶음（하루발신자 단위）.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Message — 개별 메시지 루트. align 상태 제공자역을 겸한다.
// ---------------------------------------------------------------------------
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
        // setState 설정자는 참조가 안정적이라 그대로 노출해도 안전하다.
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

// ---------------------------------------------------------------------------
// MessageAvatar — 아바타 슬롯（Avatar 컴포넌트를 넣는 컨테이너）.
// ---------------------------------------------------------------------------
// MessageAvatar — 아바타 래퍼. 상단 정렬(self-start)로 헤더·버블과 자연스럽게 정렬.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// MessageContent — 본문 영역（버블첨부를 담는다）. align=end면 자식을 우측 정렬.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// MessageHeader — 발신자시간 등 메타 표시（문자열 children 권장）.
// ---------------------------------------------------------------------------
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
      {/* 이중 지정 원칙: 텍스트 색크기는 내부 Text에 */}
      <Text className="font-sans text-xs font-medium text-muted-foreground">
        {children}
      </Text>
    </View>
  ),
);
MessageHeader.displayName = "MessageHeader";

// ---------------------------------------------------------------------------
// MessageFooter — 전송 시각상태（전송 중/실패） 표시. 마운트를 루트에 보고한다.
// ---------------------------------------------------------------------------
export type MessageFooterProps = ViewProps & {
  children?: ReactNode;
};

const MessageFooter = forwardRef<BridgeViewRef, MessageFooterProps>(
  ({ className, children, ...props }, ref) => {
    const message = useContext(MessageContext);
    const report = message?.reportFooterMounted;
    // 마운트 등록/해제 — 아바타 수직 보정의 근거（provider는 안정적）.
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
