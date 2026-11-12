"use client";
/**
 * 블록 공용 장치(웹) — 문서 셸 없이 여는 /blocks 전체 화면 블록이 공유하는 크롬.
 * - BackToBlocks: Blocks 목록으로 돌아가는 알약. 기본은 좌상단 고정(floating).
 * - BlockThemeToggle: 화면 안 테마 전환 — UnikitThemeProvider가
 *   defaultColorScheme="light" 고정이라 시스템 설정과 무관하게 직접 전환해야
 *   한다. 기본은 우측 상단 고정(알약과 좌우 대칭).
 * - BrandMark: 확정 U 마크 + 라벨 행(어시스턴트 셸·로그인·대시보드가
 *   같은 마크를 쓴다).
 * 헤더 바가 있는 블록(대시보드)은 floating={false}로 헤더 안에 배치한다 —
 * 고정 알약이 사이드바 토글을 덮지 않게 한다.
 */
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Button, useUnikitTheme } from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";
import { cn } from "@unikit-bridge/ui";
import { UnikitMark } from "../site/brand";

export function BackToBlocks({ floating = true }: { floating?: boolean }) {
  return (
    <Link
      href="/blocks"
      className={cn(
        "site-focusable flex flex-row items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 font-sans text-xs text-muted-foreground web:transition-colors web:hover:text-foreground",
        floating && "fixed left-4 top-4 z-50"
      )}
    >
      <ArrowLeft className="size-3.5" />
      Blocks
    </Link>
  );
}

export function BlockThemeToggle({ floating = true }: { floating?: boolean }) {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      accessibilityLabel="테마 전환"
      onPress={toggleColorScheme}
      className={cn(
        "site-focusable",
        floating && "fixed right-4 top-4 z-50 web:bg-background/80 web:backdrop-blur"
      )}
    >
      {colorScheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}

export function BrandMark({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <View className={cn("flex flex-row items-center gap-2", className)}>
      <UnikitMark size={28} />
      <Text className="font-sans text-sm font-semibold tracking-tight text-foreground">
        {label}
      </Text>
    </View>
  );
}
