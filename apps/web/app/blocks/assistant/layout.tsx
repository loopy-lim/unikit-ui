"use client";
/**
 * 데모 앱 셸 — Blocks의 어시스턴트 블록(/blocks/assistant) 공통 레이아웃.
 * 좌측 미니 내비(모바일은 상단 바) + 테마 토글(block-chrome 공용 장치).
 * 문서 셸(docs-shell)과는 달리 앱 챔버 느낌(bg-background 전면)으로 만든다.
 * 내비 항목은 홈·어시스턴트만 실제 화면을 갖고, 나머지는 기존 페이지로 보낸다.
 * 아이콘은 앱 코드 관행(landing·showcase)대로 lucide-react를 쓴다.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  Blocks,
  BookOpen,
  ExternalLink as ExternalLinkIcon,
  Home,
  Sparkles,
} from "lucide-react";
import { Badge, cn } from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { BlockThemeToggle, BrandMark } from "../../../components/blocks/block-chrome";

const NAV = [
  { href: "/blocks/assistant", label: "홈", icon: Home, exact: true },
  { href: "/blocks/assistant/chat", label: "어시스턴트", icon: Sparkles, exact: false },
] as const;

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <View className="flex h-dvh w-full flex-col overflow-hidden bg-background md:flex-row">
      {/** 모바일 상단 바 + 탭 스트립 */}
      <View className="md:hidden">
        <View className="flex h-14 flex-row items-center justify-between border-b border-border px-4">
          <Link href="/blocks/assistant">
            <BrandMark label="UniKit 도우미" />
          </Link>
          <BlockThemeToggle floating={false} />
        </View>
        <View className="flex flex-row items-center gap-1 border-b border-border px-2 py-1.5">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </View>
      </View>
      {/** 데스크톱 좌측 내비 */}
      <View className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
        {/** flex-row 필수 — 브리지 View는 flex-col을 기본 접두으로 붙인다 */}
        <View className="flex h-16 flex-row items-center px-4">
          <Link href="/blocks/assistant">
            <BrandMark label="UniKit 도우미" />
          </Link>
        </View>
        <View className="flex-1 gap-1 px-3">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          <View className="mt-4 gap-1 border-t border-border pt-3">
            <ExternalLink href="/blocks" icon={Blocks} label="Blocks 목록" />
            <ExternalLink href="/components" icon={BookOpen} label="컴포넌트 문서" />
            <ExternalLink
              href="https://github.com/loopy-lim/UniKit"
              icon={ExternalLinkIcon}
              label="GitHub"
            />
          </View>
        </View>
        <View className="flex flex-row items-center justify-between gap-2 px-4 py-4">
          <Badge variant="secondary">데모 앱</Badge>
          <BlockThemeToggle floating={false} />
        </View>
      </View>
      {/** 본문 — 페이지가 h-full로 채운다 */}
      <View className="min-h-0 min-w-0 flex-1">{children}</View>
    </View>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-row items-center gap-2.5 rounded-md px-3 py-2 font-sans text-sm",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground web:transition-colors web:hover:bg-muted/50 web:hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      <Text className="font-sans text-sm">{label}</Text>
    </Link>
  );
}

function ExternalLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      className="flex flex-row items-center gap-2.5 rounded-md px-3 py-2 text-muted-foreground web:transition-colors web:hover:bg-muted/50 web:hover:text-foreground"
    >
      <Icon className="size-4" />
      <Text className="font-sans text-sm">{label}</Text>
    </a>
  );
}
