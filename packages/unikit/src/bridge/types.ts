/**
 * 브리지 프리미티브의 공개 타입 — 플랫폼 공통 부분집합.
 *
 * `@unikit-bridge/ui/primitives`는 package.json exports의 조건분기로 해석된다:
 * - 네이티브（Metro, "react-native" 조건） → native.tsx — RN View/Text/Pressable/TextInput
 *   + uniwind（className을 RN 스타일로 컴파일）
 * - 웹（Next/Vite 등, "default" 조건） → web.tsx — div/span/button/input에 className을
 *   그대로 싣고 표준 Tailwind CSS v4가 스타일링한다
 *
 * 두 구현 모두 이 파일의 타입을 충족해야 한다（컴포넌트 소스는 플랫폼 무관하게
 * 한 벌로 컴파일된다）. 프로퍼티는 컴포넌트데모가 실제 쓰는 공통 부분집합이며,
 * 플랫폼 고유 프로퍼티（hitSlop 등）는 웹에서 무시된다.
 *
 * 사이클 40 확장（잔여 shadcn 33종 이식 지원 — 42-design-plan §2.1）: BridgeRole
 * 오버레이표 계열 추가, aria-value/current/modal/describedby/invalid,
 * onContextMenu/onLongPress/onKeyDown, PortalScrollViewSelect 프리미티브,
 * measureInWindowuseDrag오버레이 훈 4종（useOverlayFocususeDismiss
 * useRepositionuseScrollLock）.
 */
import type { ComponentType, ReactElement, ReactNode } from "react";

export type BridgeColorScheme = "light" | "dark";

/**
 * 플랫폼 공통 인라인 스타일 최소 계약 — className 문자열로 표현할 수 없는
 * 동적 값（진행률 폭 %, 가로세로 비율 등）용. RN 스타일 객체과 DOM
 * CSSProperties의 실용 교집합（프로퍼티 이름은 camelCase, 값은 문자열·숫자）.
 * 정적 스타일은 여전히 className이 원칙이고, 여기는 동적 값 전용이다.
 */
export type BridgeStyle = Record<string, string | number | undefined>;

/**
 * 플랫폼 공통 접근성 역할 — ARIA role과 RN accessibilityRole의 교집합 +
 * 카탈로그 확장에 필요한 역할. 웹에서는 그대로 role 속성이 되고,
 * RN이 모르는 role（tabpanel·dialog 등）은 Android 런타임에서 무시되지 않고
 * 크래시하므로(2026-11-10 실증) native 브리지가 근접 RN 역할로 매핑한다
 * （매핑표는 native.tsx의 RN_ROLE_FALLBACK — 웹 스크린리더만 이득을 얻는
 * 역할은 none으로 낮아지는 한계를 컴포넌트 머리 주석에 기록）.
 */
export type BridgeRole =
  | "button"
  | "link"
  | "search"
  | "image"
  | "text"
  | "tab"
  | "tablist"
  | "tabpanel"
  | "switch"
  | "checkbox"
  | "radio"
  | "radiogroup"
  | "option"
  | "menuitem"
  | "separator"
  | "heading"
  | "list"
  | "listitem"
  | "progressbar"
  | "alert"
  | "status"
  | "combobox"
  // ── 사이클 40 확장（오버레이표달력 계열） ──
  | "dialog"
  | "alertdialog"
  | "menu"
  | "menubar"
  | "tooltip"
  | "table"
  | "rowgroup"
  | "row"
  | "cell"
  | "columnheader"
  | "grid"
  | "gridcell"
  | "listbox"
  | "slider"
  | "toolbar"
  | "tree"
  // ── 사이클 40 후속 보강（완료 보고 제기） ──
  | "group"
  | "region";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ViewProps = {
  className?: string;
  /** 동적 값 전용 인라인 스타일（정적 스타일은 className 원칙） */
  style?: BridgeStyle;
  children?: ReactNode;
  /** 네이티브 nativeID — 웹에서는 id로 전달된다 */
  nativeID?: string;
  testID?: string;
  accessibilityRole?: BridgeRole;
  accessibilityLabel?: string;
  /** 장식용 요소 표시 — 웹 aria-hidden, 네이티브 accessibilityElementsHidden */
  "aria-hidden"?: boolean;
  /** 모달성 선언（dialogalert-dialogsheetdrawer） — 웹 aria-modal,
   *  네이티브 accessibilityViewIsModal */
  "aria-modal"?: boolean;
  /** 보조 설명 연결（nativeID） — 웹 aria-describedby. 네이티브 미지원（한계） */
  "aria-describedby"?: string;
  /** 범위형 컨트롤（progressbar 등） 현재값 — 네이티브 accessibilityValue로 */
  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
  /** 전개 상태（combobox 루트 등 View에 부여） — 네이티브 미지원（폐기） */
  "aria-expanded"?: boolean;
  /** 제어 대상 연결（nativeID） — 웹 전용. 네이티브 미지원（폐기） */
  "aria-controls"?: string;
  /** 라벨 연결（nativeID） — 웹 전용. 네이티브 미지원（폐기） */
  "aria-labelledby"?: string;
  /** 포인터 이벤트 통과 제어 — 네이티브 RN pointerEvents prop 그대로,
   *  웹은 CSS pointer-events로 치환（box-none→none: 자체는 통과, 자식은
   *  pointer-events-auto 클래스로 수신 — 오버레이 래퍼가 소비）. */
  pointerEvents?: "auto" | "none" | "box-only" | "box-none";
};

export type TextProps = {
  className?: string;
  /** 동적 값 전용 인라인 스타일（정적 스타일은 className 원칙） */
  style?: BridgeStyle;
  children?: ReactNode;
  nativeID?: string;
  testID?: string;
  onPress?: () => void;
  accessibilityRole?: BridgeRole;
  accessibilityLabel?: string;
  /** 장식용 글리프 등 읽지 않을 텍스트 표시 — 웹 aria-hidden, 네이티브
   *  accessibilityElementsHidden（T-2a 제기 — dropdown 글리프 등이 스크린리더에
   *  읽히는 것을 방지） */
  "aria-hidden"?: boolean;
  /** 줄 바꿈 제한(초과 줄 말줄임) — 웹 -webkit-line-clamp / 네이티브 RN 관용 */
  numberOfLines?: number;
};

export type PressableProps = {
  className?: string;
  /** 동적 값 전용 인라인 스타일（정적 스타일은 className 원칙） */
  style?: BridgeStyle;
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: BridgeRole;
  /** RN 0.7x+ 관용 — 웹 DOM에서도 동일 속성으로 전달된다 */
  "aria-disabled"?: boolean;
  /** 눌림 유지형 컨트롤（toggle） 상태 — 웹 DOM 그대로, 네이티브는 시각 상태로만 반영 */
  "aria-pressed"?: boolean;
  /** 체크형 컨트롤（checkbox/radio/switch） 상태 — 네이티브 accessibilityState.checked로 */
  "aria-checked"?: boolean | "mixed";
  /** 탭·옵션 등 선택 상태 — 네이티브 accessibilityState.selected로 */
  "aria-selected"?: boolean;
  /** 아코디언·콤보박스 등 전개 상태 — 네이티브 accessibilityState.expanded로 */
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-labelledby"?: string;
  /** 범위형 컨트롤（progressslider） 현재값 — 네이티브 accessibilityValue로 */
  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
  /** 현재 위치 표시（pagination 등） — 웹 전용（RN 계약 없음, 시각 강조만） */
  "aria-current"?:
    | "page"
    | "step"
    | "location"
    | "date"
    | "time"
    | (boolean & {});
  /** 보조 설명 연결（nativeID） — 웹 aria-describedby. 네이티브 미지원（한계） */
  "aria-describedby"?: string;
  /** 오류 상태（form） — 웹 aria-invalid. RN 미지원（한계） */
  "aria-invalid"?: boolean;
  /** 우클릭 메뉴（context-menu） — 웹 onContextMenu, 네이티브 onLongPress로 매핑 */
  onContextMenu?: () => void;
  /** 길게 누르기 — 네이티브 onLongPress. 웹은 미지원（폐기） */
  onLongPress?: () => void;
  /** 키 입력（웹 키보드 탐색조정） — 웹 onKeyDown. 네이티브 미지원（폐기） */
  onKeyDown?: (event: BridgeKeyEvent) => void;
  /** RN 전용 터치 타깃 확장（px） — 웹에서는 무시 */
  hitSlop?: number | { top: number; bottom: number; left: number; right: number };
  nativeID?: string;
  testID?: string;
};

export type ImageProps = {
  className?: string;
  /** 동적 값 전용 인라인 스타일（정적 스타일은 className 원칙） */
  style?: BridgeStyle;
  /** 원격 이미지 — 네이티브 RN source, 웹 img src. require（） 정적 소스는 네이티브 전용 */
  source: { uri: string };
  /** 웹 img alt — 네이티브에서는 accessibilityLabel로 전달된다 */
  alt?: string;
  /** 로드 실패 콜백（무인자） — Avatar 등의 폴백 전환용 */
  onError?: () => void;
  accessibilityLabel?: string;
  nativeID?: string;
  testID?: string;
};

export type TextInputProps = {
  className?: string;
  /** 동적 값 전용 인라인 스타일（정적 스타일은 className 원칙） */
  style?: BridgeStyle;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  /** RN 관용 — 웹에서는 readOnly로 치환 */
  editable?: boolean;
  /** 웹 관용 disabled — 네이티브에서는 editable={false}로 치환된다（Input이 처리） */
  disabled?: boolean;
  onChangeText?: (text: string) => void;
  nativeID?: string;
  testID?: string;
  /** 웹 DOM에서 aria-labelledby로 전달 — 입력창↔라벨 연결 */
  accessibilityLabelledBy?: string;
  /** RN 0.7x+ 관용 — 웹 DOM에서도 동일 속성으로 전달된다 */
  "aria-disabled"?: boolean;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
  inputMode?: "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  /** 여러 줄 입력 — 네이티브 RN multiline, 웹은 <input> 대신 <textarea>로 렌더 */
  multiline?: boolean;
  /** 최대 글자 수（input-otp 셀 등） — 양측 표준 속성 */
  maxLength?: number;
  /** 키 입력（command 방향키엔터 등） — 웹 onKeyDown,
   *  네이티브 onKeyPress（{key}）를 이 시그니처로 래핑（변환 불가 키는 미발화） */
  onKeyDown?: (event: BridgeKeyEvent) => void;
  /** 오류 상태（form 연결） — 웹 aria-invalid. 네이티브 미지원（한계） */
  "aria-invalid"?: boolean;
  /** 보조 설명 연결（오류 메시지 등, nativeID） — 웹 aria-describedby. 네이티브 미지원（한계） */
  "aria-describedby"?: string;
  /** 입력 라벨 — 웹 input aria-label, 네이티브 TextInput accessibilityLabel
   *  （T-2a 제기 — form 라벨 연결OTP 등） */
  accessibilityLabel?: string;
  /** 포커스 진입（무인자） — input-otp 활성 셀input-group 포커스 링 등 */
  onFocus?: () => void;
  /** 포커스 이탈（무인자） */
  onBlur?: () => void;
};

// ---------------------------------------------------------------------------
// Refs — 컴포넌트가 실제로 호출하는 메서드만 계약으로 선언（구조적 타이핑）.
// 네이티브 인스턴스（RN）와 DOM 요소（웹） 모두 이 인터페이스를 충족한다.
// ---------------------------------------------------------------------------

export interface BridgeViewRef {}
export interface BridgeTextRef {}
export interface BridgePressableRef {}
export interface BridgeImageRef {}
export interface BridgeTextInputRef {
  focus(): void;
  blur(): void;
}

// ---------------------------------------------------------------------------
// 사이클 40 신규 계약 — PortalScrollViewSelectmeasure드래그오버레이 훈
// ---------------------------------------------------------------------------

/** 웹 KeyboardEventRN onKeyPress의 공통 최소 형태（구조적 타이핑） */
export type BridgeKeyEvent = {
  key: string;
  preventDefault: () => void;
};

/** 포털 — 부모 레이아웃을 벗어난 최상위 렌더（dialogpopovertoast 등）.
 *  웹 createPortal（document.body） / 네이티브 RN Modal（transparent）. */
export type PortalProps = {
  children?: ReactNode;
  visible: boolean;
  /** 백드롭（배경） 눌림 — 웹 백드롭 onPointerDown, 네이티브 Modal 배경 Pressable.
   *  기본 백드롭은 투명한 클릭 포착층（배경색은 backdropClassName으로） */
  onBackdropPress?: () => void;
  /** 닫기 요청 — 네이티브 Modal onRequestClose（안드로이드 뒤로가기）, 웹은 사용측이 ESC와 연결 */
  onRequestClose?: () => void;
  /** 백드롭 추가 클래스（z-index배경색 — 예: "z-40 bg-background/80"） */
  backdropClassName?: string;
  /** 모달성（기본 true） — 네이티브에서만 유효. true면 RN Modal（배경 조작 차단
   *  OS 뒤로가기 연결）, false면 절대 배치 View로 렌더해 배경 조작을 막지 않는다
   *  （토스트 등 비모달 오버레이 — T-3b 제기）. 이때 화면 최상위 배치는 소비자가
   *  루트에 두는 것으로 보증한다. 웹 포털은 원래 비모달이라 무시된다. */
  modal?: boolean;
};

/** 스크롤 영역 — 웹 overflow div / 네이티브 RN ScrollView. ref로 scrollTo. */
export type ScrollViewProps = ViewProps & {
  /** 스크롤 콘텐츠 컨테이너 클래스（패딩간격 등） */
  contentContainerClassName?: string;
  /** 가로 축 스크롤（carousel 등） */
  horizontal?: boolean;
  /** 페이지 단위 스냅（carousel） — 웹 scroll-snap, RN pagingEnabled */
  pagingEnabled?: boolean;
  /** 스크롤 이벤트（무인자 — 페이징 감지 등） */
  onScroll?: () => void;
  /** RN 관용 — 웹 구현은 받아 두고 폐기（웹은 표준 키보드-스크롤 상호작용） */
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
  /** 〃 */
  keyboardDismissMode?: "none" | "on-drag" | "interactive";
};

export interface BridgeScrollViewRef {
  scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
}

/** 기본 셀렉트 — 웹 <select>/<option>, 네이티브 Pressable 트리거+Modal 목록 폴백.
 *  커스텀 셀렉트（select 컴포넌트）는 이 프리미티브 대신 popover 기반 자체 구현. */
export type SelectProps = {
  className?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
  disabled?: boolean;
  /** 웹 select aria-label / 네이티브 트리거 accessibilityLabel */
  accessibilityLabel?: string;
  nativeID?: string;
  testID?: string;
};

export type SelectOptionProps = {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
};

/** measure 콜백 — 뷰포트（창） 기준 좌표로 양측 동일 시맨틱.
 *  웹 getBoundingClientRect（이미 뷰포트 좌표） / RN ref.measure（pageX/pageY 창 기준）.
 *  오버레이 위치 계산（lib/overlay）이 소비한다 — fixed 배치와 정합（§2.1）. */
export type MeasureCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

/** ref를 측정하는 공통 함수 계약（웹네이티브 구현이 각각 export） */
export type MeasureInWindow = (
  ref: unknown,
  callback: MeasureCallback,
) => void;

/** 드래그 이동 이벤트 — 웹 PointerEventRN 제스처의 공통 형태 */
export type BridgeDragEvent = {
  /** 이동 중 절대（뷰포트） 좌표 */
  x: number;
  y: number;
  /** 제스처 시작점 기준 누적 이동 */
  dx: number;
  dy: number;
};

export type UseDragOptions = {
  onBegin?: () => void;
  onMove?: (event: BridgeDragEvent) => void;
  onEnd?: () => void;
};

export type UseDragResult = {
  /** 뷰에 펼쳐 넣는 핸들러 세트（웹 포인터 이벤트 / RN PanResponder） */
  dragHandlers: Record<string, unknown>;
  dragging: boolean;
};

// ---------------------------------------------------------------------------
// 오버레이 공통 훈 계약 — 웹은 DOM 구현, 네이티브는 no-op（RN Modal이 OS 수준으로
// 처리: 포커스 이동화면 고정）. lib/overlay가 소비해 한 벌 소스를 유지한다.
// ---------------------------------------------------------------------------

/**
 * 오버레이 포커스 관리（42-design-plan §2.1）. active=true가 되면 target 내 첫
 * 포커서블로 포커스를 옮기고 Tab 순환을 target 안에 가두며, false에서
 * returnTo（트리거）로 포커스를 되돌린다. 웹 전용 구현.
 */
export type UseOverlayFocus = (
  target: unknown,
  active: boolean,
  returnTo?: unknown,
) => void;

/** ESC 닫기（웹 document keydown）. 네이티브는 no-op — Modal onRequestClose가 담당 */
export type UseDismiss = (onDismiss: () => void, active: boolean) => void;

/** 열림 중 재배치 신호（웹 scrollresize → listener 재호출）.
 *  네이티브는 no-op — Modal이 창 좌표 고정（한계 기록） */
export type UseReposition = (listener: () => void, active: boolean) => void;

/** 배경 스크롤 잠금（웹 body overflow hidden）. 네이티브는 no-op — Modal이 차단 */
export type UseScrollLock = (active: boolean) => void;

/** 뷰포트（창） 크기 — 웹 window.innerWidth/innerHeight, 네이티브
 *  Dimensions.get（"window"）. 오버레이 위치 클램프（lib/overlay）가 소비.
 *  SSR 등 창을 알 수 없으면 0을 반환한다（클램프 건너뜀）. */
export type GetViewport = () => { width: number; height: number };

// ---------------------------------------------------------------------------
// 루프 애니메이션 래퍼 — 단일 소스 컴포넌트가 양쪽에서 같은 시각 효과를 갖게
// 하는 계약. 컴포넌트는 (1) 웹용 web:animate-* 클래스와 (2) 이 래퍼를 함께
// 쓴다 — 웹은 CSS keyframes가 효과를 담당해 래퍼가 투명(프래그먼트)하고,
// 네이티브는 uniwind가 keyframes를 구동 못 해 래퍼의 RN Animated가 같은
// 효과를 UI 스레드(useNativeDriver)로 구동한다. durationMs는 CSS 표준값과
// 동일하게 맞춘다.
// ---------------------------------------------------------------------------

/** 무한 회전 래퍼 — 웹 animate-spin(1s linear) 대응. spinner·sonner loading. */
export type LoopRotateProps = {
  children?: ReactNode;
  /** 1회전 시간(ms) — CSS animate-spin 기본값 1000 */
  durationMs?: number;
};

/** 투명도 맥동 래퍼 — 웹 animate-pulse(2s, 50% opacity .5) 대응. skeleton·캐럿. */
export type LoopPulseProps = {
  children?: ReactNode;
  /** 1맥동 주기(ms) — CSS animate-pulse 기본값 2000 */
  durationMs?: number;
};

/**
 * 색 스킴을 스타일링 엔진에 반영한다（UnikitThemeProvider가 호출）.
 * - native.tsx → uniwind `Uniwind.setTheme（）`（native 표준 다이얼로그까지 동기）
 * - web.tsx → document.documentElement의 `.dark` 클래스 토글（표준 Tailwind dark 변형）
 */
export type ApplyColorScheme = (colorScheme: BridgeColorScheme) => void;

// ---------------------------------------------------------------------------
// 유니버설 벡터 아이콘 타입 — lucide（웹 lucide-react / 네이티브 lucide-react-native）
// ---------------------------------------------------------------------------

export type IconProps = {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  style?: BridgeStyle;
  "aria-hidden"?: boolean | "true" | "false";
};

export type IconComponent = (props: IconProps) => ReactElement | null;

/**
 * 레이아웃 전이 애니메이션 함수 — 네이티브는 LayoutAnimation을 구동해
 * 토글/확장/탭 변경 시 부드러운 전이를 제공하고, 웹은 CSS transition이 처리해 no-op.
 */
export type AnimateLayoutFn = () => void;

// ---------------------------------------------------------------------------
// 단일 import 원칙(AC-1) 확장 — 소비 화면 코드가 react-native를 직접 import하지
// 않고 그룹 목록·앱 API를 쓰게 하는 계약. SectionList는 렌더 프리미티브
// （웹 DOM 구현 / 네이티브 RN 재노출）, Platform·Dimensions·Share·
// KeyboardAvoidingView는 앱 API（웹 폴백 / 네이티브 RN 재노출）.
// ---------------------------------------------------------------------------

/** SectionList 섹션 — 최소 계약. 항목 key는 keyExtractor, 섹션 key는 title 폴백. */
export type SectionListSection<T = unknown> = {
  title?: string;
  data: readonly T[];
};

/** renderItem 정보 — RN SectionList 하위 집합. index는 섹션 내 위치. */
export type SectionListRenderItemInfo<T> = {
  item: T;
  index: number;
  section: SectionListSection<T>;
};

/** List 계열 슬롯 — 요소 또는 프로퍼티 없는 컴포넌트(RN 관용의 실용 부분집합). */
export type SectionListNode = ReactElement | ComponentType<Record<string, never>> | null;

/** 그룹 목록 — 웹은 overflow div + 섹션 순회 렌더 / 네이티브 RN SectionList 재노출. */
export type SectionListProps<T = unknown> = Omit<
  ScrollViewProps,
  "children" | "horizontal" | "pagingEnabled" | "onScroll"
> & {
  sections: ReadonlyArray<SectionListSection<T>>;
  renderItem: (info: SectionListRenderItemInfo<T>) => ReactNode;
  /** 항목 key — 미지정 시 index 폴백 */
  keyExtractor?: (item: T, index: number) => string;
  renderSectionHeader?: (info: { section: SectionListSection<T> }) => ReactNode;
  /** 섹션 헤더 고정(기본 true) — 웹 position:sticky / RN 관용 그대로 */
  stickySectionHeadersEnabled?: boolean;
  ListHeaderComponent?: SectionListNode;
  ListEmptyComponent?: SectionListNode;
  ListFooterComponent?: SectionListNode;
};

export type SectionListComponent = <T>(
  props: SectionListProps<T>,
) => ReactElement | null;

/** Platform — 웹 {OS:"web"} / 네이티브 RN Platform 재노출. select는 OS 키 → default 순. */
export type BridgePlatformOS = "ios" | "android" | "macos" | "windows" | "web";
export type BridgePlatformSelectSpec<T> = Partial<
  Record<BridgePlatformOS | "native" | "default", T>
>;
export type BridgePlatformStatic = {
  readonly OS: BridgePlatformOS;
  select<T>(spec: BridgePlatformSelectSpec<T>): T | undefined;
};

/** Dimensions — 웹 window/screen 치수 + resize 구독 / 네이티브 RN Dimensions 재노출. */
export type BridgeDimensionsSnapshot = {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
};
export type BridgeDimensions = {
  get(dim: "window" | "screen"): BridgeDimensionsSnapshot;
  addEventListener(
    type: "change",
    handler: (dims: {
      window: BridgeDimensionsSnapshot;
      screen: BridgeDimensionsSnapshot;
    }) => void,
  ): { remove(): void };
};

/** Share — 웹 navigator.share(미지원 환경은 dismissed로 해소) / 네이티브 RN Share 재노출. */
export type BridgeShare = {
  share(
    content: { message?: string; url?: string; title?: string },
    options?: { dialogTitle?: string },
  ): Promise<{ action: "shared" | "dismissed" }>;
};

/** 키보드 회피 — 웹은 투명 View(브라우저 가상 키보드-뷰포트가 회피를 담당) /
 *  네이티브 RN KeyboardAvoidingView 재노출. */
export type KeyboardAvoidingViewProps = ViewProps & {
  behavior?: "height" | "position" | "padding";
  keyboardVerticalOffset?: number;
};
export type KeyboardAvoidingViewComponent = (
  props: KeyboardAvoidingViewProps,
) => ReactElement | null;

