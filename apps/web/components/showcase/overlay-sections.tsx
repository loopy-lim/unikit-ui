"use client";
// 사이클 40 신규 섹션 — 오버레이 티어(1/2): 모달 계열(Dialog·AlertDialog·
// Sheet·Drawer)과 앵커 팝업·메뉴 계열(Popover·Tooltip·DropdownMenu·
// ContextMenu·HoverCard). 상태 시나리오(설계 §8): 열림·닫힘·바깥 눌림·ESC,
// AlertDialog 백드롭 눌림 금지, Drawer 드래그 닫기, 계층 메뉴, 비활성 메뉴 항목.
import { cn } from "@unikit-bridge/ui";
import {
  Avatar,
  AvatarFallback,
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { DemoLabel, Hint, Section, outlineTriggerClass } from "./section";

/** Section: 오버레이 — Dialog · AlertDialog · Sheet · Drawer (모달 4종) */
export function OverlaySection() {
  return (
    <Section
      title="오버레이 — Dialog · AlertDialog · Sheet · Drawer"
      description="화면을 덮는 대화 상자예요. 열림·닫힘은 상태로 관리돼요."
    >
      {/* 트리거 4종 — 버튼 변형 토큰 재사용(중첩 버튼 회피, section.tsx 참고) */}
      <View className="flex flex-row flex-wrap gap-3">
        {/* Dialog — 열림·닫힘·바깥 눌림·ESC 닫힘(ModalOverlay 기본 동작) */}
        <Dialog>
          <DialogTrigger className={outlineTriggerClass}>Dialog 열기</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>알림 설정</DialogTitle>
              <DialogDescription>
                바깥을 누르거나 ESC를 눌러도 닫혀요. 오른쪽 위 ✕도 닫기예요.
              </DialogDescription>
            </DialogHeader>
            <Text className="font-sans text-sm text-foreground">
              열리는 순간 &quot;열림&quot;, 닫히는 순간 &quot;닫힘&quot; 상태로
              전환돼요. 닫힌 뒤 포커스는 트리거로 돌아가요.
            </Text>
            <DialogFooter>
              <DialogClose className={outlineTriggerClass}>닫기</DialogClose>
              <DialogClose className={cn(outlineTriggerClass, "bg-primary web:hover:bg-primary/90 active:bg-primary/90")}>
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
                백드롭을 눌러도 닫히지 않아요. 취소·삭제 버튼으로만 닫혀요
                (ESC는 닫힘).
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
                화면 아래에서 올라와요. 바깥 눌림·ESC·✕로 닫혀요.
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
                상단 핸들을 아래로 80px 이상 끌면 닫혀요. ESC·바깥 눌림도 닫혀요.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose className={outlineTriggerClass}>닫기</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </View>
      <Hint>
        ESC·바깥 눌림 닫힘: 4종 모두 · 백드롭 눌림 닫힘 금지: AlertDialog만.
      </Hint>
    </Section>
  );
}

/** Section: 팝업·메뉴 — Popover · Tooltip · DropdownMenu · ContextMenu · HoverCard */
export function PopupMenuSection() {
  return (
    <Section
      title="팝업 메뉴 — Popover · Tooltip · Dropdown · ContextMenu · HoverCard"
      description="트리거에 붙어 뜨는 팝업과 메뉴예요."
    >
      {/* Popover — 내용이 있는 카드형 팝업 */}
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

      {/* Tooltip — 눌러 열고 3초 뒤 자동 닫힘 */}
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

      {/* ContextMenu — 웹 우클릭 ↔ 네이티브 길게 누르기(브리지 매핑) */}
      <DemoLabel>ContextMenu</DemoLabel>
      <ContextMenu>
        <ContextMenuTrigger
          className={cn(
            "flex h-20 items-center justify-center rounded-md border border-dashed bg-muted/30",
          )}
        >
          웹은 우클릭, 네이티브는 길게 눌러 보세요
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

      {/* HoverCard — 웹 전용 표시(호버 진입 근사: press 토글) */}
      <DemoLabel>HoverCard (웹 전용)</DemoLabel>
      <HoverCard>
        <HoverCardTrigger
          className={cn(
            "font-sans text-sm font-medium text-primary underline underline-offset-4",
          )}
        >
          @unikit
        </HoverCardTrigger>
        <HoverCardContent>
          <View className="flex flex-row gap-3">
            <Avatar>
              <AvatarFallback>유</AvatarFallback>
            </Avatar>
            <View className="flex flex-col gap-1">
              <Text className="font-sans text-sm font-semibold text-foreground">
                UniKit UI
              </Text>
              <Text className="font-sans text-xs text-muted-foreground">
                한 벌 소스로 웹·앱 모두에 같은 UI를 내요.
              </Text>
            </View>
          </View>
        </HoverCardContent>
      </HoverCard>
      <Hint>
        HoverCard는 이 팝업 계열에서 유일하게 마우스 호버가 없는 네이티브에서
        쓰기 어려워 웹 전용으로 표시해요.
      </Hint>
    </Section>
  );
}
