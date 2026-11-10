"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import {
  catalog,
  getCatalogItem,
  type CatalogItem,
} from "../../../components/showcase/catalog";
import { demos } from "../../../components/showcase/demos";
import {
  CodeBlock,
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
    <View className="space-y-8 pb-12">
      <View className="space-y-2">
        <Text className="font-sans text-xs text-muted-foreground">
          <Link href="/showcase" className="site-focusable hover:underline">
            Components
          </Link>
          {" / "}
          {item.title}
        </Text>
        <Text className="site-display text-3xl font-semibold tracking-tight text-foreground">
          {item.title}
        </Text>
        <Text className="max-w-2xl font-sans text-base text-muted-foreground">
          {item.description}
        </Text>
      </View>

      <View className="space-y-3">
        <View className="flex flex-row gap-2">
          <Button
            variant={tab === "preview" ? "default" : "outline"}
            size="sm"
            onPress={() => setTab("preview")}
          >
            Preview
          </Button>
          <Button
            variant={tab === "code" ? "default" : "outline"}
            size="sm"
            onPress={() => setTab("code")}
          >
            Code
          </Button>
        </View>
        {tab === "preview" ? (
          <PreviewFrame>
            <Demo />
          </PreviewFrame>
        ) : (
          <CodeBlock code={demo.code} />
        )}
      </View>

      <InstallSnippet name={item.name} />

      <View className="flex flex-row flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        {neighbors.prev ? (
          <Link
            href={`/showcase/${neighbors.prev.name}`}
            className="site-focusable font-sans text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← {neighbors.prev.title}
          </Link>
        ) : (
          <View />
        )}
        {neighbors.next ? (
          <Link
            href={`/showcase/${neighbors.next.name}`}
            className="site-focusable font-sans text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {neighbors.next.title} →
          </Link>
        ) : (
          <View />
        )}
      </View>
    </View>
  );
}
