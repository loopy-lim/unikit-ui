"use client";
// 사이클 40 신규 섹션 공용 골격 — app/components/page.tsx의 Section과 같은 토큰
// (제목 text-lg semibold / 설명 text-sm muted / 본문 mt-4). 기존 8개 섹션은
// page.tsx 안에 그대로 보존하고, 신규 6개 티어 섹션만 이 골격을 공유한다.
import type { ReactNode } from "react";
import { buttonTextVariants, buttonVariants, cn } from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View className="space-y-4">
      <Text className="font-sans text-lg font-semibold text-foreground">
        {title}
      </Text>
      <Text className="font-sans text-sm text-muted-foreground">
        {description}
      </Text>
      <View className="mt-4 space-y-4">{children}</View>
    </View>
  );
}

/**
 * 오버레이 트리거 공용 스타일 — 버튼 변형 토큰을 className으로 재사용한다.
 * DialogTrigger 같은 트리거는 브리지 Pressable(웹 <button>)이라 Button 컴포넌트를
 * 자식으로 두면 웹에서 버튼 중첩이 되므로, 변형 토큰만 빌려 쓴다.
 */
export const outlineTriggerClass = cn(
  buttonVariants({ variant: "outline" }),
  buttonTextVariants({ variant: "outline" }),
  "w-fit",
);

/** 본문 안내 문구(상태 시나리오 힌트) — 섹션마다 1~2줄로 제약을 적는다. */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <Text className="font-sans text-xs text-muted-foreground">{children}</Text>
  );
}

/** 섹션 내 소단위(컴포넌트별) 라벨 — 데모 덩어리가 많은 섹션의 미로 표지판 */
export function DemoLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="font-sans text-sm font-medium text-foreground">
      {children}
    </Text>
  );
}
