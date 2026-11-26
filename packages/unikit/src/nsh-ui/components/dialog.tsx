// Dialog — src/components/dialog.tsx의 nsh 네이티브 포팅(사이클 102, 103 수정).
// 기반: nsh/base의 Dialog(모달 레이어 — 백드롭·Escape·포커스 관리 담당) +
// context(열림 상태를 컴파운드 파트에 공유).
//
// 포팅 판단(원본 대비 차이):
// - 컴파운드 구성은 React 포팅과 같다 — Dialog(상태 소유 래퍼)·DialogTrigger·
//   DialogClose·DialogContent·DialogHeader/Footer/Title/Description. 102 판(0.5.0)은
//   본문 파트만 있고 열림을 앱이 open/onOpenChange로 직접 소유했다(Trigger는
//   로드맵). **API 변경**: 0.5.0은 Dialog의 children이 곧 본문이었지만, 이제 본문은
//   <DialogContent>로 감싼다.
// - 비제어 상태는 signal(제어형 open이 우선). setOpen은 React 포팅과 같은 규칙 —
//   제어형이면 내부 값을 두고, 값이 달라질 때만 onOpenChange를 부른다. 0.5.0은
//   open을 항상 넘겨 nsh가 제어형으로 보았고, 앱이 onOpenChange에서 open을 내려주지
//   않으면 닫히지 않았다(102 결함).
// - nsh Dialog 계약(103 실측: 웹·안드로이드): class·style은 팝업(children을 감싸는
//   뷰)에 붙고 레이어 자체는 창 전체를 덮는다. 백드롭은 backdropClass/backdropStyle를
//   줘야 생기고(딤 + 바깥 누름 = onOpenChange, nsh reason "backdropPress"; 안드로이드
//   뒤로가기는 "cancel"), 0.5.0은 둘 다 없어 배경이 밝게 남고 바깥 누름·닫기 버튼도
//   없었다(머리 주석의 "백드롭 담당" 기술은 틀린 값이었다).
// - 원본 max-w-[calc(100%-2rem)]·sm:max-w-lg는 임의값·반응형 접두라 쓸 수 없다.
//   팝업을 my-auto self-stretch p-4 + 인라인 pointerEvents "box-none"으로 두고
//   카드에 w-full max-w-lg mx-auto를 준다 — 폰에서 좌우 1rem 여백, 넓은 화면에서
//   32rem 상한과 수직 중앙(103 실측: 웹 390폭 카드 358·900폭 카드 512, 안드로이드
//   390×844 카드 358·수직 중앙). pointer-events-box-none 클래스는 nsh에 없어 인라인
//   style로 준다. 여백 누름은 box-none을 지나 백드롭에 닿는다(웹·안드로이드 실측).
//   카드의 pointer-events-auto는 웹에서 box-none 상속을 끊어 카드 안 누름이 백드롭으로
//   새지 않게 한다(React 포팅과 같은 클래스).
// - 원본 grid gap-4 → flex-col gap-4(원본 포팅 관행 승계).
// - 등장/퇴장 애니메이션(원본 fade+zoom 200ms)은 data 속성 없이 재현 불가 — nsh
//   animation "fade"가 가장 가깝다(기본값 "slide" 대신).
// - X 닫기 버튼은 React 포팅 값(top-3 right-3 rounded-sm p-1 opacity-70 +
//   size-4 text-muted-foreground)을 따른다(원본은 top-4 right-4 rounded-xs).
//   호버·focus-visible 링은 웹 전용(web:)이라 생략, sr-only "Close"는
//   accessibilityLabel로 대체.
// - DialogHeader의 text-center는 View에서 자식 Text로 상속된다(103 실측: 웹·
//   안드로이드 — 제목은 카드 폭의 중앙). sm:text-left는 반응형 접두 미지원 — 폰 값
//   text-center만 남는다. DialogFooter의 sm:flex-row sm:justify-end도 미지원 —
//   flex-col-reverse만.
// - 안드로이드: nsh Dialog는 기본적으로 상태 바 아래에서 시작해 딤이 상태 바를 덮지
//   않는다(103 실측: 68dp 미딤, 같은 기기의 Sheet는 전체를 덮음). React 포팅의 Portal은
//   RN Modal statusBarTranslucent로 상태 바까지 덮으므로 같은 동작을 위해
//   android.statusBarTranslucent를 true로 두고, 앱은 android prop으로 바꿀 수 있다.
// - 접근성 연결(aria-labelledby·describedby·트리거 aria-expanded)은 nsh가 대화상자
//   레이어의 접근성을 소유하므로 생략 — 화면 낭독기 이름은 accessibilityLabel로
//   넘긴다(nsh 계약: 포커스 진입 시 제목으로 읽는다).
// - 팝업 children은 열릴 때마다 다시 만들어진다(nsh 계약) — 본문 안 signal 상태는
//   닫으면 사라진다.
// - testID는 카드에 붙는다(React 포팅의 카드 nativeID와 같은 대응). 지정하면 닫기
//   버튼은 `<testID>-close`. 바깥 누름은 backdropTestID로 백드롭을 찾아 누른다
//   (레이어 testID는 눌림 대상이 아니다).
import { Dialog as NshDialog } from "nsh/base";
import { context, signal, Text, View } from "nsh";
import type { AndroidDialogHostProps, IOSDialogHostProps } from "nsh/types";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { XIcon } from "../icons";
import { wrapLabel } from "../label";
import { nshClass } from "../lib";
import { Pressable } from "../primitives";
import type { Element } from "../types";

type DialogContextValue = {
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = context<DialogContextValue | null>(null);

function useDialog(component: string): DialogContextValue {
  const dialog = DialogContext();
  if (!dialog) {
    throw new Error(`<${component}>는 <Dialog> 안에서 사용해야 합니다.`);
  }
  return dialog;
}

// 팝업(nsh Dialog의 class) — 창을 가로질러 폭을 잡고 좌우 1rem 여백, 수직 중앙.
const dialogOverlayVariants = cva("my-auto self-stretch p-4");

// 카드 — 원본 w-full max-w-[calc(100%-2rem)] sm:max-w-lg의 재현.
const dialogContentVariants = cva(
  "relative mx-auto flex w-full max-w-lg flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-lg pointer-events-auto",
);

// 백드롭 — 원본 bg-black/50. 지정해야 딤과 바깥 누름 닫기가 생긴다(nsh 계약).
const dialogBackdropVariants = cva("bg-black/50");

const dialogHeaderVariants = cva("flex flex-col gap-2 text-center");
const dialogFooterVariants = cva("flex flex-col-reverse gap-2");
const dialogTitleVariants = cva(
  "font-sans text-lg leading-none font-semibold text-foreground",
);
const dialogDescriptionVariants = cva("font-sans text-sm text-muted-foreground");
const dialogCloseVariants = cva("absolute right-3 top-3 rounded-sm p-1 opacity-70");
const dialogTriggerTextVariants = cva("font-sans text-sm font-medium text-foreground");

export type DialogProps = {
  className?: string;
  testID?: string;
  /** 제어형 열림 — 앱이 소유한다(onOpenChange에서 함께 내려야 한다) */
  open?: boolean;
  /** 기본 열림 */
  defaultOpen?: boolean;
  /** 열림이 달라졌을 때 — 사용자가 닫은 경우(바깥 누름·Escape·스와이프) 포함 */
  onOpenChange?: (open: boolean) => void;
  /** DialogTrigger/DialogContent — 본문은 DialogContent로 감싼다 */
  children?: Element;
};

export function Dialog(props: DialogProps) {
  const uncontrolled = signal(props.defaultOpen ?? false);
  // 제어형(open 지정)이면 내부 signal을 건드리지 않는다(React 포팅 규칙).
  // signal은 즉시 갱신되므로 이전 값은 바꾸기 전에 읽는다.
  const setOpen = (next: boolean) => {
    const wasOpen = props.open ?? uncontrolled();
    if (props.open === undefined) uncontrolled.set(next);
    if (next !== wasOpen) props.onOpenChange?.(next);
  };
  const dialog: DialogContextValue = {
    isOpen: () => props.open ?? uncontrolled(),
    setOpen,
  };
  return (
    <DialogContext.Provider value={dialog}>
      <View class={nshClass(props.className)} testID={props.testID}>
        {props.children}
      </View>
    </DialogContext.Provider>
  );
}

export type DialogTriggerProps = {
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
export function DialogTrigger(props: DialogTriggerProps) {
  const dialog = useDialog("DialogTrigger");
  return (
    <Pressable
      className={props.className}
      disabled={props.disabled}
      testID={props.testID}
      hitSlop={props.hitSlop}
      accessibilityLabel={props.accessibilityLabel}
      onPress={() => {
        dialog.setOpen(true);
        props.onPress?.();
      }}
    >
      {wrapLabel(props.children, dialogTriggerTextVariants())}
    </Pressable>
  );
}

export type DialogCloseProps = DialogTriggerProps;

/** 누르면 닫는다(문자열 children은 내부 Text로 감싼다). */
export function DialogClose(props: DialogCloseProps) {
  const dialog = useDialog("DialogClose");
  return (
    <Pressable
      className={props.className}
      disabled={props.disabled}
      testID={props.testID}
      hitSlop={props.hitSlop}
      accessibilityLabel={props.accessibilityLabel}
      onPress={() => {
        dialog.setOpen(false);
        props.onPress?.();
      }}
    >
      {wrapLabel(props.children, dialogTriggerTextVariants())}
    </Pressable>
  );
}

export type DialogContentProps = {
  /** 추가 클래스 — 카드에 붙는다 */
  className?: string;
  /** 오른쪽 위 X 닫기 버튼(기본 true) */
  showCloseButton?: boolean;
  /** 카드 식별자 — 지정하면 닫기 버튼은 `<testID>-close` */
  testID?: string;
  /** 백드롭 식별자 — 테스트에서 바깥 누름을 위치로 보낼 때 쓴다 */
  backdropTestID?: string;
  /** 화면 낭독기가 대화상자 이름으로 읽을 제목 */
  accessibilityLabel?: string;
  /** 안드로이드 전용(nsh Dialog 계약) — statusBarTranslucent만 기본 true(상태 바까지 덮음) */
  android?: AndroidDialogHostProps;
  /** iOS 전용(nsh Dialog 계약) */
  ios?: IOSDialogHostProps;
  /** 본문 — 열릴 때마다 다시 만들어진다(nsh 계약) */
  children?: Element;
};

export function DialogContent(props: DialogContentProps) {
  const dialog = useDialog("DialogContent");
  return (
    <NshDialog
      open={dialog.isOpen()}
      onOpenChange={(event: { open: boolean }) => dialog.setOpen(event.open)}
      animation="fade"
      class={dialogOverlayVariants()}
      style={{ pointerEvents: "box-none" }}
      backdropClass={dialogBackdropVariants()}
      backdropTestID={props.backdropTestID}
      accessibilityLabel={props.accessibilityLabel}
      android={{ statusBarTranslucent: true, ...props.android }}
      ios={props.ios}
    >
      <View
        class={cn(dialogContentVariants(), nshClass(props.className))}
        testID={props.testID}
      >
        {props.children}
        {props.showCloseButton ?? true ? (
          <DialogClose
            className={dialogCloseVariants()}
            testID={props.testID ? `${props.testID}-close` : undefined}
            accessibilityLabel="Close"
          >
            <XIcon className="size-4 text-muted-foreground" />
          </DialogClose>
        ) : null}
      </View>
    </NshDialog>
  );
}

export type DialogTextProps = { className?: string; testID?: string; children?: Element };

export function DialogHeader(props: DialogTextProps) {
  return (
    <View
      class={cn(dialogHeaderVariants(), nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </View>
  );
}

export type DialogFooterProps = DialogTextProps & {
  /** 오른쪽 끝에 outline "Close" 버튼을 더한다(기본 false) */
  showCloseButton?: boolean;
};

export function DialogFooter(props: DialogFooterProps) {
  // 문맥 밖 단독 사용 시 자동 닫기 버튼은 생략한다(레이아웃 역할 유지 — React 포팅과 같다).
  const dialog = DialogContext();
  return (
    <View
      class={cn(dialogFooterVariants(), nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
      {props.showCloseButton && dialog ? (
        <Button variant="outline" onPress={() => dialog.setOpen(false)}>
          Close
        </Button>
      ) : null}
    </View>
  );
}

export function DialogTitle(props: DialogTextProps) {
  return (
    <Text class={cn(dialogTitleVariants(), nshClass(props.className))} testID={props.testID}>
      {props.children}
    </Text>
  );
}

export function DialogDescription(props: DialogTextProps) {
  return (
    <Text
      class={cn(dialogDescriptionVariants(), nshClass(props.className))}
      testID={props.testID}
    >
      {props.children}
    </Text>
  );
}

export { dialogContentVariants };
