/**
 * 네이티브 브리지 — React Native（iOS/Android） + uniwind 소비자용.
 *
 * RN 프리미티브를 그대로 재노출한다. className은 uniwind가 빌드 타임에
 * RN 스타일로 컴파일한다（metro.config.js의 withUniwindConfig — 앱 책임）.
 * RN 관용 프로퍼티（hitSlop 등）는 네이티브 그대로 전달된다.
 *
 * 웹 관용 프로퍼티는 RN 관용으로 치환한다:
 *   disabled（버튼）→ RN 표준 disabled · onChangeText는 RN 표준 그대로
 * aria-* 프로퍼티는 RN 0.7x+가 네이티브 관용으로 지원한다.
 *
 * 사이클 40 확장（잔여 shadcn 33종 이식 지원）: Portal（RN Modal transparent）
 * ScrollView（RN ScrollView + ref scrollTo）Select/SelectOption（Pressable
 * 트리거 + Modal 목록 폴백 — 웹 <select> 대응）measureInWindow（ref.measure）
 * useDrag（PanResponder）오버레이 훈 4종은 no-op（RN Modal이 OS 수준에서
 * 포커스ESC（뒤로가기）스크롤 잠금을 처리）.
 * 루프 애니메이션 래퍼 LoopRotate/LoopPulse — RN Animated useNativeDriver
 * （UI 스레드）로 web:animate-spin/pulse와 같은 효과를 구동（웹은 투명）.
 *
 * 단일 import 원칙(AC-1) 확장: SectionList·KeyboardAvoidingView·Platform·
 * Dimensions·Share를 RN에서 재노출한다 — 소비 화면 코드가 react-native를
 * 직접 import하지 않아도 양 플랫폼에서 동작한다. web.tsx는 같은 이름의
 * DOM 폴백을 제공한다.
 *
 * 웹 전용 계약의 네이티브 한계（컴포넌트 머리 주석에 기록됨）:
 *   aria-currentaria-invalidaria-describedby → RN 계약 없음, 폐기
 *   Pressable onKeyDown → 폐기（웹 키보드 탐색 전용）
 *   TextInput onKeyDown → RN onKeyPress（{key}）로 래핑（preventDefault는 no-op）
 *   useReposition → no-op（모달이 창 좌표에 고정, 재배치 불필요불가）
 */
import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image as RNImage,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  LayoutAnimation,
  Modal as RNModal,
  PanResponder,
  Platform,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  SectionList as RNSectionList,
  Share,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  UIManager,
  View as RNView,
  type ImageInstance,
  type ImageStyle,
  type PressableInstance,
  type ScrollViewInstance,
  type TextInstance,
  type TextStyle,
  type TextInputInstance,
  type ViewInstance,
  type ViewStyle,
} from "react-native";
import { Uniwind } from "uniwind";
import {
  AlertCircleIcon as LucideAlertCircleIcon,
  ArrowDownIcon as LucideArrowDownIcon,
  ArrowLeftIcon as LucideArrowLeftIcon,
  ArrowRightIcon as LucideArrowRightIcon,
  ArrowUpIcon as LucideArrowUpIcon,
  CheckCircle2Icon as LucideCheckCircle2Icon,
  CheckIcon as LucideCheckIcon,
  ChevronDownIcon as LucideChevronDownIcon,
  ChevronLeftIcon as LucideChevronLeftIcon,
  ChevronRightIcon as LucideChevronRightIcon,
  ChevronUpIcon as LucideChevronUpIcon,
  CircleIcon as LucideCircleIcon,
  GripVerticalIcon as LucideGripVerticalIcon,
  InfoIcon as LucideInfoIcon,
  Loader2Icon as LucideLoader2Icon,
  MinusIcon as LucideMinusIcon,
  MoreHorizontalIcon as LucideMoreHorizontalIcon,
  PanelLeftIcon as LucidePanelLeftIcon,
  SearchIcon as LucideSearchIcon,
  XCircleIcon as LucideXCircleIcon,
  XIcon as LucideXIcon,
  type LucideIcon,
} from "lucide-react-native";

import { cn } from "../lib/utils";
import type {
  AnimateLayoutFn,
  ApplyColorScheme,
  BridgeImageRef,
  BridgePressableRef,
  BridgeScrollViewRef,
  BridgeTextRef,
  BridgeTextInputRef,
  IconProps,
  BridgeViewRef,
  ImageProps,
  LoopPulseProps,
  LoopRotateProps,
  MeasureCallback,
  MeasureInWindow,
  PortalProps,
  PressableProps,
  ScrollViewProps,
  SectionListComponent,
  KeyboardAvoidingViewComponent,
  SelectOptionProps,
  SelectProps,
  TextProps,
  TextInputProps,
  BridgeRole,
  GetViewport,
  UseDismiss,
  UseDragOptions,
  UseDragResult,
  UseOverlayFocus,
  UseReposition,
  UseScrollLock,
  ViewProps,
} from "./types";

// 공유 타입 전량 재수출 — 소비자는 @unikit-bridge/ui/primitives에서 타입까지 한 번에 import
export type * from "./types";

/** Tailwind 클래스 없이도 확정 동작하는 고정 스타일（백드롭은 StyleSheet.absoluteFill 토큰 사용） */
const STYLES = StyleSheet.create({
  selectList: { maxHeight: 288 },
});

// ---------------------------------------------------------------------------
// 접근성 역할 매핑 — 웹 ARIA role 중 RN 유효 목록에 없는 값(tabpanel·dialog·
// listbox 등)은 Android 런타임에서 "Invalid accessibility role value" 크래시를
// 낸다(2026-11-10 에뮬레이터 실증 — 기존 "네이티브에서 무시된다" 판단 정정).
// 컴포넌트는 웹 role을 그대로 쓰고 브리지가 근접 RN 값으로 치환한다
// (플랫폼 분기는 브리지가 담당한다는 원칙의 적용).
// ---------------------------------------------------------------------------
const RN_VALID_ROLES = new Set([
  "none", "button", "link", "search", "image", "keyboardkey", "text",
  "adjustable", "imagebutton", "header", "summary", "alert", "checkbox",
  "combobox", "menu", "menubar", "menuitem", "progressbar", "radio",
  "radiogroup", "scrollbar", "spinbutton", "switch", "tab", "tablist",
  "timer", "toolbar",
]);

/** RN에 없는 웹 role → 근접 RN 역할. 대응이 없으면 none으로 낮춘다. */
const RN_ROLE_FALLBACK: Partial<Record<BridgeRole, string>> = {
  // 오버레이 계열 — RN alert(중요 알림)이 가장 근접.
  dialog: "alert",
  alertdialog: "alert",
  // 웹 heading — RN은 header.
  heading: "header",
  // 범위 입력 — RN은 adjustable.
  slider: "adjustable",
};

const toNativeRole = (role?: BridgeRole) => {
  if (!role) return undefined;
  if (RN_VALID_ROLES.has(role)) return role;
  return RN_ROLE_FALLBACK[role] ?? "none";
};

// ---------------------------------------------------------------------------
// View — RN View 재노출（타입만 브리지 계약으로 좁힌다）.
// aria-modal → accessibilityViewIsModal, aria-describedby는 RN 계약 없음（폐기）.
// 인라인 style의 position:"fixed"（웹 포탈 오버레이 관용）은 RN에 없는 값이라
// "absolute"로 치환한다 — lib/overlay가 플랫폼 무관하게 fixed를 쓸 수 있게.
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
      "aria-modal": ariaModal,
      "aria-describedby": _ariaDescribedBy, // 웹 전용 — RN 미지원(한계)
      "aria-valuenow": ariaValueNow,
      "aria-valuemin": ariaValueMin,
      "aria-valuemax": ariaValueMax,
      "aria-expanded": _ariaExpanded, // 웹 전용 — RN 미지원(폐기)
      "aria-controls": _ariaControls, // 〃
      "aria-labelledby": _ariaLabelledBy, // 〃
      pointerEvents,
      ...rest
    },
    ref,
  ) => {
    // fixed → absolute 치환（RN은 absolute|relative만 지원）
    const resolvedStyle =
      style && (style as { position?: string }).position === "fixed"
        ? ({ ...style, position: "absolute" } as ViewStyle)
        : (style as ViewStyle);
    return (
      <RNView
        ref={ref as Ref<ViewInstance>}
        nativeID={nativeID}
        testID={testID}
        accessibilityRole={toNativeRole(accessibilityRole)}
        accessibilityLabel={accessibilityLabel}
        aria-hidden={ariaHidden}
        accessibilityElementsHidden={ariaHidden}
        accessibilityViewIsModal={ariaModal}
        accessibilityValue={toAccessibilityValue({
          "aria-valuenow": ariaValueNow,
          "aria-valuemin": ariaValueMin,
          "aria-valuemax": ariaValueMax,
        })}
        pointerEvents={pointerEvents}
        className={className}
        style={resolvedStyle}
        {...rest}
      >
        {children}
      </RNView>
    );
  },
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
      "aria-hidden": ariaHidden,
      ...rest
    },
    ref,
  ) => (
    <RNText
      ref={ref as Ref<TextInstance>}
      nativeID={nativeID}
      testID={testID}
      onPress={onPress}
      accessibilityRole={toNativeRole(accessibilityRole)}
      accessibilityLabel={accessibilityLabel}
      // 장식용 글리프 숨김（T-2a 제기） — View 관례와 동일 치환
      accessibilityElementsHidden={ariaHidden}
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
// Pressable — RN Pressable 재노출. onPress는 RN 시그니처（이벤트 인자）를
// 무인자로 좁혀 브리지 계약과 맞춘다（컴포넌트·데모는 무인자 콜백만 쓴다）.
// aria-* 상태 프로퍼티는 RN 0.77+ 네이티브 관용 별칭으로 그대로 전달한다.
// react-native-web（Expo web 등）은 accessibilityState를 0.21부터 폐기하고
// aria-* 직접 전달만 DOM 속성으로 렌더하므로, 양쪽 모두 aria-* 경로가 정답.
// 네이티브 실기기에서도 동일 값을 accessibilityState로 명시 전달해 구버전
// 스크린리더 호환을 유지한다（코어는 aria-* 별칭을 같은 상태로 병합）.
// ---------------------------------------------------------------------------
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

/** aria-value*（progressslider） → RN accessibilityValue（min/max/now） */
function toAccessibilityValue(props: {
  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
}) {
  const value: { min?: number; max?: number; now?: number } = {};
  if (props["aria-valuemin"] !== undefined) value.min = props["aria-valuemin"];
  if (props["aria-valuemax"] !== undefined) value.max = props["aria-valuemax"];
  if (props["aria-valuenow"] !== undefined) value.now = props["aria-valuenow"];
  return Object.keys(value).length > 0 ? value : undefined;
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
      "aria-valuenow": ariaValueNow,
      "aria-valuemin": ariaValueMin,
      "aria-valuemax": ariaValueMax,
      // 웹 전용 aria-* — RN 계약이 없어 네이티브에서 폐기（한계는 머리 주석 참조）
      "aria-current": _ariaCurrent,
      "aria-invalid": _ariaInvalid,
      "aria-describedby": _ariaDescribedBy,
      onContextMenu,
      onLongPress,
      onKeyDown: _onKeyDown,
      hitSlop,
      nativeID,
      testID,
      ...rest
    },
    ref,
  ) => {
    // context-menu（웹 우클릭）는 네이티브에서 길게 누르기로 매핑된다（§2.1）
    const longPress = onLongPress ?? onContextMenu;
    return (
      <RNPressable
        // BridgePressableRef（구조적 최소 계약） ↔ RN PressableInstance 불일치를
        // unknown 경유 이중 단언으로만 해소 — any 사용 금지（M-3）.
        ref={ref as unknown as Ref<PressableInstance>}
        nativeID={nativeID}
        testID={testID}
        onPress={onPress ? () => onPress() : undefined}
        onLongPress={longPress ? () => longPress() : undefined}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={toNativeRole(accessibilityRole)}
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
        accessibilityValue={toAccessibilityValue({
          "aria-valuenow": ariaValueNow,
          "aria-valuemin": ariaValueMin,
          "aria-valuemax": ariaValueMax,
        })}
        // aria-pressed（toggle）aria-controls（tab↔panel 연결）은 RN 코어 타입에
        // 없는 RNW 전용 속성 — 무형 스프레드로 전달（네이티브에서는 폐기됨）.
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
    );
  },
);
Pressable.displayName = "Pressable";

// ---------------------------------------------------------------------------
// TextInput — RN TextInput 재노출. 웹 관용 disabled는 네이티브 표준 속성이
// 아니므로 여기서는 버린다（입력 차단 치환 editable={false}는 Input이 수행）.
// onKeyDown（웹）은 RN onKeyPress（{key}）로 래핑 — 변환 불가 키는 미발화,
// preventDefault는 no-op（RN이 입력을 사전 차단하지 않는 한계）.
// aria-invalidaria-describedby는 RN 계약 없음（폐기）.
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
      maxLength,
      onKeyDown,
      "aria-invalid": _ariaInvalid,
      "aria-describedby": _ariaDescribedBy,
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
      maxLength={maxLength}
      onKeyPress={
        onKeyDown
          ? (event) =>
              onKeyDown({
                key: event.nativeEvent.key,
                preventDefault: () => {}, // RN 미지원 — no-op(한계)
              })
          : undefined
      }
      {...rest}
    />
  ),
);
TextInput.displayName = "TextInput";

// ---------------------------------------------------------------------------
// Image — RN Image 재노출. 원격 {uri} 소스만 브리지 공통 계약으로 한다
// （require（） 정적 소스는 네이티브 전용 기능이므로 타입에서 제외）.
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
// Portal — RN Modal（transparent）. 오버레이가 부모 레이아웃을 벗어나
// 최상위（실제로는 새 네이티브 창 계층）에 그려진다. onRequestClose는
// 안드로이드 하드웨어 뒤로가기iOS ESC（블루투스 키보드）에 발화한다.
// 백드롭은 onBackdropPress가 있을 때만 깔리고（절대 채움 Pressable）,
// 배경색정렬은 backdropClassName（컨테이너 View에 적용）로.
// modal={false}（비모달 — 토스트 등）면 Modal이 배경 터치를 차단하는 문제를
// 피하기 위해 RN Modal 대신 절대 배치 View로 렌더한다. 이 경로는 진짜
// 포털이 아니므로 소비자를 화면 루트에 두는 것이 전제다（머리주석 안내）.
// ---------------------------------------------------------------------------
const Portal = ({
  children,
  visible,
  onBackdropPress,
  onRequestClose,
  backdropClassName,
  modal = true,
}: PortalProps) => {
  if (!visible) return null;
  if (!modal) {
    return (
      <RNView
        pointerEvents="box-none"
        className={cn("absolute inset-0", backdropClassName)}
      >
        {children}
      </RNView>
    );
  }
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <RNView className={cn("flex-1", backdropClassName)}>
        {onBackdropPress ? (
          <RNPressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            style={StyleSheet.absoluteFill}
            onPress={onBackdropPress}
          />
        ) : null}
        {children}
      </RNView>
    </RNModal>
  );
};

// ---------------------------------------------------------------------------
// ScrollView — RN ScrollView 재노출. ref.scrollTo는 RN 표준 시그니처
// （x/y/animated） 그대로. 콘텐츠 정렬패딩은 내부 View의
// contentContainerClassName로（가로 스크롤 시 소비자가 "flex-row" 지정）.
// ---------------------------------------------------------------------------
const ScrollView = forwardRef<BridgeScrollViewRef, ScrollViewProps>(
  (
    {
      className,
      style,
      children,
      nativeID,
      testID,
      accessibilityRole,
      accessibilityLabel,
      contentContainerClassName,
      horizontal,
      pagingEnabled,
      onScroll,
      ...rest
    },
    ref,
  ) => (
    <RNScrollView
      ref={ref as unknown as Ref<ScrollViewInstance>}
      nativeID={nativeID}
      testID={testID}
      accessibilityRole={toNativeRole(accessibilityRole)}
      accessibilityLabel={accessibilityLabel}
      horizontal={horizontal}
      pagingEnabled={pagingEnabled}
      onScroll={onScroll ? () => onScroll() : undefined}
      scrollEventThrottle={16}
      className={className}
      style={style as ViewStyle}
      {...rest}
    >
      <RNView className={contentContainerClassName}>{children}</RNView>
    </RNScrollView>
  ),
);
ScrollView.displayName = "ScrollView";

// ---------------------------------------------------------------------------
// 단일 import 원칙(AC-1) 확장 — SectionList·KeyboardAvoidingView·Platform·
// Dimensions·Share는 RN 것을 그대로 재노출한다（타입만 브리지 계약으로 좁힌다.
// Platform·Dimensions·Share는 네이티브 타입이 계약의 상위 집합이라 무표현으로
// 재수출）. 웹 구현(web.tsx)은 같은 이름으로 DOM 폴백을 제공한다 — 소비 화면
// 코드가 react-native를 직접 import하지 않아도 양 플랫폼에서 동작한다.
// ---------------------------------------------------------------------------
const SectionList = RNSectionList as unknown as SectionListComponent;
const KeyboardAvoidingView =
  RNKeyboardAvoidingView as unknown as KeyboardAvoidingViewComponent;

// ---------------------------------------------------------------------------
// Select/SelectOption — 네이티브 <select> 폴백. 웹 <select>/<option> 대응
// 프리미티브（native-select이 소비）: Pressable 트리거（combobox） + Modal
// 옵션 목록（option role선택 상태）. 커스텀 셀렉트（shadcn select）는
// popover 기반 자체 구현이라 이 프리미티브를 쓰지 않는다.
// ---------------------------------------------------------------------------
function Select({
  className,
  value,
  defaultValue,
  onValueChange,
  children,
  disabled,
  accessibilityLabel,
  nativeID,
  testID,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  // 비제어 값 — value 미지정 시 내부 선택을 트리거 라벨에도 반영한다
  // （G3 F-10: 웹 <select>와 플랫폼 동작 정합）.
  const [uncontrolled, setUncontrolled] = useState<string | undefined>(defaultValue);
  const entries = (
    Children.toArray(children).filter(isValidElement) as ReactElement<SelectOptionProps>[]
  ).map((entry) => ({
    key: entry.key ?? entry.props.value,
    props: entry.props,
  }));
  const current = value ?? uncontrolled;
  const currentLabel = entries.find((entry) => entry.props.value === current)?.props.children;
  const commit = (next: string) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
    setOpen(false);
  };
  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={accessibilityLabel}
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        nativeID={nativeID}
        testID={testID}
        className={className}
        onPress={() => setOpen(true)}
      >
        <RNText className="text-sm text-foreground" numberOfLines={1}>
          {currentLabel ?? ""}
        </RNText>
      </Pressable>
      <RNModal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <RNView className="flex-1 justify-center px-4">
          <RNPressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
          />
          <RNView className="max-w-sm self-center rounded-lg border border-border bg-popover py-1">
            <RNScrollView style={STYLES.selectList}>
              {entries.map(({ key, props }) => (
                <RNPressable
                  key={key}
                  disabled={props.disabled}
                  accessibilityRole={toNativeRole("option")}
                  accessibilityState={{ selected: props.value === current }}
                  onPress={() => commit(props.value)}
                  className={cn(
                    "rounded-md px-3 py-2",
                    props.value === current && "bg-accent",
                    props.disabled && "opacity-50",
                  )}
                >
                  <RNText className="text-sm text-popover-foreground" numberOfLines={1}>
                    {props.children}
                  </RNText>
                </RNPressable>
              ))}
            </RNScrollView>
          </RNView>
        </RNView>
      </RNModal>
    </>
  );
}

/** 옵션 자체는 네이티브에서 렌더하지 않는다 — Select가 children에서 추출해 목록을 그린다. */
const SelectOption = (_props: SelectOptionProps) => null;

// ---------------------------------------------------------------------------
// 루프 애니메이션 래퍼 — uniwind가 CSS keyframes(web:animate-*)를 구동하지
// 못 하는 네이티브에서 같은 효과를 RN 내장 Animated로 구동한다. transform·
// opacity라 useNativeDriver로 UI 스레드 구동(프레임마다 JS 관여 없음 —
// Reanimated와 같은 효율, 새 의존성 0). 웹은 web.tsx가 투명 프래그먼트로
// 두고 CSS 클래스가 담당한다(계약은 types.ts 참조).
// ---------------------------------------------------------------------------
const LoopRotate = ({ children, durationMs = 1000 }: LoopRotateProps) => {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // CSS animate-spin: 1s linear infinite → 0deg→360deg 선형 루프.
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, durationMs]);
  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: spin.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "360deg"],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

const LoopPulse = ({ children, durationMs = 2000 }: LoopPulseProps) => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    // CSS animate-pulse: 2s, 50% opacity .5, cubic-bezier(.4,0,.6,1)
    // → 왕복 2분할 + 동일 베지어로 재현.
    const half = durationMs / 2;
    const pulse = Easing.bezier(0.4, 0, 0.6, 1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: half,
          easing: pulse,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: half,
          easing: pulse,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, durationMs]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
};

// 구식 브리지(Old Architecture) 안드로이드에서만 실험 스위치를 켠다.
// 새 아키텍처(Fabric)에서는 이 호출이 no-op인데 WARN 로그를 뿜어
// LogBox 배너가 앱 하단을 가리기 때문이다. Fabric 런타임 판별은
// Fabric 환경에서만 존재하는 전역 UI 매니저 객체로 한다.
const isNewArchitecture =
  (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager !=
  null;

if (
  Platform.OS === "android" &&
  !isNewArchitecture &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animateLayout: AnimateLayoutFn = () => {
  try {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  } catch {
    // safe fallback
  }
};

// ---------------------------------------------------------------------------
// measureInWindow — RN ref.measure（x, y, w, h, pageX, pageY）. 창（뷰포트）
// 기준 좌표로 웹 getBoundingClientRect와 동일 시맨틱（lib/overlay 소비）.
// ---------------------------------------------------------------------------
const measureInWindow: MeasureInWindow = (ref, callback) => {
  const instance = ref as { measure?: (cb: MeasureCallback) => void } | null;
  instance?.measure?.(callback);
};

// ---------------------------------------------------------------------------
// useDrag — PanResponder 기반 드래그（sliderdrawer 등）. 웹 Pointer Events
// 대응: onBegin（제스처 시작）onMove（x/y 절대 좌표 + 시작점 대비 dx/dy）onEnd.
// panHandlers를 뷰에 펼쳐 넣는다（웹 dragHandlers와 동일한 소비 방식）.
// ---------------------------------------------------------------------------
const useDrag = (options: UseDragOptions): UseDragResult => {
  const [dragging, setDragging] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const originRef = useRef({ x: 0, y: 0 });
  const panRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (event) => {
        originRef.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
        setDragging(true);
        optionsRef.current.onBegin?.();
      },
      onPanResponderMove: (event, gesture) => {
        optionsRef.current.onMove?.({
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
          dx: gesture.dx,
          dy: gesture.dy,
        });
      },
      onPanResponderRelease: () => {
        setDragging(false);
        optionsRef.current.onEnd?.();
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        optionsRef.current.onEnd?.();
      },
    }),
  );
  return { dragHandlers: panRef.current.panHandlers as Record<string, unknown>, dragging };
};

// ---------------------------------------------------------------------------
// 오버레이 훈 4종 — 네이티브는 no-op. RN Modal이 OS 수준에서 처리한다:
// 포커스 이동트랩（iOS/Android 모달 포커스 격리）ESC（뒤로가기→onRequestClose）
// 배경 스크롤 잠금（모달이 터치를 가로챔）. lib/overlay가 웹과 동일 호출부를
// 유지할 수 있게 하는 stub이다.
// ---------------------------------------------------------------------------
const useOverlayFocus: UseOverlayFocus = (_target, _active, _returnTo) => {};
const useDismiss: UseDismiss = (_onDismiss, _active) => {};
const useReposition: UseReposition = (_listener, _active) => {};
const useScrollLock: UseScrollLock = (_active) => {};

// ---------------------------------------------------------------------------
// 테마 바인딩
// ---------------------------------------------------------------------------
/** 색 스킴 → uniwind 활성 테마. setTheme은 Appearance.setColorScheme도 호출해
 *  Alert·Modal 등 시스템 UI가 앱 테마를 따르게 한다.
 *  정적 import가 안전한 이유: 웹 번들은 exports "default" 조건으로 web.tsx만
 *  로드하므로 이 파일（와 uniwind 의존）은 네이티브 그래프에만 존재한다. */
const applyColorScheme: ApplyColorScheme = (colorScheme) => {
  Uniwind.setTheme(colorScheme);
};

/** 뷰포트（창） 크기 — Dimensions.get（"window"）. 순간 값이며 리스너 미구독
 *  （오버레이 클램프용 순간 판독으로 충분하다）. */
const getViewport: GetViewport = () => {
  const { width, height } = Dimensions.get("window");
  return { width, height };
};

// ---------------------------------------------------------------------------
// 유니버설 벡터 아이콘 — lucide-react-native 래핑（컴포넌트는 primitives의 *Icon만 소비）
// ---------------------------------------------------------------------------

function wrapNativeLucide(Icon: LucideIcon, defaultClassName = "size-4") {
  return function NativeIcon({
    className,
    size = 16,
    color = "currentColor",
    strokeWidth = 2,
    style,
    "aria-hidden": ariaHidden = true,
  }: IconProps) {
    const numericSize =
      typeof size === "string" ? Number(size) || 16 : size;
    const rotate = className?.includes("rotate-180")
      ? "180deg"
      : className?.includes("rotate-90")
        ? "90deg"
        : null;
    const mergedStyle = rotate
      ? [style, { transform: [{ rotate }] }]
      : style;
    // className의 text-* 색은 lucide Svg에 넘겨 uniwind가 color로 바인딩하게 한다.
    // rotate-* 는 래퍼 View transform으로 처리（Svg 자체 rotate 클래스 의존 회피）.
    return (
      <RNView
        aria-hidden={ariaHidden ? true : undefined}
        style={mergedStyle as ViewStyle}
        {...({
          className: cn("items-center justify-center", defaultClassName),
        } as Record<string, unknown>)}
      >
        <Icon
          size={numericSize}
          color={color}
          strokeWidth={strokeWidth}
          {...({
            className: cn(defaultClassName, className),
          } as Record<string, unknown>)}
        />
      </RNView>
    );
  };
}

const CheckIcon = wrapNativeLucide(LucideCheckIcon);
const ChevronDownIcon = wrapNativeLucide(LucideChevronDownIcon);
const ChevronUpIcon = wrapNativeLucide(LucideChevronUpIcon);
const ChevronRightIcon = wrapNativeLucide(LucideChevronRightIcon);
const ChevronLeftIcon = wrapNativeLucide(LucideChevronLeftIcon);
const XIcon = wrapNativeLucide(LucideXIcon);
const SearchIcon = wrapNativeLucide(LucideSearchIcon);
const MinusIcon = wrapNativeLucide(LucideMinusIcon);
const CircleIcon = wrapNativeLucide(LucideCircleIcon);
const MoreHorizontalIcon = wrapNativeLucide(LucideMoreHorizontalIcon);
const ArrowLeftIcon = wrapNativeLucide(LucideArrowLeftIcon);
const ArrowRightIcon = wrapNativeLucide(LucideArrowRightIcon);
const ArrowUpIcon = wrapNativeLucide(LucideArrowUpIcon);
const ArrowDownIcon = wrapNativeLucide(LucideArrowDownIcon);
const InfoIcon = wrapNativeLucide(LucideInfoIcon);
const AlertCircleIcon = wrapNativeLucide(LucideAlertCircleIcon);
const CheckCircle2Icon = wrapNativeLucide(LucideCheckCircle2Icon);
const XCircleIcon = wrapNativeLucide(LucideXCircleIcon);
const Loader2Icon = wrapNativeLucide(LucideLoader2Icon);
const PanelLeftIcon = wrapNativeLucide(LucidePanelLeftIcon);
const GripVerticalIcon = wrapNativeLucide(LucideGripVerticalIcon);

export {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  Portal,
  ScrollView,
  SectionList,
  Select,
  SelectOption,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Share,
  LoopRotate,
  LoopPulse,
  animateLayout,
  measureInWindow,
  useDrag,
  useOverlayFocus,
  useDismiss,
  useReposition,
  useScrollLock,
  getViewport,
  applyColorScheme,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  XIcon,
  SearchIcon,
  MinusIcon,
  CircleIcon,
  MoreHorizontalIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InfoIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  PanelLeftIcon,
  GripVerticalIcon,
};
