// 사이클 40 신규(엑스포) — 레이아웃·피드백 티어: ScrollArea·Resizable(웹
// 전용)·Carousel·Sidebar(고정·isMobile)·Sonner(toast)·Spinner. 카탈로그
// 재구성: 컴포넌트별 CatalogEntry로 분리. Spinner는 웹 CSS 회전 · 네이티브
// RN Animated 회전(UI 스레드) 브리지 계약의 실물 증명 지점이기도 하다.
import { type ReactNode } from "react";
import { Text, View } from "@unikit-bridge/ui/primitives";
import {
  Badge,
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  ScrollArea,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  Spinner,
  toast,
} from "@unikit-bridge/ui";

import type { CatalogEntry } from "./catalog";
import { Hint, WebOnlyNotice } from "./section";

/** 슬라이드 본문 공통 세로 간격 래퍼 */
function Stack({ children }: { children: ReactNode }) {
  return <View className="flex flex-col gap-4">{children}</View>;
}

/** ScrollArea — 높이 제한 목록 스크롤. h-56(224px)로 12개 항목 중
 *  7개 정도만 보이게 해 스크롤 여지를 눈으로 알 수 있게 한다(데모 시인성
 *  감사 2026-11-10 — h-40은 박스가 작아 "스크롤 데모"임이 안 읽혔다). */
function ScrollAreaDemo() {
  return (
    <View className="gap-2">
      <ScrollArea className="h-56 rounded-md border">
        <View className="gap-2 p-4">
          {Array.from({ length: 12 }, (_, index) => (
            <Text
              key={index}
              className="font-sans text-sm text-foreground"
            >{`목록 항목 ${index + 1}`}</Text>
          ))}
        </View>
      </ScrollArea>
      <Hint>박스 안에서 위아래로 슬라이드하면 목록이 스크롤돼요.</Hint>
    </View>
  );
}

/** Carousel — 이전/다음 버튼(끝에서 비활성 전환 관찰) */
function CarouselDemo() {
  return (
    <View className="px-12">
      <Carousel>
        <CarouselContent>
          {["하나", "둘", "셋", "넷", "다섯"].map((label, index) => (
            <CarouselItem key={label}>
              <View className="flex h-24 items-center justify-center rounded-lg border bg-muted">
                <Text className="font-sans text-base font-medium text-foreground">
                  슬라이드 {label} ({index + 1}/5)
                </Text>
              </View>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious accessibilityLabel="이전 슬라이드" />
        <CarouselNext accessibilityLabel="다음 슬라이드" />
      </Carousel>
      <Hint>
        첫 슬라이드에서는 &quot;이전&quot;, 마지막에서는 &quot;다음&quot; 버튼이
        비활성화돼요.
      </Hint>
    </View>
  );
}

/** Sidebar — 고정(트리거로 접힘) */
function SidebarFixedDemo() {
  return (
    <SidebarProvider className="h-56 rounded-md border web:min-h-0">
      <Sidebar collapsible="offcanvas">
        <SidebarHeader className="p-3">
          <Badge variant="secondary" className="self-start">
            UniKit
          </Badge>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>메뉴</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>대시보드</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>컴포넌트</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>설정 (비활성)</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="gap-2 p-3">
        <View className="flex flex-row items-center gap-2">
          <SidebarTrigger accessibilityLabel="사이드바 접기" />
          <Text className="font-sans text-sm font-medium text-foreground">
            본문 영역
          </Text>
        </View>
        <Text className="font-sans text-xs text-muted-foreground">
          ▤ 트리거를 누르면 사이드바가 접혀요.
        </Text>
      </SidebarInset>
    </SidebarProvider>
  );
}

/** Sidebar — isMobile prop: 시트로 전환 */
function SidebarMobileDemo() {
  return (
    <SidebarProvider isMobile className="h-24 rounded-md border web:min-h-0">
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
                  <SidebarMenuButton>컴포넌트</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="gap-1 p-3">
        <View className="flex flex-row items-center gap-2">
          <SidebarTrigger accessibilityLabel="사이드바 시트 열기" />
          <Text className="font-sans text-sm text-foreground">
            isMobile — 트리거를 누르면 시트가 열려요.
          </Text>
        </View>
      </SidebarInset>
    </SidebarProvider>
  );
}

/** Sonner — success · error · 중첩 스택 */
function SonnerDemo() {
  return (
    <View className="gap-2">
      <View className="flex flex-row flex-wrap gap-3">
        <Button
          variant="outline"
          onPress={() =>
            toast.success("저장했어요", { description: "방금 바뀐 내용이에요." })
          }
        >
          성공 토스트
        </Button>
        <Button
          variant="outline"
          onPress={() =>
            toast.error("저장에 실패했어요", {
              description: "잠시 후 다시 시도해 주세요.",
            })
          }
        >
          실패 토스트
        </Button>
        <Button
          variant="outline"
          onPress={() => {
            toast("첫 번째 알림");
            toast("두 번째 알림");
            toast("세 번째 알림");
          }}
        >
          3개 중첩
        </Button>
      </View>
      <Hint>
        토스트는 화면 오른쪽 아래에 쌓여요(스와이프하면 닫혀요). 카드는 루트의
        &lt;Toaster /&gt;가 렌더해요.
      </Hint>
    </View>
  );
}

/** Spinner — 로딩 표시(웹 CSS 회전 · 네이티브 RN Animated 회전) */
function SpinnerDemo() {
  return (
    <View className="flex flex-row flex-wrap items-center gap-4">
      <View className="flex flex-row items-center gap-2">
        <Spinner />
        <Text className="font-sans text-sm text-foreground">불러오는 중…</Text>
      </View>
      <View className="flex flex-row items-center gap-2">
        <Spinner className="size-6" />
        <Text className="font-sans text-sm text-muted-foreground">
          큰 크기(size-6)
        </Text>
      </View>
    </View>
  );
}

/** 레이아웃·피드백 엔트리 */
export const LAYOUT_ENTRIES: CatalogEntry[] = [
  {
    slug: "scroll-area",
    title: "ScrollArea",
    subtitle: "스크롤 영역",
    category: "레이아웃",
    description: "높이를 제한한 목록 스크롤이에요.",
    slides: [{ name: "높이 제한 목록", element: <ScrollAreaDemo /> }],
  },
  {
    slug: "resizable",
    title: "Resizable",
    subtitle: "패널 크기 조절",
    category: "레이아웃",
    description: "마우스 드래그로 패널 크기를 조절하는 웹 전용 컴포넌트예요.",
    webOnly: true,
    slides: [
      {
        name: "웹 전용",
        element: (
          <WebOnlyNotice reason="마우스 드래그로 패널 크기를 조절하는 컴포넌트예요. 웹 쇼케이스에서 확인할 수 있어요." />
        ),
      },
    ],
  },
  {
    slug: "carousel",
    title: "Carousel",
    subtitle: "캐러셀",
    category: "레이아웃",
    description: "슬라이드를 좌우로 넘겨요.",
    slides: [{ name: "버튼 탐색", element: <CarouselDemo /> }],
  },
  {
    slug: "sidebar",
    title: "Sidebar",
    subtitle: "사이드바",
    category: "레이아웃",
    description: "고정과 시트 두 방식의 사이드바예요.",
    slides: [
      { name: "고정(접힘)", element: <SidebarFixedDemo /> },
      { name: "isMobile 시트", element: <SidebarMobileDemo /> },
    ],
  },
  {
    slug: "sonner",
    title: "Sonner",
    subtitle: "토스트",
    category: "피드백",
    description: "짧은 알림 카드가 쌓여요.",
    slides: [{ name: "성공, 실패, 중첩", element: <SonnerDemo /> }],
  },
  {
    slug: "spinner",
    title: "Spinner",
    subtitle: "스피너",
    category: "피드백",
    description:
      "로딩 회전이에요 — 웹은 CSS, 네이티브는 RN Animated(UI 스레드).",
    slides: [{ name: "크기 2종", element: <SpinnerDemo /> }],
  },
];
