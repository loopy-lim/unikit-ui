/**
 * nsh(Native Shell) 브리지 — `@unikit-bridge/ui/nsh` 사전 번들(dist/nsh.mjs)이
 * 임포트하는 프리미티브 구현. web.tsx·native.tsx와 같은 export 면(types.ts 계약)을
 * 충족한다(단일 import 원칙 AC-1).
 *
 * 아키텍처(사이클 2026-11 nsh 지원 — docs/sdd/101-nsh-react-runtime.md):
 * - 컴포넌트 62종은 React로 작성돼 있고, src/nsh/renderer.ts의 react-reconciler
 *   호스트 설정이 React 트리를 nsh:rt 뷰(element/append/insert/prop)로 굽는다.
 *   이 브리지는 컴포넌트가 그리는 소문자 호스트 태그(view·text·input·image·
 *   scroll·canvas)에 nsh 호스트 프로퍼티를 내린다.
 * - className은 nsh가 네이티브로 해석하는 Tailwind류 클래스로 그대로 간다
 *   (`class` prop). `web:` 접두 클래스는 nsh 플랫폼 클래스(web 플랫폼에서만
 *   적용)라 걸러내지 않는다. 임의값 `[...]`·`dark:` 관련 규칙은 저장소 규칙대로
 *   컴포넌트 소스에 없다.
 * - 포털(dialog·popover)은 nsh의 `position: fixed`(루트 뷰 기준 배치 — 웹
 *   createPortal과 같은 좌표계)로 웹 브리지와 동일한 계약을 유지하고,
 *   팝업 바깥 눌림·ESC는 nsh `<overlay>`의 onPressOutside/onCancel이 담당한다.
 *   lib/overlay.tsx(위치 계산 공통 소스)가 그대로 돈다.
 *
 * 치환표(bridge props → nsh host props):
 * - className → class(nshClass 정규화 동반: web:selection:* 제거·native:X → X
 *   — nsh가 파싱 못 하는 토큰의 경고를 없앤다, 컴포넌트 소스는 단일 유지),
 *   accessibilityRole → role(nsh AccessibilityRole 어휘로
 *   매핑), aria-hidden → accessibilityElementsHidden, aria-checked/selected/
 *   expanded/pressed/current → accessibilityState, aria-valuenow/min/max →
 *   accessibilityValue, onChangeText → onChange({value}), secureTextEntry →
 *   masked, editable:false → readonly, inputMode → keyboardType,
 *   onHoverIn/Out → onMouseEnter/Leave, onLayout({bounds}) → {width,height}.
 *
 * 로드맵(이 파일 머리 주석 계약 — 미지원 기능):
 * - 아이콘 캔버스의 draw는 생성 시 1회만 소비된다(nsh Canvas 컴포넌트 계약 —
 *   rt.prop 채널로 못 내린다). 그래서 색 스킴 전환 후에도 아이콘 색은 마운트
 *   시점 token() 값에 머문다(다크 전환 시 대비 소실 가능 — draw 재소비 채널이
 *   생기면 해소).
 * - LoopRotate/LoopPulse 루프 애니메이션은 정적 렌더(web:animate-*만 적용).
 *   nsh AnimatedValue + style transform 승급 예정.
 * - Android 뒤로가기(모달 onRequestClose의 백버튼 경로)는 nsh overlay onCancel이
 *   담당하는데 fixed-포털(모달) 경로는 ESC까지만 연결했다.
 * - aria-describedby/labelledby(nativeID 문자열 연결)·aria-modal은 nsh 호스트에
 *   대응 프로퍼티가 없어 폐기(스크린리더 한계 — native.tsx와 같은 판단).
 * - SectionList는 nsh `list` 태그 대신 scroll + 섹션 순회 렌더(web 구현과 동일).
 * - ScrollView 가로 축은 콘텐츠 컨테이너 flexDirection row(RN 관용)로 지정한다.
 */
import * as React from "react";
import {
  setColorScheme,
  fontScale as nshFontScale,
  Path2D as NshPath2D,
  pixelRatio,
  platform,
  screenSize as nshScreenSize,
  token,
  windowSize,
  Share as NshShare,
} from "nsh";
import { cn } from "../lib/utils";
import { NSH_LUCIDE_ICONS } from "../nsh/lucide-icons.generated";
import type * as T from "./types";

// ---------------------------------------------------------------------------
// 역할 매핑 — nsh AccessibilityRole 어휘에 없는 BridgeRole의 근접 치환
// ---------------------------------------------------------------------------

const NSH_VALID_ROLES = new Set([
  "none", "button", "link", "search", "image", "imagebutton", "keyboardkey",
  "text", "adjustable", "header", "summary", "alert", "checkbox", "combobox",
  "menu", "menubar", "menuitem", "progressbar", "radio", "radiogroup",
  "scrollbar", "spinbutton", "switch", "tab", "tablist", "timer", "toolbar",
  "list", "grid", "table", "row", "cell", "columnheader", "rowgroup",
  "listbox", "option", "group", "region", "navigation", "tree", "treeitem",
  "menuitemcheckbox", "menuitemradio", "dialog", "alertdialog",
]);

/** nsh에 없는 웹 role → 근접 nsh 역할. 대응이 없으면 none으로 낮춘다(native.tsx
 *  RN_ROLE_FALLBACK과 같은 판단 — 웹 스크린리더만 이득인 역할은 버린다). */
const NSH_ROLE_FALLBACK: Partial<Record<T.BridgeRole, string>> = {
  heading: "header",
  slider: "adjustable",
  tabpanel: "region",
  // nsh 어휘에 없음 — none으로 낮춘다
  separator: "none",
  listitem: "none",
  status: "none",
  tooltip: "none",
};

const toRole = (role?: T.BridgeRole) => {
  if (!role) return undefined;
  if (NSH_VALID_ROLES.has(role)) return role;
  return NSH_ROLE_FALLBACK[role] ?? "none";
};

/** aria-* props를 nsh accessibilityState 한 건으로 합친다. */
function toA11yState(props: {
  "aria-checked"?: boolean | "mixed";
  "aria-selected"?: boolean;
  "aria-expanded"?: boolean;
  "aria-pressed"?: boolean | "mixed";
  "aria-current"?: boolean | "page" | "step" | "location" | "date" | "time";
  "aria-invalid"?: boolean;
  disabled?: boolean;
}): Record<string, boolean | "mixed" | string> | undefined {
  const state: Record<string, boolean | "mixed" | string> = {};
  if (props.disabled !== undefined) state.disabled = props.disabled;
  if (props["aria-checked"] !== undefined) state.checked = props["aria-checked"];
  if (props["aria-selected"] !== undefined) state.selected = props["aria-selected"];
  if (props["aria-expanded"] !== undefined) state.expanded = props["aria-expanded"];
  if (props["aria-pressed"] !== undefined) state.pressed = props["aria-pressed"];
  if (props["aria-current"] !== undefined) state.current = props["aria-current"];
  if (props["aria-invalid"] !== undefined) state.invalid = props["aria-invalid"];
  return Object.keys(state).length > 0 ? state : undefined;
}

function toA11yValue(props: {
  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
}): Record<string, number> | undefined {
  if (
    props["aria-valuenow"] === undefined &&
    props["aria-valuemin"] === undefined &&
    props["aria-valuemax"] === undefined
  ) {
    return undefined;
  }
  return {
    now: props["aria-valuenow"] ?? 0,
    min: props["aria-valuemin"] ?? 0,
    max: props["aria-valuemax"] ?? 0,
  };
}

/** nsh KeyEvent → BridgeKeyEvent. preventDefault/stopPropagation은 nsh 키
 *  전달이 captureKeys 정책으로 미리 결정돼(no-op 외 방법 없음) 빈 함수로 채운다. */
function wrapKeyEvent(
  handler: (event: T.BridgeKeyEvent) => void,
): (event: { key: string; modifiers: { control: boolean; alt: boolean; shift: boolean; platform: boolean } }) => void {
  return (event) => {
    handler({
      key: event.key,
      ctrlKey: event.modifiers.control,
      altKey: event.modifiers.alt,
      shiftKey: event.modifiers.shift,
      metaKey: event.modifiers.platform,
      preventDefault: () => {},
      stopPropagation: () => {},
    });
  };
}

/** inputMode → nsh KeyboardType. */
const KEYBOARD_TYPE: Partial<Record<NonNullable<T.TextInputProps["inputMode"]>, string>> = {
  text: "default",
  tel: "phone-pad",
  url: "url",
  email: "email-address",
  numeric: "numbers-and-punctuation",
  decimal: "decimal-pad",
  search: "default",
};

/** nsh가 모르는 클래스 토큰을 정규화한다(실측 경고 기준):
 * - web:selection:* 등 nsh가 파싱 못 하는 웹 전용 변형 → 제거(nsh에서 무의미)
 * - native:X → X — 네이티브 전용 클래스는 nsh도 네이티브라 값이 그대로 유효
 * 컴포넌트 소스는 단일로 유지한다(치환은 브리지의 책임 — 규칙 5와 같은 구조). */
function nshClass(className: string | undefined): string | undefined {
  if (!className) return className;
  const kept = className
    .split(/\s+/)
    .filter((token) => token !== "" && !token.startsWith("web:selection:"))
    .map((token) => (token.startsWith("native:") ? token.slice("native:".length) : token));
  return kept.length > 0 ? kept.join(" ") : undefined;
}

/** ViewProps 공통 치환 — Pressable/ScrollView 등 하위 프리미티브가 펼쳐 쓴다. */
function viewHostProps(props: T.ViewProps): Record<string, unknown> {
  const host: Record<string, unknown> = {
    class: nshClass(props.className),
    style: props.style,
    nativeID: props.nativeID,
    testID: props.testID,
    accessibilityLabel: props.accessibilityLabel,
    role: toRole(props.accessibilityRole),
    accessibilityElementsHidden: props["aria-hidden"] || undefined,
    accessibilityState: toA11yState(props),
    accessibilityValue: toA11yValue(props),
  };
  if (props.pointerEvents === "none" || props.pointerEvents === "box-none") {
    host.class = nshClass(cn(props.className, "pointer-events-none"));
  }
  if (props.onLayout) {
    host.onLayout = (event: { bounds: { width: number; height: number } }) =>
      props.onLayout!({ width: event.bounds.width, height: event.bounds.height });
  }
  if (props.onKeyDown) {
    host.onKeyDown = wrapKeyEvent(props.onKeyDown);
    // 키 전달은 포커스가 조건(웹 tabIndex=0 치환과 같은 판단)
    host.focusable = props.focusable ?? true;
  } else if (props.focusable !== undefined) {
    host.focusable = props.focusable;
  }
  if (props.onHoverIn) host.onMouseEnter = () => props.onHoverIn!();
  if (props.onHoverOut) host.onMouseLeave = () => props.onHoverOut!();
  return host;
}

const VIEW_BASE_CLASS = "flex flex-col";

// ---------------------------------------------------------------------------
// View — nsh view. 기본 클래스 flex flex-col(RN 방향 기본값 정합 — web.tsx와 동일)
// ---------------------------------------------------------------------------

const View = React.forwardRef<T.BridgeViewRef, T.ViewProps>(function View(props, ref) {
  const { children, ...rest } = props;
  const host = viewHostProps(rest);
  host.class = host.class ? cn(VIEW_BASE_CLASS, host.class as string) : VIEW_BASE_CLASS;
  return React.createElement("view", { ...host, ref }, children);
});

// ---------------------------------------------------------------------------
// Text — nsh text. onPress·numberOfLines 지원
// ---------------------------------------------------------------------------

const Text = React.forwardRef<T.BridgeTextRef, T.TextProps>(function Text(props, ref) {
  const {
    className,
    style,
    children,
    nativeID,
    testID,
    onPress,
    accessibilityRole,
    accessibilityLabel,
    "aria-hidden": ariaHidden,
    numberOfLines,
  } = props;
  const host: Record<string, unknown> = {
    class: nshClass(className),
    style: numberOfLines !== undefined ? { ...style, numberOfLines } : style,
    nativeID,
    testID,
    accessibilityLabel,
    role: toRole(accessibilityRole),
    accessibilityElementsHidden: ariaHidden || undefined,
    onPress,
  };
  return React.createElement("text", { ...host, ref }, children);
});

// ---------------------------------------------------------------------------
// Pressable — nsh view + onPress/disabled(nsh view가 탭 응답 계약을 갖는다)
// ---------------------------------------------------------------------------

const Pressable = React.forwardRef<T.BridgePressableRef, T.PressableProps>(
  function Pressable(props, ref) {
    const {
      className,
      style,
      children,
      onPress,
      disabled,
      accessibilityLabel,
      accessibilityRole,
      onContextMenu,
      onLongPress,
      onKeyDown,
      focusable,
      onHoverIn,
      onHoverOut,
      onFocus,
      onBlur,
      nativeID,
      testID,
      ...aria
    } = props;
    const host: Record<string, unknown> = {
      class: nshClass(cn(VIEW_BASE_CLASS, "text-left", className)),
      style,
      nativeID,
      testID,
      accessibilityLabel,
      role: toRole(accessibilityRole ?? "button"),
      disabled: disabled || undefined,
      accessibilityState: toA11yState({ ...aria, disabled }),
      onPress,
      onLongPress,
      onContextMenu,
      onMouseEnter: onHoverIn ? () => onHoverIn() : undefined,
      onMouseLeave: onHoverOut ? () => onHoverOut() : undefined,
      onFocus: onFocus ? () => onFocus() : undefined,
      onBlur: onBlur ? () => onBlur() : undefined,
    };
    if (onKeyDown) {
      host.onKeyDown = wrapKeyEvent(onKeyDown);
      host.focusable = focusable ?? true;
    } else if (focusable !== undefined) {
      host.focusable = focusable;
    }
    return React.createElement("view", { ...host, ref }, children);
  },
);

// ---------------------------------------------------------------------------
// TextInput — nsh input
// ---------------------------------------------------------------------------

const TextInput = React.forwardRef<T.BridgeTextInputRef, T.TextInputProps>(
  function TextInput(props, ref) {
    const {
      className,
      style,
      value,
      defaultValue,
      placeholder,
      editable,
      disabled,
      onChangeText,
      nativeID,
      testID,
      accessibilityLabelledBy,
      "aria-disabled": ariaDisabled,
      autoFocus,
      secureTextEntry,
      inputMode,
      multiline,
      maxLength,
      onKeyDown,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      accessibilityLabel,
      onFocus,
      onBlur,
    } = props;
    void accessibilityLabelledBy;
    void ariaDescribedBy;
    const host: Record<string, unknown> = {
      class: nshClass(className),
      style,
      nativeID,
      testID,
      value,
      defaultValue,
      placeholder,
      readonly: (editable === false || disabled) || undefined,
      disabled: disabled || undefined,
      accessibilityLabel,
      autoFocus,
      masked: secureTextEntry || undefined,
      keyboardType: inputMode ? KEYBOARD_TYPE[inputMode] : undefined,
      multiline: multiline || undefined,
      maxLength,
      accessibilityState: ariaInvalid !== undefined ? { invalid: ariaInvalid } : undefined,
      onFocus: onFocus ? () => onFocus() : undefined,
      onBlur: onBlur ? () => onBlur() : undefined,
      onChange: onChangeText ? (event: { value: string }) => onChangeText(event.value) : undefined,
      onKeyPress: onKeyDown
        ? (event: { key: string }) => {
            // 수정자 정보가 없는 onKeyPress — key만 전달(계약상 생략 허용)
            onKeyDown({ key: event.key, preventDefault: () => {} });
          }
        : undefined,
    };
    return React.createElement("input", { ...host, ref });
  },
);

// ---------------------------------------------------------------------------
// Image — nsh image
// ---------------------------------------------------------------------------

const Image = React.forwardRef<T.BridgeImageRef, T.ImageProps>(function Image(props, ref) {
  const { className, style, source, alt, onError, accessibilityLabel, nativeID, testID } = props;
  const host: Record<string, unknown> = {
    class: nshClass(className),
    style,
    src: source.uri,
    accessibilityLabel: accessibilityLabel ?? alt,
    role: "image",
    nativeID,
    testID,
    onError: onError ? () => onError() : undefined,
  };
  return React.createElement("image", { ...host, ref });
});

// ---------------------------------------------------------------------------
// Portal — position:fixed 포털(모달) + overlay 프리미티브(바깥 눌림·ESC)
// ---------------------------------------------------------------------------

function resolveRefValue(ref: unknown): unknown {
  if (ref && typeof ref === "object" && "current" in (ref as Record<string, unknown>)) {
    return (ref as { current: unknown }).current;
  }
  return ref;
}

function Portal({
  children,
  visible,
  onBackdropPress,
  onRequestClose,
  backdropClassName,
  dismissViaDocument,
  dismissIgnoreRef,
  modal = true,
}: T.PortalProps) {
  if (!visible) return null;
  // 비모달(토스트 등) — 소비자가 루트 배치를 보증한다(native.tsx와 같은 계약)
  if (!modal && !dismissViaDocument) return <>{children}</>;
  // 팝오버 계열(dismissViaDocument) — nsh overlay가 바깥 눌림·ESC·뒤로가기를
  // 담당한다(anchor = 트리거 → 트리거 재눌림은 바깥으로 세지 않아 토글이
  // 성립한다 — web F-10 정합). children은 fixed 좌표로 스스로 위치한다.
  if (dismissViaDocument) {
    const anchor = resolveRefValue(dismissIgnoreRef) as Record<string, unknown> | null;
    return React.createElement(
      'overlay',
      {
        anchor: anchor ?? undefined,
        onPressOutside: onBackdropPress,
        onCancel: onRequestClose,
      },
      children,
    );
  }
  // 모달 — 투명(또는 backdropClassName) 백드롭 + ESC 캡처 래퍼(0×0 — fixed
  // children은 루트 뷰 기준으로 배치되므로 래퍼가 레이아웃을 간섭하지 않는다).
  return (
    <>
      {onBackdropPress
        ? React.createElement("view", {
            class: nshClass(cn("fixed inset-0", backdropClassName)),
            focusable: false,
            accessibilityElementsHidden: true,
            onPress: onBackdropPress,
          })
        : null}
      {React.createElement(
        "view",
        {
          focusable: true,
          captureKeys: ["escape"],
          onKeyDown: (event: { key: string }) => {
            if (event.key === "Escape") onRequestClose?.();
          },
        },
        children,
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ScrollView — nsh scroll(ref → scrollTo)
// ---------------------------------------------------------------------------

const ScrollView = React.forwardRef<T.BridgeScrollViewRef, T.ScrollViewProps>(
  function ScrollView(props, ref) {
    const {
      className,
      style,
      children,
      onLayout,
      onKeyDown,
      focusable,
      onHoverIn,
      onHoverOut,
      nativeID,
      testID,
      accessibilityRole,
      accessibilityLabel,
      "aria-hidden": ariaHidden,
      "aria-modal": ariaModal,
      "aria-describedby": ariaDescribedBy,
      "aria-valuenow": ariaValueNow,
      "aria-valuemin": ariaValueMin,
      "aria-valuemax": ariaValueMax,
      "aria-expanded": ariaExpanded,
      "aria-controls": ariaControls,
      "aria-labelledby": ariaLabelledBy,
      pointerEvents,
      contentContainerClassName,
      horizontal,
      pagingEnabled,
      onScroll,
      keyboardShouldPersistTaps,
      keyboardDismissMode,
    } = props;
    void ariaModal;
    void ariaDescribedBy;
    void ariaControls;
    void ariaLabelledBy;
    void keyboardDismissMode;
    const base = viewHostProps({
      className,
      style,
      onLayout,
      onKeyDown,
      focusable,
      onHoverIn,
      onHoverOut,
      nativeID,
      testID,
      accessibilityRole,
      accessibilityLabel,
      "aria-hidden": ariaHidden,
      "aria-expanded": ariaExpanded,
      "aria-valuenow": ariaValueNow,
      "aria-valuemin": ariaValueMin,
      "aria-valuemax": ariaValueMax,
      pointerEvents,
    });
    const host: Record<string, unknown> = {
      ...base,
      pagingEnabled: pagingEnabled || undefined,
      keyboardShouldPersistTaps,
      onScroll: onScroll ? () => onScroll() : undefined,
      contentClass: contentContainerClassName,
      // 가로 축 — 콘텐츠 컨테이너를 row로(RN ScrollView horizontal 관용)
      contentStyle: horizontal ? { flexDirection: "row" } : undefined,
    };
    return React.createElement("scroll", { ...host, ref }, children);
  },
);

// ---------------------------------------------------------------------------
// SectionList — scroll + 섹션 순회 렌더(web 폴백과 동일 — nsh list 태그는 로드맵)
// ---------------------------------------------------------------------------

const renderListNode = (node: T.SectionListNode | undefined): React.ReactNode => {
  if (!node) return null;
  if (React.isValidElement(node)) return node;
  const Comp = node as React.ComponentType;
  return <Comp />;
};

const SectionList: T.SectionListComponent = (props) => {
  const {
    sections,
    renderItem,
    keyExtractor,
    renderSectionHeader,
    stickySectionHeadersEnabled = true,
    ListHeaderComponent,
    ListEmptyComponent,
    ListFooterComponent,
    ...scrollProps
  } = props;
  void stickySectionHeadersEnabled;
  return (
    <ScrollView {...scrollProps}>
      {renderListNode(ListHeaderComponent)}
      {sections.length === 0 ? renderListNode(ListEmptyComponent) : null}
      {sections.map((section, sectionIndex) =>
        React.createElement(
          "view",
          { key: section.title ?? `section-${sectionIndex}` },
          [
            renderSectionHeader ? renderSectionHeader({ section }) : null,
            ...section.data.map((item, index) => (
              <React.Fragment key={keyExtractor ? keyExtractor(item, index) : String(index)}>
                {renderItem({ item, index, section })}
              </React.Fragment>
            )),
          ],
        ),
      )}
      {renderListNode(ListFooterComponent)}
    </ScrollView>
  );
};

// ---------------------------------------------------------------------------
// Select/SelectOption — Pressable 트리거 + overlay 옵션 목록(native 폴백 대응)
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
}: T.SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [uncontrolled, setUncontrolled] = React.useState<string | undefined>(defaultValue);
  const entries = (
    React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<T.SelectOptionProps>[]
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
        onPress={() => setOpen((prev) => !prev)}
      >
        <Text className="text-sm text-foreground" numberOfLines={1}>
          {currentLabel ?? ""}
        </Text>
      </Pressable>
      <Portal visible={open} onBackdropPress={() => setOpen(false)} onRequestClose={() => setOpen(false)}>
        <View className="fixed inset-x-0 top-1/3 z-50 mx-auto max-w-sm px-4">
          <ScrollView className="rounded-lg border border-border bg-popover py-1">
            {entries.map(({ key, props: option }) => (
              <Pressable
                key={key}
                disabled={option.disabled}
                accessibilityRole="option"
                aria-selected={option.value === current}
                onPress={() => commit(option.value)}
                className={cn(
                  "rounded-md px-3 py-2",
                  option.value === current && "bg-accent",
                  option.disabled && "opacity-50",
                )}
              >
                <Text className="text-sm text-popover-foreground" numberOfLines={1}>
                  {option.children}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Portal>
    </>
  );
}

/** 옵션 자체는 렌더하지 않는다 — Select가 children에서 추출해 목록을 그린다. */
const SelectOption = (_props: T.SelectOptionProps) => null;

// ---------------------------------------------------------------------------
// KeyboardAvoidingView — 투명 View 폴백(web과 동일 — nsh는 플랫폼 키보드 회피에
// 맡긴다. keyboardFrame 접근자 연동은 로드맵)
// ---------------------------------------------------------------------------

const KeyboardAvoidingView: T.KeyboardAvoidingViewComponent = (props) => {
  const { behavior, keyboardVerticalOffset, ...rest } = props;
  void behavior;
  void keyboardVerticalOffset;
  return <View {...rest} />;
};

// ---------------------------------------------------------------------------
// Platform / Dimensions / Share — nsh 액세서 래핑
// ---------------------------------------------------------------------------

const Platform: T.BridgePlatformStatic = {
  // nsh는 linux를 더하지만 BridgePlatformOS 어휘(RN 기준)에 없어 desktop
  // 근접값 windows로 낮춘다(native 브리지 역할 폴백과 같은 판단).
  OS: platform.os === "linux" ? "windows" : platform.os,
  select<T>(spec: T.BridgePlatformSelectSpec<T>): T | undefined {
    const os = platform.os === "linux" ? "windows" : platform.os;
    return (
      spec[os] ??
      (os !== "web" ? spec.native : undefined) ??
      spec.default
    );
  },
};

const Dimensions: T.BridgeDimensions = {
  get(dim) {
    const size = dim === "window" ? windowSize() : nshScreenSize();
    return {
      width: size.width,
      height: size.height,
      scale: pixelRatio(),
      fontScale: nshFontScale(),
    };
  },
  addEventListener(_type, _handler) {
    // nsh는 windowSize 접근자가 반응형이지만 브리지 계약은 순간 판독 —
    // 오버레이 클램프(getViewport)가 순간값으로 충분하다(native.tsx와 같은 판단).
    return { remove() {} };
  },
};

const Share: T.BridgeShare = {
  async share(content) {
    const result = await NshShare.show({
      text: content.message,
      url: content.url,
      title: content.title,
    });
    return { action: result.action };
  },
};

// ---------------------------------------------------------------------------
// measureInWindow / useDrag / 오버레이 훈 4종
// ---------------------------------------------------------------------------

/** nsh ViewRef.measure()는 비동기 — 브리지 계약(동기 콜백)을 프로미스로 잇는다.
 *  오버레이 위치 계산이 콜백을 한 번 소비하므로 지연은 감수한다(로드맵:
 *  동기 측정 API — nsh 미제공). */
const measureInWindow: T.MeasureInWindow = (ref, callback) => {
  const node = resolveRefValue(ref) as
    | { measure(): Promise<{ bounds: { x: number; y: number; width: number; height: number }; pagePosition: { x: number; y: number } } | null> }
    | null;
  if (!node || typeof node.measure !== "function") return;
  node.measure().then((measured) => {
    if (!measured) return;
    const { bounds, pagePosition } = measured;
    callback(bounds.x, bounds.y, bounds.width, bounds.height, pagePosition.x, pagePosition.y);
  });
};

/** 드래그 — nsh 터치 이벤트(pageX/pageY 절대 좌표)로 조립. */
function useDrag(options: T.UseDragOptions): T.UseDragResult {
  const [dragging, setDragging] = React.useState(false);
  const startRef = React.useRef<{ x: number; y: number } | null>(null);
  const onBegin = useEvent(options.onBegin);
  const onMove = useEvent(options.onMove);
  const onEnd = useEvent(options.onEnd);
  const dragHandlers = {
    onTouchStart: (event: { pageX: number; pageY: number }) => {
      startRef.current = { x: event.pageX, y: event.pageY };
      setDragging(true);
      onBegin();
    },
    onTouchMove: (event: { pageX: number; pageY: number }) => {
      const start = startRef.current;
      if (!start) return;
      onMove({
        x: event.pageX,
        y: event.pageY,
        dx: event.pageX - start.x,
        dy: event.pageY - start.y,
      });
    },
    onTouchEnd: () => {
      if (!startRef.current) return;
      startRef.current = null;
      setDragging(false);
      onEnd();
    },
    onTouchCancel: () => {
      if (!startRef.current) return;
      startRef.current = null;
      setDragging(false);
      onEnd();
    },
  };
  return { dragHandlers, dragging };
}

/** 옵션 콜백을 최신 참조로 유지하는 작은 훅(드래그 핸들러 재생성 방지). */
function useEvent<A extends unknown[]>(handler?: (...args: A) => void): (...args: A) => void {
  const ref = React.useRef(handler);
  ref.current = handler;
  return React.useCallback((...args: A) => ref.current?.(...args), []);
}

/** 오버레이 포커스 — 대상 노드 자체에 포커스(nsh ViewRef.focus). 첫 포커서블
 *  탐색·Tab 가두기는 nsh 포커스 시스템에 위임할 계약이 없어 생략(로드맵). */
const useOverlayFocus: T.UseOverlayFocus = (target, active, _returnTo) => {
  React.useEffect(() => {
    if (!active) return;
    const node = resolveRefValue(target) as { focus?(): void } | null;
    node?.focus?.();
  }, [target, active]);
};

/** ESC 닫기 — no-op. 모달 Portal의 captureKeys escape·overlay onCancel이
 *  nsh 수준에서 담당한다(native.tsx가 RN Modal에 위임한 것과 같은 구조). */
const useDismiss: T.UseDismiss = () => {};

/** 재배치 신호 — no-op. nsh는 fixed 노드가 루트 뷰를 추종하고 overlay는 앵커를
 *  네이티브로 따라간다. */
const useReposition: T.UseReposition = () => {};

/** 배경 스크롤 잠금 — no-op. fixed 레이어는 배경 스크롤을 차단하지 않지만
 *  nsh에 문서 스크롤 잠금 계약이 없다(native.tsx와 같은 판단). */
const useScrollLock: T.UseScrollLock = () => {};

/** 뷰포트(창) 크기 — nsh windowSize(). */
const getViewport: T.GetViewport = () => {
  const size = windowSize();
  return { width: size.width, height: size.height };
};

// ---------------------------------------------------------------------------
// LoopRotate / LoopPulse — 정적 렌더(로드맵: nsh AnimatedValue 루프 승급)
// animateLayout — no-op(nsh는 상태 전이를 스타일 transition으로 처리)
// ---------------------------------------------------------------------------

function LoopRotate({ children }: T.LoopRotateProps) {
  return <>{children}</>;
}

function LoopPulse({ children }: T.LoopPulseProps) {
  return <>{children}</>;
}

const animateLayout: T.AnimateLayoutFn = () => {};

/** 색 스킴 — nsh setColorScheme(플랫폼 컨트롤까지 동기). */
const applyColorScheme: T.ApplyColorScheme = (colorScheme) => {
  setColorScheme(colorScheme);
};

// ---------------------------------------------------------------------------
// 유니버설 벡터 아이콘 — lucide 경로 데이터를 nsh canvas(Path2D)로 그린다
// ---------------------------------------------------------------------------

/** className의 text-* 색 토큰을 nsh token()으로 해석한 색. 캔버스에 CSS
 *  currentColor 상속이 없어(native.tsx의 uniwind 훅 대응) 토큰 이름을 직접
 *  해석한다. 미지원 토큰은 foreground로 폴백. */
function iconColor(className: string | undefined): string {
  const fallback = () => {
    try {
      return token("foreground") as string;
    } catch {
      // token 해석 실패 시의 최후 폴백 — 캔버스 색 키워드(원색 리터럴 아님,
      // audit (b) 계약 유지).
      return "black";
    }
  };
  if (!className) return fallback();
  const match = className.match(/text-([a-z0-9-]+)/g);
  if (match) {
    for (const cls of match) {
      const name = cls.slice("text-".length).replace(/\/\d+$/, "");
      try {
        const value = token(name as "foreground");
        if (typeof value === "string") return value;
      } catch {
        // 미지원 토큰 — 다음 매치로
      }
    }
  }
  return fallback();
}

type NshCanvasContext = {
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  scale(x: number, y: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  arc(x: number, y: number, radius: number, start: number, end: number): void;
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, start: number, end: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  stroke(path?: unknown): void;
  fill(path?: unknown): void;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  lineCap: "round";
  lineJoin: "round";
};

/** lucide 아이콘 노드(tag별 도형)를 24×24 뷰박스에서 캔버스로 그린다. */
function makeIconDrawer(
  cx: NshCanvasContext,
  data: readonly (readonly [string, Readonly<Record<string, string | number>>])[],
  color: string,
  strokeWidth: number,
) {
  return (width: number, height: number) => {
    const scale = Math.min(width, height) / 24;
    if (scale <= 0) return;
    cx.save();
    cx.translate((width - 24 * scale) / 2, (height - 24 * scale) / 2);
    cx.scale(scale, scale);
    cx.strokeStyle = color;
    cx.fillStyle = color;
    cx.lineWidth = strokeWidth;
    cx.lineCap = 'round';
    cx.lineJoin = 'round';
    for (const [tag, attrs] of data) {
      if (tag === 'circle') {
        cx.beginPath();
        cx.ellipse(Number(attrs.cx), Number(attrs.cy), Number(attrs.r), Number(attrs.r), 0, 0, Math.PI * 2);
        cx.stroke();
      } else if (tag === 'ellipse') {
        cx.beginPath();
        cx.ellipse(Number(attrs.cx), Number(attrs.cy), Number(attrs.rx), Number(attrs.ry), 0, 0, Math.PI * 2);
        cx.stroke();
      } else if (tag === 'rect') {
        cx.beginPath();
        cx.rect(Number(attrs.x), Number(attrs.y), Number(attrs.width), Number(attrs.height));
        cx.stroke();
      } else if (tag === 'line') {
        cx.beginPath();
        cx.moveTo(Number(attrs.x1), Number(attrs.y1));
        cx.lineTo(Number(attrs.x2), Number(attrs.y2));
        cx.stroke();
      } else if (attrs.d !== undefined) {
        // Path2D는 전역이 아니라 nsh 모듈 export다(실측 — 전역 참조 시
        // "Path2D is not defined"). SVG d 문자열을 네이티브가 파싱한다.
        cx.stroke(new NshPath2D(String(attrs.d)));
      }
    }
    cx.restore();
  };
}

function makeNshIcon(name: keyof typeof NSH_LUCIDE_ICONS) {
  return function NshIcon(props: T.IconProps): React.ReactElement | null {
    const {
      className,
      size = 16,
      color,
      strokeWidth = 2,
      style,
      'aria-hidden': ariaHidden = true,
    } = props;
    const data = NSH_LUCIDE_ICONS[name];
    const resolvedColor = color ?? iconColor(className);
    const numericSize = typeof size === 'string' ? Number(size) || 16 : size;
    const host: Record<string, unknown> = {
      class: nshClass(cn('size-4', className)),
      // size prop 우선 — 클래스 size-*와 함께 쓰이면 인라인 값이 이긴다
      style: { width: numericSize, height: numericSize, ...style },
      accessibilityElementsHidden: ariaHidden === true || ariaHidden === 'true' ? true : undefined,
    };
    return React.createElement('canvas', {
      ...host,
      draw: (cx: NshCanvasContext, canvasSize: { width: number; height: number }) =>
        makeIconDrawer(cx, data, resolvedColor, strokeWidth)(canvasSize.width, canvasSize.height),
    });
  };
}
const CheckIcon = makeNshIcon("Check");
const ChevronDownIcon = makeNshIcon("ChevronDown");
const ChevronUpIcon = makeNshIcon("ChevronUp");
const ChevronRightIcon = makeNshIcon("ChevronRight");
const ChevronLeftIcon = makeNshIcon("ChevronLeft");
const XIcon = makeNshIcon("X");
const SearchIcon = makeNshIcon("Search");
const MinusIcon = makeNshIcon("Minus");
const CircleIcon = makeNshIcon("Circle");
const MoreHorizontalIcon = makeNshIcon("MoreHorizontal");
const ArrowLeftIcon = makeNshIcon("ArrowLeft");
const ArrowRightIcon = makeNshIcon("ArrowRight");
const ArrowUpIcon = makeNshIcon("ArrowUp");
const ArrowDownIcon = makeNshIcon("ArrowDown");
const InfoIcon = makeNshIcon("Info");
const AlertCircleIcon = makeNshIcon("AlertCircle");
const CheckCircle2Icon = makeNshIcon("CheckCircle2");
const XCircleIcon = makeNshIcon("XCircle");
const Loader2Icon = makeNshIcon("Loader2");
const PanelLeftIcon = makeNshIcon("PanelLeft");
const GripVerticalIcon = makeNshIcon("GripVertical");
const BoldIcon = makeNshIcon("Bold");
const ItalicIcon = makeNshIcon("Italic");
const StrikethroughIcon = makeNshIcon("Strikethrough");
const Heading1Icon = makeNshIcon("Heading1");
const Heading2Icon = makeNshIcon("Heading2");
const ListIcon = makeNshIcon("List");
const ListOrderedIcon = makeNshIcon("ListOrdered");
const TextQuoteIcon = makeNshIcon("TextQuote");
const CodeIcon = makeNshIcon("Code");
const Undo2Icon = makeNshIcon("Undo2");
const Redo2Icon = makeNshIcon("Redo2");

export type * from "./types";

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
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  Heading1Icon,
  Heading2Icon,
  ListIcon,
  ListOrderedIcon,
  TextQuoteIcon,
  CodeIcon,
  Undo2Icon,
  Redo2Icon,
};
