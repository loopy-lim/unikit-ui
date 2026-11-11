// 컴포넌트 상세 화면 — /component/<slug>.
// 웹 쇼케이스(/showcase/[name])와 동일한 시각 계층:
// - 상단 헤더: 뒤로가기, 컴포넌트 영문명 + 웹 전용 배지, 설명
// - 대표 미리보기(Preview): 단일 프레임 안에 중앙 배치
// - 변형 예시(Examples): 인위적인 가로 캐러셀/점 페이저 대신 웹과 같이 자연스러운 세로 스크롤로 나열
// - 하단 내비게이션: 이전 / 다음 컴포넌트 이동
import { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Badge, Button, useUnikitTheme } from "@unikit-bridge/ui";

import { CATALOG, findEntry } from "../../components/showcase/catalog";

export default function ComponentScreen() {
  const { colorScheme } = useUnikitTheme();
  const iconColor =
    colorScheme === "dark" ? "hsl(240 5% 96%)" : "hsl(240 10% 3.9%)";
  const mutedIconColor =
    colorScheme === "dark" ? "hsl(240 5% 65%)" : "hsl(240 3.8% 46.1%)";

  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const entry = typeof slug === "string" ? findEntry(slug) : undefined;

  const neighbors = useMemo(() => {
    if (!slug || typeof slug !== "string") return { prev: null, next: null };
    const idx = CATALOG.findIndex((c) => c.slug === slug);
    return {
      prev: idx > 0 ? CATALOG[idx - 1] : null,
      next: idx >= 0 && idx < CATALOG.length - 1 ? CATALOG[idx + 1] : null,
    };
  }, [slug]);

  if (!entry) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text className="font-sans text-base font-medium text-foreground">
          찾을 수 없는 컴포넌트예요
        </Text>
        <Button variant="outline" size="sm" onPress={() => router.back()}>
          목록으로
        </Button>
      </View>
    );
  }

  const primarySlide = entry.slides[0];
  const exampleSlides = entry.slides.slice(1);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <ScrollView
          style={{ flex: 1 }}
          className="w-full flex-1"
          contentContainerClassName="w-full max-w-[640px] mx-auto px-4 pt-4 pb-16"
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View className="mb-4">
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="목록으로"
              className="flex-row items-center gap-1 py-1 self-start active:opacity-70"
              hitSlop={8}
            >
              <ChevronLeft size={16} color={mutedIconColor} />
              <Text className="font-sans text-xs font-medium text-muted-foreground">
                컴포넌트
              </Text>
            </Pressable>
            <View className="mt-2 flex-row items-baseline gap-2">
              <Text className="font-sans text-2xl font-bold tracking-tight text-foreground">
                {entry.title}
              </Text>
              <Text className="font-sans text-sm text-muted-foreground">
                {entry.subtitle}
              </Text>
              {entry.webOnly ? (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  웹 전용
                </Badge>
              ) : null}
            </View>
            <Text className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground">
              {entry.description}
            </Text>
          </View>

          {/* 대표 미리보기 (Preview) — 주 무대 */}
          {primarySlide ? (
            <View className="mb-7">
              {entry.webOnly || ["card", "table"].includes(entry.slug) ? (
                <View className="py-2 items-center justify-center">
                  {primarySlide.element}
                </View>
              ) : (
                <View className="min-h-36 items-center justify-center rounded-2xl border border-border/50 bg-card/60 p-6">
                  {primarySlide.element}
                </View>
              )}
            </View>
          ) : null}

          {/* 변형 예시 목록 (Examples) — 불필요한 중첩 박스 제거 */}
          {exampleSlides.length > 0 ? (
            <View className="mb-7 pt-5 border-t border-border/40">
              <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Examples
              </Text>
              <View className="divide-y divide-border/30">
                {exampleSlides.map((slide) => (
                  <View key={slide.name} className="py-4 space-y-2.5">
                    <Text className="font-sans text-xs font-medium text-muted-foreground">
                      {slide.name}
                    </Text>
                    <View className="items-center justify-center py-2">
                      {slide.element}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* 이전 / 다음 컴포넌트 이동 */}
          <View className="flex-row items-center gap-3 border-t border-border/40 pt-5">
            {neighbors.prev ? (
              <Pressable
                onPress={() =>
                  router.replace(`/component/${neighbors.prev!.slug}`)
                }
                className="flex-1 rounded-xl border border-border/50 bg-card/60 p-3.5 active:bg-muted/40 active:opacity-85"
                accessibilityLabel={`이전 컴포넌트: ${neighbors.prev.title}`}
              >
                <Text className="font-sans text-[11px] text-muted-foreground">
                  이전
                </Text>
                <View className="mt-0.5 flex-row items-center gap-1">
                  <ChevronLeft size={13} color={iconColor} />
                  <Text className="font-sans text-sm font-medium text-foreground">
                    {neighbors.prev.title}
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {neighbors.next ? (
              <Pressable
                onPress={() =>
                  router.replace(`/component/${neighbors.next!.slug}`)
                }
                className="flex-1 rounded-xl border border-border/50 bg-card/60 p-3.5 active:bg-muted/40 active:opacity-85"
                accessibilityLabel={`다음 컴포넌트: ${neighbors.next.title}`}
              >
                <Text className="font-sans text-[11px] text-muted-foreground text-right">
                  다음
                </Text>
                <View className="mt-0.5 flex-row items-center justify-end gap-1">
                  <Text className="font-sans text-sm font-medium text-foreground">
                    {neighbors.next.title}
                  </Text>
                  <ChevronRight size={13} color={iconColor} />
                </View>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
