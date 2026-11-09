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
  Pressable as RNPressable,
  Text as RNText,
  TextInput as RNTextInput,
  View as RNView,
  type PressableInstance,
  type TextInstance,
  type TextInputInstance,
  type ViewInstance,
} from "react-native";
import { Uniwind } from "uniwind";

import type {
  ApplyColorScheme,
  BridgePressableRef,
  BridgeTextRef,
  BridgeTextInputRef,
  BridgeViewRef,
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
  ({ className, children, nativeID, testID, ...rest }, ref) => (
    <RNView
      ref={ref as Ref<ViewInstance>}
      nativeID={nativeID}
      testID={testID}
      className={className}
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
  ({ className, children, nativeID, testID, onPress, ...rest }, ref) => (
    <RNText
      ref={ref as Ref<TextInstance>}
      nativeID={nativeID}
      testID={testID}
      onPress={onPress}
      className={className}
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
const Pressable = forwardRef<BridgePressableRef, PressableProps>(
  (
    {
      className,
      children,
      onPress,
      disabled,
      accessibilityLabel,
      accessibilityRole,
      hitSlop,
      nativeID,
      testID,
      ...rest
    },
    ref,
  ) => (
    <RNPressable
      ref={ref as Ref<PressableInstance>}
      nativeID={nativeID}
      testID={testID}
      onPress={onPress ? () => onPress() : undefined}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      hitSlop={hitSlop}
      className={className}
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
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      editable={editable}
      onChangeText={onChangeText}
      autoFocus={autoFocus}
      secureTextEntry={secureTextEntry}
      inputMode={inputMode}
      {...rest}
    />
  ),
);
TextInput.displayName = "TextInput";

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

export { View, Text, Pressable, TextInput, applyColorScheme };
