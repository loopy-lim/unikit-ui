// UniKit Expo 쇼케이스 — 카탈로그 재구성(2026-11-10): 세로로 쭉 나열하던
// 단일 페이지를 RNR(react-native-reusables 쇼케이스) 관행인 "검색 가능한
// 목록 → 컴포넌트별 상세 화면" 구조로 바꿨다. 데모 본문은
// components/showcase/*-sections.tsx의 CatalogEntry로 옮겼고, 이 화면은
// 목록(카테고리 그룹 + 검색)만 담는다.
//
// - 컴포넌트 import는 오직 @unikit-bridge/ui, 프리미티브는
//   @unikit-bridge/ui/primitives(AC-1 단일 import 원칙 — react-native 직접
//   import 폐지, 이 화면 소스가 웹/Tauri 번들에서도 그대로 해석된다).
//   SafeArea/Toaster는 _layout이 담당.
// - 헤더 카피는 기존(02-design §1.2·§5)을 그대로 유지한다(문구 수정 금지).
import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Search, SearchX } from "lucide-react-native";
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
  cn,
} from "@unikit-bridge/ui";
import { Image, Pressable, SectionList, Text, View } from "@unikit-bridge/ui/primitives";

import {
  CATALOG,
  CATEGORIES,
  type CatalogEntry,
} from "../components/showcase/catalog";
import { ThemeToggleButton } from "../components/theme-toggle";
import { useIconColors } from "../lib/token-colors";

const brandMark = require("../assets/images/icon.png");

type IndexedCatalogEntry = {
  entry: CatalogEntry;
  searchText: string;
};

const INDEXED_CATALOG: IndexedCatalogEntry[] = CATALOG.map((entry) => ({
  entry,
  searchText: `${entry.title} ${entry.subtitle} ${entry.category}`.toLowerCase(),
}));

const SAFE_AREA_STYLE = { flex: 1 } as const;
const BRAND_IMAGE_STYLE = { width: 44, height: 44, borderRadius: 10 } as const;

/** 카탈로그 항목 — 미니멀 인셋 리스트 행 */
const CatalogRow = memo(function CatalogRow({
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
        className={cn(
          "flex-row items-center justify-between px-4 py-3 bg-card active:bg-muted/50 active:opacity-85",
          isFirst && isLast
            ? "rounded-2xl border border-border/50"
            : isFirst
              ? "rounded-t-2xl border-t border-x border-border/50"
              : isLast
                ? "rounded-b-2xl border-b border-x border-border/50"
                : "border-x border-border/50",
          !isLast && "border-b border-border/40",
        )}
        accessibilityLabel={`${entry.title} ${entry.subtitle} 데모 열기`}
      >
        <View className="flex-1 flex-row items-center gap-2 pr-2">
          <Text className="font-sans text-sm font-semibold tracking-tight text-foreground">
            {entry.title}
          </Text>
          <Text className="font-sans text-xs text-muted-foreground">
            {entry.subtitle}
          </Text>
          {entry.webOnly ? (
            <Badge variant="outline" className="px-1.5 py-0 text-xs">
              웹 전용
            </Badge>
          ) : null}
        </View>
        <ChevronRight size={15} color={chevronColor} />
      </Pressable>
    </Link>
  );
});

const CatalogListHeader = memo(function CatalogListHeader({
  query,
  onChangeQuery,
  mutedColor,
}: {
  query: string;
  onChangeQuery: (text: string) => void;
  mutedColor: string;
}) {
  return (
    <View className="pb-2">
      <View className="mb-5 flex-row items-center justify-between pt-4">
        <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-2">
          <Image
            source={brandMark}
            accessibilityLabel="UniKit"
            className="size-11 rounded-[22%]"
            style={BRAND_IMAGE_STYLE}
          />
          <View className="min-w-0 flex-1">
            <Text className="font-sans text-2xl font-bold tracking-tight text-foreground">
              UniKit
            </Text>
            <Text className="mt-1 font-sans text-xs text-muted-foreground">
              React와 React Native에서 같은 컴포넌트, 같은 모습
            </Text>
          </View>
        </View>
        <ThemeToggleButton />
      </View>
      <View className="relative justify-center">
        <View className="absolute left-3.5 z-10 pointer-events-none">
          <Search size={15} color={mutedColor} />
        </View>
        <Input
          className="pl-9 h-10 rounded-xl bg-muted/40 border-border/40 text-sm"
          placeholder="컴포넌트 검색 (예: 버튼, dialog)"
          value={query}
          onChangeText={onChangeQuery}
          accessibilityLabel="컴포넌트 검색"
        />
      </View>
      {/** 데모 앱 진입 — 실제 앱 화면처럼 쓰는 구성(사이클 73) */}
      <Link href="/demo" asChild>
        <Pressable
          className="mt-4 flex-row items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 active:bg-muted/50 active:opacity-85"
          accessibilityLabel="데모 앱 UniKit 도우미 열기"
        >
          <View className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Text className="font-sans text-lg text-foreground">✦</Text>
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <View className="flex-row items-center gap-2">
              <Text className="font-sans text-sm font-semibold tracking-tight text-foreground">
                데모 앱 — UniKit 도우미
              </Text>
              <Badge variant="outline" className="px-1.5 py-0 text-xs">
                새
              </Badge>
            </View>
            <Text
              className="font-sans text-xs text-muted-foreground"
              numberOfLines={1}
            >
              컴포넌트를 실제 앱 화면처럼 조합한 AI 어시스턴트 데모
            </Text>
          </View>
          <ChevronRight size={15} color={mutedColor} />
        </Pressable>
      </Link>
    </View>
  );
});

export default function Index() {
  const icons = useIconColors();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const sections = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const matched = q
      ? INDEXED_CATALOG.filter((item) => item.searchText.includes(q)).map(
          (item) => item.entry,
        )
      : CATALOG;
    const grouped = new Map<string, CatalogEntry[]>();
    for (const entry of matched) {
      const list = grouped.get(entry.category);
      if (list) {
        list.push(entry);
      } else {
        grouped.set(entry.category, [entry]);
      }
    }
    return CATEGORIES.map((category) => ({
      title: category,
      data: grouped.get(category) ?? [],
    })).filter((section) => section.data.length > 0);
  }, [deferredQuery]);

  const keyExtractor = useCallback((entry: CatalogEntry) => entry.slug, []);

  const renderItem = useCallback(
    ({
      item,
      index,
      section,
    }: {
      item: CatalogEntry;
      index: number;
      section: { data: readonly CatalogEntry[] };
    }) => (
      <CatalogRow
        entry={item}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
        chevronColor={icons.muted}
      />
    ),
    [icons.muted],
  );

  const renderSectionHeader = useCallback(
    ({
      section,
    }: {
      section: { title?: string; data: readonly CatalogEntry[] };
    }) => (
      <View className="flex-row items-baseline justify-between pb-2 pt-6 px-1">
        <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {section.title}
        </Text>
        <Text className="font-sans text-xs text-muted-foreground/60">
          {section.data.length}종
        </Text>
      </View>
    ),
    [],
  );

  const clearQuery = useCallback(() => setQuery(""), []);

  const listHeader = useMemo(
    () => (
      <CatalogListHeader
        query={query}
        onChangeQuery={setQuery}
        mutedColor={icons.muted}
      />
    ),
    [query, icons.muted],
  );

  const listEmpty = useMemo(
    () => (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX size={32} color={icons.muted} />
          </EmptyMedia>
          <EmptyTitle>검색 결과가 없어요</EmptyTitle>
          <EmptyDescription>다른 이름으로 찾아 보세요.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onPress={clearQuery}>
            검색 지우기
          </Button>
        </EmptyContent>
      </Empty>
    ),
    [icons.muted, clearQuery],
  );

  const listFooter = useMemo(
    () => (
      <View className="pt-8">
        <Text className="text-center font-sans text-xs text-muted-foreground">
          UniKit v0.3 — Expo와 Next.js에서 같은 화면을 보고 있어요.
        </Text>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={SAFE_AREA_STYLE}>
      <View className="flex-1 bg-background">
        <SectionList
          style={SAFE_AREA_STYLE}
          className="w-full flex-1"
          contentContainerClassName="w-full max-w-2xl mx-auto px-4 pb-12"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={listFooter}
        />
      </View>
    </SafeAreaView>
  );
}
