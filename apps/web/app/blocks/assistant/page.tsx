"use client";
/**
 * 데모 앱 홈(웹) — "UniKit UI 도우미" 앱의 대문.
 * 인사 · 빠른 질문 카드 · 이어서 하기 목록만 담고, 실제 대화는
 * /blocks/assistant/chat로 넘어간다(q 파라미터로 질문을 실어 보낸다).
 * 엑스포 사본은 apps/expo/app/demo/index.tsx. 아이콘은 lucide-react.
 */
import Link from "next/link";
import {
  ChevronRight,
  Download,
  Layers,
  MessageSquare,
  Palette,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@unikit-bridge/ui";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@unikit-bridge/ui";
import { ScrollView, Text, View } from "@unikit-bridge/ui/primitives";

import { DEMO_RECENTS, DEMO_SUGGESTIONS } from "../../../components/blocks/script";

/** 빠른 질문 카드 아이콘 — 제목 기준 매핑(엑스포 사본과 같은 구성) */
const SUGGESTION_ICONS: Record<string, LucideIcon> = {
  "구성 알아보기": Layers,
  "설치 방법": Download,
  크로스플랫폼: Smartphone,
  테마: Palette,
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "좋은 오후예요";
  return "좋은 저녁이에요";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export default function DemoHomePage() {
  return (
    <ScrollView className="h-full w-full bg-background">
      <View className="mx-auto w-full max-w-3xl gap-8 px-4 py-10 sm:px-6">
        {/** 인사 */}
        <View className="gap-1">
          <Text className="font-sans text-xs text-muted-foreground">
            {todayLabel()}
          </Text>
          <Text className="site-display text-3xl font-semibold tracking-tight text-foreground">
            {greeting()} — 무엇을 도와드릴까요?
          </Text>
        </View>

        {/** 빠른 질문 — 카드를 누르면 그 질문으로 대화가 시작된다 */}
        <View className="gap-3">
          <Text className="font-sans text-sm font-medium text-foreground">
            빠른 질문
          </Text>
          <View className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DEMO_SUGGESTIONS.map((s) => {
              const Icon = SUGGESTION_ICONS[s.title] ?? Sparkles;
              return (
                <Link
                  key={s.title}
                  href={`/blocks/assistant/chat?q=${encodeURIComponent(s.prompt)}`}
                  className="group web:transition-colors"
                >
                  <Card className="h-full gap-1 border-border/70 py-4 web:transition-colors web:group-hover:border-foreground/25 web:group-hover:bg-muted/30">
                    <CardHeader className="gap-1">
                      <View className="flex flex-row items-center gap-2">
                        <View className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Icon className="size-4 text-foreground" />
                        </View>
                        <CardTitle className="text-sm">{s.title}</CardTitle>
                      </View>
                      <CardDescription className="text-xs">
                        {s.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-row items-center justify-between gap-2 pt-0">
                      <Text className="font-sans text-xs text-muted-foreground">
                        “{s.prompt}”
                      </Text>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 web:transition-transform web:group-hover:translate-x-0.5" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </View>
        </View>

        {/** 이어서 하기 — 누르면 그 주제로 새 대화 */}
        <View className="gap-3">
          <Text className="font-sans text-sm font-medium text-foreground">
            이어서 하기
          </Text>
          <Card className="py-2">
            <ItemGroup>
              {DEMO_RECENTS.map((r, index) => (
                <Link
                  key={r.title}
                  href={`/blocks/assistant/chat?q=${encodeURIComponent(r.prompt)}`}
                  className="web:transition-opacity web:hover:opacity-80"
                >
                  <Item className={cn(index === 0 && "border-t-0")}>
                    <ItemMedia className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <MessageSquare className="size-4 text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{r.title}</ItemTitle>
                      <ItemDescription className="line-clamp-1">
                        {r.preview}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Badge variant="outline" className="px-1.5 text-xs">
                        {r.time}
                      </Badge>
                    </ItemActions>
                  </Item>
                </Link>
              ))}
            </ItemGroup>
          </Card>
        </View>

        {/** 안내 */}
        <View className="flex flex-row flex-wrap items-center gap-2">
          <Badge variant="secondary">데모 앱</Badge>
          <Text className="font-sans text-xs text-muted-foreground">
            이 화면의 모든 요소는 @unikit-bridge/ui 컴포넌트예요 — 답변은 미리
            쓴 대본이에요.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
