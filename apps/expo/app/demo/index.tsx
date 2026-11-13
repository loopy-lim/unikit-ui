// 데모 앱 홈(엑스포) — "UniKit UI 도우미" 앱의 대문. 웹 사본(apps/web/app/blocks/
// assistant/page.tsx)과 같은 구성: 인사 · 빠른 질문 · 이어서 하기. 질문을 고르면
// /demo/chat으로 q를 실어 보내 바로 대화가 시작된다. 컴포넌트 import는 오직
// @unikit-bridge/ui, 프리미티브는 @unikit-bridge/ui/primitives(AC-1).
import { Link } from "expo-router";
import {
  ChevronRight,
  Download,
  Layers,
  MessageSquare,
  Palette,
  Smartphone,
  type LucideIcon,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@unikit-bridge/ui";
import { Pressable, ScrollView, Text, View } from "@unikit-bridge/ui/primitives";

import { DEMO_RECENTS, DEMO_SUGGESTIONS } from "../../components/demo/script";
import { ThemeToggleButton } from "../../components/theme-toggle";
import { useIconColors } from "../../lib/token-colors";

/** 빠른 질문 카드 아이콘 — 제목 기준 매핑(웹 사본과 같은 구성) */
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

export default function DemoHome() {
  const icons = useIconColors();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <ScrollView
          className="w-full flex-1"
          contentContainerClassName="w-full max-w-2xl mx-auto px-4 pb-12 gap-8"
        >
          {/** 헤더 */}
          <View className="flex-row items-center justify-between pt-4">
            <View className="gap-0.5">
              <Text className="font-sans text-xs text-muted-foreground">
                {todayLabel()}
              </Text>
              <Text className="font-sans text-2xl font-bold tracking-tight text-foreground">
                UniKit UI 도우미
              </Text>
            </View>
            <ThemeToggleButton />
          </View>

          {/** 인사 */}
          <Text className="font-sans text-lg font-semibold text-foreground">
            {greeting()} — 무엇을 도와드릴까요?
          </Text>

          {/** 빠른 질문 — 카드를 누르면 그 질문으로 대화가 시작된다 */}
          <View className="gap-3">
            <Text className="font-sans text-sm font-medium text-foreground">
              빠른 질문
            </Text>
            {DEMO_SUGGESTIONS.map((s) => {
              const Icon = SUGGESTION_ICONS[s.title];
              return (
                <Link
                  key={s.title}
                  href={{ pathname: "/demo/chat", params: { q: s.prompt } }}
                  asChild
                >
                  <Pressable className="active:opacity-70">
                    <Card className="gap-1 py-4">
                      <CardHeader className="gap-1">
                        <View className="flex-row items-center gap-2">
                          {Icon ? (
                            <View className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Icon size={15} color={icons.fg} />
                            </View>
                          ) : null}
                          <CardTitle className="text-sm">{s.title}</CardTitle>
                        </View>
                        <CardDescription className="text-xs">
                          {s.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-row items-center justify-between gap-2 pt-0">
                        <Text className="font-sans flex-1 text-xs text-muted-foreground">
                          “{s.prompt}”
                        </Text>
                        <ChevronRight size={15} color={icons.muted} />
                      </CardContent>
                    </Card>
                  </Pressable>
                </Link>
              );
            })}
          </View>

          {/** 이어서 하기 — 누르면 그 주제로 새 대화 */}
          <View className="gap-3">
            <Text className="font-sans text-sm font-medium text-foreground">
              이어서 하기
            </Text>
            <Card className="py-2">
              <ItemGroup>
                {DEMO_RECENTS.map((r) => (
                  <Link
                    key={r.title}
                    href={{ pathname: "/demo/chat", params: { q: r.prompt } }}
                    asChild
                  >
                    <Pressable className="active:opacity-70">
                      <Item>
                        <ItemMedia className="flex size-9 items-center justify-center rounded-md bg-muted">
                          <MessageSquare size={16} color={icons.muted} />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{r.title}</ItemTitle>
                          <ItemDescription>{r.preview}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-xs"
                          >
                            {r.time}
                          </Badge>
                        </ItemActions>
                      </Item>
                    </Pressable>
                  </Link>
                ))}
              </ItemGroup>
            </Card>
          </View>

          {/** 안내 */}
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge variant="secondary">데모 앱</Badge>
            <Text className="font-sans text-xs text-muted-foreground">
              이 화면의 모든 요소는 @unikit-bridge/ui 컴포넌트예요 — 답변은 미리
              쓴 대본이에요.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
