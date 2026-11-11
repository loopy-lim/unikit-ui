"use client";
/**
 * 쇼케이스 문서 셸 — 여유 있는 패딩·사이드바 구분·Preview 스테이지.
 * 사이클 73: 모바일(<md) 목차를 인라인 펼침 대신 패키지 Sheet 좌측 드로어로
 * 개편(Astryx 모바일 벤치마크)하고 헤더에 GitHub 링크를 상시 노출.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  Toaster,
} from "@unikit-bridge/ui";
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
      <View className="site-docs-canvas">
        <DocsHeader>
          {/* 모바일 목차 드로어 — 트리거(햄버거)는 헤더 행 안에 배치 */}
          <DocsMobileNav open={navOpen} onOpenChange={setNavOpen} />
        </DocsHeader>
        <View className="mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 md:flex-row lg:px-8">
          <DocsSidebar />
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
      className="site-docs-enter min-w-0 flex-1 pb-16 pt-6 sm:pt-8 md:pl-8 lg:pl-10"
    >
      {children}
    </View>
  );
}

function DocsHeader({ children }: { children: ReactNode }) {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  const pathname = usePathname();
  const onComponents = pathname.startsWith("/showcase");

  return (
    <View className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <View className="mx-auto flex h-16 w-full max-w-7xl flex-row items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <View className="flex min-w-0 flex-row items-center gap-3 sm:gap-4">
          {children}
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
        <View className="flex flex-row items-center gap-3 sm:gap-4">
          <a
            href="https://github.com/loopy-lim/UniKit"
            aria-label="GitHub (새 창에서 열림)"
            className="site-focusable font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
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

/** 목차 링크 클래스 — 활성/비활성 (사이드바·드로어 공용) */
function docsNavLinkClass(active: boolean) {
  return active
    ? "site-focusable site-nav-link block rounded-md bg-muted px-3 py-2 font-sans text-sm font-medium text-foreground"
    : "site-focusable site-nav-link block rounded-md px-3 py-2 font-sans text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground";
}

/** 카탈로그 목차 본문 — 사이드바(md+)와 모바일 드로어가 같은 마크업을 공유.
 *  드로어는 헤더 주요 링크 «Components»와 같은 행선지인 «전체 목록»을 숨긴다(중복 방지). */
function DocsNavGroups({
  pathname,
  onNavigate,
  showAllLink = true,
}: {
  pathname: string;
  onNavigate?: () => void;
  showAllLink?: boolean;
}) {
  const groups = catalogByCategory();

  return (
    <>
      {showAllLink ? (
        <Link
          href="/showcase"
          onClick={onNavigate}
          className={`mb-5 ${docsNavLinkClass(pathname === "/showcase")}`}
        >
          전체 목록
        </Link>
      ) : null}
      {groups.map((group) => (
        <View key={group.category} className="mb-6">
          <Text className="mb-2.5 px-3 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {group.label}
          </Text>
          <View className="space-y-0.5">
            {group.items.map((item) => {
              const href = `/showcase/${item.name}`;
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
}

/** md+ 고정 사이드바 — 모바일은 DocsMobileNav 드로어가 담당 */
function DocsSidebar() {
  const pathname = usePathname();

  return (
    <View className="hidden w-full shrink-0 md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)] md:w-60 md:overflow-y-auto md:border-r md:border-border/80 md:py-8 md:pr-6 lg:w-64 lg:pr-8">
      <DocsNavGroups pathname={pathname} />
    </View>
  );
}

/** 모바일(<md) 목차 드로어 — 패키지 Sheet(side="left"). 포털·백드롭·ESC·
 *  스크롤 잠금·포커스 복귀는 ModalOverlay가 제공한다.
 *  구조: 제목 행(고정) + 목록(내부 스크롤) — 카드 전체가 아닌 목록만 스크롤해야
 *  내장 X 닫기 버튼(카드 우상단 absolute)이 스크롤에 함께 따라가지 않는다. */
function DocsMobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();

  // 드로어를 열면 활성 링크(현재 문서)가 목차 어디에 있든 보이게 끌어온다.
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
    // Sheet 루트는 항상 View 래퍼를 렌더한다 — md+에서 트리거만 숨기면 빈
    // 플렉스 아이템이 남아 헤더 gap이 한 칸 더 적용된다(로고 16px 우측 밀림).
    // 래퍼째 md:hidden하면 아이템 자체가 사라진다. 본문은 포털(body)이라 영향 없음.
    <Sheet open={open} onOpenChange={onOpenChange} className="md:hidden">
      <SheetTrigger
        /* 제어형이라 트리거는 열기만 가능 — 라벨은 상시 "목차 열기"로 고정하고
           상태는 aria-expanded가 전달한다. */
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
              ["/showcase", "Components"],
              ["/showcase/kitchen-sink", "Kitchen sink"],
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
          ? "site-preview-enter site-preview-stage flex min-h-44 items-start justify-start rounded-xl border border-border p-6 sm:p-8"
          : "site-preview-enter site-preview-stage flex min-h-44 items-center justify-center rounded-xl border border-border p-6 sm:p-8"
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
      // 클립보드 거부(권한·비보안 컨텍스트) — 실패도 버튼 문구로 알린다.
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

export function InstallSnippet({ name }: { name: string }) {
  const cmd = `bunx shadcn@latest add https://ui.unikit.ll3.kr/r/${name}.json -y`;
  return (
    <View className="space-y-3">
      <Text className="font-sans text-base font-semibold tracking-tight text-foreground">
        Installation
      </Text>
      <CodeBlock code={cmd} label="Command" />
    </View>
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
  return (
    <View className="site-preview-enter overflow-hidden rounded-xl border border-border bg-background">
      <View className="flex flex-row gap-1 border-b border-border bg-muted/20 px-3 py-2">
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
                  ? "site-focusable rounded-md bg-background px-3 py-1.5 font-sans text-xs font-medium text-foreground shadow-sm"
                  : "site-focusable rounded-md px-3 py-1.5 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {label}
            </button>
          );
        })}
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
