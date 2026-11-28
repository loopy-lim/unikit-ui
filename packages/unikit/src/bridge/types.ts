import type { ComponentType, ReactElement, ReactNode } from "react";

export type BridgeColorScheme = "light" | "dark";

export type BridgeStyle = Record<string, string | number | undefined>;

export type BridgeScrollEvent = {
  contentOffset: { x: number; y: number };
  contentSize: { width: number; height: number };
  layoutMeasurement: { width: number; height: number };
};

export type BridgeLayout = { width: number; height: number };

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

  | "group"
  | "region";

export type ViewProps = {
  className?: string;

  style?: BridgeStyle;
  children?: ReactNode;

  onLayout?: (layout: BridgeLayout) => void;

  onKeyDown?: (event: BridgeKeyEvent) => void;

  focusable?: boolean;

  onHoverIn?: () => void;

  onHoverOut?: () => void;

  nativeID?: string;
  testID?: string;
  accessibilityRole?: BridgeRole;
  accessibilityLabel?: string;

  "aria-hidden"?: boolean;

  "aria-modal"?: boolean;

  "aria-describedby"?: string;

  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;

  "aria-expanded"?: boolean;

  "aria-controls"?: string;

  "aria-labelledby"?: string;

  pointerEvents?: "auto" | "none" | "box-only" | "box-none";
};

export type TextProps = {
  className?: string;

  style?: BridgeStyle;
  children?: ReactNode;
  nativeID?: string;
  testID?: string;
  onPress?: () => void;
  accessibilityRole?: BridgeRole;
  accessibilityLabel?: string;

  "aria-hidden"?: boolean;

  numberOfLines?: number;
};

export type PressableProps = {
  className?: string;

  style?: BridgeStyle;
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;

  pointerEvents?: "auto" | "none" | "box-only" | "box-none";
  accessibilityLabel?: string;
  accessibilityRole?: BridgeRole;

  "aria-disabled"?: boolean;

  "aria-pressed"?: boolean;

  "aria-checked"?: boolean | "mixed";

  "aria-selected"?: boolean;

  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-labelledby"?: string;

  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;

  "aria-current"?:
    | "page"
    | "step"
    | "location"
    | "date"
    | "time"
    | (boolean & {});

  "aria-describedby"?: string;

  "aria-invalid"?: boolean;

  onContextMenu?: () => void;

  onLongPress?: () => void;

  onKeyDown?: (event: BridgeKeyEvent) => void;

  focusable?: boolean;

  onHoverIn?: () => void;

  onHoverOut?: () => void;

  onFocus?: () => void;

  onBlur?: () => void;

  onLayout?: (layout: BridgeLayout) => void;

  hitSlop?: number | { top: number; bottom: number; left: number; right: number };
  nativeID?: string;
  testID?: string;
};

export type SlotProps = {
  children?: ReactNode;
} & Record<string, unknown>;

export type ImageProps = {
  className?: string;

  style?: BridgeStyle;

  source: { uri: string };

  alt?: string;

  onError?: () => void;
  accessibilityLabel?: string;
  nativeID?: string;
  testID?: string;
};

export type TextInputProps = {
  className?: string;

  style?: BridgeStyle;
  value?: string;
  defaultValue?: string;
  placeholder?: string;

  editable?: boolean;

  disabled?: boolean;
  onChangeText?: (text: string) => void;
  nativeID?: string;
  testID?: string;

  accessibilityLabelledBy?: string;

  "aria-disabled"?: boolean;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
  inputMode?: "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";

  autoComplete?: string;

  multiline?: boolean;

  maxLength?: number;

  onKeyDown?: (event: BridgeKeyEvent) => void;

  "aria-invalid"?: boolean;

  "aria-describedby"?: string;

  accessibilityLabel?: string;

  onFocus?: () => void;

  onBlur?: () => void;
};

export interface BridgeViewRef {}
export interface BridgeTextRef {}

export interface BridgePressableRef {
  focus?(): void;
}
export interface BridgeImageRef {}
export interface BridgeTextInputRef {
  focus(): void;
  blur(): void;
}

export type BridgeKeyEvent = {
  key: string;
  preventDefault: () => void;

  stopPropagation?: () => void;

  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;

  shiftKey?: boolean;
};

export type PortalProps = {
  children?: ReactNode;
  visible: boolean;

  onBackdropPress?: () => void;

  onRequestClose?: () => void;

  backdropClassName?: string;

  dismissViaDocument?: boolean;

  dismissIgnoreRef?: unknown;

  modal?: boolean;
};

export type PortalHostProps = {
  children?: ReactNode;
};

export type ScrollViewProps = ViewProps & {

  contentContainerClassName?: string;

  horizontal?: boolean;

  pagingEnabled?: boolean;

  onScroll?: (event: BridgeScrollEvent) => void;

  keyboardShouldPersistTaps?: "always" | "never" | "handled";

  keyboardDismissMode?: "none" | "on-drag" | "interactive";
};

export interface BridgeScrollViewRef {
  scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
}

export interface BridgeSelectRef {}

export type SelectProps = {
  className?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
  disabled?: boolean;

  accessibilityLabel?: string;
  nativeID?: string;
  testID?: string;

  name?: string;

  required?: boolean;

  tabIndex?: number;

  ariaHidden?: boolean;
};

export type SelectOptionProps = {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
};

export type SelectOptGroupProps = {
  label: string;
  disabled?: boolean;
  children?: ReactNode;
};

export type MeasureCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type MeasureInWindow = (
  ref: unknown,
  callback: MeasureCallback,
) => void;

export type BridgeDragEvent = {

  x: number;
  y: number;

  dx: number;
  dy: number;

  vx?: number;

  vy?: number;
};

export type UseDragOptions = {
  onBegin?: () => void;
  onMove?: (event: BridgeDragEvent) => void;
  onEnd?: (event?: BridgeDragEvent) => void;
};

export type UseDragResult = {

  dragHandlers: Record<string, unknown>;
  dragging: boolean;
};

export type UseOverlayFocus = (
  target: unknown,
  active: boolean,
  returnTo?: unknown,
) => void;

export type UseDismiss = (onDismiss: () => void, active: boolean) => void;

export type UseReposition = (listener: () => void, active: boolean) => void;

export type UseScrollLock = (active: boolean) => void;

export type GetViewport = () => { width: number; height: number };

export type LoopRotateProps = {
  children?: ReactNode;

  durationMs?: number;
};

export type LoopPulseProps = {
  children?: ReactNode;

  durationMs?: number;
};

export type ApplyColorScheme = (colorScheme: BridgeColorScheme) => void;

export type UseColorScheme = () => BridgeColorScheme;

export type IconProps = {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  style?: BridgeStyle;
  "aria-hidden"?: boolean | "true" | "false";
};

export type IconComponent = (props: IconProps) => ReactElement | null;

export type AnimateLayoutFn = () => void;

export type SectionListSection<T = unknown> = {
  title?: string;
  data: readonly T[];
};

export type SectionListRenderItemInfo<T> = {
  item: T;
  index: number;
  section: SectionListSection<T>;
};

export type SectionListNode = ReactElement | ComponentType<Record<string, never>> | null;

export type SectionListProps<T = unknown> = Omit<
  ScrollViewProps,
  "children" | "horizontal" | "pagingEnabled" | "onScroll"
> & {
  sections: ReadonlyArray<SectionListSection<T>>;
  renderItem: (info: SectionListRenderItemInfo<T>) => ReactNode;

  keyExtractor?: (item: T, index: number) => string;
  renderSectionHeader?: (info: { section: SectionListSection<T> }) => ReactNode;

  stickySectionHeadersEnabled?: boolean;
  ListHeaderComponent?: SectionListNode;
  ListEmptyComponent?: SectionListNode;
  ListFooterComponent?: SectionListNode;
};

export type SectionListComponent = <T>(
  props: SectionListProps<T>,
) => ReactElement | null;

export type BridgePlatformOS = "ios" | "android" | "macos" | "windows" | "web";
export type BridgePlatformSelectSpec<T> = Partial<
  Record<BridgePlatformOS | "native" | "default", T>
>;
export type BridgePlatformStatic = {
  readonly OS: BridgePlatformOS;
  select<T>(spec: BridgePlatformSelectSpec<T>): T | undefined;
};

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

export type BridgeShare = {
  share(
    content: { message?: string; url?: string; title?: string },
    options?: { dialogTitle?: string },
  ): Promise<{ action: "shared" | "dismissed" }>;
};

export type KeyboardAvoidingViewProps = ViewProps & {
  behavior?: "height" | "position" | "padding";
  keyboardVerticalOffset?: number;
};
export type KeyboardAvoidingViewComponent = (
  props: KeyboardAvoidingViewProps,
) => ReactElement | null;
