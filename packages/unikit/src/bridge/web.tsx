/**
 * 웹 브리지 — 표준 Tailwind CSS v4 소비자용（Next.js/Vite 등）.
 *
 * 같은 className 문자열을 DOM 요소에 그대로 얹는다. 스타일링 엔진이 별도로
 * 필요하지 않다 — 소비자 앱의 Tailwind CSS가 클래스를 생성하고 브라우저가
 * 적용한다（hover/focus-visible/:active 등 웹 전용 변형도 CSS 표준 동작）.
 *
 * RN 프리미티브 관용 프로퍼티는 DOM 속성으로 치환된다:
 *   onPress→onClick · accessibilityRole→role · accessibilityLabel→aria-label ·
 *   nativeID→id · accessibilityLabelledBy→aria-labelledby · editable→readOnly ·
 *   secureTextEntry→type="password" · onChangeText→onChange（value 추출）
 * 치환은 View/Text/Pressable 전 프리미티브에 동일 적용된다（M-1 — React DOM은
 * camelCase 미지 prop을 렌더에서 제거하므로 치환 없이는 role·라벨이 사라진다）.
 * hitSlop은 웹에서 무시된다（포인터 정밀도가 높아 불필요）. onLongPress（길게
 * 누르기）도 웹 표준이 아니므로 폐기한다 — context-menu는 onContextMenu로.
 *
 * 사이클 90 확장（docs/sdd/92-design-plan §2）: onHoverIn/onHoverOut→
 * onMouseEnter/onMouseLeave（View·Pressable）, View onLayout→ResizeObserver,
 * Pressable onFocus/onBlur는 DOM 표준명 그대로.
 *
 * 사이클 40 확장（잔여 shadcn 33종 이식 지원）: Portal（createPortal→body）
 * ScrollView（overflow div + ref scrollTo）Select/SelectOption（select/option）
 * measureInWindow（getBoundingClientRect — 이미 뷰포트 좌표, scrollX/Y 가산
 * 없음 → fixed 배치와 정합）useDrag（Pointer Events）오버레이 훈 4종
 * （useOverlayFocususeDismissuseRepositionuseScrollLock — DOM 구현.
 * 네이티브 대응은 no-op, RN Modal이 OS 수준에서 처리）.
 * 루프 애니메이션 래퍼 LoopRotate/LoopPulse — 웹은 투명（컴포넌트의
 * web:animate-* 클래스가 CSS keyframes로 담당, native.tsx가 RN Animated 구현）.
 *
 * 단일 import 원칙(AC-1) 확장: SectionList（overflow div + 섹션 순회 렌더,
 * sticky 헤더）와 앱 API 폴백 Platform{OS:"web"}·Dimensions{window 치수,
 * resize 구독}·Share{navigator.share}·KeyboardAvoidingView{투명 View} —
 * 소비 화면 코드가 react-native를 직접 import하지 않아도 양 플랫폼에서
 * 동작하게 한다. native.tsx는 같은 이름으로 RN 것을 재노출한다.
 */
import {
  Fragment,
  forwardRef,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertCircleIcon as LucideAlertCircleIcon,
  ArrowDownIcon as LucideArrowDownIcon,
  ArrowLeftIcon as LucideArrowLeftIcon,
  ArrowRightIcon as LucideArrowRightIcon,
  ArrowUpIcon as LucideArrowUpIcon,
  BoldIcon as LucideBoldIcon,
  CheckCircle2Icon as LucideCheckCircle2Icon,
  CheckIcon as LucideCheckIcon,
  ChevronDownIcon as LucideChevronDownIcon,
  ChevronLeftIcon as LucideChevronLeftIcon,
  ChevronRightIcon as LucideChevronRightIcon,
  ChevronUpIcon as LucideChevronUpIcon,
  CircleIcon as LucideCircleIcon,
  CodeIcon as LucideCodeIcon,
  GripVerticalIcon as LucideGripVerticalIcon,
  Heading1Icon as LucideHeading1Icon,
  Heading2Icon as LucideHeading2Icon,
  InfoIcon as LucideInfoIcon,
  ItalicIcon as LucideItalicIcon,
  ListIcon as LucideListIcon,
  ListOrderedIcon as LucideListOrderedIcon,
  Loader2Icon as LucideLoader2Icon,
  MinusIcon as LucideMinusIcon,
  MoreHorizontalIcon as LucideMoreHorizontalIcon,
  PanelLeftIcon as LucidePanelLeftIcon,
  Redo2Icon as LucideRedo2Icon,
  SearchIcon as LucideSearchIcon,
  StrikethroughIcon as LucideStrikethroughIcon,
  TextQuoteIcon as LucideTextQuoteIcon,
  Undo2Icon as LucideUndo2Icon,
  XCircleIcon as LucideXCircleIcon,
  XIcon as LucideXIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "../lib/utils";
import type {
  AnimateLayoutFn,
  ApplyColorScheme,
  BridgeDimensions,
  BridgeImageRef,
  BridgePlatformStatic,
  BridgePressableRef,
  BridgeScrollViewRef,
  BridgeShare,
  BridgeStyle,
  BridgeTextRef,
  IconProps,
  BridgeTextInputRef,
  BridgeViewRef,
  ImageProps,
  KeyboardAvoidingViewProps,
  LoopPulseProps,
  LoopRotateProps,
  MeasureInWindow,
  PortalProps,
  PressableProps,
  ScrollViewProps,
  SectionListComponent,
  SectionListNode,
  SectionListProps,
  SelectOptionProps,
  SelectProps,
  TextProps,
  TextInputProps,
  UseDismiss,
  UseDragOptions,
  UseDragResult,
  UseOverlayFocus,
  UseReposition,
  UseScrollLock,
  ViewProps,
  GetViewport,
} from "./types";

// 공유 타입 전량 재수출 — 소비자는 @unikit-bridge/ui/primitives에서 타입까지 한 번에 import
export type * from "./types";

// ---------------------------------------------------------------------------
// View → <div> — RN View 기본값（display:flex, flexDirection:column）을
// 기본 클래스로 재현한다. 충돌 시 tailwind-merge（cn）이 방향 유틸리티를 정리한다.
// pointerEvents는 CSS pointer-events로 치환한다（포인터 정밀도가 높은 웹에서는
// box-only가 의미가 없어 auto로 근사 — 실사용은 box-none뿐）.
// ---------------------------------------------------------------------------
const VIEW_BASE_CLASS = "flex flex-col";
const PRESSABLE_BASE_CLASS = "flex flex-col text-left";
const SINGLE_LINE_STYLE: React.CSSProperties = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const View = forwardRef<BridgeViewRef, ViewProps>(
  (
    {
      className,
      style,
      children,
      nativeID,
      testID,
      accessibilityLabel,
      accessibilityRole,
      pointerEvents,
      onLayout,
      onHoverIn,
      onHoverOut,
      ...rest
    },
    ref,
  ) => {
    const pointerEventsValue =
      pointerEvents === "box-none"
        ? "none"
        : pointerEvents === "box-only"
          ? "auto"
          : pointerEvents;
    const resolvedStyle: React.CSSProperties | undefined = pointerEventsValue
      ? style
        ? { ...(style as React.CSSProperties), pointerEvents: pointerEventsValue }
        : { pointerEvents: pointerEventsValue }
      : (style as React.CSSProperties | undefined);
    // onLayout — RN View onLayout의 웹 실현（사이클 90）. ResizeObserver로
    // 마운트 시 1회 + 크기 변화마다 {width,height}를 전달한다. 콜백은 ref로
    // 최신 것을 읽어(inline 화살표 전개에서 관찰 재시작하지 않게) prop 유무로만
    // 구독한다. onKeyDown은 DOM 표준명이라 rest로 그대로 흐른다.
    const nodeRef = useRef<HTMLDivElement | null>(null);
    const layoutRef = useRef(onLayout);
    layoutRef.current = onLayout;
    const hasLayout = onLayout !== undefined;
    useEffect(() => {
      if (!hasLayout) return;
      const el = nodeRef.current;
      if (!el || typeof ResizeObserver !== "function") return;
      const observer = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect;
        if (rect) layoutRef.current?.({ width: rect.width, height: rect.height });
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, [hasLayout]);
    const setRef = (node: HTMLDivElement | null) => {
      nodeRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    };
    return (
      <div
        ref={setRef}
        id={nativeID}
        data-testid={testID}
        role={accessibilityRole}
        aria-label={accessibilityLabel}
        className={className ? cn(VIEW_BASE_CLASS, className) : VIEW_BASE_CLASS}
        style={resolvedStyle}
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
View.displayName = "View";

// ---------------------------------------------------------------------------
// Text → <span>
// ---------------------------------------------------------------------------
const Text = forwardRef<BridgeTextRef, TextProps>(
  (
    { className, style, children, nativeID, testID, onPress, accessibilityLabel, accessibilityRole, numberOfLines, ...rest },
    ref,
  ) => {
    const resolvedStyle: React.CSSProperties | undefined = numberOfLines
      ? numberOfLines === 1
        ? style
          ? { ...(style as React.CSSProperties), ...SINGLE_LINE_STYLE }
          : SINGLE_LINE_STYLE
        : {
            ...(style as React.CSSProperties | undefined),
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: numberOfLines,
            overflow: "hidden",
          }
      : (style as React.CSSProperties | undefined);
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        id={nativeID}
        data-testid={testID}
        role={accessibilityRole}
        aria-label={accessibilityLabel}
        className={className}
        // numberOfLines → line-clamp(동적 값이라 동적 style 계약으로 — 임의값 클래스 금지)
        style={resolvedStyle}
        onClick={onPress}
        {...rest}
      >
        {children}
      </span>
    );
  },
);
Text.displayName = "Text";

// ---------------------------------------------------------------------------
// Pressable → <button type="button">
// disabled는 네이티브 속성으로 전달돼 CSS :disabled/disabled: 변형과 포커스·클릭
// 차단이 함께 동작한다. active: 변형은 브라우저 :active와 대응한다.
// aria-value*aria-currentaria-invalidaria-describedbyonContextMenu
// onKeyDown은 표준 DOM 속성이라 rest 스프레드로 그대로 전달된다.
// （onKeyDown 계약 BridgeKeyEvent은 DOM KeyboardEvent의 구조적 상위 타입 —
//  핸들러가 keypreventDefault만 읽으므로 호환된다.）
// 기본 클래스 `flex flex-col text-left`: RN View 계열의 기본 display:flex·
// column을 재현하고(위 View와 동일 규칙), <button> 브라우저 기본
// text-align:center를 RN 시작 정렬로 되돌린다. 호출자 클래스가 이긴다.
// ---------------------------------------------------------------------------
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
      nativeID,
      testID,
      hitSlop: _hitSlop,
      onLongPress: _onLongPress, // 네이티브 전용 제스처 — 웹 폐기(context-menu는 onContextMenu)
      onContextMenu,
      // hover 2종은 웹 mouse 이벤트로 이름만 치환（사이클 90）. onFocus/onBlur/
      // onKeyDown은 DOM 표준명이라 rest로 그대로 흐른다.
      onHoverIn,
      onHoverOut,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      id={nativeID}
      data-testid={testID}
      className={className ? cn(PRESSABLE_BASE_CLASS, className) : PRESSABLE_BASE_CLASS}
      style={style as React.CSSProperties}
      onClick={onPress}
      disabled={disabled}
      aria-label={accessibilityLabel}
      role={accessibilityRole}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      // 브라우저 기본 우클릭 메뉴를 막고 커스텀 메뉴（context-menu）만 띄운다
      onContextMenu={
        onContextMenu
          ? (event: React.MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
              onContextMenu();
            }
          : undefined
      }
      {...rest}
    >
      {children}
    </button>
  ),
);
Pressable.displayName = "Pressable";

// ---------------------------------------------------------------------------
// TextInput → <input>
// maxLengthonKeyDownaria-invalidaria-describedby는 표준 DOM 속성이라
// rest 스프레드로 전달된다.
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
      disabled,
      onChangeText,
      nativeID,
      testID,
      accessibilityLabel,
      accessibilityLabelledBy,
      autoFocus,
      secureTextEntry,
      inputMode,
      multiline,
      ...rest
    },
    ref,
  ) => {
    const handleChange = (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      onChangeText?.(event.target.value);
    };
    // multiline → <textarea>（웹 표준 여러 줄 입력）. 나머지 계약은 <input>과 동일.
    if (multiline) {
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={nativeID}
          data-testid={testID}
          aria-label={accessibilityLabel}
          aria-labelledby={accessibilityLabelledBy}
          className={className}
          style={style as React.CSSProperties}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={editable === false}
          autoFocus={autoFocus}
          inputMode={inputMode}
          onChange={handleChange}
          {...rest}
        />
      );
    }
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        id={nativeID}
        data-testid={testID}
        aria-label={accessibilityLabel}
        aria-labelledby={accessibilityLabelledBy}
        className={className}
        style={style as React.CSSProperties}
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
// Image → <img> — 원격 {uri} 소스를 src로 푼다. 정적 require（） 소스는
// 네이티브 전용 기능이라 웹 계약에 없다.
// ---------------------------------------------------------------------------
const Image = forwardRef<BridgeImageRef, ImageProps>(
  (
    {
      className,
      style,
      source,
      alt = "",
      onError,
      accessibilityLabel, // 웹은 alt가 스크린리더 텍스트 표준
      nativeID,
      testID,
      ...rest
    },
    ref,
  ) => (
    <img
      ref={ref as React.Ref<HTMLImageElement>}
      id={nativeID}
      data-testid={testID}
      src={source.uri}
      alt={alt || accessibilityLabel}
      loading="lazy"
      className={className}
      style={style as React.CSSProperties}
      onError={onError}
      {...rest}
    />
  ),
);
Image.displayName = "Image";

// ---------------------------------------------------------------------------
// Portal — createPortal（document.body）. 오버레이（dialogpopoversheettoast）가
// 부모 레이아웃（stacking contextoverflow）을 벗어나 최상위에 그려진다.
// visible=false 또는 SSR（document 부재）이면 아무것도 렌더하지 않는다.
// 백드롭은 onBackdropPress가 있을 때만 깔리며（투명 클릭 포착층 — Tailwind
// 클래스 없이도 동작하도록 인라인 fixed）, 배경색z-index는 backdropClassName으로.
// onRequestClose（ESC）는 웹에서 Portal이 소비하지 않는다 — useDismiss 훅이
// 담당하고 lib/overlay가 둘을 조합한다（이중 발화 방지）.
// modal={false}는 웹에서 무의미하다 — 웹 포털은 원래 비모달（백드롭 없으면
// 클릭을 잡지 않는다）.
// dismissViaDocument（사이클 90 F-4） — hover 진입 오버레이용 대안 포착 방식.
// 투명 커버층이 전체 화면을 덮는 순간 브라우저가 hover 체인을 재계산해 트리거에
// mouseleave가 발생, hover로 열린 카드가 스스로 닫힌다. 이 값이 true면 커버층을
// 깔지 않고 문서 수준 pointerdown 리스너로 카드 밖 판정을 한다（radix
// DismissableLayer 방식의 근사）. 포함 판정 기준으로 children을 display:contents
// 래퍼로 감싼다(박스를 만들지 않아 레이아웃 불변).
//
// 계층 스택（사이클 90 F-10） — 열린 카드가 여러 개일 때(메뉴+서브메뉴) 각 포털이
// 독립 판정하면 ① 서브 카드 안 눌림도 루트가 «바깥»으로 닫아버려 언마운트가
// click보다 먼저 와 항목 선택이 유실되고 ② 트리거 재클릭이 닫힘→토글 재오픈이
// 된다. 등록 순(=마운트 순) 스택에서 위에서부터 내려가며, 눌림 대상을 포함하는
// 층을 만나면 멈추고 그 위의 층만 닫는다(radix DismissableLayer 스택 근사).
// dismissIgnoreRef(트리거)도 포함 판정에 넣어 트리거 눌림은 트리거 토글에 맡긴다.
// ---------------------------------------------------------------------------
type DismissLayer = {
  host: HTMLDivElement;
  close: () => void;
  /** 바깥 판정에서 제외할 요소(트리거) — null이면 없음 */
  ignoreNode: Node | null;
};
const dismissLayers: DismissLayer[] = [];
function resolveDismissIgnoreNode(ref: unknown): Node | null {
  const el =
    ref && typeof ref === "object" && "current" in (ref as Record<string, unknown>)
      ? (ref as { current: unknown }).current
      : ref;
  return el instanceof Node ? el : null;
}

const Portal = ({
  children,
  visible,
  onBackdropPress,
  backdropClassName,
  dismissViaDocument,
  dismissIgnoreRef,
}: PortalProps) => {
  // 문서 리스너 포착 — 카드 밖 pointerdown만 onBackdropPress로 전달한다.
  // 훅은 언제 불려도 같은 순서로 호출돼야 하므로 조기 반환보다 앞에 둔다.
  // close는 ref로 갱신해 등록 자체는 마운트마다 1회로 안정시킨다 — 콜백 인라인
  // 화살표 때문에 매 렌더 재등록하면 스택 순서가 흔들린다(루트가 서브 위로).
  const hostRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onBackdropPress);
  closeRef.current = onBackdropPress;
  useEffect(() => {
    if (!visible || !dismissViaDocument || !closeRef.current) return;
    const layer: DismissLayer = {
      host: hostRef.current!,
      close: () => closeRef.current?.(),
      ignoreNode: resolveDismissIgnoreNode(dismissIgnoreRef),
    };
    dismissLayers.push(layer);
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      const layers = dismissLayers.slice();
      for (let i = layers.length - 1; i >= 0; i--) {
        const current = layers[i]!;
        const inside =
          current.host.contains(event.target) ||
          (current.ignoreNode !== null && current.ignoreNode.contains(event.target));
        if (inside) break;
        current.close();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      const index = dismissLayers.indexOf(layer);
      if (index !== -1) dismissLayers.splice(index, 1);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [visible, dismissViaDocument, dismissIgnoreRef]);
  if (!visible || typeof document === "undefined") return null;
  // 백드롭 렌더 조건 — 닫기 핸들러가 있거나(onBackdropPress — 투명 클릭
  // 포착층이라도 렌더) 배경 클래스가 있으면(딤 — alert-dialog 등 닫힘
  // 차단만 하는 오버레이) 무조건 렌더한다. 둘 다 없으면 백드롭 없이
  // children만(비모달 — 토스트). onBackdropPress가 없는 백드롭은 클릭을
  // 삼키되 닫지 않는다(원본 radix alert-dialog 동작 — G3 F-3 반영).
  // dismissViaDocument면 커버층을 생략한다(문서 리스너가 포착을 대신).
  const renderBackdrop = (onBackdropPress || backdropClassName) && !dismissViaDocument;
  return createPortal(
    <>
      {renderBackdrop ? (
        <div
          className={backdropClassName}
          style={{ position: "fixed", inset: 0 }}
          onPointerDown={onBackdropPress}
        />
      ) : null}
      <div ref={hostRef} style={{ display: "contents" }}>
        {children}
      </div>
    </>,
    document.body,
  );
};

// ---------------------------------------------------------------------------
// ScrollView → overflow 스크롤 div + 내부 콘텐츠 컨테이너 div.
// ref.scrollTo는 RN ScrollView 인스퍼런스 계약과 동일 시그니처（x/y/animated）.
// pagingEnabled → CSS scroll-snap（가로 carousel 등）, horizontal → 축 전환.
// 콘텐츠 정렬패딩은 contentContainerClassName（내부 컨테이너）에 준다.
// ---------------------------------------------------------------------------
const ScrollView = forwardRef<BridgeScrollViewRef, ScrollViewProps>(
  (
    {
      className,
      style,
      children,
      nativeID,
      testID,
      accessibilityLabel,
      accessibilityRole,
      contentContainerClassName,
      horizontal,
      pagingEnabled,
      onScroll,
      keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
      keyboardDismissMode: _keyboardDismissMode,
      ...rest
    },
    ref,
  ) => {
    const elRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(
      ref,
      () => ({
        scrollTo: ({ x = 0, y = 0 }: { x?: number; y?: number; animated?: boolean }) => {
          const el = elRef.current;
          if (!el) return;
          if (horizontal) el.scrollTo({ left: x, behavior: "smooth" });
          else el.scrollTo({ top: y, behavior: "smooth" });
        },
      }),
      [horizontal],
    );
    return (
      <div
        ref={elRef}
        id={nativeID}
        data-testid={testID}
        role={accessibilityRole}
        aria-label={accessibilityLabel}
        className={cn(
          horizontal ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto overflow-x-hidden",
          pagingEnabled && (horizontal ? "snap-x snap-mandatory" : "snap-y snap-mandatory"),
          className,
        )}
        style={style as React.CSSProperties}
        onScroll={onScroll}
        {...rest}
      >
        <div
          className={cn(
            "flex min-w-full",
            horizontal ? "flex-row" : "flex-col",
            contentContainerClassName,
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);
ScrollView.displayName = "ScrollView";

// ---------------------------------------------------------------------------
// SectionList → overflow div + 섹션 순회 렌더. RN 하위 집합 계약
// （sections·renderItem·renderSectionHeader·keyExtractor·List* 슬롯）.
// stickySectionHeadersEnabled(기본 true) → position:sticky. RN 관용
// keyboardShouldPersistTaps·keyboardDismissMode는 받아 두고 폐기한다（웹은
// 표준 키보드-스크롤 상호작용을 따른다）. ListEmptyComponent는 전 섹션 항목
// 수가 0일 때 본문 대신 나온다（RN 관행）. 스크롤 위치 제어(scrollToLocation
// 등)는 아직 계약에 없다 — 필요해지면 BridgeScrollViewRef와 같은 방식으로 확장.
// ---------------------------------------------------------------------------
const renderListNode = (node: SectionListNode | undefined): ReactNode => {
  if (!node) return null;
  if (isValidElement(node)) return node;
  const Comp = node as ComponentType; // 관용 — 요소 또는 프로퍼티 없는 컴포넌트
  return <Comp />;
};

const SectionList: SectionListComponent = ({
  className,
  style,
  nativeID,
  testID,
  accessibilityLabel,
  accessibilityRole,
  contentContainerClassName,
  sections,
  renderItem,
  keyExtractor,
  renderSectionHeader,
  stickySectionHeadersEnabled = true,
  ListHeaderComponent,
  ListEmptyComponent,
  ListFooterComponent,
  keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
  keyboardDismissMode: _keyboardDismissMode,
  ...rest
}) => {
  const totalItems = sections.reduce((count, section) => count + section.data.length, 0);
  return (
    <div
      id={nativeID}
      data-testid={testID}
      role={accessibilityRole}
      aria-label={accessibilityLabel}
      className={cn("overflow-y-auto overflow-x-hidden", className)}
      style={style as React.CSSProperties}
      {...rest}
    >
      <div className={cn("flex min-w-full flex-col", contentContainerClassName)}>
        {renderListNode(ListHeaderComponent)}
        {totalItems === 0
          ? renderListNode(ListEmptyComponent)
          : sections.map((section, sectionIndex) => (
              <Fragment key={section.title ?? sectionIndex}>
                {renderSectionHeader ? (
                  <div
                    className={cn(
                      stickySectionHeadersEnabled && "sticky top-0 z-10",
                    )}
                  >
                    {renderSectionHeader({ section })}
                  </div>
                ) : null}
                {section.data.map((item, index) => (
                  <Fragment key={keyExtractor?.(item, index) ?? index}>
                    {renderItem({ item, index, section })}
                  </Fragment>
                ))}
              </Fragment>
            ))}
        {renderListNode(ListFooterComponent)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 앱 API 폴백（웹） — Platform·Dimensions·Share·KeyboardAvoidingView.
// 소비 화면 코드가 react-native를 직접 import하지 않아도 양 플랫폼에서
// 동작하게 하는 단일 import 원칙(AC-1) 확장. 웹 키보드 회피는 브라우저 가상
// 키보드-뷰포트가 담당하므로 KeyboardAvoidingView는 투명 View로 둔다.
// navigator.share 미지원 환경은 조용히 dismissed로 해소한다（사용측 try/catch
// 관행과 정합 — 웹 전용 공유 UI가 필요하면 소비자가 직접 구성）.
// ---------------------------------------------------------------------------
const Platform: BridgePlatformStatic = {
  OS: "web",
  select: (spec) => spec.web ?? spec.default,
};

const windowSnapshot = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
  scale: window.devicePixelRatio || 1,
  fontScale: 1,
});

const screenSnapshot = () => ({
  width: window.screen.width,
  height: window.screen.height,
  scale: window.devicePixelRatio || 1,
  fontScale: 1,
});

const Dimensions: BridgeDimensions = {
  get: (dim) => (dim === "screen" ? screenSnapshot() : windowSnapshot()),
  addEventListener: (type, handler) => {
    if (type !== "change") return { remove: () => {} };
    const listener = () => handler({ window: windowSnapshot(), screen: screenSnapshot() });
    window.addEventListener("resize", listener);
    return { remove: () => window.removeEventListener("resize", listener) };
  },
};

const Share: BridgeShare = {
  share: async (content) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        text: content.message,
        url: content.url,
        title: content.title,
      });
      return { action: "shared" };
    }
    return { action: "dismissed" };
  },
};

const KeyboardAvoidingView = ({
  behavior: _behavior,
  keyboardVerticalOffset: _keyboardVerticalOffset,
  ...rest
}: KeyboardAvoidingViewProps) => <View {...rest} />;

// ---------------------------------------------------------------------------
// Select/SelectOption → <select>/<option>. 네이티브 폼 셀렉트（native-select）가
// 소비한다 — 커스텀 셀렉트（shadcn select）는 popover 기반 자체 구현.
// onChange에서 value만 뽑아 onValueChange（브리지 공통 계약）로 올린다.
// ---------------------------------------------------------------------------
const Select = ({
  className,
  value,
  defaultValue,
  onValueChange,
  children,
  disabled,
  accessibilityLabel,
  nativeID,
  testID,
}: SelectProps) => (
  <select
    className={className}
    value={value}
    defaultValue={defaultValue}
    disabled={disabled}
    aria-label={accessibilityLabel}
    id={nativeID}
    data-testid={testID}
    onChange={(event) => onValueChange?.(event.target.value)}
  >
    {children}
  </select>
);

const SelectOption = ({ value, disabled, children }: SelectOptionProps) => (
  <option value={value} disabled={disabled}>
    {children}
  </option>
);

// ---------------------------------------------------------------------------
// measureInWindow — getBoundingClientRect는 이미 뷰포트（창） 좌표를 반환하므로
// （x,y,w,h,pageX,pageY）에 그대로 흘린다（scrollX/Y 가산 없음 → fixed 배치와
// 정합 — lib/overlay 위치 계산이 이 좌표계를 소비한다）.
// ---------------------------------------------------------------------------
const measureInWindow: MeasureInWindow = (ref, callback) => {
  if (typeof window === "undefined") return;
  const el = ref as HTMLElement | null;
  if (!el || typeof el.getBoundingClientRect !== "function") return;
  const rect = el.getBoundingClientRect();
  callback(rect.x, rect.y, rect.width, rect.height, rect.x, rect.y);
};

// ---------------------------------------------------------------------------
// useDrag — Pointer Events 기반 드래그（sliderdrawer 등）. setPointerCapture로
// 포인터가 요소를 벗어나도 제스처를 유지하고, origin 대비 델타（dx/dy）를
// 제공한다. RN PanResponder와 동일 시맨틱.
// ---------------------------------------------------------------------------
const useDrag = (options: UseDragOptions): UseDragResult => {
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const originRef = useRef({ x: 0, y: 0 });

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    originRef.current = { x: event.clientX, y: event.clientY };
    draggingRef.current = true;
    setDragging(true);
    optionsRef.current.onBegin?.();
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    optionsRef.current.onMove?.({
      x: event.clientX,
      y: event.clientY,
      dx: event.clientX - originRef.current.x,
      dy: event.clientY - originRef.current.y,
    });
  };
  const onPointerEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    optionsRef.current.onEnd?.();
  };

  return {
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
    dragging,
  };
};

// ---------------------------------------------------------------------------
// 오버레이 훈 4종 — lib/overlay가 소비해 오버레이 컴포넌트를 한 벌 소스로
// 유지한다. 네이티브 대응은 no-op（RN Modal이 OS 수준 처리）.
// ---------------------------------------------------------------------------

/** 훈 인자 target/returnTo는 ref 객체 또는 요소 자체를 허용한다. */
function toElement(target: unknown): HTMLElement | null {
  if (!target || typeof window === "undefined") return null;
  if (typeof target === "object" && "current" in (target as Record<string, unknown>)) {
    return (target as RefObject<HTMLElement | null>).current ?? null;
  }
  return target as HTMLElement | null;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * useOverlayFocus — 열림（active=true） 시 오버레이 내 첫 포커서블로 포커스,
 * Tab 순환을 오버레이 안에 가두고（트랩）, 닫힘 시 트리거（returnTo）로 복귀.
 */
const useOverlayFocus: UseOverlayFocus = (target, active, returnTo) => {
  const prevActiveRef = useRef(false);
  useEffect(() => {
    const node = toElement(target);
    if (active) {
      const first = node?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? null;
      (first ?? node)?.focus({ preventScroll: true });
    } else if (prevActiveRef.current) {
      toElement(returnTo)?.focus({ preventScroll: true });
    }
    prevActiveRef.current = active;
  }, [active, target, returnTo]);

  useEffect(() => {
    if (!active) return;
    const node = toElement(target);
    if (!node) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const current = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (current === first || !node.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !node.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [active, target]);
};

/** ESC 오너십 스택 — 중첩 오버레이（다이얼로그 안의 셀렉트 팝업 등）에서
 *  ESC는 최상위（마지막에 열린） 오버레이만 닫는다（원본 radix 동작 —
 *  G3 F-6 반영）. 각 useDismiss 인스턴스가 고유 토큰을 push/pop하고
 *  자신이 스택 꼭대기일 때만 발화한다. */
const dismissStack: unknown[] = [];

/** useDismiss — ESC 닫기（document keydown）. active일 때만 리스너가 산다. */
const useDismiss: UseDismiss = (onDismiss, active) => {
  const callbackRef = useRef(onDismiss);
  callbackRef.current = onDismiss;
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const entry = {};
    dismissStack.push(entry);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (dismissStack[dismissStack.length - 1] !== entry) return;
      callbackRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      const index = dismissStack.indexOf(entry);
      if (index >= 0) dismissStack.splice(index, 1);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);
};

/** useReposition — 열림 중 scroll（캡처）resize마다 listener 재호출（재배치）. */
const useReposition: UseReposition = (listener, active) => {
  const callbackRef = useRef(listener);
  callbackRef.current = listener;
  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    // 안정 래퍼 — add/remove가 항상 같은 함수 참조를 쓰게 해 리스너 누수를
    // 막는다（listener 참조가 바뀌어도 등록 시점 래퍼로 해제 — G3 F-14）.
    // rAF 스로틀로 스크롤 이벤트 폭주를 프레임당 1회 재측정으로 제한한다
    // （G3 F-19）.
    let frame = 0;
    const onEvent = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        callbackRef.current();
      });
    };
    window.addEventListener("scroll", onEvent, true);
    window.addEventListener("resize", onEvent);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onEvent, true);
      window.removeEventListener("resize", onEvent);
    };
  }, [active]);
};

/** useScrollLock — 열림 중 배경 스크롤 잠금（body overflow hidden, 원상 복구）. */
const useScrollLock: UseScrollLock = (active) => {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
};

// ---------------------------------------------------------------------------
// 테마 바인딩
// ---------------------------------------------------------------------------
/** 색 스킴 → 문서 루트의 .dark 클래스（표준 Tailwind dark 변형 — @custom-variant dark） */
const applyColorScheme: ApplyColorScheme = (colorScheme) => {
  document.documentElement.classList.toggle("dark", colorScheme === "dark");
};

/** 뷰포트 크기 — SSR（창 부재）이면 0（소비자가 클램프를 건너뛴다） */
const getViewport: GetViewport = () =>
  typeof window === "undefined"
    ? { width: 0, height: 0 }
    : { width: window.innerWidth, height: window.innerHeight };

// ---------------------------------------------------------------------------
// 루프 애니메이션 래퍼 — 웹은 투명(프래그먼트). 컴포넌트가 함께 쓰는
// web:animate-spin / web:animate-pulse 클래스(CSS keyframes)가 이미 회전·
// 맥동을 담당하므로 래퍼가 아무것도 감싸지 않는다. 이 투명성 덕분에 컴포넌트는
// 단일 소스로 양쪽 효과를 얻는다(네이티브 구현은 native.tsx — RN Animated).
// ---------------------------------------------------------------------------
const LoopRotate = ({ children }: LoopRotateProps) => <>{children}</>;
const LoopPulse = ({ children }: LoopPulseProps) => <>{children}</>;
const animateLayout: AnimateLayoutFn = () => {};

// ---------------------------------------------------------------------------
// 유니버설 벡터 아이콘 — lucide-react 래핑（컴포넌트는 primitives의 *Icon만 소비）
// ---------------------------------------------------------------------------

function wrapWebLucide(Icon: LucideIcon, defaultClassName = "size-4") {
  return function WebIcon({
    className,
    size,
    color,
    strokeWidth = 2,
    style,
    "aria-hidden": ariaHidden = true,
  }: IconProps) {
    return (
      <Icon
        className={className ? cn(defaultClassName, className) : defaultClassName}
        {...(size != null ? { size } : {})}
        color={color}
        strokeWidth={strokeWidth}
        aria-hidden={ariaHidden ? true : undefined}
        style={style as React.CSSProperties | undefined}
      />
    );
  };
}

const CheckIcon = wrapWebLucide(LucideCheckIcon);
const ChevronDownIcon = wrapWebLucide(LucideChevronDownIcon);
const ChevronUpIcon = wrapWebLucide(LucideChevronUpIcon);
const ChevronRightIcon = wrapWebLucide(LucideChevronRightIcon);
const ChevronLeftIcon = wrapWebLucide(LucideChevronLeftIcon);
const XIcon = wrapWebLucide(LucideXIcon);
const SearchIcon = wrapWebLucide(LucideSearchIcon);
const MinusIcon = wrapWebLucide(LucideMinusIcon);
const CircleIcon = wrapWebLucide(LucideCircleIcon);
const MoreHorizontalIcon = wrapWebLucide(LucideMoreHorizontalIcon);
const ArrowLeftIcon = wrapWebLucide(LucideArrowLeftIcon);
const ArrowRightIcon = wrapWebLucide(LucideArrowRightIcon);
const ArrowUpIcon = wrapWebLucide(LucideArrowUpIcon);
const ArrowDownIcon = wrapWebLucide(LucideArrowDownIcon);
const InfoIcon = wrapWebLucide(LucideInfoIcon);
const AlertCircleIcon = wrapWebLucide(LucideAlertCircleIcon);
const CheckCircle2Icon = wrapWebLucide(LucideCheckCircle2Icon);
const XCircleIcon = wrapWebLucide(LucideXCircleIcon);
const Loader2Icon = wrapWebLucide(LucideLoader2Icon);
const PanelLeftIcon = wrapWebLucide(LucidePanelLeftIcon);
const GripVerticalIcon = wrapWebLucide(LucideGripVerticalIcon);
// 툴바 서식 아이콘 — 마크다운 에디터 도그푸딩(apps/desktop·apps/mobile)에서 사용.
const BoldIcon = wrapWebLucide(LucideBoldIcon);
const ItalicIcon = wrapWebLucide(LucideItalicIcon);
const StrikethroughIcon = wrapWebLucide(LucideStrikethroughIcon);
const Heading1Icon = wrapWebLucide(LucideHeading1Icon);
const Heading2Icon = wrapWebLucide(LucideHeading2Icon);
const ListIcon = wrapWebLucide(LucideListIcon);
const ListOrderedIcon = wrapWebLucide(LucideListOrderedIcon);
const TextQuoteIcon = wrapWebLucide(LucideTextQuoteIcon);
const CodeIcon = wrapWebLucide(LucideCodeIcon);
const Undo2Icon = wrapWebLucide(LucideUndo2Icon);
const Redo2Icon = wrapWebLucide(LucideRedo2Icon);

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
