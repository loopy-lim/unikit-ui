"use client";
/**
 * Blocks 목록(웹) — /blocks 인덱스 본문.
 * shadcn Blocks(ui.shadcn.com/blocks) 구성을 따른다: 컴포넌트를 조립한
 * 페이지 단위 데모를 카드로 소개하고, 카드를 누르면 문서 셸 없이 전체
 * 화면(각 블록의 자체 레이아웃)으로 연다.
 * 카드 미리보기는 실제 컴포넌트의 정적 조합이다(포인터 차단) — 스트리밍
 * 같은 자동 동작은 전체 화면에서만 일어나게 한다.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUp } from "lucide-react";
import {
  Bubble,
  BubbleContent,
  Button,
  Card,
  CardContent,
  Input,
  Badge,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import {
  ChartBarSeries,
  ChartContainer,
  type ChartConfig,
  type ChartDatum,
} from "../ui/chart";

/** 대시보드 미리보기 차트 설정 — 단일 시리즈(범례 불필요, 제목이 시리즈를 명시) */
const previewChartConfig = {
  visits: { label: "방문자" },
} satisfies ChartConfig;

const previewChartData: ChartDatum[] = [
  { month: "1월", visits: 14 },
  { month: "3월", visits: 18 },
  { month: "5월", visits: 16 },
  { month: "7월", visits: 21 },
  { month: "9월", visits: 19 },
  { month: "11월", visits: 24 },
];

/** 블록 목록 — 미리보기 컴포넌트까지 포함해 이 파일이 단일 출처다. */
const BLOCKS: {
  name: string;
  title: string;
  category: string;
  description: string;
  preview: ReactNode;
}[] = [
  {
    name: "assistant",
    title: "AI 어시스턴트",
    category: "chat",
    description:
      "스트리밍 대화·첨부 업로드·설정 시트를 갖춘 채팅 앱이에요. 답변은 미리 쓴 대본이에요.",
    preview: <AssistantPreview />,
  },
  {
    name: "login",
    title: "로그인",
    category: "authentication",
    description:
      "흐린 배경 위 중앙 카드 로그인 폼이에요. shadcn login 블록 구성을 따라요.",
    preview: <LoginPreview />,
  },
  {
    name: "dashboard",
    title: "대시보드",
    category: "dashboard",
    description:
      "사이드바·지표 카드·차트·표를 한 화면에 담았어요. shadcn dashboard 블록 대응이에요.",
    preview: <DashboardPreview />,
  },
];

export function BlocksIndex() {
  return (
    <View className="w-full max-w-4xl space-y-10">
      <View className="space-y-3">
        <Text className="site-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Blocks
        </Text>
        <Text className="max-w-2xl font-sans text-[15px] leading-7 text-muted-foreground">
          컴포넌트를 조립해 만든 페이지 단위 데모예요. 카드를 누르면 문서
          없이 전체 화면으로 열려요 — 실제 제품 화면처럼 만져 보세요.
        </Text>
      </View>

      <View className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {BLOCKS.map((block) => (
          <Link
            key={block.name}
            href={`/blocks/${block.name}`}
            className="site-focusable site-card group flex flex-col rounded-xl border border-border bg-background transition-colors hover:border-foreground/25"
          >
            <View className="pointer-events-none flex h-44 items-center justify-center overflow-hidden border-b border-border/60 bg-muted/30 p-4">
              {block.preview}
            </View>
            <View className="flex flex-1 flex-col gap-1.5 p-4">
              <View className="flex flex-row items-center gap-2">
                <Text className="font-sans text-sm font-semibold text-foreground">
                  {block.title}
                </Text>
                <Badge variant="outline" className="px-1.5 text-xs">
                  {block.category}
                </Badge>
              </View>
              <Text className="font-sans text-xs leading-5 text-muted-foreground">
                {block.description}
              </Text>
              <Text className="mt-auto pt-2 font-sans text-xs font-medium text-primary">
                전체 화면에서 열기 →
              </Text>
            </View>
          </Link>
        ))}
      </View>
    </View>
  );
}

/** 어시스턴트 미리보기 — Bubble 두 개 + 작성줄 흉내(정적) */
function AssistantPreview() {
  return (
    <View className="w-full max-w-52 gap-2">
      <Bubble variant="default" align="end">
        <BubbleContent>UniKit UI가 뭐야?</BubbleContent>
      </Bubble>
      <Bubble variant="outline">
        <BubbleContent>한 import로 웹·앱이 같은 UI!</BubbleContent>
      </Bubble>
      <View className="flex flex-row items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
        <Text className="flex-1 font-sans text-xs text-muted-foreground">
          질문을 입력하세요
        </Text>
        <View className="flex size-5 items-center justify-center rounded-full bg-primary">
          <ArrowUp className="size-3 text-primary-foreground" />
        </View>
      </View>
    </View>
  );
}

/** 로그인 미리보기 — 입력 2개 + 주 버튼(정적, 조작 불가) */
function LoginPreview() {
  return (
    <Card className="w-full max-w-44 gap-2.5 py-4">
      <CardContent className="gap-2.5">
        <Input accessibilityLabel="이메일" placeholder="이메일" />
        <Input
          accessibilityLabel="비밀번호"
          placeholder="비밀번호"
          secureTextEntry
        />
        <Button size="sm" className="self-stretch">
          로그인
        </Button>
      </CardContent>
    </Card>
  );
}

/** 대시보드 미리보기 — 축·툴팁 없는 최소 막대 차트 */
function DashboardPreview() {
  return (
    <View className="w-full max-w-56 gap-2">
      <Text className="font-sans text-xs font-medium text-foreground">
        월별 방문자
      </Text>
      <ChartContainer
        config={previewChartConfig}
        data={previewChartData}
        width={224}
        height={110}
        accessibilityLabel="월별 방문자 미리보기 차트"
      >
        <ChartBarSeries dataKey="visits" />
      </ChartContainer>
    </View>
  );
}
