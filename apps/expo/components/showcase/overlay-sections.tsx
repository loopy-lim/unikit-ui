// 사이클 40 신규(엑스포) — 오버레이·팝업 티어: Dialog·AlertDialog·Sheet·
// Drawer·Popover·Tooltip·DropdownMenu·ContextMenu(길게 누르기). HoverCard는
// 웹 전용 표시. 카탈로그 재구성: 컴포넌트별 CatalogEntry로 분리(데모 JSX는
// 사이클 40 것을 유지 — 트리거 문자열은 Text로 감싼 2026-11-10 수정 포함).
import { Text, View } from "react-native";
import { cn } from "@unikit-bridge/ui";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@unikit-bridge/ui";

import type { CatalogEntry } from "./catalog";
import { Hint, outlineTriggerClass, WebOnlyNotice } from "./section";

/** Dialog — 열림·닫힘·바깥 눌림·(웹)ESC 닫힘 */
function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger className={outlineTriggerClass}>
        <Text>Dialog 열기</Text>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>알림 설정</DialogTitle>
          <DialogDescription>
            바깥을 누르면 닫혀요(웹은 ESC·✕도 닫기예요).
          </DialogDescription>
        </DialogHeader>
        <Text className="font-sans text-sm text-foreground">
          열리는 순간 &quot;열림&quot;, 닫히는 순간 &quot;닫힘&quot; 상태로
          전환돼요. 닫힌 뒤 포커스는 트리거로 돌아가요.
        </Text>
        <DialogFooter>
          <DialogClose className={outlineTriggerClass}>닫기</DialogClose>
          <DialogClose
            className={cn(outlineTriggerClass, "bg-primary active:bg-primary/90")}
          >
            <Text className="font-sans text-sm font-medium text-primary-foreground">
              확인
            </Text>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** AlertDialog — 백드롭 눌림 금지(명시적 선택만 닫기) */
function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger className={outlineTriggerClass}>
        <Text>AlertDialog 열기</Text>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Text className="text-2xl leading-none">⚠️</Text>
          </AlertDialogMedia>
          <AlertDialogTitle>정말 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            백드롭을 눌러도 닫히지 않아요. 취소·삭제 버튼으로만 닫혀요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction>삭제</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Sheet — 바텀 시트(사이클 40 기본 side="bottom") */
function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger className={outlineTriggerClass}>
        <Text>Sheet 열기</Text>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>바텀 시트</SheetTitle>
          <SheetDescription>
            화면 아래에서 올라와요. 바깥 눌림·✕로 닫혀요.
          </SheetDescription>
        </SheetHeader>
        <View className="gap-2 px-4">
          <Text className="font-sans text-sm text-foreground">
            좁은 화면에서 필터·간단한 동작을 담기 좋아요.
          </Text>
        </View>
        <SheetFooter>
          <SheetClose className={outlineTriggerClass}>닫기</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Drawer — 핸들 드래그로 닫기 */
function DrawerDemo() {
  return (
    <Drawer>
      <DrawerTrigger className={outlineTriggerClass}>
        <Text>Drawer 열기</Text>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>드래그로 닫기</DrawerTitle>
          <DrawerDescription>
            상단 핸들을 아래로 80px 이상 끌면 닫혀요.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose className={outlineTriggerClass}>닫기</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/** Popover — 앵커 팝업 */
function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger className={outlineTriggerClass}>
        <Text>알림 보기</Text>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>읽지 않은 알림</PopoverTitle>
          <PopoverDescription>3건의 새 알림이 있어요.</PopoverDescription>
        </PopoverHeader>
        <Text className="font-sans text-sm text-foreground">
          · 저장이 완료됐어요 · 댓글 2개 · 초대 1건
        </Text>
      </PopoverContent>
    </Popover>
  );
}

/** Tooltip — 탭하면 뜨고 3초 뒤 자동 닫힘(길게 눌러도 열림) */
function TooltipDemo() {
  return (
    <View className="gap-2">
      <Tooltip>
        <TooltipTrigger
          className={cn(outlineTriggerClass, "h-8 w-8 px-0")}
          accessibilityLabel="툴팁 열기"
        >
          <Text>?</Text>
        </TooltipTrigger>
        <TooltipContent side="top">
          누르면 뜨고 3초 후 자동으로 닫혀요
        </TooltipContent>
      </Tooltip>
      <Hint>
        탭하면 뜨고 3초(displayDuration) 뒤 자동으로 닫혀요. 길게 눌러도 열려요.
      </Hint>
    </View>
  );
}

/** DropdownMenu — 계층 메뉴(서브메뉴) + 비활성 항목 */
function DropdownMenuDemo() {
  return (
    <View className="gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger className={outlineTriggerClass}>
          메뉴 열기
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>내 계정</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              저장 <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>관리자 콘솔 (비활성)</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Text>더 보기</Text>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>내보내기</DropdownMenuItem>
                <DropdownMenuItem>가져오기</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked onCheckedChange={() => {}}>
            이메일 알림
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value="light">
            <DropdownMenuRadioItem value="light">라이트</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">다크</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">로그아웃</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Hint>항목을 누르면 닫혀요. 서브메뉴 · 체크 · 라디오 그룹도 있어요.</Hint>
    </View>
  );
}

/** ContextMenu — 네이티브 길게 누르기(웹은 우클릭) */
function ContextMenuDemo() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-20 items-center justify-center rounded-md border border-dashed bg-muted/30">
        길게 눌러 보세요 (웹은 우클릭)
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>복사</ContextMenuItem>
        <ContextMenuItem>붙여넣기</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Text>공유</Text>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>링크 복사</ContextMenuItem>
            <ContextMenuItem>이미지로 저장</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">삭제</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** 오버레이·팝업 엔트리 */
export const OVERLAY_ENTRIES: CatalogEntry[] = [
  {
    slug: "dialog",
    title: "Dialog",
    subtitle: "대화 상자",
    category: "오버레이",
    description: "화면을 덮는 대화 상자예요. 열림·닫힘은 상태로 관리돼요.",
    slides: [{ name: "기본", element: <DialogDemo /> }],
  },
  {
    slug: "alert-dialog",
    title: "AlertDialog",
    subtitle: "확인 대화 상자",
    category: "오버레이",
    description: "백드롭 눌림으로는 닫히지 않아요 — 명시적 선택만 닫혀요.",
    slides: [{ name: "삭제 확인", element: <AlertDialogDemo /> }],
  },
  {
    slug: "sheet",
    title: "Sheet",
    subtitle: "바텀 시트",
    category: "오버레이",
    description: "화면 아래에서 올라오는 패널이에요.",
    slides: [{ name: "bottom", element: <SheetDemo /> }],
  },
  {
    slug: "drawer",
    title: "Drawer",
    subtitle: "드로어",
    category: "오버레이",
    description: "핸들 드래그로 여닫는 패널이에요.",
    slides: [{ name: "드래그 닫기", element: <DrawerDemo /> }],
  },
  {
    slug: "popover",
    title: "Popover",
    subtitle: "팝오버",
    category: "팝업",
    description: "트리거에 붙어 뜨는 팝업이에요.",
    slides: [{ name: "알림 카드", element: <PopoverDemo /> }],
  },
  {
    slug: "tooltip",
    title: "Tooltip",
    subtitle: "툴팁",
    category: "팝업",
    description: "짧은 도움말 카드가 트리거 위에 떠요.",
    slides: [{ name: "탭 진입", element: <TooltipDemo /> }],
  },
  {
    slug: "dropdown-menu",
    title: "DropdownMenu",
    subtitle: "드롭다운 메뉴",
    category: "팝업",
    description: "트리거 아래로 펼쳐지는 메뉴예요.",
    slides: [{ name: "계층 메뉴", element: <DropdownMenuDemo /> }],
  },
  {
    slug: "context-menu",
    title: "ContextMenu",
    subtitle: "컨텍스트 메뉴",
    category: "팝업",
    description: "길게 눌러 여는 동작 메뉴예요(웹은 우클릭).",
    slides: [{ name: "길게 누르기", element: <ContextMenuDemo /> }],
  },
  {
    slug: "hover-card",
    title: "HoverCard",
    subtitle: "호버 카드",
    category: "팝업",
    description: "마우스 호버 진입이 필요한 웹 전용 컴포넌트예요.",
    webOnly: true,
    slides: [
      {
        name: "웹 전용",
        element: (
          <WebOnlyNotice reason="마우스 호버 진입이 없는 네이티브에서는 쓰기 어려워요. 웹 쇼케이스에서 확인할 수 있어요." />
        ),
      },
    ],
  },
];
