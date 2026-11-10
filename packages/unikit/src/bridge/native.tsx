/**
 * 네이티브 브리지 — React Native(iOS/Android) + uniwind 소비자용.
 *
 * RN 프리미티브를 그대로 재노출한다. className은 uniwind가 빌드 타임에
 * RN 스타일로 컴파일한다(metro.config.js의 withUniwindConfig — 앱 책임).
 * RN 관용 프로퍼티(hitSlop 등)는 네이티브 그대로 전달된다.
 *
 * 웹 관용 프로퍼티는 RN 관용으로 치환한다:
 *   disabled(버튼)→ RN 표준 disabled · onChangeText는 RN 표준 그대로
 * aria-* 프로퍼티는 RN 0.7x+가 네이티브 관용으로 지원한다.
 */
import { forwardRef, type Ref } from "react";
import {
  Image as RNImage,
  Pressable as RNPressable,
  Text as RNText,
  TextInput as RNTextInput,
  View as RNView,
  type ImageInstance,
  type ImageStyle,
  type PressableInstance,
  type TextInstance,
  type TextStyle,
  type TextInputInstance,
  type ViewInstance,
  type ViewStyle,
} from "react-native";
import { Uniwind } from "uniwind";

import type {
  ApplyColorScheme,
  BridgeImageRef,
  BridgePressableRef,
  BridgeTextRef,
  BridgeTextInputRef,
  BridgeViewRef,
  ImageProps,
  PressableProps,
  TextProps,
  TextInputProps,
  ViewProps,
} from "./types";

// 공유 타입 전량 재수출 — 소비자는 @unikit-bridge/ui/primitives에서 타입까지 한 번에 import
export type * from "./types";

// ---------------------------------------------------------------------------
// View — RN View 재노출(타입만 브리지 계약으로 좁힌다)
// ---------------------------------------------------------------------------
const View = forwardRef<BridgeViewRef, ViewProps>(
  (
    {
      className,
      style,
      children,
      nativeID,
      testID,
      accessibilityRole,
      accessibilityLabel,
      "aria-hidden": ariaHidden,
      ...rest
    },
    ref,
  ) => (
    <RNView
      ref={ref as Ref<ViewInstance>}
      nativeID={nativeID}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      aria-hidden={ariaHidden}
      accessibilityElementsHidden={ariaHidden}
      className={className}
      style={style as ViewStyle}
      {...rest}
    >
      {children}
    </RNView>
  ),
);
View.displayName = "View";

// ---------------------------------------------------------------------------
// Text — RN Text 재노출
// ---------------------------------------------------------------------------
const Text = forwardRef<BridgeTextRef, TextProps>(
  (
    {
      className,
      style,
      children,
      nativeID,
      testID,
      onPress,
      accessibilityRole,
      accessibilityLabel,
      ...rest
    },
    ref,
  ) => (
    <RNText
      ref={ref as Ref<TextInstance>}
      nativeID={nativeID}
      testID={testID}
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      className={className}
      style={style as TextStyle}
      {...rest}
    >
      {children}
    </RNText>
  ),
);
Text.displayName = "Text";

// ---------------------------------------------------------------------------
// Pressable — RN Pressable 재노출. onPress는 RN 시그니처(이벤트 인자)를
// 무인자로 좁혀 브리지 계약과 맞춘다(컴포넌트·데모는 무인자 콜백만 쓴다).
// ---------------------------------------------------------------------------
// aria-* 상태 프로퍼티는 RN 0.77+ 네이티브 관용 별칭으로 그대로 전달한다.
// react-native-web(Expo web 등)은 accessibilityState를 0.21부터 폐기하고
// aria-* 직접 전달만 DOM 속성으로 렌더하므로, 양쪽 모두 aria-* 경로가 정답.
// 네이티브 실기기에서도 동일 값을 accessibilityState로 명시 전달해 구버전
// 스크린리더 호환을 유지한다(코어는 aria-* 별칭을 같은 상태로 병합).
function toAccessibilityState(props: {
  disabled?: boolean;
  "aria-checked"?: boolean | "mixed";
  "aria-selected"?: boolean;
  "aria-expanded"?: boolean;
}) {
  const state: {
    disabled?: boolean;
    checked?: boolean | "mixed";
    selected?: boolean;
    expanded?: boolean;
  } = {};
  if (props.disabled !== undefined) state.disabled = props.disabled;
  if (props["aria-checked"] !== undefined) state.checked = props["aria-checked"];
  if (props["aria-selected"] !== undefined) state.selected = props["aria-selected"];
  if (props["aria-expanded"] !== undefined) state.expanded = props["aria-expanded"];
  return Object.keys(state).length > 0 ? state : undefined;
}

const Pressable = forwardRef<BridgePressableRef, PressableProps>(
  (
    {
      className,
      style,
      children,
      onPress,
      disabled,
      accessibilityLabel,
      accessibilityRole,
      "aria-disabled": ariaDisabled,
      "aria-pressed": ariaPressed,
      "aria-checked": ariaChecked,
      "aria-selected": ariaSelected,
      "aria-expanded": ariaExpanded,
      "aria-controls": ariaControls,
      "aria-labelledby": ariaLabelledBy,
      hitSlop,
      nativeID,
      testID,
      ...rest
    },
    ref,
  ) => (
    <RNPressable
      // BridgePressableRef(구조적 최소 계약) ↔ RN PressableInstance 불일치를
      // unknown 경유 이중 단언으로만 해소 — any 사용 금지(M-3).
      ref={ref as unknown as Ref<PressableInstance>}
      nativeID={nativeID}
      testID={testID}
      onPress={onPress ? () => onPress() : undefined}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      aria-disabled={ariaDisabled}
      aria-checked={ariaChecked}
      aria-selected={ariaSelected}
      aria-expanded={ariaExpanded}
      aria-labelledby={ariaLabelledBy}
      accessibilityState={toAccessibilityState({
        disabled,
        "aria-checked": ariaChecked,
        "aria-selected": ariaSelected,
        "aria-expanded": ariaExpanded,
      })}
      // aria-pressed(toggle)·aria-controls(tab↔panel 연결)은 RN 코어 타입에
      // 없는 RNW 전용 속성 — 무형 스프레드로 전달(네이티브에서는 폐기됨).
      {...({
        "aria-pressed": ariaPressed,
        "aria-controls": ariaControls,
      } as Record<string, unknown>)}
      hitSlop={hitSlop}
      className={className}
      style={style as ViewStyle}
      {...rest}
    >
      {children}
    </RNPressable>
  ),
);
Pressable.displayName = "Pressable";

// ---------------------------------------------------------------------------
// TextInput — RN TextInput 재노출. 웹 관용 disabled는 네이티브 표준 속성이
// 아니므로 여기서는 버린다(입력 차단 치환 editable={false}는 Input이 수행).
// ---------------------------------------------------------------------------
const TextInput = forwardRef<BridgeTextInputRef, TextInputProps>(
  (
    {
      className,
      style,
      value,
      defaultValue,
      placeholder,
      editable,
      disabled: _disabled, // 웹 관용 — 네이티브는 위 editable 치환으로 이미 반영됨
      onChangeText,
      nativeID,
      testID,
      accessibilityLabelledBy,
      autoFocus,
      secureTextEntry,
      inputMode,
      multiline,
      ...rest
    },
    ref,
  ) => (
    <RNTextInput
      ref={ref as Ref<TextInputInstance>}
      nativeID={nativeID}
      testID={testID}
      accessibilityLabelledBy={accessibilityLabelledBy}
      className={className}
      style={style as TextStyle}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      editable={editable}
      onChangeText={onChangeText}
      autoFocus={autoFocus}
      secureTextEntry={secureTextEntry}
      inputMode={inputMode}
      multiline={multiline}
      {...rest}
    />
  ),
);
TextInput.displayName = "TextInput";

// ---------------------------------------------------------------------------
// Image — RN Image 재노출. 원격 {uri} 소스만 브리지 공통 계약으로 한다
// (require() 정적 소스는 네이티브 전용 기능이므로 타입에서 제외).
// ---------------------------------------------------------------------------
const Image = forwardRef<BridgeImageRef, ImageProps>(
  (
    {
      className,
      style,
      source,
      alt: _alt, // 웹 관용 — 네이티브는 accessibilityLabel이 스크린리더 텍스트
      onError,
      accessibilityLabel,
      nativeID,
      testID,
      ...rest
    },
    ref,
  ) => (
    <RNImage
      ref={ref as Ref<ImageInstance>}
      nativeID={nativeID}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      source={source}
      className={className}
      style={style as ImageStyle}
      onError={onError ? () => onError() : undefined}
      {...rest}
    />
  ),
);
Image.displayName = "Image";

// ---------------------------------------------------------------------------
// 테마 바인딩
// ---------------------------------------------------------------------------
/** 색 스킴 → uniwind 활성 테마. setTheme은 Appearance.setColorScheme도 호출해
 *  Alert·Modal 등 시스템 UI가 앱 테마를 따르게 한다.
 *  정적 import가 안전한 이유: 웹 번들은 exports "default" 조건으로 web.tsx만
 *  로드하므로 이 파일(와 uniwind 의존)은 네이티브 그래프에만 존재한다. */
const applyColorScheme: ApplyColorScheme = (colorScheme) => {
  Uniwind.setTheme(colorScheme);
};

export { View, Text, Pressable, TextInput, Image, applyColorScheme };
