"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Text, View } from "@unikit-bridge/ui/primitives";

import {
  catalog,
  getCatalogItem,
  type CatalogItem,
} from "../../../components/showcase/catalog";
import { demos } from "../../../components/showcase/demos";
import {
  CodeBlock,
  DocsTabs,
  InstallSnippet,
  PreviewFrame,
} from "../../../components/showcase/docs-shell";

export function ComponentDoc({ name }: { name: string }) {
  const item = getCatalogItem(name) as CatalogItem;
  const demo = demos[name];
  const [tab, setTab] = useState<"preview" | "code">("preview");

  const neighbors = useMemo(() => {
    const idx = catalog.findIndex((c) => c.name === name);
    return {
      prev: idx > 0 ? catalog[idx - 1] : null,
      next: idx >= 0 && idx < catalog.length - 1 ? catalog[idx + 1] : null,
    };
  }, [name]);

  if (!demo) {
    return (
      <Text className="font-sans text-sm text-destructive">
        데모를 찾을 수 없어요: {name}
      </Text>
    );
  }

  const Demo = demo.Demo;

  return (
    <View className="w-full max-w-3xl space-y-10 pb-8">
      <View className="space-y-3">
        <View className="flex flex-row items-center gap-1.5">
          <Link
            href="/showcase"
            className="site-focusable font-sans text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            Components
          </Link>
          <Text className="font-sans text-sm text-border">/</Text>
          <Text className="font-sans text-sm text-muted-foreground">
            {item.title}
          </Text>
        </View>
        <Text className="site-display text-4xl font-semibold tracking-tight text-foreground">
          {item.title}
        </Text>
        <Text className="max-w-2xl font-sans text-[15px] leading-7 text-muted-foreground">
          {item.description}
        </Text>
      </View>

      <View className="space-y-5">
        <DocsTabs tab={tab} onChange={setTab} />
        {tab === "preview" ? (
          <PreviewFrame>
            <Demo />
          </PreviewFrame>
        ) : (
          <CodeBlock code={demo.code} />
        )}
      </View>

      <InstallSnippet name={item.name} />

      <View className="flex flex-row flex-wrap items-center justify-between gap-4 border-t border-border/80 pt-8">
        {neighbors.prev ? (
          <Link
            href={`/showcase/${neighbors.prev.name}`}
            className="site-focusable group rounded-lg border border-border/80 px-4 py-3 transition-colors hover:border-foreground/25 hover:bg-muted/30"
          >
            <Text className="font-sans text-xs text-muted-foreground">이전</Text>
            <Text className="mt-0.5 font-sans text-sm font-medium text-foreground">
              ← {neighbors.prev.title}
            </Text>
          </Link>
        ) : (
          <View />
        )}
        {neighbors.next ? (
          <Link
            href={`/showcase/${neighbors.next.name}`}
            className="site-focusable group ml-auto rounded-lg border border-border/80 px-4 py-3 text-right transition-colors hover:border-foreground/25 hover:bg-muted/30"
          >
            <Text className="font-sans text-xs text-muted-foreground">다음</Text>
            <Text className="mt-0.5 font-sans text-sm font-medium text-foreground">
              {neighbors.next.title} →
            </Text>
          </Link>
        ) : (
          <View />
        )}
      </View>
    </View>
  );
}
