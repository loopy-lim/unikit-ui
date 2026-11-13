"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Blocks, Component, Moon, Palette, Search, Sun } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Kbd,
  KbdGroup,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { CATEGORY_LABEL, catalog } from "./catalog";
import { PRESET_META, useSiteTheme, type SiteThemePreset } from "../site/site-theme";

const BLOCK_ITEMS = [
  { href: "/components", label: "전체 컴포넌트 목록", keywords: ["components", "catalog"] },
  { href: "/components/kitchen-sink", label: "Kitchen sink", keywords: ["kitchen", "all", "demo"] },
  { href: "/blocks", label: "Blocks 목록", keywords: ["blocks", "templates"] },
  { href: "/blocks/assistant", label: "AI 어시스턴트 블록", keywords: ["assistant", "chat", "ai"] },
  { href: "/blocks/login", label: "로그인 블록", keywords: ["login", "auth"] },
  { href: "/blocks/dashboard", label: "대시보드 블록", keywords: ["dashboard", "chart", "sidebar"] },
] as const;

export function CommandSearchTrigger({ compact = false }: { compact?: boolean }) {
  const { setCommandOpen } = useSiteTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        aria-label="검색 열기 (단축키 Command+K)"
        className="site-focusable flex size-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Search className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setCommandOpen(true)}
      aria-label="문서 검색 열기 (단축키 Command+K)"
      className="site-focusable flex h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Search className="size-3.5 shrink-0" />
      <span className="hidden sm:inline">컴포넌트 검색...</span>
      <KbdGroup className="hidden md:flex">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </button>
  );
}

export function CommandSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { colorScheme, setColorScheme, setPreset } = useSiteTheme();
  const [hasOpened, setHasOpened] = useState(open);

  useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  // 첫 오픈 전에는 61종 CommandItem 트리를 마운트하지 않아 초기 부하를 제거한다.
  if (!hasOpened && !open) return null;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="UniKit 빠른 탐색"
      className="max-w-lg"
    >
      <Command className="h-auto">
        <CommandInput
          autoFocus
          placeholder="컴포넌트, 블록, 테마 검색..."
        />
        <CommandList className="max-h-80">
          <CommandEmpty>일치하는 결과가 없어요.</CommandEmpty>
          <CommandGroup heading="페이지 · 블록">
            {BLOCK_ITEMS.map((entry) => (
              <CommandItem
                key={entry.href}
                value={entry.label}
                keywords={[...entry.keywords]}
                onSelect={() => navigate(entry.href)}
              >
                <Blocks className="size-4 text-muted-foreground" />
                <Text className="flex-1 font-sans text-sm text-popover-foreground">
                  {entry.label}
                </Text>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="컴포넌트 (61)">
            {catalog.map((item) => (
              <CommandItem
                key={item.name}
                value={`${item.title} ${item.name}`}
                keywords={[
                  item.name,
                  item.description,
                  CATEGORY_LABEL[item.category],
                ]}
                onSelect={() => navigate(`/components/${item.name}`)}
              >
                <Component className="size-4 text-muted-foreground" />
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                  <Text className="font-sans text-sm font-medium text-popover-foreground">
                    {item.title}
                  </Text>
                  <Text className="truncate font-sans text-xs text-muted-foreground">
                    {item.description}
                  </Text>
                </View>
                <CommandShortcut>{CATEGORY_LABEL[item.category]}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="테마">
            <CommandItem
              value="라이트 모드 전환 Light"
              onSelect={() => {
                setColorScheme("light");
                onOpenChange(false);
              }}
            >
              <Sun className="size-4 text-muted-foreground" />
              <Text className="flex-1 font-sans text-sm text-popover-foreground">
                라이트 모드
              </Text>
              {colorScheme === "light" ? (
                <CommandShortcut>사용 중</CommandShortcut>
              ) : null}
            </CommandItem>
            <CommandItem
              value="다크 모드 전환 Dark"
              onSelect={() => {
                setColorScheme("dark");
                onOpenChange(false);
              }}
            >
              <Moon className="size-4 text-muted-foreground" />
              <Text className="flex-1 font-sans text-sm text-popover-foreground">
                다크 모드
              </Text>
              {colorScheme === "dark" ? (
                <CommandShortcut>사용 중</CommandShortcut>
              ) : null}
            </CommandItem>
            {(Object.keys(PRESET_META) as SiteThemePreset[]).map((key) => (
              <CommandItem
                key={key}
                value={`프리셋 테마 ${PRESET_META[key].label}`}
                keywords={["theme", "preset", key]}
                onSelect={() => {
                  setPreset(key);
                  onOpenChange(false);
                }}
              >
                <Palette className="size-4 text-muted-foreground" />
                <Text className="flex-1 font-sans text-sm text-popover-foreground">
                  {PRESET_META[key].label} 프리셋 적용
                </Text>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
