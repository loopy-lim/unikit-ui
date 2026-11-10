// 사이클 40 신규 섹션(엑스포) — 레이아웃·피드백 티어(4): ScrollArea·
// Carousel(이전/다음)·Sidebar(고정·isMobile 시트)·Sonner(success·error·중첩
// 스택)·Spinner(로딩 — 양측 회전: 웹 CSS·네이티브 LoopRotate). Resizable은 마우스 드래그 전용이라
// 웹 쇼케이스 안내로 대체(생략·표시). 상태 시나리오(설계 §8)는 웹과 동일.
import { Text, View } from "react-native";
import { toast } from "@unikit-bridge/ui";
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
} from "@unikit-bridge/ui";

import { DemoLabel, Hint, Section } from "./section";

/** Section: 레이아웃·피드백 확장 — ScrollArea · Resizable · Carousel · Sidebar · Sonner · Spinner */
export function LayoutFeedbackSection() {
  return (
    <Section
      title="레이아웃·피드백 확장 — ScrollArea · Resizable · Carousel · Sidebar · Sonner · Spinner"
      description="공간을 나누고 상태를 알려주는 컴포넌트예요."
    >
      {/* ScrollArea — 높이 제한 목록 스크롤 */}
      <DemoLabel>ScrollArea</DemoLabel>
      <ScrollArea className="h-40 rounded-md border">
        <View className="gap-2 p-4">
          {Array.from({ length: 12 }, (_, index) => (
            <Text
              key={index}
              className="font-sans text-sm text-foreground"
            >{`목록 항목 ${index + 1}`}</Text>
          ))}
        </View>
      </ScrollArea>

      {/* Resizable — 웹 전용(마우스 드래그) → 안내 문구로 대체 */}
      <DemoLabel>Resizable (웹 전용)</DemoLabel>
      <Hint>
        Resizable은 마우스 드래그로 패널 크기를 조절하는 웹 전용 컴포넌트예요.
        웹 쇼케이스에서 확인할 수 있어요(여기선 생략).
      </Hint>

      {/* Carousel — 이전/다음 버튼(끝에서 비활성 전환 관찰) */}
      <DemoLabel>Carousel</DemoLabel>
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
      </View>
      <Hint>
        첫 슬라이드에서는 &quot;이전&quot;, 마지막에서는 &quot;다음&quot; 버튼이
        비활성화돼요.
      </Hint>

      {/* Sidebar — 고정(트리거로 접힘) */}
      <DemoLabel>Sidebar — 고정</DemoLabel>
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

      {/* Sidebar — isMobile prop: 시트로 전환 */}
      <DemoLabel>Sidebar — isMobile 시트</DemoLabel>
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

      {/* Sonner — success · error · 중첩 스택 */}
      <DemoLabel>Sonner — toast</DemoLabel>
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
        토스트는 화면 오른쪽 아래에 쌓여요(스와이프하면 닫혀요). 카드는 화면
        루트의 &lt;Toaster /&gt;가 렌더해요.
      </Hint>

      {/* Spinner — 로딩 표시(웹 CSS 회전 · 네이티브 RN Animated 회전) */}
      <DemoLabel>Spinner</DemoLabel>
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
    </Section>
  );
}
