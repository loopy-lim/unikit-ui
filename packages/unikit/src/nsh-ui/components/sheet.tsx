// Sheet — src/components/sheet.tsx의 nsh 네이티브 포팅(사이클 102, 103 수정).
// 기반: nsh/base의 Sheet(가장자리 배치·백드롭·Escape·스와이프 닫기 소유) +
// context(열림 상태를 컴파운드 파트에 공유). dialog.tsx의 형제 구성이다.
//
// 포팅 판단(원본 대비 차이):
// - 컴파운드 구성은 React 포팅과 같다 — Sheet(상태 소유 래퍼)·SheetTrigger·
//   SheetClose·SheetContent·SheetHeader/Footer/Title/Description. 102 판(0.5.0)은
//   본문 파트만 있고 열림을 앱이 직접 소유했다. **API 변경**: 0.5.0은 Sheet의
//   children이 곧 본문이었고 side도 Sheet prop이었지만, 이제 본문은 <SheetContent
//   side=…>로 감싼다. 변형 export 이름도 sheetPanelVariants → sheetContentVariants
//   (React 포팅과 같은 이름).
// - 비제어 상태·setOpen 규칙은 dialog.tsx와 같다(signal + 제어형 open 우선,
//   값이 달라질 때만 onOpenChange). 0.5.0은 open을 항상 넘겨 닫히지 않았다(102 결함).
// - 기본 side는 원본·React 포팅과 같은 "right"(0.5.0은 "bottom").
// - nsh Sheet 계약(103 실측: 웹·안드로이드): 패널 클래스는 popupClass로만 붙는다 —
//   0.5.0은 class에 넘겨 레이아웃·배경이 패널에 적용되지 않았다(102 결함). 백드롭은
//   backdropClass를 줘야 딤이 생기고(원본·React 포팅과 같은 bg-black/50), 바깥 누름은
//   nsh가 기본(closeOnBackdropPress)으로 닫고 안드로이드 뒤로가기도 닫는다
//   (reason "cancel"). testID는 nsh Sheet가 테스트 드라이버에 노출하지 않아 패널
//   안 본문 래퍼 View에 붙인다(지정하면 닫기 버튼은 `<testID>-close`).
// - 가장자리 클래스는 React 포팅 값 그대로 — 다만 nsh는 한정 없는 border-* 를 검정
//   으로 그린다(103 실측: 웹의 border-border 기본 규칙 없음) → 기본 클래스에
//   border-border를 둔다. left/right의 sm:max-w-sm은 반응형 접두 미지원 — 조건 없는
//   max-w-sm으로 둔다(폰에서는 w-3/4가 더 좁아 효과 없음, 넓은 화면에서 24rem 상한 —
//   103 실측: 웹 900폭 패널 383, 안드로이드 390폭 패널 291.5).
// - 시트가 화면에 붙으므로 팝업 여백은 없다(원본 inset-0과 같다).
// - 등장/퇴장 애니메이션은 nsh Sheet가 가장자리 슬라이드로 자체 제공(원본과 같은
//   방향). 바텀시트의 스와이프 닫기(closeOnSwipe)는 원본에 없어 기본값 false 그대로.
//   백드롭은 상태 바까지 덮는다(103 실측: 안드로이드 390×844 전체 — Dialog와 다름).
// - X 닫기 버튼은 React 포팅 값(top-3 right-3 rounded-sm p-1 opacity-70 + size-4
//   text-foreground). 호버·focus-visible 링은 웹 전용(web:)이라 생략, sr-only "Close"는
//   accessibilityLabel로 대체.
// - SheetHeader "gap-1.5 p-4"·SheetFooter "mt-auto gap-2 p-4"·SheetTitle(무게만,
//   text-lg 없음)은 React 포팅·원본 값 — 0.5.0은 Dialog 값을 그대로 썼다(102 결함).
// - 접근성 연결은 nsh가 소유(dialog.tsx와 같다). 본문은 열릴 때마다 다시 만들어진다.
import { Sheet as NshSheet } from "nsh/base";
import { context, signal, Text, View } from "nsh";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { XIcon } from "../icons";
import { wrapLabel } from "../label";
import { nshClass } from "../lib";
import { Pressable } from "../primitives";
import type { Element } from "../types";

type SheetContextValue = {
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
};

const SheetContext = context<SheetContextValue | null>(null);

function useSheet(component: string): SheetContextValue {
  const sheet = SheetContext();
  if (!sheet) {
    throw new Error(`<${component}>는 <Sheet> 안에서 사용해야 합니다.`);
  }
  return sheet;
}

// 패널 — 남는 축 토큰만 원본에서 유지(가장자리 고정은 nsh Sheet가 담당).
const sheetContentVariants = cva(
  "relative flex flex-col gap-4 border-border bg-background shadow-lg",
  {
    variants: {
      side: {
        top: "w-full border-b",
        bottom: "w-full border-t",
        left: "h-full w-3/4 max-w-sm border-r",
        right: "h-full w-3/4 max-w-sm border-l",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

// 백드롭 — React 포팅 값 bg-black/50. 지정해야 딤이 생긴다(nsh 계약).
const sheetBackdropVariants = cva("bg-black/50");

// 패널 안 본문 래퍼 — left/right(h-full 패널)에서는 남는 높이를 채워
// SheetFooter의 mt-auto가 바닥에 닿게 한다. top/bottom은 내용 높이 패널이라
// flex-basis 0인 flex-1을 쓰면 접히므로 클래스를 주지 않는다.
// relative — SheetClose(sheetCloseVariants가 absolute)의 배치 기준을 이 래퍼로
// 통일한다(팝업 클래스의 relative와 무관하게 항상 본문 기준).
const sheetBodyVariants = cva("relative flex flex-col gap-4", {
  variants: {
    side: {
      top: "",
      bottom: "",
      left: "flex-1",
      right: "flex-1",
    },
  },
  defaultVariants: {
    side: "right",
  },
});

const sheetHeaderVariants = cva("flex flex-col gap-1.5 p-4");
const sheetFooterVariants = cva("mt-auto flex flex-col gap-2 p-4");
const sheetTitleVariants = cva("font-sans font-semibold text-foreground");
const sheetDescriptionVariants = cva("font-sans text-sm text-muted-foreground");
const sheetCloseVariants = cva("absolute right-3 top-3 rounded-sm p-1 opacity-70");
const sheetTriggerTextVariants = cva("font-sans text-sm font-medium text-foreground");

export type SheetProps = {
  className?: string;
  testID?: string;
  /** 제어형 열림 — 앱이 소유한다(onOpenChange에서 함께 내려야 한다) */
  open?: boolean;
  /** 기본 열림 */
  defaultOpen?: boolean;
  /** 열림이 달라졌을 때 — 사용자가 닫은 경우(바깥 누름·Escape·스와이프) 포함 */
  onOpenChange?: (open: boolean) => void;
  /** SheetTrigger/SheetContent — 본문은 SheetContent로 감싼다 */
  children?: Element;
};

export function Sheet(props: SheetProps) {
  const uncontrolled = signal(props.defaultOpen ?? false);
  // dialog.tsx와 같은 규칙 — signal은 즉시 갱신되므로 이전 값은 바꾸기 전에 읽는다.
  const setOpen = (next: boolean) => {
    const wasOpen = props.open ?? uncontrolled();
    if (props.open === undefined) uncontrolled.set(next);
    if (next !== wasOpen) props.onOpenChange?.(next);
  };
  const sheet: SheetContextValue = {
    isOpen: () => props.open ?? uncontrolled(),
    setOpen,
  };
  return (
    <SheetContext.Provider value={sheet}>
      <View class={nshClass(props.className)} testID={props.testID}>
        {props.children}
      </View>
    </SheetContext.Provider>
  );
}

export type SheetTriggerProps = {
  className?: string;
  disabled?: boolean;
  testID?: string;
  hitSlop?: number;
  accessibilityLabel?: string;
  onPress?: () => void;
  /** 트리거 라벨 — 문자열을 권장한다(내부 Text 래핑) */
  children?: Element;
};

/** 누르면 연다(문자열 children은 내부 Text로 감싼다). */
export function SheetTrigger(props: SheetTriggerProps) {
  const sheet = useSheet("SheetTrigger");
  return (
    <Pressable
      className={props.className}
      disabled={props.disabled}
      testID={props.testID}
      hitSlop={props.hitSlop}
      accessibilityLabel={props.accessibilityLabel}
      onPress={() => {
        sheet.setOpen(true);
        props.onPress?.();
      }}
    >
      {wrapLabel(props.children, sheetTriggerTextVariants())}
    </Pressable>
  );
}

export type SheetCloseProps = SheetTriggerProps;

/** 누르면 닫는다(문자열 children은 내부 Text로 감싼다). */
export function SheetClose(props: SheetCloseProps) {
  const sheet = useSheet("SheetClose");
  return (
    <Pressable
      className={props.className}
      disabled={props.disabled}
      testID={props.testID}
      hitSlop={props.hitSlop}
      accessibilityLabel={props.accessibilityLabel}
      onPress={() => {
        sheet.setOpen(false);
        props.onPress?.();
      }}
    >
      {wrapLabel(props.children, sheetTriggerTextVariants())}
    </Pressable>
  );
}

export type SheetContentProps = VariantProps<typeof sheetContentVariants> & {
  /** 추가 클래스 — 패널에 붙는다 */
  className?: string;
  /** 오른쪽 위 X 닫기 버튼(기본 true) */
  showCloseButton?: boolean;
  /** 본문 래퍼 식별자 — 지정하면 닫기 버튼은 `<testID>-close` */
  testID?: string;
  /** 화면 낭독기가 시트 이름으로 읽을 제목 */
  accessibilityLabel?: string;
  /** 본문 — 열릴 때마다 다시 만들어진다(nsh 계약) */
  children?: Element;
};

export function SheetContent(props: SheetContentProps) {
  const sheet = useSheet("SheetContent");
  // props는 getter다 — side는 읽는 시점마다 다시 읽어 시그널 교체를 따라간다.
  const sideOf = () => props.side ?? "right";
  return (
    <NshSheet
      side={sideOf()}
      open={sheet.isOpen()}
      onOpenChange={(event: { open: boolean }) => sheet.setOpen(event.open)}
      popupClass={cn(sheetContentVariants({ side: sideOf() }), nshClass(props.className))}
      backdropClass={sheetBackdropVariants()}
      accessibilityLabel={props.accessibilityLabel}
    >
      <View class={cn(sheetBodyVariants({ side: sideOf() }))} testID={props.testID}>
        {props.children}
        {props.showCloseButton ?? true ? (
          <SheetClose
            className={sheetCloseVariants()}
            testID={props.testID ? `${props.testID}-close` : undefined}
            accessibilityLabel="Close"
          >
            <XIcon className="size-4 text-foreground" />
          </SheetClose>
        ) : null}
      </View>
    </NshSheet>
  );
}

export type SheetTextProps = { className?: string; testID?: string; children?: Element };

export function SheetHeader(props: SheetTextProps) {
  return (
    <View class={cn(sheetHeaderVariants(), nshClass(props.className))} testID={props.testID}>
      {props.children}
    </View>
  );
}

export function SheetFooter(props: SheetTextProps) {
  return (
    <View
      class={cn(sheetFooterVariants(), nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </View>
  );
}

export function SheetTitle(props: SheetTextProps) {
  return (
    <Text class={cn(sheetTitleVariants(), nshClass(props.className))} testID={props.testID}>
      {props.children}
    </Text>
  );
}

export function SheetDescription(props: SheetTextProps) {
  return (
    <Text
      class={cn(sheetDescriptionVariants(), nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </Text>
  );
}

export { sheetContentVariants };
