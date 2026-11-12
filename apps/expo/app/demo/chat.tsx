// 데모 앱 채팅 화면(엑스포) — "UniKit 도우미". 웹 사본(apps/web/components/
// blocks/assistant-screen.tsx)과 같은 구성: 대본 스트리밍 · 첨부(업로드
// Progress) · 모델 전환 · 헤더 ⋯ 오버플로우(DropdownMenu) · 설정 시트(Field+
// Separator). 차이는 키보드 회피(KeyboardAvoidingView)·공유(Share)·시트 방향
// (아래/오른쪽)과 웹 전용 요소(Enter 힌트 Kbd·헤더 부제·대화 폭 제한)뿐이다.
// 복사·수정 시 웹과 함께. 아이콘은 lucide-react-native(쇼케이스 관행) — 색은
// lib/token-colors 헬퍼가 테마 토큰에서 유도한다(재타이핑 금지, 사이클 74).
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowUp,
  ChevronLeft,
  MoreHorizontal,
  Paperclip,
  Plus,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react-native";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Bubble,
  BubbleContent,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Slider,
  Spinner,
  Switch,
  Textarea,
  toast,
} from "@unikit-bridge/ui";

import {
  DEMO_FILES,
  DEMO_MODELS,
  DEMO_SUGGESTIONS,
  answerFor,
  type DemoModel,
} from "../../components/demo/script";
import { useIconColors } from "../../lib/token-colors";

type Phase = "thinking" | "streaming" | "done";

type PendingFile = {
  uid: string;
  name: string;
  kind: "image" | "file";
  size: string;
  state: "uploading" | "done";
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  phase?: Phase;
  text: string;
  /** 사용자 메시지 전송 시각(전송 시점에 고정 — 렌더마다 다시 계산하지 않는다) */
  sentAt?: string;
  attachments?: PendingFile[];
};

const CLOCK = () =>
  new Date().toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });

export default function DemoChat() {
  const params = useLocalSearchParams<{ q?: string }>();
  const router = useRouter();
  const icons = useIconColors();
  const initialPrompt = typeof params.q === "string" ? params.q : "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [model, setModel] = useState<DemoModel>(DEMO_MODELS[0]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creativity, setCreativity] = useState(40);
  const [streaming, setStreaming] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState(
    "UniKit에 대해 한국어로 친절하게 답하는 데모 도우미.",
  );

  const idRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fileCursorRef = useRef(0);
  const startedRef = useRef(false);

  // 타이머는 timersRef에 모아 뒀다가 언마운트·새 대화에서 한꺼번에 끊는다.
  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  /** 대본 답변을 타이핑하듯 흘려 보낸다 */
  const respond = useCallback(
    (prompt: string, attachments: PendingFile[]) => {
      const userId = ++idRef.current;
      const assistantId = ++idRef.current;
      setMessages((prev) => [
        ...prev,
        {
          id: userId,
          role: "user",
          text: prompt,
          sentAt: CLOCK(),
          attachments,
        },
        { id: assistantId, role: "assistant", phase: "thinking", text: "" },
      ]);

      const useStream = streaming;
      const charsPerTick = model.charsPerTick;
      const full = answerFor(prompt);

      schedule(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, phase: "streaming" } : m,
          ),
        );
        if (!useStream) {
          schedule(() => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, text: full, phase: "done" }
                  : m,
              ),
            );
          }, 500);
          return;
        }
        let i = 0;
        const tick = () => {
          i += charsPerTick;
          const slice = full.slice(0, i);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, text: slice } : m)),
          );
          if (i < full.length) {
            schedule(tick, 14);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, phase: "done" } : m,
              ),
            );
          }
        };
        schedule(tick, 14);
      }, model.thinkingDelayMs);
    },
    [model, schedule, streaming],
  );

  /** 홈·추천 질문에서 q 파라미터로 들어오면 바로 시작.
   *  respond를 effect 소유 타이머로 미뤄 붙인다 — effect 본문에서 곧바로
   *  messages에 쌓으면 StrictMode 이중 마운트에서 첫 마운트분 쌍이 정리
   *  없이 남아 "생각 중"에 걸린다(웹 사본과 같은 구성). 여기서는 시작 예약만
   *  정리하고 startedRef 리셋은 언마운트 정리가 담당한다. */
  useEffect(() => {
    if (startedRef.current || !initialPrompt) return;
    startedRef.current = true;
    const t = setTimeout(() => respond(initialPrompt, []), 0);
    return () => clearTimeout(t);
  }, [initialPrompt, respond]);

  /** 언마운트 정리 — 타이머를 끊고 startedRef를 되돌린다(웹 사본과 같은 구성).
   *  리셋이 핵심: StrictMode 재마운트에서 ?q 자동 시작이 다시 발화되어야
   *  (사이클 74의 "생각 중" 정지 결함 회피) 언마운트 뒤 tick 체인이 답변
   *  끝까지 도는 낭비를 없앨 수 있다. */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
      startedRef.current = false;
    };
  }, []);

  const busy = messages.some(
    (m) => m.phase !== undefined && m.phase !== "done",
  );

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const files = pendingFiles.filter((f) => f.state === "done");
    setPendingFiles([]);
    respond(text, files);
  };

  const retry = () => {
    if (busy) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // user·assistant는 항상 쌍으로 추가되므로 lastUser가 있으면 마지막
    // assistant도 반드시 있다 — 가드는 불변식 변화에 대한 방어다.
    const lastAssistant = messages.map((m) => m.role).lastIndexOf("assistant");
    if (lastAssistant >= 0) {
      setMessages((prev) => prev.slice(0, lastAssistant));
    }
    schedule(() => respond(lastUser.text, lastUser.attachments ?? []), 60);
  };

  const newChat = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    setMessages([]);
    setInput("");
    setPendingFiles([]);
    setUploadPct(null);
  };

  const attachFile = () => {
    const def = DEMO_FILES[fileCursorRef.current % DEMO_FILES.length];
    fileCursorRef.current += 1;
    const uid = `${def.name}-${Date.now()}`;
    setPendingFiles((prev) => [
      ...prev,
      { uid, ...def, state: "uploading" as const },
    ]);
    // 업로드 진행바(Progress) — 데모 가짜 진행. 완료 타이밍은 상태 전이(900ms)와 같다.
    setUploadPct(8);
    schedule(() => setUploadPct(46), 300);
    schedule(() => setUploadPct(80), 600);
    schedule(() => {
      setPendingFiles((prev) =>
        prev.map((f) => (f.uid === uid ? { ...f, state: "done" } : f)),
      );
      setUploadPct(null);
    }, 900);
  };

  const shareAnswer = async (text: string) => {
    try {
      await Share.share({ message: text });
    } catch {
      toast.error("공유에 실패했어요");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", default: undefined })}
      >
        <View className="flex-1 bg-background">
          {/** 헤더 — 뒤로 · 제목 · 모델 선택 · ⋯ 오버플로우(새 대화·설정) */}
          <View className="flex-row items-center gap-1 border-b border-border px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="데모 홈으로"
              onPress={() => router.back()}
            >
              <ChevronLeft size={20} color={icons.fg} />
            </Button>
            <Avatar className="size-8">
              <AvatarFallback>무</AvatarFallback>
            </Avatar>
            <View className="min-w-0 flex-1 flex-row items-center gap-2 px-1">
              <Text
                className="font-sans text-base font-semibold text-foreground"
                numberOfLines={1}
              >
                UniKit 도우미
              </Text>
              <Badge variant="secondary" className="px-1.5 py-0">
                데모
              </Badge>
            </View>
            <Select
              value={model.id}
              onValueChange={(id) => {
                const next = DEMO_MODELS.find((m) => m.id === id);
                if (next) setModel(next);
              }}
            >
              <SelectTrigger className="h-9 w-28">
                <SelectValue placeholder="모델" />
              </SelectTrigger>
              <SelectContent>
                {DEMO_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/** ⋯ 오버플로우 — 아이콘 버튼 2개를 메뉴로 묶어 헤더 밀도를 줄인다 */}
            <DropdownMenu>
              <DropdownMenuTrigger
                accessibilityLabel="더 보기"
                className="flex h-9 w-9 items-center justify-center rounded-md active:bg-accent"
              >
                <MoreHorizontal size={20} color={icons.fg} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={newChat}
                  accessibilityLabel="새 대화 시작"
                  className="gap-2"
                >
                  <Plus size={16} color={icons.muted} /> 새 대화
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSettingsOpen(true)}
                  accessibilityLabel="어시스턴트 설정"
                  className="gap-2"
                >
                  <SlidersHorizontal size={16} color={icons.muted} /> 설정
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </View>

          {/** 본문 — 대화가 없으면 추천 질문, 있으면 스트리밍 목록 */}
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6 pb-10">
              <Empty className="w-full max-w-sm">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Sparkles size={20} color={icons.muted} />
                  </EmptyMedia>
                  <EmptyTitle>무엇이 궁금하세요?</EmptyTitle>
                  <EmptyDescription>
                    UniKit에 대해 물어보세요. 답변은 미리 쓴 대본을 흘려 보내요.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="w-full gap-2">
                  {DEMO_SUGGESTIONS.map((s) => (
                    // Button은 children을 내부 Text로 감싸 한 줄로 흐르므로, 제목·설명
                    // 두 줄 버튼은 Pressable에 직접 쌓아 만든다(웹 사본과 같은 구성).
                    <Pressable
                      key={s.title}
                      accessibilityLabel={s.title}
                      onPress={() => respond(s.prompt, [])}
                      className="flex w-full flex-col items-start gap-0.5 rounded-md border border-border bg-background px-4 py-3 active:opacity-70"
                    >
                      <Text className="font-sans text-sm font-medium text-foreground">
                        {s.title}
                      </Text>
                      <Text className="font-sans text-xs text-muted-foreground">
                        {s.description}
                      </Text>
                    </Pressable>
                  ))}
                </EmptyContent>
              </Empty>
            </View>
          ) : (
            <MessageScrollerProvider>
              <MessageScroller className="w-full flex-1">
                <MessageScrollerViewport>
                  <MessageScrollerContent className="w-full px-4 py-6">
                    {messages.map((m) => (
                      <MessageScrollerItem key={m.id}>
                        <Message align={m.role === "user" ? "end" : "start"}>
                          {m.role === "assistant" ? (
                            <MessageAvatar>
                              <Avatar>
                                <AvatarFallback>무</AvatarFallback>
                              </Avatar>
                            </MessageAvatar>
                          ) : null}
                          <MessageContent>
                            {m.attachments && m.attachments.length > 0 ? (
                              <AttachmentGroup className="mb-2 max-w-full">
                                {m.attachments.map((f) => (
                                  <Attachment
                                    key={f.uid}
                                    size="sm"
                                    state="done"
                                    className="max-w-56"
                                  >
                                    <AttachmentContent>
                                      <AttachmentTitle>
                                        {f.kind === "image" ? "▣ " : "▤ "}
                                        {f.name}
                                      </AttachmentTitle>
                                      <AttachmentDescription>
                                        {f.size}
                                      </AttachmentDescription>
                                    </AttachmentContent>
                                  </Attachment>
                                ))}
                              </AttachmentGroup>
                            ) : null}
                            <Bubble
                              variant={m.role === "user" ? "default" : "outline"}
                            >
                              <BubbleContent>
                                {m.phase === "thinking" ? (
                                  <View className="flex-row items-center gap-2">
                                    <Spinner className="size-4" />
                                    <Text className="font-sans text-sm text-muted-foreground">
                                      생각 중…
                                    </Text>
                                  </View>
                                ) : (
                                  m.text
                                )}
                              </BubbleContent>
                            </Bubble>
                            {m.role === "user" ? (
                              <MessageFooter>{m.sentAt}</MessageFooter>
                            ) : m.phase === "done" ? (
                              <MessageFooter>
                                <View className="flex-row items-center gap-1">
                                  <Badge variant="secondary" className="px-1.5">
                                    {model.label}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    accessibilityLabel="답변 공유"
                                    onPress={() => void shareAnswer(m.text)}
                                  >
                                    <Share2 size={14} color={icons.muted} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    accessibilityLabel="답변 다시 생성"
                                    onPress={retry}
                                    disabled={busy}
                                  >
                                    <RefreshCw size={14} color={icons.muted} />
                                  </Button>
                                </View>
                              </MessageFooter>
                            ) : null}
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    ))}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton direction="end" />
              </MessageScroller>
            </MessageScrollerProvider>
          )}

          {/** 작성 줄 — 첨부 미리보기 + 통합 입력 상자 */}
          <View className="border-t border-border px-4 py-2.5">
            {pendingFiles.length > 0 ? (
              <AttachmentGroup className="mb-2">
                {pendingFiles.map((f) => (
                  <Attachment
                    key={f.uid}
                    size="sm"
                    state={f.state}
                    className="max-w-60"
                  >
                    <AttachmentContent>
                      <AttachmentTitle>
                        {f.kind === "image" ? "▣ " : "▤ "}
                        {f.name}
                      </AttachmentTitle>
                      <AttachmentDescription>
                        {f.state === "uploading" ? "올리는 중…" : f.size}
                      </AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction
                        accessibilityLabel={`${f.name} 첨부 취소`}
                        onPress={() =>
                          setPendingFiles((prev) =>
                            prev.filter((p) => p.uid !== f.uid),
                          )
                        }
                      >
                        ✕
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                ))}
              </AttachmentGroup>
            ) : null}
            {uploadPct != null ? (
              <Progress
                value={uploadPct}
                accessibilityLabel="첨부 업로드 진행"
                className="mb-2 h-1.5"
              />
            ) : null}
            <View className="flex-row items-end gap-1 rounded-xl border border-border bg-card p-1.5">
              <Button
                variant="ghost"
                size="icon"
                accessibilityLabel="파일 첨부"
                onPress={attachFile}
                className="shrink-0"
              >
                <Paperclip size={18} color={icons.fg} />
              </Button>
              <Textarea
                value={input}
                onChangeText={setInput}
                placeholder="UniKit에 대해 물어보세요"
                className="min-h-9 flex-1 border-0 bg-transparent px-1"
              />
              <Button
                size="icon"
                accessibilityLabel="보내기"
                onPress={send}
                disabled={!input.trim() || busy}
                className="shrink-0 rounded-full"
              >
                <ArrowUp size={18} color={icons.onPrimary} />
              </Button>
            </View>
          </View>

          {/** 설정 시트 — Field 족으로 항목을 잡고 Separator로 구분한다 */}
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetContent side="bottom" className="gap-4">
              <SheetHeader>
                <SheetTitle>어시스턴트 설정</SheetTitle>
              </SheetHeader>
              {/** 시트 카드 자체는 패딩이 없다(shadcn 원본·Sheet 컴포넌트 그대로) —
                  본문 좌우 여백은 소비자가 준다(G4 P2 수정, 웹 사본과 같은 구성) */}
              <View className="gap-4 px-4">
                <Field>
                  <FieldContent>
                    <FieldLabel nativeID="demo-creativity">창의성</FieldLabel>
                    <Slider
                      value={[creativity]}
                      onValueChange={(v) => setCreativity(v[0] ?? 0)}
                      accessibilityLabel="창의성"
                      className="mt-1"
                    />
                    <FieldDescription>
                      데모라 답변은 같아요 — 슬라이더만 움직여 보세요.
                    </FieldDescription>
                  </FieldContent>
                </Field>
                <Separator />
                <View className="flex-row items-center justify-between gap-4">
                  <Field className="min-w-0 flex-1">
                    <FieldContent>
                      <FieldLabel nativeID="demo-streaming">스트리밍</FieldLabel>
                      <FieldDescription>
                        끄면 답변이 한 번에 나타나요.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                  <Switch
                    checked={streaming}
                    onCheckedChange={setStreaming}
                    accessibilityLabel="스트리밍"
                  />
                </View>
                <Separator />
                <Field>
                  <FieldContent>
                    <FieldLabel nativeID="demo-system-prompt">
                      시스템 프롬프트
                    </FieldLabel>
                    <Textarea
                      value={systemPrompt}
                      onChangeText={setSystemPrompt}
                      accessibilityLabelledBy="demo-system-prompt"
                      className="mt-1 min-h-20"
                    />
                  </FieldContent>
                </Field>
              </View>
            </SheetContent>
          </Sheet>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
