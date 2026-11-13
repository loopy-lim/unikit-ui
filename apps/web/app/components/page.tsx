"use client";
/**
 * 쇼케이스 인덱스 — 검색·카테고리 필터 + 지연 로드(IntersectionObserver) 라이브 썸네일 그리드.
 * 화면 근처에 들어온 카드의 데모 청크만 동적 import 하여 초기 JS/마운트 비용을 최소화한다.
 */
import Link from "next/link";
import {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search, SearchX, X } from "lucide-react";
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
  Skeleton,
  cn,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import {
  catalog,
  catalogByCategory,
  type CatalogItem,
  type ShowcaseCategory,
} from "../../components/showcase/catalog";
import {
  getCachedDemo,
  loadDemo,
  type ShowcaseDemo,
} from "../../components/showcase/demos/loaders";

const ALL_GROUPS = catalogByCategory();

/** 썸네일 스트립(h-44 sm:h-40)보다 큰 데모 — 축소 배율.
 *  모바일(1열 넓은 카드) 기준값 + sm:(2~3열 좁은 카드) 오버라이드.
 *  세로는 calendar·card가 스트립 높이(176/160)를 넘지 않도록 맞춘 값. */
const THUMB_SCALE: Record<string, string> = {
  calendar: "scale-[0.53] sm:scale-[0.48]",
  card: "scale-[0.57] sm:scale-[0.4]",
  chart: "scale-[0.8] sm:scale-[0.6]",
  command: "sm:scale-[0.9]",
  empty: "scale-[0.55] sm:scale-[0.45]",
  "message-scroller": "scale-[0.85] sm:scale-[0.6]",
  sidebar: "scale-[0.9] sm:scale-[0.75]",
};

export default function ShowcaseIndexPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ShowcaseCategory | "all"
  >("all");
  const deferredQuery = useDeferredValue(query);

  const visibleGroups = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return ALL_GROUPS.filter(
      (group) => selectedCategory === "all" || group.category === selectedCategory,
    )
      .map((group) => ({
        ...group,
        items: q
          ? group.items.filter((item) =>
              `${item.name} ${item.title} ${item.description} ${group.label}`
                .toLowerCase()
                .includes(q),
            )
          : group.items,
      }))
      .filter((group) => group.items.length > 0);
  }, [deferredQuery, selectedCategory]);

  const totalVisible = useMemo(
    () => visibleGroups.reduce((acc, g) => acc + g.items.length, 0),
    [visibleGroups],
  );

  return (
    <View className="w-full space-y-10">
      <View className="space-y-4">
        <Text className="site-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Components
        </Text>
        <Text className="max-w-2xl font-sans text-[15px] leading-7 text-muted-foreground">
          UniKit {catalog.length}종 — 웹과 React Native에서 같은 소스로 렌더링해요.
          카드 미리보기는 전부 실제 컴포넌트예요. 컴포넌트를 골라 Preview와 사용
          코드를 확인하세요.
        </Text>
        <View className="flex flex-row flex-wrap items-center gap-2">
          <Badge variant="secondary">{catalog.length}종</Badge>
          <Badge variant="secondary">{ALL_GROUPS.length}개 카테고리</Badge>
          <Badge variant="secondary">웹 · React Native 동일 소스</Badge>
        </View>
      </View>

      {/* 검색 + 카테고리 필터 바 — 헤더(backdrop-blur) 바로 아래 고정.
          중첩 블러를 피하기 위해 불투명 배경(bg-background/95)을 쓴다. */}
      <View className="sticky top-16 z-30 -mx-4 space-y-3 border-b border-border/70 bg-background/95 px-4 py-3 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
        <View className="relative flex flex-row items-center">
          <Search className="pointer-events-none absolute left-3 z-10 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={`컴포넌트 검색 (${catalog.length}종 — 예: button, dialog, 폼)`}
            accessibilityLabel="컴포넌트 목록 검색"
            className="h-9 pl-9 pr-9 text-sm"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="검색어 지우기"
              className="site-focusable absolute right-2 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </View>
        <nav aria-label="컴포넌트 카테고리">
          <View className="site-scrollbar-none flex flex-row gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "site-focusable shrink-0 rounded-full border px-3 py-1 font-sans text-xs font-medium transition-colors",
                selectedCategory === "all"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
              )}
            >
              전체 {catalog.length}
            </button>
            {ALL_GROUPS.map((group) => {
              const active = selectedCategory === group.category;
              return (
                <button
                  key={group.category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory((prev) =>
                      prev === group.category ? "all" : group.category,
                    )
                  }
                  className={cn(
                    "site-focusable shrink-0 rounded-full border px-3 py-1 font-sans text-xs font-medium transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                  )}
                >
                  {group.label} {group.items.length}
                </button>
              );
            })}
          </View>
        </nav>
      </View>

      {totalVisible === 0 ? (
        <Empty className="rounded-xl border border-border/80 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX className="size-6 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>일치하는 컴포넌트가 없어요</EmptyTitle>
            <EmptyDescription>
              다른 이름이나 카테고리로 다시 찾아보세요.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                setQuery("");
                setSelectedCategory("all");
              }}
            >
              필터 초기화
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        visibleGroups.map((group) => (
          <section
            key={group.category}
            id={group.category}
            className="scroll-mt-44 space-y-5"
          >
            <View className="flex flex-row items-baseline gap-2.5">
              <Text className="font-sans text-xl font-semibold tracking-tight text-foreground">
                {group.label}
              </Text>
              <Text className="font-sans text-sm text-muted-foreground">
                {group.items.length}종
              </Text>
            </View>
            <View className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => (
                <CatalogCard key={item.name} item={item} />
              ))}
            </View>
          </section>
        ))
      )}
    </View>
  );
}

const LazyThumbnail = memo(function LazyThumbnail({ name }: { name: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [demo, setDemo] = useState<ShowcaseDemo | undefined>(() =>
    getCachedDemo(name),
  );
  const scale = THUMB_SCALE[name];

  useEffect(() => {
    const cached = getCachedDemo(name);
    if (cached) {
      setDemo(cached);
      return;
    }

    const node = hostRef.current;
    if (!node) return;

    let cancelled = false;
    const triggerLoad = () => {
      loadDemo(name)
        .then((loaded) => {
          if (!cancelled && loaded) setDemo(loaded);
        })
        .catch(() => {
          // 네트워크/청크 오류 시 플레이스홀더 유지
        });
    };

    if (typeof IntersectionObserver === "undefined") {
      triggerLoad();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          triggerLoad();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [name]);

  const Thumb = demo?.Demo;

  return (
    <div
      ref={hostRef}
      inert={true}
      className="pointer-events-none flex h-44 items-center justify-center overflow-hidden border-b border-border/60 bg-muted/25 p-4 sm:h-40"
    >
      {Thumb ? (
        <View className={cn("w-full", scale)}>
          <Thumb />
        </View>
      ) : (
        <View className="w-full max-w-[180px] space-y-2.5 opacity-60">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </View>
      )}
    </div>
  );
});

const CatalogCard = memo(function CatalogCard({ item }: { item: CatalogItem }) {
  const { name, title, description } = item;

  return (
    <View className="site-card group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-background hover:border-foreground/25 hover:bg-accent">
      <LazyThumbnail name={name} />
      <View className="flex flex-1 flex-col gap-2 p-5">
        <View className="flex flex-row items-center justify-between gap-2">
          <Text className="font-sans text-[15px] font-medium text-foreground">
            {title}
          </Text>
          <Text
            aria-hidden
            className="font-sans text-sm text-muted-foreground opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
          >
            →
          </Text>
        </View>
        <Text className="font-sans text-sm leading-6 text-muted-foreground">
          {description}
        </Text>
      </View>
      <Link
        href={`/components/${name}`}
        className="site-focusable absolute inset-0"
        aria-label={`${title} 문서 보기`}
      />
    </View>
  );
});
