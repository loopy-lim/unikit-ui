// 컴포넌트 상세 화면(카탈로그 재구성 2026-11-10) — /component/<slug>.
// 카탈로그(components/showcase/catalog.tsx)에서 항목을 찾아 변형 슬라이드를
// 가로 페이징(RNR PreviewCarousel 관행 — 한 변형 = 화면 한 폭, 하단 점·
// 화살표)으로 보여준다. 슬라이드가 1개면 페이징 없이 세로 스크롤로 둔다.
// 데모 본문은 shadcn 문서의 preview처럼 테두리 프레임(rounded-lg border
// border-border p-5)에 담는다 — 프레임 없이 배경에 두면 짧은 변형에서
// 화면이 미완성처럼 비어 보인다(패딩 감사 2026-11-10).
import { useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FlatList,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Button, Badge } from "@unikit-bridge/ui";

import {
  findEntry,
  type DemoSlide,
} from "../../components/showcase/catalog";
import { DemoLabel } from "../../components/showcase/section";

/** 화살표·점 조작줄 — 슬라이드 이름은 상단 라벨이 이미 보여 주니 점만(중복 제거) */
function PagerControls({
  slides,
  index,
  onPrev,
  onNext,
}: {
  slides: DemoSlide[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between border-t border-border/40 px-4 py-2.5">
      <Button
        variant="ghost"
        size="sm"
        onPress={onPrev}
        disabled={index === 0}
        accessibilityLabel="이전 변형"
      >
        ‹ 이전
      </Button>
      <View className="flex-row items-center gap-1.5">
        {slides.map((slide, i) => (
          <View
            key={slide.name}
            className={
              i === index
                ? "h-1.5 w-4 rounded-full bg-foreground"
                : "h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
            }
          />
        ))}
      </View>
      <Button
        variant="ghost"
        size="sm"
        onPress={onNext}
        disabled={index === slides.length - 1}
        accessibilityLabel="다음 변형"
      >
        다음 ›
      </Button>
    </View>
  );
}

export default function ComponentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<DemoSlide>>(null);
  const [index, setIndex] = useState(0);

  const entry = typeof slug === "string" ? findEntry(slug) : undefined;

  if (!entry) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text className="font-sans text-base font-medium text-foreground">
          찾을 수 없는 컴포넌트예요
        </Text>
        <Button variant="outline" size="sm" onPress={() => router.back()}>
          목록으로
        </Button>
      </View>
    );
  }

  const scrollTo = (next: number) => {
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  return (
    <View className="flex-1 bg-background">
      {/* 헤더 — 목록 복귀 + 컴포넌트명(라우터 헤더 대신 직접 렌더, §1.2).
          배지 나열은 탭처럼 오독돼서(감사) 내비행은 뒤로가기만 두고,
          카테고리는 목록 그룹이 이미 보여 주니 빼고 웹 전용만 제목 옆에 둔다. */}
      <View className="w-full max-w-[640px] mx-auto px-4 pt-5">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          accessibilityLabel="목록으로"
        >
          ‹ 목록
        </Button>
        <View className="mt-4 flex-row items-center gap-2">
          <Text className="font-sans text-xl font-bold web:tracking-tight text-foreground">
            {entry.title}
          </Text>
          {entry.webOnly ? <Badge variant="outline">웹 전용</Badge> : null}
        </View>
        <Text className="mt-1 font-sans text-sm text-muted-foreground">
          {entry.description}
        </Text>
      </View>

      {entry.slides.length <= 1 ? (
        /* 단일 슬라이드 — 세로 스크롤로 충분하다(웹 전용 안내는 중앙 배치) */
        <ScrollView
          className={`w-full ${entry.webOnly ? "flex-1" : ""}`}
          contentContainerClassName={`w-full max-w-[640px] mx-auto px-4 pb-12 ${
            entry.webOnly ? "flex-1 justify-center" : "pt-5"
          }`}
          keyboardShouldPersistTaps="handled"
        >
          {entry.webOnly ? (
            entry.slides[0]?.element
          ) : (
            <View className="rounded-lg border border-border p-5">
              {entry.slides[0]?.element}
            </View>
          )}
        </ScrollView>
      ) : (
        /* 다중 슬라이드 — 가로 페이징(한 변형 = 화면 한 폭) */
        <View className="flex-1">
          <FlatList
            ref={listRef}
            className="w-full"
            data={entry.slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(event) => {
              setIndex(
                Math.round(event.nativeEvent.contentOffset.x / width),
              );
            }}
            renderItem={({ item }) => (
              <View style={{ width }}>
                <ScrollView
                  className="w-full"
                  contentContainerClassName="w-full max-w-[640px] mx-auto px-4 pt-5 pb-12 gap-3"
                  keyboardShouldPersistTaps="handled"
                >
                  <DemoLabel>{item.name}</DemoLabel>
                  <View className="rounded-lg border border-border p-5">
                    {item.element}
                  </View>
                </ScrollView>
              </View>
            )}
          />
          <View className="w-full max-w-[640px] mx-auto">
            <PagerControls
              slides={entry.slides}
              index={index}
              onPrev={() => scrollTo(Math.max(0, index - 1))}
              onNext={() =>
                scrollTo(Math.min(entry.slides.length - 1, index + 1))
              }
            />
          </View>
        </View>
      )}
    </View>
  );
}
