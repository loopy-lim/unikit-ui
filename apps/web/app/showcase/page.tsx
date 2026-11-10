"use client";
/**
 * 쇼케이스 인덱스 — shadcn Components 그리드 + 카테고리 앵커.
 */
import Link from "next/link";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { catalog, catalogByCategory } from "../../components/showcase/catalog";

export default function ShowcaseIndexPage() {
  const groups = catalogByCategory();

  return (
    <View className="space-y-10 pb-8">
      <View className="space-y-3">
        <Text className="site-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Components
        </Text>
        <Text className="max-w-2xl font-sans text-base text-muted-foreground">
          UniKit {catalog.length}종 — 웹과 React Native에서 같은 소스로 렌더링해요.
          컴포넌트를 골라 Preview와 사용 코드를 확인하세요.
        </Text>
        <Link
          href="/showcase/kitchen-sink"
          className="site-focusable inline-flex font-sans text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          한 페이지 전체 스크롤 데모 →
        </Link>
      </View>

      <View className="flex flex-row flex-wrap gap-2">
        {groups.map((group) => (
          <a
            key={group.category}
            href={`#${group.category}`}
            className="site-focusable rounded-md border border-border px-3 py-1.5 font-sans text-xs text-foreground hover:bg-muted"
          >
            {group.label}
          </a>
        ))}
      </View>

      {groups.map((group) => (
        <section
          key={group.category}
          id={group.category}
          className="scroll-mt-20 space-y-4"
        >
          <Text className="font-sans text-lg font-semibold text-foreground">
            {group.label}
          </Text>
          <View className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <Link
                key={item.name}
                href={`/showcase/${item.name}`}
                className="site-focusable group rounded-lg border border-border p-4 transition-colors hover:border-foreground/30 hover:bg-muted/40"
              >
                <Text className="font-sans text-sm font-medium text-foreground group-hover:underline">
                  {item.title}
                </Text>
                <Text className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </Text>
              </Link>
            ))}
          </View>
        </section>
      ))}
    </View>
  );
}
