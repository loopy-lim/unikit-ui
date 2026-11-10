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
import {
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

/** 목록 행 — 컴포넌트 하나(탭하면 상세 화면으로) */
function CatalogRow({ entry }: { entry: CatalogEntry }) {
  return (
    <Link href={`/component/${entry.slug}`} asChild>
      <Pressable
        className="flex-row items-center justify-between border-b border-border/40 py-4 active:bg-muted/40"
        accessibilityLabel={`${entry.title} ${entry.subtitle} 데모 열기`}
      >
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            <Text className="font-sans text-sm font-medium text-foreground">
              {entry.title}
            </Text>
            {entry.webOnly ? (
              <Text className="font-sans text-xs text-muted-foreground">
                웹 전용
              </Text>
            ) : null}
          </View>
          <Text className="mt-0.5 font-sans text-xs text-muted-foreground">
            {entry.subtitle}
          </Text>
        </View>
        <Text className="font-sans text-base text-muted-foreground">›</Text>
      </Pressable>
    </Link>
  );
}

export default function Index() {
  // 테마 토글(§1.4): Provider는 _layout이 이미 랩. 라벨은 "누르면 될 모드".
  const { colorScheme, toggleColorScheme } = useUnikitTheme();

  // 검색 — 영문명·한글명·카테고리를 모두 대상으로.
  const [query, setQuery] = useState("");

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
    <View className="flex-1 bg-background">
      <SectionList
        className="w-full"
        contentContainerClassName="w-full max-w-[640px] mx-auto px-4 pb-12"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        sections={sections}
        keyExtractor={(entry) => entry.slug}
        renderItem={({ item }) => <CatalogRow entry={item} />}
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-baseline justify-between border-b border-border pb-3 pt-8">
            <Text className="font-sans text-sm font-semibold text-foreground">
              {section.title}
            </Text>
            <Text className="font-sans text-xs text-muted-foreground">
              {section.data.length}종
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <View>
            {/* 헤더(§1.2 v3): 좌 타이틀 블록(flex-1) · 우 테마 토글 — 카피 유지 */}
            {/* items-start — 토글 상단을 타이틀 첫 줄에 맞춘다(부제가 2줄이면
                items-center는 토글이 아래로 처져 어긋나 보임, 감사 2026-11-10) */}
            <View className="mb-8 flex-row items-start justify-between gap-3 pt-8">
              <View className="flex-1">
                <Text className="font-sans text-2xl font-bold web:tracking-tight text-foreground">
                  UniKit
                </Text>
                <Text className="mt-1 font-sans text-sm text-muted-foreground">
                  React와 React Native에서 같은 컴포넌트, 같은 모습.
                </Text>
              </View>
              <Button
                variant="outline"
                size="sm"
                onPress={toggleColorScheme}
                accessibilityLabel="색 테마 전환"
              >
                {colorScheme === "light" ? "🌙 다크" : "☀️ 라이트"}
              </Button>
            </View>
            {/* 검색 — 컴포넌트 61종을 이름으로 찾는다 */}
            <Input
              placeholder="컴포넌트 검색 (예: 버튼, dialog)"
              value={query}
              onChangeText={setQuery}
              accessibilityLabel="컴포넌트 검색"
            />
          </View>
        }
        ListEmptyComponent={
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">⌕</EmptyMedia>
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
  );
}
