"use client";
/**
 * 쇼케이스 인덱스 — 카테고리 섹션 + 여유 있는 카드 그리드.
 */
import Link from "next/link";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { catalog, catalogByCategory } from "../../components/showcase/catalog";

export default function ShowcaseIndexPage() {
  const groups = catalogByCategory();

  return (
    <View className="w-full space-y-12">
      <View className="space-y-4">
        <Text className="site-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Components
        </Text>
        <Text className="max-w-2xl font-sans text-[15px] leading-7 text-muted-foreground">
          UniKit {catalog.length}종 — 웹과 React Native에서 같은 소스로 렌더링해요.
          컴포넌트를 골라 Preview와 사용 코드를 확인하세요.
        </Text>
        <View className="flex flex-row flex-wrap items-center gap-x-5 gap-y-2 pt-1">
          {groups.map((group) => (
            <a
              key={group.category}
              href={`#${group.category}`}
              className="site-focusable font-sans text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {group.label}
            </a>
          ))}
        </View>
      </View>

      {groups.map((group) => (
        <section
          key={group.category}
          id={group.category}
          className="scroll-mt-24 space-y-5"
        >
          <Text className="font-sans text-xl font-semibold tracking-tight text-foreground">
            {group.label}
          </Text>
          <View className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <Link
                key={item.name}
                href={`/showcase/${item.name}`}
                className="site-focusable site-card group flex flex-col rounded-xl border border-border/80 bg-background p-5 transition-colors hover:border-foreground/25 hover:bg-muted/30"
              >
                <Text className="font-sans text-[15px] font-medium text-foreground">
                  {item.title}
                </Text>
                <Text className="mt-2 font-sans text-sm leading-6 text-muted-foreground">
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
