/**
 * 웹 브리지 — 표준 Tailwind CSS v4 소비자용(Next.js/Vite 등).
 *
 * 같은 className 문자열을 DOM 요소에 그대로 얹는다. 스타일링 엔진이 별도로
 * 필요하지 않다 — 소비자 앱의 Tailwind CSS가 클래스를 생성하고 브라우저가
 * 적용한다(hover/focus-visible/:active 등 웹 전용 변형도 CSS 표준 동작).
 *
 * RN 프리미티브 관용 프로퍼티는 DOM 속성으로 치환된다:
 *   onPress→onClick · accessibilityLabel→aria-label · nativeID→id ·
 *   accessibilityLabelledBy→aria-labelledby · editable→readOnly ·
 *   secureTextEntry→type="password" · onChangeText→onChange(value 추출)
 * hitSlop은 웹에서 무시된다(포인터 정밀도가 높아 불필요).
 */
import { forwardRef, type ChangeEvent } from "react";

import { cn } from "../lib/utils";
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
// View → <div> — RN View 기본값(display:flex, flexDirection:column)을
// 기본 클래스로 재현한다. 충돌 시 tailwind-merge(cn)이 방향 유틸리티를 정리한다.
// ---------------------------------------------------------------------------
const View = forwardRef<BridgeViewRef, ViewProps>(
  ({ className, children, nativeID, testID, ...rest }, ref) => (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      id={nativeID}
      data-testid={testID}
      className={cn("flex flex-col", className)}
      {...rest}
    >
      {children}
    </div>
  ),
);
View.displayName = "View";

// ---------------------------------------------------------------------------
// Text → <span>
// ---------------------------------------------------------------------------
const Text = forwardRef<BridgeTextRef, TextProps>(
  ({ className, children, nativeID, testID, onPress, ...rest }, ref) => (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      id={nativeID}
      data-testid={testID}
      className={className}
      onClick={onPress}
      {...rest}
    >
      {children}
    </span>
  ),
);
Text.displayName = "Text";

// ---------------------------------------------------------------------------
// Pressable → <button type="button">
// disabled는 네이티브 속성으로 전달돼 CSS :disabled/disabled: 변형과 포커스·클릭
// 차단이 함께 동작한다. active: 변형은 브라우저 :active와 대응한다.
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
      nativeID,
      testID,
      hitSlop: _hitSlop,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      id={nativeID}
      data-testid={testID}
      className={className}
      onClick={onPress}
      disabled={disabled}
      aria-label={accessibilityLabel}
      role={accessibilityRole}
      {...rest}
    >
      {children}
    </button>
  ),
);
Pressable.displayName = "Pressable";

// ---------------------------------------------------------------------------
// TextInput → <input>
// ---------------------------------------------------------------------------
const TextInput = forwardRef<BridgeTextInputRef, TextInputProps>(
  (
    {
      className,
      value,
      defaultValue,
      placeholder,
      editable,
      disabled,
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
  ) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChangeText?.(event.target.value);
    };
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        id={nativeID}
        data-testid={testID}
        aria-labelledby={accessibilityLabelledBy}
        className={className}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={editable === false}
        autoFocus={autoFocus}
        type={secureTextEntry ? "password" : undefined}
        inputMode={inputMode}
        onChange={handleChange}
        {...rest}
      />
    );
  },
);
TextInput.displayName = "TextInput";

// ---------------------------------------------------------------------------
// 테마 바인딩
// ---------------------------------------------------------------------------
/** 색 스킴 → 문서 루트의 .dark 클래스(표준 Tailwind dark 변형 — @custom-variant dark) */
const applyColorScheme: ApplyColorScheme = (colorScheme) => {
  document.documentElement.classList.toggle("dark", colorScheme === "dark");
};

export { View, Text, Pressable, TextInput, applyColorScheme };
