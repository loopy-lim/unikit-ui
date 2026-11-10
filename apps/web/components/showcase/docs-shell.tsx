"use client";
/**
 * 쇼케이스 문서 셸 — shadcn docs 식 사이드바 TOC + 헤더 테마 토글.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, Toaster } from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";
import { UnikitThemeProvider, useUnikitTheme } from "@unikit-bridge/ui";

import { catalogByCategory } from "./catalog";

export function DocsProviders({ children }: { children: ReactNode }) {
  return (
    <UnikitThemeProvider>
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </UnikitThemeProvider>
  );
}

export function DocsShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <DocsProviders>
      <View className="min-h-screen bg-background">
        <DocsHeader onToggleNav={() => setNavOpen((v) => !v)} navOpen={navOpen} />
        <View className="mx-auto flex w-full max-w-6xl flex-col gap-0 px-4 pb-16 md:flex-row md:gap-10">
          <DocsSidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
          <DocsMain>{children}</DocsMain>
        </View>
      </View>
    </DocsProviders>
  );
}

/** 경로가 바뀔 때마다 본문을 다시 마운트해 진입 모션을 재생한다. */
function DocsMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <View
      key={pathname}
      className="site-docs-enter min-w-0 flex-1 pt-6 md:pt-8"
    >
      {children}
    </View>
  );
}

function DocsHeader({
  onToggleNav,
  navOpen,
}: {
  onToggleNav: () => void;
  navOpen: boolean;
}) {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();

  return (
    <View className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <View className="mx-auto flex h-14 w-full max-w-6xl flex-row items-center justify-between gap-3 px-4">
        <View className="flex min-w-0 flex-row items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onPress={onToggleNav}
            accessibilityLabel={navOpen ? "목차 닫기" : "목차 열기"}
          >
            {navOpen ? "닫기" : "목차"}
          </Button>
          <Link href="/" className="site-focusable shrink-0">
            <Text className="site-display text-lg font-semibold text-foreground">
              UniKit
            </Text>
          </Link>
          <Text className="hidden font-sans text-sm text-muted-foreground sm:flex">
            Components
          </Text>
        </View>
        <View className="flex flex-row items-center gap-2">
          <Link
            href="/showcase/kitchen-sink"
            className="site-focusable hidden font-sans text-xs text-muted-foreground underline-offset-2 hover:underline sm:flex"
          >
            전체 스크롤
          </Link>
          <Button
            variant="outline"
            size="sm"
            onPress={toggleColorScheme}
            accessibilityLabel="색 테마 전환"
          >
            {colorScheme === "light" ? "다크" : "라이트"}
          </Button>
        </View>
      </View>
    </View>
  );
}

function DocsSidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const groups = catalogByCategory();

  return (
    <View
      className={
        open
          ? "block w-full shrink-0 border-b border-border pb-4 pt-4 md:sticky md:top-14 md:block md:h-[calc(100dvh-3.5rem)] md:w-56 md:overflow-y-auto md:border-b-0 md:pb-10 md:pt-8"
          : "hidden w-full shrink-0 border-b border-border pb-4 pt-4 md:sticky md:top-14 md:block md:h-[calc(100dvh-3.5rem)] md:w-56 md:overflow-y-auto md:border-b-0 md:pb-10 md:pt-8"
      }
    >
      <Link
        href="/showcase"
        onClick={onNavigate}
        className="site-focusable mb-4 block font-sans text-sm font-medium text-foreground"
      >
        전체 목록
      </Link>
      {groups.map((group) => (
        <View key={group.category} className="mb-5">
          <Text className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </Text>
          <View className="space-y-0.5">
            {group.items.map((item) => {
              const href = `/showcase/${item.name}`;
              const active = pathname === href;
              return (
                <Link
                  key={item.name}
                  href={href}
                  onClick={onNavigate}
                  className={
                    active
                      ? "site-focusable site-nav-link block rounded-md bg-muted px-2 py-1.5 font-sans text-sm font-medium text-foreground"
                      : "site-focusable site-nav-link block rounded-md px-2 py-1.5 font-sans text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }
                >
                  {item.title}
                </Link>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

export function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <View className="site-preview-enter flex min-h-40 items-center justify-center rounded-lg border border-border bg-background p-8">
      <View className="w-full max-w-lg">{children}</View>
    </View>
  );
}

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <View className="relative overflow-hidden rounded-lg border border-border bg-muted/40">
      <View className="flex flex-row items-center justify-between border-b border-border px-3 py-2">
        <Text className="font-sans text-xs text-muted-foreground">Usage</Text>
        <Button variant="ghost" size="sm" onPress={copy}>
          {copied ? "복사됨" : "복사"}
        </Button>
      </View>
      <pre className="site-mono overflow-x-auto p-4 text-xs leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </View>
  );
}

export function InstallSnippet({ name }: { name: string }) {
  const cmd = `bunx shadcn@latest add https://ui.unikit.ll3.kr/r/${name}.json -y`;
  return (
    <View className="space-y-2">
      <Text className="font-sans text-sm font-medium text-foreground">
        Installation
      </Text>
      <CodeBlock code={cmd} />
    </View>
  );
}
