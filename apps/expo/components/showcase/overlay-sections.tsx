// 사이클 40 신규 섹션(엑스포) — 오버레이 티어(1/2): Dialog·AlertDialog·Sheet·
// Drawer·Popover·Tooltip·DropdownMenu·ContextMenu(길게 누르기). HoverCard는
// 웹 전용 표시(생략 — 웹 쇼케이스에서 확인). 상태 시나리오(설계 §8)는 웹과 동일.
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

import { DemoLabel, Hint, Section, outlineTriggerClass } from "./section";

/** Section: 오버레이 — Dialog · AlertDialog · Sheet · Drawer (모달 4종) */
export function OverlaySection() {
  return (
    <Section
      title="오버레이 — Dialog · AlertDialog · Sheet · Drawer"
      description="화면을 덮는 대화 상자예요. 열림·닫힘은 상태로 관리돼요."
    >
      <View className="flex flex-row flex-wrap gap-3">
        {/* Dialog — 열림·닫힘·바깥 눌림·(웹)ESC 닫힘 */}
        <Dialog>
          <DialogTrigger className={outlineTriggerClass}>Dialog 열기</DialogTrigger>
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
                className={cn(
                  outlineTriggerClass,
                  "bg-primary active:bg-primary/90",
                )}
              >
                <Text className="font-sans text-sm font-medium text-primary-foreground">
                  확인
                </Text>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AlertDialog — 백드롭 눌림 금지(명시적 선택만 닫기) */}
        <AlertDialog>
          <AlertDialogTrigger className={outlineTriggerClass}>
            AlertDialog 열기
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

        {/* Sheet — 바텀 시트(사이클 40 기본 side="bottom") */}
        <Sheet>
          <SheetTrigger className={outlineTriggerClass}>Sheet 열기</SheetTrigger>
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

        {/* Drawer — 핸들 드래그로 닫기 */}
        <Drawer>
          <DrawerTrigger className={outlineTriggerClass}>Drawer 열기</DrawerTrigger>
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
      </View>
      <Hint>
        바깥 눌림 닫힘: 4종 모두 · 백드롭 눌림 닫힘 금지: AlertDialog만.
      </Hint>
    </Section>
  );
}

/** Section: 팝업 메뉴 — Popover · Tooltip · DropdownMenu · ContextMenu (HoverCard 웹 전용) */
export function PopupMenuSection() {
  return (
    <Section
      title="팝업 메뉴 — Popover · Tooltip · Dropdown · ContextMenu · HoverCard"
      description="트리거에 붙어 뜨는 팝업과 메뉴예요."
    >
      {/* Popover */}
      <DemoLabel>Popover</DemoLabel>
      <Popover>
        <PopoverTrigger className={outlineTriggerClass}>알림 보기</PopoverTrigger>
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

      {/* Tooltip — 탭하면 뜨고 3초 뒤 자동 닫힘(길게 눌러도 열림) */}
      <DemoLabel>Tooltip</DemoLabel>
      <Tooltip>
        <TooltipTrigger
          className={cn(outlineTriggerClass, "h-8 w-8 px-0")}
          accessibilityLabel="툴팁 열기"
        >
          ?
        </TooltipTrigger>
        <TooltipContent side="top">누르면 뜨고 3초 후 자동으로 닫혀요</TooltipContent>
      </Tooltip>

      {/* DropdownMenu — 계층 메뉴(서브메뉴) + 비활성 항목 */}
      <DemoLabel>DropdownMenu</DemoLabel>
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
              <DropdownMenuSubTrigger>더 보기</DropdownMenuSubTrigger>
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

      {/* ContextMenu — 네이티브 길게 누르기(웹은 우클릭) */}
      <DemoLabel>ContextMenu</DemoLabel>
      <ContextMenu>
        <ContextMenuTrigger className="flex h-20 items-center justify-center rounded-md border border-dashed bg-muted/30">
          길게 눌러 보세요 (웹은 우클릭)
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>복사</ContextMenuItem>
          <ContextMenuItem>붙여넣기</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>공유</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>링크 복사</ContextMenuItem>
              <ContextMenuItem>이미지로 저장</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">삭제</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* HoverCard — 웹 전용(호버 없는 네이티브는 생략·표시) */}
      <DemoLabel>HoverCard (웹 전용)</DemoLabel>
      <Hint>
        HoverCard는 마우스 호버 진입이 없는 네이티브에서 쓰기 어려워 웹
        쇼케이스에서만 확인할 수 있어요(여기선 생략).
      </Hint>
    </Section>
  );
}
