"use client";

import { toast, Badge, Button, Toaster } from "@unikit-bridge/ui";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  Spinner,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import type { ShowcaseDemo } from "./types";

export const scrollAreaDemo: ShowcaseDemo = {
  Demo: function ScrollAreaDemo() {
    return (
      <ScrollArea className="h-32 w-full max-w-sm rounded-md border">
        <View className="gap-2 p-3">
          {Array.from({ length: 8 }, (_, i) => (
            <Text key={i} className="font-sans text-sm text-foreground">
              항목 {i + 1}
            </Text>
          ))}
        </View>
      </ScrollArea>
    );
  },
  code: `import { ScrollArea } from "@unikit-bridge/ui";

<ScrollArea className="h-40">...</ScrollArea>`,
};

export const resizableDemo: ShowcaseDemo = {
  Demo: function ResizableDemo() {
    return (
      <ResizablePanelGroup direction="horizontal" className="min-h-24 w-full max-w-md rounded-md border">
        <ResizablePanel defaultSize={50}>
          <View className="flex h-full items-center justify-center">
            <Text className="font-sans text-sm text-muted-foreground">A</Text>
          </View>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <View className="flex h-full items-center justify-center">
            <Text className="font-sans text-sm text-muted-foreground">B</Text>
          </View>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  },
  code: `import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@unikit-bridge/ui";

<ResizablePanelGroup direction="horizontal"><ResizablePanel /></ResizablePanelGroup>`,
};

export const carouselDemo: ShowcaseDemo = {
  Demo: function CarouselDemo() {
    return (
      <View className="w-full max-w-xs px-10">
        <Carousel>
          <CarouselContent>
            {["1", "2", "3"].map((n) => (
              <CarouselItem key={n}>
                <View className="flex h-20 items-center justify-center rounded-lg border bg-muted">
                  <Text className="font-sans text-sm text-foreground">슬라이드 {n}</Text>
                </View>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious accessibilityLabel="이전" />
          <CarouselNext accessibilityLabel="다음" />
        </Carousel>
      </View>
    );
  },
  code: `import { Carousel, CarouselContent, CarouselItem } from "@unikit-bridge/ui";

<Carousel><CarouselContent><CarouselItem>...</CarouselItem></CarouselContent></Carousel>`,
};

export const sidebarDemo: ShowcaseDemo = {
  Demo: function SidebarDemo() {
    return (
      <SidebarProvider className="h-40 w-full max-w-md rounded-md border web:min-h-0">
        <Sidebar collapsible="offcanvas">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>메뉴</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>대시보드</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>설정</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="gap-2 p-3">
          <View className="flex flex-row items-center gap-2">
            <SidebarTrigger accessibilityLabel="사이드바" />
            <Badge variant="secondary">본문</Badge>
          </View>
        </SidebarInset>
      </SidebarProvider>
    );
  },
  code: `import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from "@unikit-bridge/ui";

<SidebarProvider><Sidebar /><SidebarInset>...</SidebarInset></SidebarProvider>`,
};

export const sonnerDemo: ShowcaseDemo = {
  Demo: function SonnerDemo() {
    return (
      <View className="gap-3">
        <Button
          variant="outline"
          onPress={() => toast.success("저장했어요")}
        >
          토스트 보내기
        </Button>
        <Toaster position="bottom-right" richColors closeButton />
      </View>
    );
  },
  code: `import { toast, Toaster } from "@unikit-bridge/ui";

toast.success("완료");
// 루트에 <Toaster />`,
};

export const spinnerDemo: ShowcaseDemo = {
  Demo: function SpinnerDemo() {
    return (
      <View className="flex flex-row items-center gap-2">
        <Spinner />
        <Text className="font-sans text-sm text-foreground">불러오는 중…</Text>
      </View>
    );
  },
  code: `import { Spinner } from "@unikit-bridge/ui";

<Spinner className="size-4" />`,
};
