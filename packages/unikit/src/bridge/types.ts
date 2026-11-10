/**
 * 브리지 프리미티브의 공개 타입 — 플랫폼 공통 부분집합.
 *
 * `@unikit-bridge/ui/primitives`는 package.json exports의 조건분기로 해석된다:
 * - 네이티브(Metro, "react-native" 조건) → native.tsx — RN View/Text/Pressable/TextInput
 *   + uniwind(className을 RN 스타일로 컴파일)
 * - 웹(Next/Vite 등, "default" 조건) → web.tsx — div/span/button/input에 className을
 *   그대로 싣고 표준 Tailwind CSS v4가 스타일링한다
 *
 * 두 구현 모두 이 파일의 타입을 충족해야 한다(컴포넌트 소스는 플랫폼 무관하게
 * 한 벌로 컴파일된다). 프로퍼티는 v0.1 컴포넌트·데모가 실제 쓰는 공통 부분집합이며,
 * 플랫폼 고유 프로퍼티(hitSlop 등)는 웹에서 무시된다.
 */
import type { ReactNode } from "react";

export type BridgeColorScheme = "light" | "dark";

/**
 * 플랫폼 공통 인라인 스타일 최소 계약 — className 문자열로 표현할 수 없는
 * 동적 값(진행률 폭 %, 가로세로 비율 등)용. RN 스타일 객체와 DOM
 * CSSProperties의 실용 교집합(프로퍼티 이름은 camelCase, 값은 문자열·숫자).
 * 정적 스타일은 여전히 className이 원칙이고, 여기는 동적 값 전용이다.
 */
export type BridgeStyle = Record<string, string | number | undefined>;

/**
 * 플랫폼 공통 접근성 역할 — RN accessibilityRole과 ARIA role의 교집합(컴포넌트
 * 카탈로그 확장 시 필요한 역할까지 포함). 웹에서는 그대로 role 속성이 된다.
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
  | "combobox";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ViewProps = {
  className?: string;
  /** 동적 값 전용 인라인 스타일(정적 스타일은 className 원칙) */
  style?: BridgeStyle;
  children?: ReactNode;
  /** 네이티브 nativeID — 웹에서는 id로 전달된다 */
  nativeID?: string;
  testID?: string;
  accessibilityRole?: BridgeRole;
  accessibilityLabel?: string;
  /** 장식용 요소 표시 — 웹 aria-hidden, 네이티브 accessibilityElementsHidden */
  "aria-hidden"?: boolean;
};

export type TextProps = {
  className?: string;
  /** 동적 값 전용 인라인 스타일(정적 스타일은 className 원칙) */
  style?: BridgeStyle;
  children?: ReactNode;
  nativeID?: string;
  testID?: string;
  onPress?: () => void;
  accessibilityRole?: BridgeRole;
  accessibilityLabel?: string;
};

export type PressableProps = {
  className?: string;
  /** 동적 값 전용 인라인 스타일(정적 스타일은 className 원칙) */
  style?: BridgeStyle;
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: BridgeRole;
  /** RN 0.7x+ 관용 — 웹 DOM에서도 동일 속성으로 전달된다 */
  "aria-disabled"?: boolean;
  /** 눌림 유지형 컨트롤(toggle) 상태 — 웹 DOM 그대로, 네이티브는 시각 상태로만 반영 */
  "aria-pressed"?: boolean;
  /** 체크형 컨트롤(checkbox/radio/switch) 상태 — 네이티브 accessibilityState.checked로 */
  "aria-checked"?: boolean | "mixed";
  /** 탭·옵션 등 선택 상태 — 네이티브 accessibilityState.selected로 */
  "aria-selected"?: boolean;
  /** 아코디언·콤보박스 등 전개 상태 — 네이티브 accessibilityState.expanded로 */
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-labelledby"?: string;
  /** RN 전용 터치 타깃 확장(px) — 웹에서는 무시 */
  hitSlop?: number | { top: number; bottom: number; left: number; right: number };
  nativeID?: string;
  testID?: string;
};

export type ImageProps = {
  className?: string;
  /** 동적 값 전용 인라인 스타일(정적 스타일은 className 원칙) */
  style?: BridgeStyle;
  /** 원격 이미지 — 네이티브 RN source, 웹 img src. require() 정적 소스는 네이티브 전용 */
  source: { uri: string };
  /** 웹 img alt — 네이티브에서는 accessibilityLabel로 전달된다 */
  alt?: string;
  /** 로드 실패 콜백(무인자) — Avatar 등의 폴백 전환용 */
  onError?: () => void;
  accessibilityLabel?: string;
  nativeID?: string;
  testID?: string;
};

export type TextInputProps = {
  className?: string;
  /** 동적 값 전용 인라인 스타일(정적 스타일은 className 원칙) */
  style?: BridgeStyle;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  /** RN 관용 — 웹에서는 readOnly로 치환 */
  editable?: boolean;
  /** 웹 관용 disabled — 네이티브에서는 editable={false}로 치환된다(Input이 처리) */
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
};

// ---------------------------------------------------------------------------
// Refs — 컴포넌트가 실제로 호출하는 메서드만 계약으로 선언(구조적 타이핑).
// 네이티브 인스턴스(RN)와 DOM 요소(웹) 모두 이 인터페이스를 충족한다.
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
// 테마 엔진 바인딩
// ---------------------------------------------------------------------------

/**
 * 색 스킴을 스타일링 엔진에 반영한다(UnikitThemeProvider가 호출).
 * - native.tsx → uniwind `Uniwind.setTheme()`(native 표준 다이얼로그까지 동기)
 * - web.tsx → document.documentElement의 `.dark` 클래스 토글(표준 Tailwind dark 변형)
 */
export type ApplyColorScheme = (colorScheme: BridgeColorScheme) => void;
