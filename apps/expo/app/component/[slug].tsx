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
          contentContainerClassName="w-full max-w-[640px] mx-auto px-4 pt-5 pb-16 space-y-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              accessibilityLabel="목록으로"
              className="self-start -ml-2.5 flex-row items-center gap-1.5 text-muted-foreground"
            >
              <ChevronLeft size={16} color={iconColor} />
              <Text className="font-sans text-sm font-medium text-foreground">
                목록
              </Text>
            </Button>
            <View className="mt-3 flex-row items-center gap-2">
              <Text className="font-sans text-2xl font-bold tracking-tight text-foreground">
                {entry.title}
              </Text>
              {entry.webOnly ? <Badge variant="outline">웹 전용</Badge> : null}
            </View>
            <Text className="mt-1.5 font-sans text-sm leading-6 text-muted-foreground">
              {entry.description}
            </Text>
          </View>

          {/* 대표 미리보기 (Preview) — 주 무대 */}
          {primarySlide ? (
            <View className="space-y-2.5">
              <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {primarySlide.name}
              </Text>
              {entry.webOnly ? (
                primarySlide.element
              ) : (
                <View className="min-h-36 items-center justify-center rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                  {primarySlide.element}
                </View>
              )}
            </View>
          ) : null}

          {/* 변형 예시 목록 (Examples) — 박스 중첩(Containeritis) 완화 */}
          {exampleSlides.length > 0 ? (
            <View className="space-y-6 border-t border-border/60 pt-7">
              <Text className="font-sans text-lg font-semibold tracking-tight text-foreground">
                Examples
              </Text>
              {exampleSlides.map((slide) => (
                <View key={slide.name} className="space-y-2">
                  <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {slide.name}
                  </Text>
                  <View className="items-center justify-center rounded-xl bg-muted/40 p-5">
                    {slide.element}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* 이전 / 다음 컴포넌트 이동 */}
          <View className="flex-row items-center justify-between gap-4 border-t border-border/60 pt-8">
            {neighbors.prev ? (
              <Pressable
                onPress={() =>
                  router.replace(`/component/${neighbors.prev!.slug}`)
                }
                className="flex-1 rounded-xl border border-border/70 bg-card p-4 active:bg-muted/40"
                accessibilityLabel={`이전 컴포넌트: ${neighbors.prev.title}`}
              >
                <Text className="font-sans text-xs text-muted-foreground">
                  이전
                </Text>
                <View className="mt-1 flex-row items-center gap-1.5">
                  <ChevronLeft size={14} color={iconColor} />
                  <Text className="font-sans text-sm font-medium text-foreground">
                    {neighbors.prev.title}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View className="flex-1" />
            )}
            {neighbors.next ? (
              <Pressable
                onPress={() =>
                  router.replace(`/component/${neighbors.next!.slug}`)
                }
                className="flex-1 rounded-xl border border-border/70 bg-card p-4 active:bg-muted/40"
                accessibilityLabel={`다음 컴포넌트: ${neighbors.next.title}`}
              >
                <Text className="font-sans text-xs text-muted-foreground text-right">
                  다음
                </Text>
                <View className="mt-1 flex-row items-center justify-end gap-1.5">
                  <Text className="font-sans text-sm font-medium text-foreground">
                    {neighbors.next.title}
                  </Text>
                  <ChevronRight size={14} color={iconColor} />
                </View>
              </Pressable>
            ) : (
              <View className="flex-1" />
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
