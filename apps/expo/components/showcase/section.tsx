// 사이클 40 신규 섹션 공용 골격(엑스포) — app/index.tsx의 Section과 같은 토큰.
// RN에서 space-y 간격 유틸이 보증되지 않아 본문은 flex-col gap-4로 둔다
// (기존 섹션들이 Section 안에 별도 flex-col gap-4 래퍼를 두던 것을 골격에 합침).
// 레이아웃 텍스트는 RN Text/View(uniwind className)를, 컴포넌트는
// @unikit-bridge/ui에서 가져온다(기존 쇼케이스 관행).
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { buttonVariants } from "@unikit-bridge/ui";

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
      <View className="mt-4 flex flex-col gap-4">{children}</View>
    </View>
  );
}

/**
 * 오버레이 트리거 공용 스타일 — 버튼 변형 토큰을 className으로 재사용한다.
 * (웹 쇼케이스 section.tsx와 동일한 이유 — 트리거 중첩 버튼 회피)
 */
export const outlineTriggerClass = buttonVariants({ variant: "outline" });

/** 본문 안내 문구(상태 시나리오 힌트) */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <Text className="font-sans text-xs text-muted-foreground">{children}</Text>
  );
}

/** 섹션 내 소단위(컴포넌트별) 라벨 */
export function DemoLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="font-sans text-sm font-medium text-foreground">
      {children}
    </Text>
  );
}
