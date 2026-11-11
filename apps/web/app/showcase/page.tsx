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

/** 썸네일 스트립(h-44 sm:h-40, p-4)에 들어가기 큰 데모 — 축소 배율.
 *  값은 모바일(1열 넓은 카드) 기준 + sm: 오버라이드(2~3열 좁은 카드).
 *  사이클 73: 모바일 배율 신설 — 이전 단일 값은 데스크톱 카드 폭 기준이라
 *  모바일 카드(382px)에서 데모가 지나치게 작게 렌더됐다. */
const THUMB_SCALE: Record<string, string> = {
  // calendar 248×328·card 높이 약 307(자연) — 0.55/0.6은 세로가 스트립(h-44=176)을
  // 4~8px 넘어 잘렸다(추가 평가 시각 렌즈). 176·160 안쪽으로 내린 값.
  calendar: "scale-[0.53] sm:scale-[0.48]",
  card: "scale-[0.57] sm:scale-[0.4]",
  chart: "scale-[0.8] sm:scale-[0.6]",
  command: "sm:scale-[0.9]",
  empty: "scale-[0.55] sm:scale-[0.45]",
  "message-scroller": "scale-[0.85] sm:scale-[0.6]",
  sidebar: "scale-[0.9] sm:scale-[0.75]",
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
      </View>

      {/* 카테고리 칩 바 — 가로 스크롤(스크롤바 숨김), 헤더 바로 아래 고정.
          루트 블록 바로 아래에 둬야 페이지 끝까지 붙어 다닌다(사이클 73).
          <md 풀블리드(음수 마진), md+는 본문 열 시작에 정렬(사이드바 경계 관통 방지). */}
      <nav
        aria-label="컴포넌트 카테고리"
        className="sticky top-16 z-30 -mx-4 border-b border-border/60 bg-background/90 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:-mx-6 sm:px-6 md:mx-0 md:px-0"
      >
        <View className="site-scrollbar-none flex flex-row gap-2 overflow-x-auto">
          {groups.map((group) => (
            <a
              key={group.category}
              href={`#${group.category}`}
              className="site-focusable shrink-0 rounded-full border border-border px-3 py-1.5 font-sans text-sm text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
            >
              {group.label}
            </a>
          ))}
        </View>
      </nav>

      {groups.map((group) => (
        <section
          key={group.category}
          id={group.category}
          className="scroll-mt-32 space-y-5"
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
    <View className="site-card group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-background hover:border-foreground/25 hover:bg-accent">
      {/* inert 속성이 브리지 ViewProps 계약에 없어 원시 div — 시각 전용 래핑 */}
      <div
        inert={true}
        className="pointer-events-none flex h-44 items-center justify-center overflow-hidden border-b border-border/60 bg-muted/25 p-4 sm:h-40"
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
            /* 터치 기기엔 hover가 없어 화살표가 아예 안 보였다 — <md 상시 노출,
               md+는 기존 hover 표시 유지. */
            className="font-sans text-sm text-muted-foreground opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
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
