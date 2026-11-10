/**
 * 쇼케이스 카탈로그 — registry.json UI 61종 메타 + 사이드바 그룹.
 * 설명은 소비자용 한 줄(레지스트리 description 축약).
 */
export type ShowcaseCategory =
  | "basics"
  | "forms"
  | "feedback"
  | "overlay"
  | "navigation"
  | "layout"
  | "data"
  | "message";

export type CatalogItem = {
  name: string;
  title: string;
  description: string;
  category: ShowcaseCategory;
};

export const CATEGORY_LABEL: Record<ShowcaseCategory, string> = {
  basics: "기본",
  forms: "폼",
  feedback: "피드백",
  overlay: "오버레이",
  navigation: "탐색",
  layout: "레이아웃",
  data: "데이터",
  message: "메시지·차트",
};

/** 사이드바·인덱스 표시 순서 */
export const CATEGORY_ORDER: ShowcaseCategory[] = [
  "basics",
  "forms",
  "feedback",
  "overlay",
  "navigation",
  "layout",
  "data",
  "message",
];

export const catalog: CatalogItem[] = [
  // basics
  { name: "button", title: "Button", description: "변형·크기·비활성 상태를 갖춘 버튼.", category: "basics" },
  { name: "badge", title: "Badge", description: "상태·카테고리를 표시하는 배지.", category: "basics" },
  { name: "card", title: "Card", description: "제목·설명·내용·푸터를 담는 카드.", category: "basics" },
  { name: "avatar", title: "Avatar", description: "프로필 이미지와 폴백 이니셜.", category: "basics" },
  { name: "kbd", title: "Kbd", description: "키보드 단축키 표시.", category: "basics" },
  { name: "separator", title: "Separator", description: "가로·세로 구분선.", category: "basics" },
  { name: "skeleton", title: "Skeleton", description: "로딩 자리 표시.", category: "basics" },
  { name: "spinner", title: "Spinner", description: "진행 중 표시용 스피너.", category: "basics" },
  // forms
  { name: "input", title: "Input", description: "한 줄 텍스트 입력.", category: "forms" },
  { name: "label", title: "Label", description: "입력과 연결되는 라벨.", category: "forms" },
  { name: "textarea", title: "Textarea", description: "여러 줄 텍스트 입력.", category: "forms" },
  { name: "checkbox", title: "Checkbox", description: "체크·중간 상태 지원.", category: "forms" },
  { name: "radio-group", title: "Radio Group", description: "단일 선택 라디오 그룹.", category: "forms" },
  { name: "switch", title: "Switch", description: "켜고 끄는 스위치.", category: "forms" },
  { name: "toggle", title: "Toggle", description: "눌림 상태를 유지하는 토글.", category: "forms" },
  { name: "toggle-group", title: "Toggle Group", description: "토글 묶음(단일·다중).", category: "forms" },
  { name: "slider", title: "Slider", description: "범위 값 슬라이더.", category: "forms" },
  { name: "input-otp", title: "Input OTP", description: "인증 코드 입력 칸.", category: "forms" },
  { name: "input-group", title: "Input Group", description: "입력과 부가 요소 묶음.", category: "forms" },
  { name: "field", title: "Field", description: "라벨·설명·오류를 묶은 필드.", category: "forms" },
  { name: "form", title: "Form", description: "react-hook-form 연동 폼.", category: "forms" },
  { name: "calendar", title: "Calendar", description: "날짜 선택 달력.", category: "forms" },
  { name: "native-select", title: "Native Select", description: "네이티브 select 래퍼.", category: "forms" },
  { name: "select", title: "Select", description: "커스텀 셀렉트 메뉴.", category: "forms" },
  { name: "combobox", title: "Combobox", description: "검색 가능한 선택 상자.", category: "forms" },
  // feedback
  { name: "alert", title: "Alert", description: "상황 알림 박스.", category: "feedback" },
  { name: "progress", title: "Progress", description: "진행률 표시 바.", category: "feedback" },
  { name: "empty", title: "Empty", description: "빈 상태 안내.", category: "feedback" },
  { name: "sonner", title: "Sonner", description: "토스트 알림.", category: "feedback" },
  { name: "tooltip", title: "Tooltip", description: "짧은 힌트 팝업.", category: "feedback" },
  // overlay
  { name: "dialog", title: "Dialog", description: "모달 대화 상자.", category: "overlay" },
  { name: "alert-dialog", title: "Alert Dialog", description: "확인·취소 경고 대화.", category: "overlay" },
  { name: "sheet", title: "Sheet", description: "가장자리에서 열리는 패널.", category: "overlay" },
  { name: "drawer", title: "Drawer", description: "하단·측면 드로어.", category: "overlay" },
  { name: "popover", title: "Popover", description: "앵커 기준 팝오버.", category: "overlay" },
  { name: "hover-card", title: "Hover Card", description: "호버 미리보기(웹).", category: "overlay" },
  { name: "dropdown-menu", title: "Dropdown Menu", description: "드롭다운 메뉴.", category: "overlay" },
  { name: "context-menu", title: "Context Menu", description: "우클릭·길게 누르기 메뉴.", category: "overlay" },
  // navigation
  { name: "breadcrumb", title: "Breadcrumb", description: "경로 탐색.", category: "navigation" },
  { name: "pagination", title: "Pagination", description: "페이지 매김.", category: "navigation" },
  { name: "tabs", title: "Tabs", description: "탭 전환.", category: "navigation" },
  { name: "menubar", title: "Menubar", description: "메뉴 막대.", category: "navigation" },
  { name: "navigation-menu", title: "Navigation Menu", description: "사이트 내비게이션.", category: "navigation" },
  { name: "command", title: "Command", description: "명령 팔레트·검색.", category: "navigation" },
  { name: "sidebar", title: "Sidebar", description: "앱 사이드바 레이아웃.", category: "navigation" },
  // layout
  { name: "accordion", title: "Accordion", description: "접고 펴는 패널.", category: "layout" },
  { name: "collapsible", title: "Collapsible", description: "단일 접기/펼치기.", category: "layout" },
  { name: "aspect-ratio", title: "Aspect Ratio", description: "고정 비율 컨테이너.", category: "layout" },
  { name: "scroll-area", title: "Scroll Area", description: "스크롤 영역.", category: "layout" },
  { name: "resizable", title: "Resizable", description: "크기 조절 패널.", category: "layout" },
  { name: "direction", title: "Direction", description: "LTR/RTL 방향 컨텍스트.", category: "layout" },
  { name: "item", title: "Item", description: "리스트 아이템 행.", category: "layout" },
  { name: "button-group", title: "Button Group", description: "연접 버튼 무리.", category: "layout" },
  // data
  { name: "table", title: "Table", description: "표 레이아웃.", category: "data" },
  { name: "carousel", title: "Carousel", description: "슬라이드 캐러셀.", category: "data" },
  { name: "chart", title: "Chart", description: "막대·선·영역 차트.", category: "data" },
  { name: "marker", title: "Marker", description: "하이라이트 마커.", category: "data" },
  // message
  { name: "bubble", title: "Bubble", description: "말풍선 UI.", category: "message" },
  { name: "message", title: "Message", description: "채팅 메시지 블록.", category: "message" },
  { name: "message-scroller", title: "Message Scroller", description: "메시지 스크롤 컨테이너.", category: "message" },
  { name: "attachment", title: "Attachment", description: "첨부 파일 칩.", category: "message" },
];

export function getCatalogItem(name: string): CatalogItem | undefined {
  return catalog.find((item) => item.name === name);
}

export function catalogByCategory(): {
  category: ShowcaseCategory;
  label: string;
  items: CatalogItem[];
}[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    items: catalog.filter((item) => item.category === category),
  }));
}
