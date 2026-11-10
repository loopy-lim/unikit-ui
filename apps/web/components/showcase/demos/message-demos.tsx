"use client";

import { useState } from "react";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Avatar,
  AvatarFallback,
  Bubble,
  BubbleContent,
  Button,
  Marker,
  MarkerContent,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import type { ShowcaseDemo } from "./types";

export const messageDemo: ShowcaseDemo = {
  Demo: function MessageDemo() {
    return (
      <MessageGroup>
        <Message align="start">
          <MessageAvatar>
            <Avatar>
              <AvatarFallback>홍</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>홍길동</MessageHeader>
            <Bubble variant="outline">
              <BubbleContent>안녕하세요!</BubbleContent>
            </Bubble>
            <MessageFooter>읽음</MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>
    );
  },
  code: `import { Message, MessageContent, Bubble, BubbleContent } from "@unikit-bridge/ui";

<Message align="start"><MessageContent><Bubble><BubbleContent>안녕</BubbleContent></Bubble></MessageContent></Message>`,
};

export const bubbleDemo: ShowcaseDemo = {
  Demo: function BubbleDemo() {
    return (
      <Bubble>
        <BubbleContent>default 말풍선</BubbleContent>
      </Bubble>
    );
  },
  code: `import { Bubble, BubbleContent } from "@unikit-bridge/ui";

<Bubble><BubbleContent>내용</BubbleContent></Bubble>`,
};

export const attachmentDemo: ShowcaseDemo = {
  Demo: function AttachmentDemo() {
    return (
      <Attachment state="done">
        <AttachmentMedia>
          <Text className="font-sans text-base text-muted-foreground">📄</Text>
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>보고서.pdf</AttachmentTitle>
          <AttachmentDescription>2.4 MB</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    );
  },
  code: `import { Attachment, AttachmentTitle, AttachmentContent } from "@unikit-bridge/ui";

<Attachment state="done"><AttachmentContent><AttachmentTitle>파일</AttachmentTitle></AttachmentContent></Attachment>`,
};

export const markerDemo: ShowcaseDemo = {
  Demo: function MarkerDemo() {
    return (
      <Marker variant="separator">
        <MarkerContent>2026년 11월 10일</MarkerContent>
      </Marker>
    );
  },
  code: `import { Marker, MarkerContent } from "@unikit-bridge/ui";

<Marker variant="separator"><MarkerContent>오늘</MarkerContent></Marker>`,
};

const INITIAL = [{ id: 1, fromMe: false, text: "첫 메시지" }];

export const messageScrollerDemo: ShowcaseDemo = {
  Demo: function MessageScrollerDemo() {
    const [chat, setChat] = useState(INITIAL);
    return (
      <View className="gap-2">
        <MessageScrollerProvider>
          <MessageScroller className="h-40 rounded-md border">
            <MessageScrollerViewport>
              <MessageScrollerContent>
                {chat.map((e) => (
                  <MessageScrollerItem key={e.id}>
                    <Message align={e.fromMe ? "end" : "start"}>
                      <MessageContent>
                        <Bubble>
                          <BubbleContent>{e.text}</BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="end" active />
          </MessageScroller>
        </MessageScrollerProvider>
        <Button
          variant="outline"
          size="sm"
          onPress={() =>
            setChat((p) => [
              ...p,
              { id: p.length + 1, fromMe: true, text: `메시지 ${p.length + 1}` },
            ])
          }
        >
          추가
        </Button>
      </View>
    );
  },
  code: `import { MessageScroller, MessageScrollerViewport, MessageScrollerContent } from "@unikit-bridge/ui";

<MessageScroller><MessageScrollerViewport><MessageScrollerContent /></MessageScrollerViewport></MessageScroller>`,
};
