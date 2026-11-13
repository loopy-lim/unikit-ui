"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge, Skeleton } from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import {
  CATEGORY_LABEL,
  catalog,
  getCatalogItem,
  type CatalogItem,
} from "../../../components/showcase/catalog";
import {
  getCachedDemo,
  loadDemo,
  type ShowcaseDemo,
} from "../../../components/showcase/demos/loaders";
import {
  DemoPanel,
  ExampleBlock,
  InstallSnippet,
} from "../../../components/showcase/docs-shell";

const FORM_LIKE_COMPONENTS = new Set([
  "input",
  "textarea",
  "field",
  "form",
  "card",
  "alert",
  "progress",
  "table",
  "item",
  "switch",
  "checkbox",
  "radio-group",
  "slider",
  "input-group",
  "input-otp",
  "message",
  "message-scroller",
  "scroll-area",
  "resizable",
  "sidebar",
  "carousel",
  "accordion",
  "collapsible",
  "tabs",
  "command",
  "separator",
  "skeleton",
]);

export function ComponentDoc({ name }: { name: string }) {
  const item = getCatalogItem(name) as CatalogItem;
  const [demo, setDemo] = useState<ShowcaseDemo | undefined>(() =>
    getCachedDemo(name),
  );
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<"preview" | "code">("preview");

  useEffect(() => {
    const cached = getCachedDemo(name);
    if (cached) {
      setDemo(cached);
      setLoadError(false);
      return;
    }

    let cancelled = false;
    setDemo(undefined);
    setLoadError(false);

    loadDemo(name)
      .then((loaded) => {
        if (cancelled) return;
        if (loaded) {
          setDemo(loaded);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  const neighbors = useMemo(() => {
    const idx = catalog.findIndex((c) => c.name === name);
    return {
      prev: idx > 0 ? catalog[idx - 1] : null,
      next: idx >= 0 && idx < catalog.length - 1 ? catalog[idx + 1] : null,
    };
  }, [name]);

  const Demo = demo?.Demo;
  const examples = demo?.examples ?? [];
  const formLike = FORM_LIKE_COMPONENTS.has(name);

  return (
    <View className="flex w-full flex-row items-start gap-10">
      <View className="min-w-0 flex-1 max-w-4xl space-y-12">
        <View className="space-y-3">
          <View className="flex flex-row items-center gap-1.5">
            <Link
              href="/components"
              className="site-focusable font-sans text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              Components
            </Link>
            <Text className="font-sans text-sm text-border">/</Text>
            <Text className="font-sans text-sm text-muted-foreground">
              {item.title}
            </Text>
          </View>
          <Text className="site-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {item.title}
          </Text>
          <Text className="max-w-2xl font-sans text-[15px] leading-7 text-muted-foreground">
            {item.description}
          </Text>
          <View className="flex flex-row flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">{CATEGORY_LABEL[item.category]}</Badge>
            <Badge variant="outline">웹 · RN 공용</Badge>
            <a
              href={`/r/${item.name}.json`}
              target="_blank"
              rel="noreferrer"
              className="site-focusable inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-0.5 font-sans text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
            >
              <span>Registry JSON</span>
              <ExternalLink className="size-3" />
            </a>
          </View>
        </View>

        <section id="preview" className="scroll-mt-24">
          {loadError ? (
            <View className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
              <Text className="font-sans text-sm text-destructive">
                데모를 불러오지 못했어요: {name}
              </Text>
            </View>
          ) : Demo && demo ? (
            <DemoPanel
              tab={tab}
              onChange={setTab}
              align={formLike ? "start" : "center"}
              preview={<Demo />}
              code={demo.code}
            />
          ) : (
            <View className="overflow-hidden rounded-xl border border-border bg-background">
              <View className="flex h-11 flex-row items-center border-b border-border bg-muted/20 px-4">
                <Skeleton className="h-5 w-28 rounded-md" />
              </View>
              <View className="flex min-h-44 items-center justify-center p-8">
                <View className="w-full max-w-sm space-y-3">
                  <Skeleton className="h-5 w-1/2 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </View>
              </View>
            </View>
          )}
        </section>

        <InstallSnippet name={item.name} />

        {examples.length > 0 ? (
          <section
            id="examples"
            className="scroll-mt-24 space-y-10 border-t border-border/80 pt-10"
          >
            <Text className="font-sans text-xl font-semibold tracking-tight text-foreground">
              Examples
            </Text>
            {examples.map((example) => {
              const ExampleDemo = example.Demo;
              return (
                <ExampleBlock
                  key={example.title}
                  title={example.title}
                  description={example.description}
                  align={formLike ? "start" : "center"}
                >
                  <ExampleDemo />
                </ExampleBlock>
              );
            })}
          </section>
        ) : null}

        <View className="flex flex-row flex-wrap items-center justify-between gap-4 border-t border-border/80 pt-8">
          {neighbors.prev ? (
            <Link
              href={`/components/${neighbors.prev.name}`}
              className="site-focusable group rounded-lg border border-border/80 px-4 py-3 transition-colors hover:border-foreground/25 hover:bg-accent"
            >
              {/* Text는 웹에서 <span>(inline)이라 block 지정 없으면 라벨과
                  제목이 한 줄에 붙고 mt-0.5도 무시된다 — 세로 쌓기 필수 */}
              <Text className="block font-sans text-xs text-muted-foreground">
                이전
              </Text>
              <Text className="mt-0.5 block font-sans text-sm font-medium text-foreground">
                ← {neighbors.prev.title}
              </Text>
            </Link>
          ) : (
            <View />
          )}
          {neighbors.next ? (
            <Link
              href={`/components/${neighbors.next.name}`}
              className="site-focusable group ml-auto rounded-lg border border-border/80 px-4 py-3 text-right transition-colors hover:border-foreground/25 hover:bg-accent"
            >
              <Text className="block font-sans text-xs text-muted-foreground">
                다음
              </Text>
              <Text className="mt-0.5 block font-sans text-sm font-medium text-foreground">
                {neighbors.next.title} →
              </Text>
            </Link>
          ) : (
            <View />
          )}
        </View>
      </View>

      <aside className="hidden w-44 shrink-0 xl:sticky xl:top-24 xl:block">
        <View className="space-y-2.5 border-l border-border/70 pl-4">
          <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On This Page
          </Text>
          <View className="space-y-1.5">
            <a
              href="#preview"
              className="site-focusable block font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Preview
            </a>
            <a
              href="#installation"
              className="site-focusable block font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Installation
            </a>
            {examples.length > 0 ? (
              <a
                href="#examples"
                className="site-focusable block font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Examples ({examples.length})
              </a>
            ) : null}
          </View>
        </View>
      </aside>
    </View>
  );
}
