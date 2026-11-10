// 쇼케이스 공용 조각(엑스포) — 데모 안내 문구(Hint)·트리거 공용 스타일·
// 슬라이드 라벨·웹 전용 안내. 카탈로그 재구성 전의 Section 골격은 목록·
// 상세 화면이 구조를 나눠 가지며 쓰는 곳이 없어져 제거했다(2026-11-10).
// 레이아웃 텍스트는 RN Text/View(uniwind className)를, 컴포넌트는
// @unikit-bridge/ui에서 가져온다(기존 쇼케이스 관행).
import type { ReactNode } from "react";
import { Text } from "react-native";
import { ExternalLink } from "lucide-react-native";
import {
  buttonVariants,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@unikit-bridge/ui";

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

/** 웹 전용 컴포넌트 안내(HoverCard·Resizable) — 네이티브에 데모가 없어
 *  점선 빈 상태 박스로 이유를 설명한다(카탈로그 재구성). */
export function WebOnlyNotice({ reason }: { reason: string }) {
  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ExternalLink size={24} className="text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>웹 전용 컴포넌트예요</EmptyTitle>
        <EmptyDescription>{reason}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
