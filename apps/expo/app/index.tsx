// UniKit Expo 쇼케이스 — 카탈로그 재구성(2026-11-10): 세로로 쭉 나열하던
// 단일 페이지를 RNR(react-native-reusables 쇼케이스) 관행인 "검색 가능한
// 목록 → 컴포넌트별 상세 화면" 구조로 바꿨다. 데모 본문은
// components/showcase/*-sections.tsx의 CatalogEntry로 옮겼고, 이 화면은
// 목록(카테고리 그룹 + 검색)만 담는다.
//
// - 컴포넌트 import는 오직 @unikit-bridge/ui(AC-1 단일 import 원칙).
//   react-native는 인프라 import다. SafeArea/Toaster는 _layout이 담당.
// - 헤더 카피는 기존(02-design §1.2·§5)을 그대로 유지한다(문구 수정 금지).
import { useMemo, useState } from "react";
import { Link } from "expo-router";
import { Pressable, SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  Moon,
  Search,
  SearchX,
  Sun,
} from "lucide-react-native";
import {
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  useUnikitTheme,
} from "@unikit-bridge/ui";

import {
  CATALOG,
  CATEGORIES,
  type CatalogEntry,
} from "../components/showcase/catalog";

/** 카탈로그 항목 — 카테고리 그룹화된 리스트 행 (Containeritis 해소) */
function CatalogRow({
  entry,
  isFirst,
  isLast,
  chevronColor,
}: {
  entry: CatalogEntry;
  isFirst: boolean;
  isLast: boolean;
  chevronColor: string;
}) {
  return (
    <Link href={`/component/${entry.slug}`} asChild>
      <Pressable
        className={`flex-row items-center justify-between px-4 py-3.5 bg-card active:bg-muted/50 ${
          isFirst && isLast
            ? "rounded-2xl border border-border/70"
            : isFirst
              ? "rounded-t-2xl border-t border-x border-border/70"
              : isLast
                ? "rounded-b-2xl border-b border-x border-border/70"
                : "border-x border-b border-border/70"
        }`}
        accessibilityLabel={`${entry.title} ${entry.subtitle} 데모 열기`}
      >
        <View className="flex-1 pr-3">
          <View className="flex-row items-baseline gap-2">
            <Text className="font-sans text-base font-semibold text-foreground">
              {entry.title}
            </Text>
            <Text className="font-sans text-xs text-muted-foreground">
              {entry.subtitle}
            </Text>
            {entry.webOnly ? (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                웹 전용
              </Badge>
            ) : null}
          </View>
          <Text
            className="mt-0.5 font-sans text-xs leading-5 text-muted-foreground"
            numberOfLines={1}
          >
            {entry.description}
          </Text>
        </View>
        <ChevronRight size={16} color={chevronColor} />
      </Pressable>
    </Link>
  );
}

export default function Index() {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  const [query, setQuery] = useState("");

  const iconColor =
    colorScheme === "dark" ? "hsl(240 5% 96%)" : "hsl(240 10% 3.9%)";
  const mutedIconColor =
    colorScheme === "dark" ? "hsl(240 5% 65%)" : "hsl(240 3.8% 46.1%)";
  const subtleIconColor =
    colorScheme === "dark" ? "hsl(240 5% 45%)" : "hsl(240 5% 75%)";

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? CATALOG.filter((entry) =>
          `${entry.title} ${entry.subtitle} ${entry.category}`
            .toLowerCase()
            .includes(q),
        )
      : CATALOG;
    return CATEGORIES.map((category) => ({
      title: category,
      data: matched.filter((entry) => entry.category === category),
    })).filter((section) => section.data.length > 0);
  }, [query]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <SectionList
          style={{ flex: 1 }}
          className="w-full flex-1"
          contentContainerClassName="w-full max-w-[640px] mx-auto px-4 pb-12"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
          sections={sections}
          keyExtractor={(entry) => entry.slug}
          renderItem={({ item, index, section }) => (
            <CatalogRow
              entry={item}
              isFirst={index === 0}
              isLast={index === section.data.length - 1}
              chevronColor={subtleIconColor}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-baseline justify-between pb-2.5 pt-7 px-1">
              <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </Text>
              <Text className="font-sans text-xs text-muted-foreground/60">
                {section.data.length}종
              </Text>
            </View>
          )}
          ListHeaderComponent={
            <View className="pb-3">
              <View className="mb-6 flex-row items-start justify-between gap-3 pt-6">
                <View className="flex-1">
                  <Text className="font-sans text-2xl font-bold tracking-tight text-foreground">
                    UniKit
                  </Text>
                  <Text className="mt-1 font-sans text-sm text-muted-foreground">
                    React와 React Native에서 같은 컴포넌트, 같은 모습.
                  </Text>
                </View>
                <Button
                  variant="outline"
                  size="icon"
                  onPress={toggleColorScheme}
                  accessibilityLabel="색 테마 전환"
                  className="h-10 w-10 rounded-full border-border/80"
                >
                  {colorScheme === "light" ? (
                    <Moon size={18} color={iconColor} />
                  ) : (
                    <Sun size={18} color={iconColor} />
                  )}
                </Button>
              </View>
              <View className="relative justify-center">
                <View className="absolute left-3.5 z-10 pointer-events-none">
                  <Search size={16} color={mutedIconColor} />
                </View>
                <Input
                  className="pl-10 h-11 rounded-xl bg-card border-border/80 text-sm"
                  placeholder="컴포넌트 검색 (예: 버튼, dialog)"
                  value={query}
                  onChangeText={setQuery}
                  accessibilityLabel="컴포넌트 검색"
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX size={32} color={mutedIconColor} />
                </EmptyMedia>
                <EmptyTitle>검색 결과가 없어요</EmptyTitle>
                <EmptyDescription>다른 이름으로 찾아 보세요.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onPress={() => setQuery("")}>
                  검색 지우기
                </Button>
              </EmptyContent>
            </Empty>
          }
          ListFooterComponent={
            <View className="pt-8">
              <Text className="text-center font-sans text-xs text-muted-foreground">
                UniKit v0.2 · Expo와 Next.js에서 같은 화면을 보고 있어요.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
