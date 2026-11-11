"use client";
/**
 * 쇼케이스 인덱스 — 카테고리 섹션 + 라이브 썸네일 카드 그리드.
 * 카드 썸네일은 실제 데모(demos[name].Demo)를 inert·pointer-events-none로
 * 시각 전용 렌더링하고, 카드 전체를 stretch 링크가 덮어 문서로 보낸다.
 */
import Link from "next/link";
import { Badge } from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import {
  catalog,
  catalogByCategory,
  type CatalogItem,
} from "../../components/showcase/catalog";
import { demos } from "../../components/showcase/demos";

/** 썸네일 스트립(h-40, p-4 → 가용 128px)에 들어가기 큰 데모 — 축소 배율 */
const THUMB_SCALE: Record<string, string> = {
  calendar: "scale-[0.5]",
  card: "scale-[0.4]",
  chart: "scale-[0.6]",
  command: "scale-[0.9]",
  empty: "scale-[0.45]",
  "message-scroller": "scale-[0.6]",
  sidebar: "scale-[0.75]",
};

export default function ShowcaseIndexPage() {
  const groups = catalogByCategory();

  return (
    <View className="w-full space-y-12">
      <View className="space-y-4">
        <Text className="site-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Components
        </Text>
        <Text className="max-w-2xl font-sans text-[15px] leading-7 text-muted-foreground">
          UniKit {catalog.length}종 — 웹과 React Native에서 같은 소스로 렌더링해요.
          카드 미리보기는 전부 실제 컴포넌트예요. 컴포넌트를 골라 Preview와 사용
          코드를 확인하세요.
        </Text>
        <View className="flex flex-row flex-wrap items-center gap-2">
          <Badge variant="secondary">{catalog.length}종</Badge>
          <Badge variant="secondary">{groups.length}개 카테고리</Badge>
          <Badge variant="secondary">웹 · React Native 동일 소스</Badge>
        </View>
        <View className="flex flex-row flex-wrap items-center gap-x-5 gap-y-2 pt-1">
          {groups.map((group) => (
            <a
              key={group.category}
              href={`#${group.category}`}
              className="site-focusable font-sans text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {group.label}
            </a>
          ))}
        </View>
      </View>

      {groups.map((group) => (
        <section
          key={group.category}
          id={group.category}
          className="scroll-mt-24 space-y-5"
        >
          <View className="flex flex-row items-baseline gap-2.5">
            <Text className="font-sans text-xl font-semibold tracking-tight text-foreground">
              {group.label}
            </Text>
            <Text className="font-sans text-sm text-muted-foreground">
              {group.items.length}종
            </Text>
          </View>
          <View className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <CatalogCard key={item.name} item={item} />
            ))}
          </View>
        </section>
      ))}
    </View>
  );
}

function CatalogCard({ item }: { item: CatalogItem }) {
  const { name, title, description } = item;
  const demo = demos[name];
  const Thumb = demo?.Demo;
  const scale = THUMB_SCALE[name];

  return (
    <View className="site-card group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-background hover:border-foreground/25 hover:bg-muted/30">
      {/* inert 속성이 브리지 ViewProps 계약에 없어 원시 div — 시각 전용 래핑 */}
      <div
        inert={true}
        className="pointer-events-none flex h-40 items-center justify-center overflow-hidden border-b border-border/60 bg-muted/25 p-4"
      >
        {Thumb ? (
          <View className={scale ? `w-full ${scale}` : "w-full"}>
            <Thumb />
          </View>
        ) : null}
      </div>
      <View className="flex flex-1 flex-col gap-2 p-5">
        <View className="flex flex-row items-center justify-between gap-2">
          <Text className="font-sans text-[15px] font-medium text-foreground">
            {title}
          </Text>
          <Text
            aria-hidden
            className="font-sans text-sm text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            →
          </Text>
        </View>
        <Text className="font-sans text-sm leading-6 text-muted-foreground">
          {description}
        </Text>
      </View>
      <Link
        href={`/showcase/${name}`}
        className="site-focusable absolute inset-0"
        aria-label={`${title} 문서 보기`}
      />
    </View>
  );
}
