"use client";
/**
 * 쇼케이스 문서 셸 — 여유 있는 패딩·사이드바 구분·Preview 스테이지.
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
        <View className="mx-auto flex w-full max-w-7xl flex-col md:flex-row">
          <DocsSidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
          <DocsMain>{children}</DocsMain>
        </View>
      </View>
    </DocsProviders>
  );
}

function DocsMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <View
      key={pathname}
      className="site-docs-enter min-w-0 flex-1 px-6 pb-20 pt-8 sm:px-8 lg:px-10 lg:pt-10"
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
  const pathname = usePathname();
  const onComponents = pathname.startsWith("/showcase");

  return (
    <View className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <View className="mx-auto flex h-16 w-full max-w-7xl flex-row items-center justify-between gap-4 px-6 sm:px-8">
        <View className="flex min-w-0 flex-row items-center gap-4">
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
            <Text className="site-display text-xl font-semibold tracking-tight text-foreground">
              UniKit
            </Text>
          </Link>
          <View className="hidden h-4 w-px bg-border sm:flex" />
          <View className="hidden flex-row items-center gap-4 sm:flex">
            <Link
              href="/"
              className="site-focusable font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              소개
            </Link>
            <Link
              href="/showcase"
              className={
                onComponents
                  ? "site-focusable font-sans text-sm font-medium text-foreground"
                  : "site-focusable font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              Components
            </Link>
            <Link
              href="/showcase/kitchen-sink"
              className="site-focusable font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Kitchen sink
            </Link>
          </View>
        </View>
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
          ? "block w-full shrink-0 border-b border-border px-6 py-6 md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)] md:w-60 md:overflow-y-auto md:border-b-0 md:border-r md:border-border/80 md:px-5 md:py-8 lg:w-64 lg:px-6"
          : "hidden w-full shrink-0 border-b border-border px-6 py-6 md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)] md:w-60 md:overflow-y-auto md:border-b-0 md:border-r md:border-border/80 md:px-5 md:py-8 lg:w-64 lg:px-6"
      }
    >
      <Link
        href="/showcase"
        onClick={onNavigate}
        className={
          pathname === "/showcase"
            ? "site-focusable site-nav-link mb-6 block rounded-md bg-muted px-3 py-2 font-sans text-sm font-medium text-foreground"
            : "site-focusable site-nav-link mb-6 block rounded-md px-3 py-2 font-sans text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        }
      >
        전체 목록
      </Link>
      {groups.map((group) => (
        <View key={group.category} className="mb-7">
          <Text className="mb-2.5 px-3 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
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
                      ? "site-focusable site-nav-link block rounded-md bg-muted px-3 py-2 font-sans text-sm font-medium text-foreground"
                      : "site-focusable site-nav-link block rounded-md px-3 py-2 font-sans text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
    <View className="site-preview-enter flex min-h-48 items-center justify-center rounded-xl border border-border bg-muted/20 px-6 py-10 sm:min-h-52 sm:px-10 sm:py-12">
      <View className="flex w-full max-w-xl flex-col items-start">{children}</View>
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
    <View className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
      <View className="flex flex-row items-center justify-between border-b border-border/80 px-4 py-2.5">
        <Text className="font-sans text-xs text-muted-foreground">Usage</Text>
        <Button variant="ghost" size="sm" onPress={copy}>
          {copied ? "복사됨" : "복사"}
        </Button>
      </View>
      <pre className="site-mono overflow-x-auto px-4 py-5 text-[13px] leading-6 text-foreground">
        <code>{code}</code>
      </pre>
    </View>
  );
}

export function InstallSnippet({ name }: { name: string }) {
  const cmd = `bunx shadcn@latest add https://ui.unikit.ll3.kr/r/${name}.json -y`;
  return (
    <View className="space-y-3">
      <Text className="font-sans text-base font-semibold tracking-tight text-foreground">
        Installation
      </Text>
      <CodeBlock code={cmd} />
    </View>
  );
}

export function DocsTabs({
  tab,
  onChange,
}: {
  tab: "preview" | "code";
  onChange: (next: "preview" | "code") => void;
}) {
  return (
    <View className="flex flex-row gap-6 border-b border-border">
      {(
        [
          ["preview", "Preview"],
          ["code", "Code"],
        ] as const
      ).map(([id, label]) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={
              active
                ? "site-focusable -mb-px border-b-2 border-foreground pb-2.5 font-sans text-sm font-medium text-foreground"
                : "site-focusable -mb-px border-b-2 border-transparent pb-2.5 font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {label}
          </button>
        );
      })}
    </View>
  );
}
