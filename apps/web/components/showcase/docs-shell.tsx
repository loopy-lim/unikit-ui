"use client";
/**
 * 쇼케이스 문서 셸 — 헤더·목차(md+ 사이드바 / 모바일 드로어)·Preview 스테이지.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  cn,
  useUnikitTheme,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { SiteBrand } from "../site/brand";
import { ThemeCustomizer } from "../site/site-theme";
import { catalogByCategory } from "./catalog";
import { CommandSearchTrigger } from "./command-search";

const CATALOG_GROUPS = catalogByCategory();

export function DocsProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DocsShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <View className="site-docs-canvas">
      <DocsHeader>
        <DocsMobileNav open={navOpen} onOpenChange={setNavOpen} />
      </DocsHeader>
      <View className="mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 md:flex-row lg:px-8">
        <DocsSidebar />
        <DocsMain>{children}</DocsMain>
      </View>
    </View>
  );
}

function DocsMain({ children }: { children: ReactNode }) {
  return (
    <View className="min-w-0 flex-1 pb-16 pt-6 sm:pt-8 md:pl-8 lg:pl-10">
      {children}
    </View>
  );
}

function DocsHeader({ children }: { children: ReactNode }) {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  const pathname = usePathname();
  const onComponents = pathname.startsWith("/components");
  const onBlocks = pathname.startsWith("/blocks");

  function navLinkClass(active: boolean) {
    return active
      ? "site-focusable font-sans text-sm font-medium text-foreground"
      : "site-focusable font-sans text-sm text-muted-foreground transition-colors hover:text-foreground";
  }

  return (
    <View className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <View className="mx-auto flex h-16 w-full max-w-7xl flex-row items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <View className="flex min-w-0 flex-row items-center gap-3 sm:gap-4">
          {children}
          <SiteBrand
            className="shrink-0"
            wordmarkClassName="text-xl"
            markSize={30}
          />
          <View className="hidden h-4 w-px bg-border sm:flex" />
          <View className="hidden flex-row items-center gap-4 sm:flex">
            <Link href="/" className={navLinkClass(pathname === "/")}>
              소개
            </Link>
            <Link href="/components" className={navLinkClass(onComponents)}>
              Components
            </Link>
            <Link href="/blocks" className={navLinkClass(onBlocks)}>
              Blocks
            </Link>
            <Link
              href="/components/kitchen-sink"
              className={navLinkClass(pathname === "/components/kitchen-sink")}
            >
              Kitchen sink
            </Link>
          </View>
        </View>
        <View className="flex flex-row items-center gap-2 sm:gap-3">
          <CommandSearchTrigger />
          <ThemeCustomizer />
          <a
            href="https://github.com/loopy-lim/UniKit"
            aria-label="GitHub (새 창에서 열림)"
            className="site-focusable hidden font-sans text-sm text-muted-foreground transition-colors hover:text-foreground lg:inline"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
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

function docsNavLinkClass(active: boolean) {
  return active
    ? "site-focusable site-nav-link block rounded-md bg-muted px-3 py-2 font-sans text-sm font-medium text-foreground"
    : "site-focusable site-nav-link block rounded-md px-3 py-2 font-sans text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground";
}

/** 카탈로그 목차 본문 — 사이드바(md+)·드로어 공용 마크업 */
const DocsNavGroups = memo(function DocsNavGroups({
  pathname,
  onNavigate,
  showAllLink = true,
}: {
  pathname: string;
  onNavigate?: () => void;
  showAllLink?: boolean;
}) {
  return (
    <>
      {showAllLink ? (
        <Link
          href="/components"
          onClick={onNavigate}
          className={cn("mb-5", docsNavLinkClass(pathname === "/components"))}
        >
          전체 목록
        </Link>
      ) : null}
      {CATALOG_GROUPS.map((group) => (
        <View key={group.category} className="mb-6">
          <Text className="mb-2.5 px-3 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {group.label}
          </Text>
          <View className="space-y-0.5">
            {group.items.map((item) => {
              const href = `/components/${item.name}`;
              return (
                <Link
                  key={item.name}
                  href={href}
                  onClick={onNavigate}
                  className={docsNavLinkClass(pathname === href)}
                >
                  {item.title}
                </Link>
              );
            })}
          </View>
        </View>
      ))}
    </>
  );
});

/** md+ 고정 사이드바 — 모바일은 DocsMobileNav 드로어가 담당 */
function DocsSidebar() {
  const pathname = usePathname();

  return (
    <View className="hidden w-full shrink-0 md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)] md:w-60 md:overflow-y-auto md:border-r md:border-border/80 md:py-8 md:pr-6 lg:w-64 lg:pr-8">
      <DocsNavGroups pathname={pathname} />
    </View>
  );
}

/** 모바일(<md) 목차 드로어 — 패키지 Sheet(side="left"). 포털·백드롭·ESC·스크롤
 *  잠금·포커스 복귀는 ModalOverlay가 제공. 제목 행은 고정하고 목록만 스크롤해야
 *  내장 X 닫기 버튼(카드 우상단 absolute)이 스크롤에 따라가지 않는다. */
function DocsMobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();

  // 열림 시 현재 문서 링크를 목록 가운데로 끌어온다.
  useEffect(() => {
    if (!open) return;
    const raf = window.requestAnimationFrame(() => {
      document
        .querySelector('div[role="dialog"] a.bg-muted')
        ?.scrollIntoView({ block: "center" });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [open, pathname]);

  return (
    // Sheet 루트는 항상 View 래퍼를 렌더 — 트리거만 숨기면 빈 플렉스 아이템이
    // 남아 간격이 밀린다. 래퍼째 md:hidden(드로어 본문은 포털이라 영향 없음).
    <Sheet open={open} onOpenChange={onOpenChange} className="md:hidden">
      <SheetTrigger
        /* 제어형 — 트리거는 열기만 가능. 라벨은 고정, 상태는 aria-expanded */
        accessibilityLabel="목차 열기"
        className="site-focusable flex size-9 shrink-0 items-center justify-center rounded-md text-foreground web:hover:bg-muted md:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 p-0">
        <View className="shrink-0 border-b border-border px-4 py-3.5 pr-14">
          <SheetTitle className="text-base">목차</SheetTitle>
        </View>
        <View className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {(
            [
              ["/", "소개"],
              ["/components", "Components"],
              ["/blocks", "Blocks"],
              ["/components/kitchen-sink", "Kitchen sink"],
            ] as const
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => onOpenChange(false)}
              className={docsNavLinkClass(pathname === href)}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/loopy-lim/UniKit"
            aria-label="GitHub (새 창에서 열림)"
            onClick={() => onOpenChange(false)}
            className={docsNavLinkClass(false)}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <View className="my-3 h-px bg-border" />
          <DocsNavGroups
            pathname={pathname}
            onNavigate={() => onOpenChange(false)}
            showAllLink={false}
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}

export function PreviewFrame({
  children,
  align = "center",
}: {
  children: ReactNode;
  align?: "center" | "start";
}) {
  return (
    <View
      className={
        align === "start"
          ? "site-preview-stage flex min-h-44 items-start justify-start rounded-xl border border-border p-6 sm:p-8"
          : "site-preview-stage flex min-h-44 items-center justify-center rounded-xl border border-border p-6 sm:p-8"
      }
    >
      <View
        className={
          align === "start"
            ? "flex w-full max-w-xl flex-col items-stretch"
            : "flex w-full max-w-xl flex-col items-center"
        }
      >
        {children}
      </View>
    </View>
  );
}

/** shadcn Examples / Seed 변형 섹션 — 제목 + Preview */
export function ExampleBlock({
  title,
  description,
  children,
  align = "center",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  align?: "center" | "start";
}) {
  return (
    <View className="space-y-3">
      <View className="space-y-1">
        <Text className="font-sans text-lg font-semibold tracking-tight text-foreground">
          {title}
        </Text>
        {description ? (
          <Text className="font-sans text-sm leading-6 text-muted-foreground">
            {description}
          </Text>
        ) : null}
      </View>
      <PreviewFrame align={align}>{children}</PreviewFrame>
    </View>
  );
}

export function CodeBlock({
  code,
  label = "Usage",
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      setFailed(true);
      window.setTimeout(() => setFailed(false), 1500);
    }
  }

  return (
    <View className="relative overflow-hidden rounded-xl border border-border bg-background">
      <View className="flex flex-row items-center justify-between border-b border-border/80 px-4 py-2">
        <Text className="font-sans text-xs font-medium text-muted-foreground">{label}</Text>
        <Button variant="ghost" size="sm" onPress={copy}>
          {failed ? "복사 실패" : copied ? "복사됨" : "복사"}
        </Button>
      </View>
      <pre className="site-mono overflow-x-auto bg-muted/30 p-4 sm:p-5 text-[13px] leading-6 text-foreground">
        <code>{code}</code>
      </pre>
    </View>
  );
}

type PackageManager = "bun" | "npm" | "pnpm";

export function InstallSnippet({ name }: { name: string }) {
  const [pm, setPm] = useState<PackageManager>("bun");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const runner =
    pm === "bun" ? "bunx --bun" : pm === "pnpm" ? "pnpm dlx" : "npx";
  const cmd = `${runner} shadcn@latest add https://ui.ll3.kr/r/${name}.json -y`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(cmd);
      setFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      setFailed(true);
      window.setTimeout(() => setFailed(false), 1500);
    }
  }

  return (
    <section id="installation" className="scroll-mt-24 space-y-3">
      <Text className="font-sans text-base font-semibold tracking-tight text-foreground">
        Installation
      </Text>
      <View className="relative overflow-hidden rounded-xl border border-border bg-background">
        <View className="flex flex-row items-center justify-between border-b border-border/80 px-3 py-2">
          <View className="flex flex-row items-center gap-1">
            {(["bun", "npm", "pnpm"] as const).map((item) => {
              const active = pm === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPm(item)}
                  className={
                    active
                      ? "site-focusable rounded-md bg-muted px-2.5 py-1 font-sans text-xs font-medium text-foreground"
                      : "site-focusable rounded-md px-2.5 py-1 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {item}
                </button>
              );
            })}
          </View>
          <Button variant="ghost" size="sm" onPress={copy}>
            {failed ? "복사 실패" : copied ? "복사됨" : "복사"}
          </Button>
        </View>
        <pre className="site-mono overflow-x-auto bg-muted/30 p-4 sm:p-5 text-[13px] leading-6 text-foreground">
          <code>{cmd}</code>
        </pre>
      </View>
    </section>
  );
}

/** Seed식 미리보기 카드 — 탭이 카드 안에 있음 */
export function DemoPanel({
  tab,
  onChange,
  preview,
  code,
  align = "center",
}: {
  tab: "preview" | "code";
  onChange: (next: "preview" | "code") => void;
  preview: ReactNode;
  code: string;
  align?: "center" | "start";
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-background">
      <View className="flex flex-row items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2">
        <View className="flex flex-row gap-1">
          {(
            [
              ["preview", "미리보기"],
              ["code", "코드"],
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
                    ? "site-focusable rounded-md bg-background px-3 py-1.5 font-sans text-xs font-medium text-foreground"
                    : "site-focusable rounded-md px-3 py-1.5 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {label}
              </button>
            );
          })}
        </View>
        <Button variant="ghost" size="sm" onPress={copyCode}>
          {copied ? "복사됨" : "코드 복사"}
        </Button>
      </View>
      {tab === "preview" ? (
        <View
          className={
            align === "start"
              ? "site-preview-stage flex min-h-44 items-start justify-start p-6 sm:p-8"
              : "site-preview-stage flex min-h-44 items-center justify-center p-6 sm:p-8"
          }
        >
          <View
            className={
              align === "start"
                ? "flex w-full max-w-xl flex-col items-stretch"
                : "flex w-full max-w-xl flex-col items-center"
            }
          >
            {preview}
          </View>
        </View>
      ) : (
        <pre className="site-mono overflow-x-auto bg-muted/30 p-4 sm:p-5 text-[13px] leading-6 text-foreground">
          <code>{code}</code>
        </pre>
      )}
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
