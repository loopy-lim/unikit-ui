// 쇼케이스 카탈로그 — 컴포넌트별 상세 화면 구성(RNR react-native-reusables
// 쇼케이스 앱 관행: 검색 가능한 목록 → 컴포넌트별 화면 → 변형 슬라이드)의
// 단일 출처. 각 티어 파일이 CatalogEntry[]를 내보내면 여기서 카테고리
// 순서를 정해 합친다. 데모 JSX의 실체는 각 섹션 파일에 있다.
import type { ReactNode } from "react";

import { BASIC_ENTRIES } from "./basic-sections";
import { CHART_ENTRIES } from "./chart-section";
import { COMMAND_ENTRIES } from "./command-sections";
import { FORM_ENTRIES } from "./form-sections";
import { LAYOUT_ENTRIES } from "./layout-sections";
import { MESSAGE_ENTRIES } from "./message-sections";
import { OVERLAY_ENTRIES } from "./overlay-sections";

/** 변형 슬라이드 하나(이름 + 본문) */
export type DemoSlide = {
  name: string;
  element: ReactNode;
};

/** 카탈로그 항목 — app/component/<slug> 화면 하나와 대응 */
export type CatalogEntry = {
  /** 라우트 슬러그 */
  slug: string;
  /** 컴포넌트명(영문) */
  title: string;
  /** 한글 이름 — 목록 표시·검색 대상 */
  subtitle: string;
  /** 카테고리(목록 그룹) */
  category: string;
  /** 화면 설명 한 줄 */
  description: string;
  /** 웹 전용 표시(네이티브 데모 없음 — 안내만) */
  webOnly?: boolean;
  /** 변형 슬라이드 */
  slides: DemoSlide[];
};

/** 전체 카탈로그 — 목록 순서가 곧 화면 순서다. */
export const CATALOG: CatalogEntry[] = [
  ...BASIC_ENTRIES,
  ...OVERLAY_ENTRIES,
  ...COMMAND_ENTRIES,
  ...FORM_ENTRIES,
  ...LAYOUT_ENTRIES,
  ...MESSAGE_ENTRIES,
  ...CHART_ENTRIES,
];

/** 카테고리 목록(등장 순) */
export const CATEGORIES: string[] = CATALOG.reduce<string[]>(
  (acc, entry) => (acc.includes(entry.category) ? acc : [...acc, entry.category]),
  [],
);

/** 슬러그로 항목 찾기(상세 화면용) */
export function findEntry(slug: string): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.slug === slug);
}
