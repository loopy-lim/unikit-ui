import type { ComponentType } from "react";

/** 컴포넌트 문서의 개별 예시（shadcn Examples / Seed 변형 섹션） */
export type ShowcaseExample = {
  title: string;
  description?: string;
  Demo: ComponentType;
  code?: string;
};

export type ShowcaseDemo = {
  /** 히어로 Preview — 대표 사용 장면 하나 */
  Demo: ComponentType;
  /** 히어로 아래 Examples 섹션（선택） */
  examples?: ShowcaseExample[];
  /** Code 탭·히어로 스니펫 */
  code: string;
};
