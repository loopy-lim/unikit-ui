"use client";
// 사이클 40 신규 섹션 — 메시지 UI 티어(5): Message·Bubble·Attachment·Marker·
// MessageScroller(자동 하단 이동). 채팅 화면 구성 요소 모음.
import { useState } from "react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  Avatar,
  AvatarFallback,
  Button,
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
  Marker,
  MarkerContent,
  MarkerIcon,
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
  Spinner,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";
import { ArrowDown } from "lucide-react";

import { DemoLabel, Hint, Section } from "./section";

/** MessageScroller 데모용 초기 대화 */
const INITIAL_CHAT = [
  { id: 1, fromMe: false, text: "안녕! 쇼케이스 잘 뜨나요?" },
];

/** Section: 메시지 UI — Message · Bubble · Attachment · Marker · MessageScroller */
export function MessageUISection() {
  // 자동 하단 데모 — 새 메시지가 오면 Viewport가 끝으로 붙는다(stickToEnd).
  const [chat, setChat] = useState(INITIAL_CHAT);

  return (
    <Section
      title="메시지 UI — Message · Bubble · Attachment · Marker · MessageScroller"
      description="채팅 화면을 구성하는 부품들이에요."
    >
      {/* Message — 그룹·정렬(start 상대방/end 나)·헤더·푸터 */}
      <DemoLabel>Message</DemoLabel>
      <MessageGroup>
        <Message align="start">
          <MessageAvatar>
            <Avatar>
              <AvatarFallback>홍</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>홍길동 · 오전 10:02</MessageHeader>
            <Bubble variant="outline">
              <BubbleContent>이 메시지는 상대방 쪽(start)이에요.</BubbleContent>
            </Bubble>
            <MessageFooter>전송 완료</MessageFooter>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageContent>
            <Bubble>
              <BubbleContent>그럼! 나는 내 쪽(end)이에요.</BubbleContent>
              <BubbleReactions>
                <Text className="text-xs text-muted-foreground">👍 3</Text>
              </BubbleReactions>
            </Bubble>
            <MessageFooter>오후 12:30 · 읽음</MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>

      {/* Bubble — 변형 4종 나열 */}
      <DemoLabel>Bubble</DemoLabel>
      <BubbleGroup>
        <Bubble>
          <BubbleContent>default — 주 배경</BubbleContent>
        </Bubble>
        <Bubble variant="secondary">
          <BubbleContent>secondary — 보조 배경</BubbleContent>
        </Bubble>
        <Bubble variant="tinted" align="end">
          <BubbleContent>tinted — 주색 물들임</BubbleContent>
        </Bubble>
        <Bubble variant="destructive" align="end">
          <BubbleContent>destructive — 오류·경고</BubbleContent>
        </Bubble>
      </BubbleGroup>

      {/* Attachment — 완료·업로드 중·오류 상태 + 그룹 가로 스크롤 */}
      <DemoLabel>Attachment</DemoLabel>
      <AttachmentGroup>
        <Attachment state="done">
          <AttachmentMedia>
            <Text className="font-sans text-base text-muted-foreground">📄</Text>
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>분기 보고서.pdf</AttachmentTitle>
            <AttachmentDescription>2.4 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction size="sm">열기</AttachmentAction>
            <AttachmentAction size="sm" disabled>
              삭제 (비활성)
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state="uploading">
          <AttachmentMedia variant="image">
            <Spinner className="size-4" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>스크린샷.png</AttachmentTitle>
            <AttachmentDescription>업로드 중…</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment state="error">
          <AttachmentMedia>
            <Text className="font-sans text-base text-destructive">!</Text>
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>큰 파일.mp4</AttachmentTitle>
            <AttachmentDescription>용량 초과로 실패했어요</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      </AttachmentGroup>

      {/* Marker — 구분선(날짜)·아이콘 안내 */}
      <DemoLabel>Marker</DemoLabel>
      <View className="gap-3">
        <Marker variant="separator">
          <MarkerContent>2026년 11월 10일</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerIcon>
            <ArrowDown size={12} className="text-muted-foreground" />
          </MarkerIcon>
          <MarkerContent>여기까지 읽었어요</MarkerContent>
        </Marker>
      </View>

      {/* MessageScroller — 새 메시지 도착 시 자동 하단 */}
      <DemoLabel>MessageScroller — 자동 하단</DemoLabel>
      <MessageScrollerProvider>
        <MessageScroller className="h-56 rounded-md border">
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {chat.map((entry) => (
                <MessageScrollerItem key={entry.id}>
                  <Message align={entry.fromMe ? "end" : "start"}>
                    <MessageContent>
                      <Bubble variant={entry.fromMe ? "default" : "outline"}>
                        <BubbleContent>{entry.text}</BubbleContent>
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
        onPress={() =>
          setChat((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              fromMe: prev.length % 2 === 1,
              text: `새 메시지 ${prev.length + 1} — 아래로 자동 스크롤돼요.`,
            },
          ])
        }
      >
        메시지 추가
      </Button>
      <Hint>
        메시지를 추가하면 뷰포트가 자동으로 맨 아래로 붙어요(stickToEnd). ↓
        버튼은 맨 아래로 점프해요.
      </Hint>
    </Section>
  );
}
