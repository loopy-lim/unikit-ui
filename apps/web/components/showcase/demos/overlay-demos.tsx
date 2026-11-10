"use client";

import { buttonVariants, cn } from "@unikit-bridge/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { outlineTriggerClass } from "../section";
import type { ShowcaseDemo } from "./types";

export const dialogDemo: ShowcaseDemo = {
  Demo: function DialogDemo() {
    return (
      <Dialog>
        <DialogTrigger className={outlineTriggerClass}>설정 열기</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로필 공유</DialogTitle>
            <DialogDescription>
              링크가 있는 사람은 누구나 볼 수 있어요. 바깥을 누르거나 ESC로
              닫혀요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className={outlineTriggerClass}>취소</DialogClose>
            <DialogClose
              className={cn(buttonVariants({ variant: "default" }), "self-start")}
            >
              <Text className="font-sans text-sm font-medium text-primary-foreground">
                공유
              </Text>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  code: `import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@unikit-bridge/ui";

<Dialog>
  <DialogTrigger>설정 열기</DialogTrigger>
  <DialogContent>...</DialogContent>
</Dialog>`,
};

export const alertDialogDemo: ShowcaseDemo = {
  Demo: function AlertDialogDemo() {
    return (
      <AlertDialog>
        <AlertDialogTrigger className={outlineTriggerClass}>
          AlertDialog
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              되돌릴 수 없는 작업이에요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
  code: `import { AlertDialog, AlertDialogTrigger, AlertDialogContent } from "@unikit-bridge/ui";

<AlertDialog><AlertDialogTrigger>열기</AlertDialogTrigger></AlertDialog>`,
};

export const sheetDemo: ShowcaseDemo = {
  Demo: function SheetDemo() {
    return (
      <Sheet>
        <SheetTrigger className={outlineTriggerClass}>Sheet 열기</SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>바텀 시트</SheetTitle>
          </SheetHeader>
          <SheetClose className={cn(outlineTriggerClass, "mt-4")}>닫기</SheetClose>
        </SheetContent>
      </Sheet>
    );
  },
  code: `import { Sheet, SheetTrigger, SheetContent } from "@unikit-bridge/ui";

<Sheet><SheetTrigger>열기</SheetTrigger><SheetContent side="bottom" /></Sheet>`,
};

export const drawerDemo: ShowcaseDemo = {
  Demo: function DrawerDemo() {
    return (
      <Drawer>
        <DrawerTrigger className={outlineTriggerClass}>Drawer 열기</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>드래그로 닫기</DrawerTitle>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose className={outlineTriggerClass}>닫기</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
  code: `import { Drawer, DrawerTrigger, DrawerContent } from "@unikit-bridge/ui";

<Drawer><DrawerTrigger>열기</DrawerTrigger><DrawerContent /></Drawer>`,
};

export const popoverDemo: ShowcaseDemo = {
  Demo: function PopoverDemo() {
    return (
      <Popover>
        <PopoverTrigger className={outlineTriggerClass}>알림</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>새 알림</PopoverTitle>
            <PopoverDescription>3건</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    );
  },
  code: `import { Popover, PopoverTrigger, PopoverContent } from "@unikit-bridge/ui";

<Popover><PopoverTrigger>열기</PopoverTrigger><PopoverContent>내용</PopoverContent></Popover>`,
};

export const tooltipDemo: ShowcaseDemo = {
  Demo: function TooltipDemo() {
    return (
      <Tooltip>
        <TooltipTrigger
          className={cn(outlineTriggerClass, "h-8 w-8 px-0")}
          accessibilityLabel="툴팁"
        >
          ?
        </TooltipTrigger>
        <TooltipContent side="top">누르면 잠깐 보여요</TooltipContent>
      </Tooltip>
    );
  },
  code: `import { Tooltip, TooltipTrigger, TooltipContent } from "@unikit-bridge/ui";

<Tooltip><TooltipTrigger>?</TooltipTrigger><TooltipContent>설명</TooltipContent></Tooltip>`,
};

export const dropdownMenuDemo: ShowcaseDemo = {
  Demo: function DropdownMenuDemo() {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className={outlineTriggerClass}>메뉴</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>저장</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">삭제</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
  code: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@unikit-bridge/ui";

<DropdownMenu><DropdownMenuTrigger>메뉴</DropdownMenuTrigger><DropdownMenuContent /></DropdownMenu>`,
};

export const contextMenuDemo: ShowcaseDemo = {
  Demo: function ContextMenuDemo() {
    return (
      <ContextMenu>
        <ContextMenuTrigger className="flex h-16 items-center justify-center rounded-md border border-dashed bg-muted/30">
          우클릭 / 길게 누르기
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>복사</ContextMenuItem>
          <ContextMenuItem>붙여넣기</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
  code: `import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@unikit-bridge/ui";

<ContextMenu><ContextMenuTrigger>영역</ContextMenuTrigger></ContextMenu>`,
};

export const hoverCardDemo: ShowcaseDemo = {
  Demo: function HoverCardDemo() {
    return (
      <HoverCard>
        <HoverCardTrigger className="font-sans text-sm font-medium text-primary underline">
          @unikit
        </HoverCardTrigger>
        <HoverCardContent>
          <View className="flex flex-row gap-2">
            <Avatar>
              <AvatarFallback>유</AvatarFallback>
            </Avatar>
            <Text className="font-sans text-sm text-foreground">UniKit</Text>
          </View>
        </HoverCardContent>
      </HoverCard>
    );
  },
  code: `import { HoverCard, HoverCardTrigger, HoverCardContent } from "@unikit-bridge/ui";

<HoverCard><HoverCardTrigger>@user</HoverCardTrigger><HoverCardContent /></HoverCard>`,
};
