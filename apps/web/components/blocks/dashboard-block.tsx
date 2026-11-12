"use client";
/**
 * 대시보드 블록(웹) — /blocks/dashboard 전체 화면.
 * shadcn dashboard-01(사이드바 + 지표 카드 + 차트 + 데이터 표) 구성을
 * UniKit 컴포넌트로 조립.
 * - 차트: 단일 시리즈 막대(--chart-1) — 시리즈가 하나면 범례 없이 제목이
 *   시리즈를 명시한다. 아래 데이터 표가 표 형태 데이터 뷰를 겸한다.
 * - 지표 증감은 ▲▼ 글리프 + 부호 수치 텍스트로만 표현 — 상태 색 토큰이
 *   없어 색만으로 상태를 암시하지 않는다(색·수치 이중 표기 원칙).
 * - 모든 수치는 데모용 샘플이다(실측 아님). 아이콘은 lucide-react(앱 코드 관행).
 * - Blocks 돌아가기 알약·테마 토글은 헤더 바 안(floating={false}) — 고정 알약이
 *   사이드바 토글을 덮지 않게 한다.
 * - Sidebar 모바일 판정은 소비자 몫(isMobile prop — 원본 useIsMobile 관행):
 *   좁은 화면에서 사이드바가 Sheet 오버레이로 열리게 한다.
 */
import { useEffect, useState } from "react";
import {
  Bell,
  ChartColumn,
  LayoutDashboard,
  LifeBuoy,
  Settings,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  UnikitThemeProvider,
} from "@unikit-bridge/ui";
import { ScrollView, Text, View } from "@unikit-bridge/ui/primitives";

import { BackToBlocks, BlockThemeToggle, BrandMark } from "./block-chrome";
import {
  ChartBarSeries,
  ChartConfig,
  ChartContainer,
  ChartGrid,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
  type ChartDatum,
} from "../ui/chart";

/** 차트 설정 — 단일 시리즈. 색은 site.css의 --chart-1(라이트·다크 대응) */
const chartConfig = {
  visits: { label: "방문자", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** 월별 방문자(샘플) — 지표 카드 "이번 달 24,812, ▲12.5%"와 끝을 맞춘다 */
const monthlyVisits: ChartDatum[] = [
  { month: "1월", visits: 14200 },
  { month: "2월", visits: 15800 },
  { month: "3월", visits: 17300 },
  { month: "4월", visits: 16400 },
  { month: "5월", visits: 18900 },
  { month: "6월", visits: 20100 },
  { month: "7월", visits: 19600 },
  { month: "8월", visits: 20800 },
  { month: "9월", visits: 21400 },
  { month: "10월", visits: 20600 },
  { month: "11월", visits: 22055 },
  { month: "12월", visits: 24812 },
];

/** 지표 카드(샘플) — 증감은 글리프+수치 텍스트로만 */
const STAT_CARDS = [
  { label: "이번 달 방문자", value: "24,812", delta: "▲ 12.5%", note: "지난 달 대비" },
  { label: "활성 구독", value: "1,024", delta: "▲ 4.3%", note: "지난 달 대비" },
  { label: "총 매출", value: "₩8,245,000", delta: "▲ 9.2%", note: "지난 달 대비" },
  { label: "이탈률", value: "2.4%", delta: "▼ 0.3%포인트", note: "개선" },
];

/** 최근 활동(샘플) — 셀은 문자열 계약(Table 내부 Text 래핑)을 지킨다 */
const ACTIVITY: {
  user: string;
  email: string;
  status: string;
  amount: string;
  date: string;
}[] = [
  { user: "홍길동", email: "hong@unikit.dev", status: "완료", amount: "₩120,000", date: "11월 12일" },
  { user: "김철수", email: "kim@unikit.dev", status: "대기", amount: "₩89,000", date: "11월 12일" },
  { user: "이영희", email: "lee@unikit.dev", status: "완료", amount: "₩240,000", date: "11월 11일" },
  { user: "박민수", email: "park@unikit.dev", status: "환불", amount: "−₩45,000", date: "11월 11일" },
  { user: "최수진", email: "choi@unikit.dev", status: "완료", amount: "₩310,000", date: "11월 10일" },
];

/**
 * 모바일 판정(웹 전용) — SidebarProvider isMobile의 기준.
 * 원본 shadcn useIsMobile과 같은 768px: 이하에서 사이드바는 Sheet로 열린다.
 */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

export function DashboardBlock() {
  const isMobile = useIsMobile();
  return (
    <UnikitThemeProvider>
      <SidebarProvider className="min-h-dvh w-full" isMobile={isMobile}>
        <Sidebar collapsible="offcanvas">
          {/** 헤더 — 공용 BrandMark(로그인 블록·어시스턴트 셸과 같은 마크) */}
          <SidebarHeader>
            <BrandMark label="UniKit 관리자" className="px-2 py-1.5" />
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>분석</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>
                      <LayoutDashboard className="size-4" />
                      대시보드
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <ChartColumn className="size-4" />
                      보고서
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>일반</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Bell className="size-4" />
                      알림
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Settings className="size-4" />
                      설정
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <LifeBuoy className="size-4" />
                      지원
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/** 푸터 — 사용자 행 */}
          <SidebarFooter>
            <View className="flex flex-row items-center gap-2 px-2 py-1">
              <Avatar className="size-8">
                <AvatarFallback>홍</AvatarFallback>
              </Avatar>
              <View className="min-w-0 flex-1">
                <Text className="block font-sans text-sm font-medium text-foreground">
                  홍길동
                </Text>
                <Text className="block truncate font-sans text-xs text-muted-foreground">
                  hong@unikit.dev
                </Text>
              </View>
              <Badge variant="secondary" className="px-1.5 text-xs self-center">
                관리자
              </Badge>
            </View>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          {/** 상단 바 — Blocks 돌아가기 + 사이드바 토글 + 경로 + 기간 배지 + 테마 */}
          <View className="flex h-16 shrink-0 flex-row items-center gap-2 border-b border-border px-4 sm:px-6">
            <BackToBlocks floating={false} />
            <Separator orientation="vertical" className="mx-1 h-4" />
            <SidebarTrigger accessibilityLabel="사이드바 토글" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Text className="font-sans text-sm text-muted-foreground">
                    UniKit 관리자
                  </Text>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>대시보드</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Badge variant="outline" className="ml-auto self-center">
              최근 30일
            </Badge>
            <BlockThemeToggle floating={false} />
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="mx-auto w-full max-w-6xl gap-4 p-4 sm:gap-6 sm:p-6"
          >
            {/** 지표 카드 — 증감 글리프+수치 */}
            <View className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {STAT_CARDS.map((stat) => (
                <Card key={stat.label} className="gap-1.5">
                  <CardHeader>
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {stat.value}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Text className="font-sans text-xs text-muted-foreground">
                      {stat.delta} · {stat.note}
                    </Text>
                  </CardContent>
                </Card>
              ))}
            </View>

            {/** 차트 카드 — 단일 시리즈 막대 */}
            <Card>
              <CardHeader>
                <CardTitle>월별 방문자</CardTitle>
                <CardDescription>
                  지난 12개월 웹 방문자 수(샘플 데이터)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/** 차트는 fluid 캔버스 — 카드 내부 폭에 맞춘다(웹 ResizeObserver).
                    캔버스가 폭을 따라가므로 가로 스크롤·우측 빈 공간이 없다 */}
                <View className="w-full web:overflow-x-auto">
                  <ChartContainer
                    config={chartConfig}
                    data={monthlyVisits}
                    width="fluid"
                    height={280}
                    accessibilityLabel="월별 방문자 막대 차트"
                  >
                    <ChartGrid />
                    <ChartXAxis />
                    <ChartYAxis />
                    <ChartBarSeries dataKey="visits" />
                    <ChartTooltip />
                  </ChartContainer>
                </View>
              </CardContent>
            </Card>

            {/** 데이터 표 — 최근 활동 */}
            <Card>
              <CardHeader>
                <CardTitle>최근 활동</CardTitle>
                <CardDescription>최근 결제 내역이에요(샘플)</CardDescription>
              </CardHeader>
              <CardContent>
                <View className="w-full web:overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>고객</TableHead>
                        <TableHead>이메일</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>금액</TableHead>
                        <TableHead className="text-right">날짜</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ACTIVITY.map((row) => (
                        <TableRow key={row.email}>
                          <TableCell>{row.user}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.status}</TableCell>
                          <TableCell className="tabular-nums">
                            {row.amount}
                          </TableCell>
                          <TableCell className="text-right">{row.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </View>
              </CardContent>
            </Card>

            <Text className="pb-2 font-sans text-xs text-muted-foreground">
              이 화면의 모든 요소는 @unikit-bridge/ui 컴포넌트예요 — 수치는
              샘플이에요.
            </Text>
          </ScrollView>
        </SidebarInset>
      </SidebarProvider>
    </UnikitThemeProvider>
  );
}
