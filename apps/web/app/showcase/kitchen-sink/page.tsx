"use client";
// Next.js 쇼케이스 페이지 — /showcase (사이클 50: 랜딩 `/`와 분리).
// Expo 쇼케이스(apps/expo/app/index.tsx)와 같은 섹션 순서·문구·클래스·간격을 렌더링한다.
//
// - "use client" 유지(테마 상태·이벤트 사용 — DOM 브리지 렌더링).
// - 컴포넌트 import는 오직 @unikit-bridge/ui. 플랫폼 분기 없음.
// - 테마: page 최상위에서 UnikitThemeProvider로 감싼다 — 웹 브리지가
//   문서 루트의 .dark 클래스를 토글한다(표준 Tailwind dark 변형).
// - SafeAreaView는 Expo 전용 포장 — 웹은 min-h-screen 배경 래퍼로 대응.
// - 모든 Text에 명시 색·크기·font-sans.
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { Inbox, Plus, Star } from "lucide-react";
import {
  Text,
  View,
  type BridgeTextInputRef,
} from "@unikit-bridge/ui/primitives";

import {
  useUnikitTheme,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  AspectRatio,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  ButtonGroup,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Kbd,
  KbdGroup,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@unikit-bridge/ui";

// 사이클 40(T-4.6) 신규 이식 33종 대표 데모 섹션 — 페이지가 길어져 섹션
// 컴포넌트로 분리(components/showcase/). 아래 기존 8개 섹션은 사이클 50 산출물
// 그대로 보존하고, 신규 섹션을 뒤에 이어 붙인다.
import { ChartSection } from "../../../components/showcase/chart-section";
import {
  CommandNavigationSection,
  SelectSection,
} from "../../../components/showcase/command-sections";
import { FormInputsSection } from "../../../components/showcase/form-sections";
import { LayoutFeedbackSection } from "../../../components/showcase/layout-sections";
import { MessageUISection } from "../../../components/showcase/message-sections";
import {
  OverlaySection,
  PopupMenuSection,
} from "../../../components/showcase/overlay-sections";

/** 전체 스크롤 데모 — DocsShell(테마·Toaster) 안에서 기존 섹션을 이어 붙인다. */
export default function KitchenSinkPage() {
  return (
    <View className="mx-auto w-full max-w-[640px] space-y-10 pb-8">
      <Header />
      <ButtonSection />
      <CardSection />
      <InputSection />
      <BadgeSection />
      <FormControlsSection />
      <DisclosureSection />
      <FeedbackSection />
      <DataLayoutSection />
      <OverlaySection />
      <PopupMenuSection />
      <CommandNavigationSection />
      <SelectSection />
      <FormInputsSection />
      <LayoutFeedbackSection />
      <MessageUISection />
      <ChartSection />
      <View className="pt-6">
        <Text className="text-center font-sans text-xs text-muted-foreground">
          UniKit — 전체 스크롤 데모(Expo 쇼케이스와 같은 구성)
        </Text>
      </View>
    </View>
  );
}

/** 헤더: 좌 타이틀 블록(flex-1 — §1.2 v3, 좁은 뷰포트에서 서브타이틀 줄바꿈·토글 잘림 방지) · 우 테마 토글(Button outline sm 재사용 — §1.4) */
function Header() {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();

  return (
    <View className="flex-row items-center justify-between mb-8">
      <View className="flex-1">
        <Text className="font-sans text-2xl font-bold web:tracking-tight text-foreground">
          UniKit
        </Text>
        <Text className="font-sans text-sm text-muted-foreground">
          React와 React Native에서 같은 컴포넌트, 같은 모습.
        </Text>
        <Link
          href="/showcase"
          className="site-focusable mt-2 font-sans text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          ← 컴포넌트 목록
        </Link>
      </View>
      <Button
        variant="outline"
        size="sm"
        onPress={toggleColorScheme}
        accessibilityLabel="색 테마 전환"
      >
        {colorScheme === "light" ? "🌙 다크" : "☀️ 라이트"}
      </Button>
    </View>
  );
}

/** 섹션 공통 골격: 제목 · 설명(space-y-4) + 본문(mt-4) — §1.2 하단 규칙 */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View className="space-y-4">
      <Text className="font-sans text-lg font-semibold text-foreground">
        {title}
      </Text>
      <Text className="font-sans text-sm text-muted-foreground">
        {description}
      </Text>
      <View className="mt-4">{children}</View>
    </View>
  );
}

/** Section: Button — 변형 6종 · 크기 4종 · 비활성 */
function ButtonSection() {
  return (
    <Section
      title="Button — 버튼"
      description="여섯 가지 스타일과 네 가지 크기예요. 버튼을 꾹 눌러보세요."
    >
      <View className="space-y-4">
        {/* [변형 6종] 모두 size="default" — flex-row 명시(§1.2 v3): Expo/RN과
            클래스를 통일하되 RN View 기본 flexDirection(column)에서도 행이 되게 한다. */}
        <View className="flex flex-row flex-wrap gap-3">
          <Button variant="default">기본</Button>
          <Button variant="secondary">보조</Button>
          <Button variant="destructive">삭제</Button>
          <Button variant="outline">외곽선</Button>
          <Button variant="ghost">고스트</Button>
          <Button variant="link">링크</Button>
        </View>
        {/* [크기 4종] 모두 variant="default" */}
        <View className="flex flex-row flex-wrap items-center gap-3">
          <Button size="sm">작게</Button>
          <Button size="default">보통</Button>
          <Button size="lg">크게</Button>
          <Button size="icon" accessibilityLabel="추가">
            <Plus className="size-4" />
          </Button>
        </View>
        {/* [상태] 비활성(default · disabled) */}
        <View className="flex flex-row flex-wrap gap-3">
          <Button disabled>비활성</Button>
        </View>
      </View>
    </Section>
  );
}

/** Section: Card — 카드 2장(1장은 푸터 포함 전 구성, 1장은 Header+Content) */
function CardSection() {
  return (
    <Section
      title="Card — 카드"
      description="제목과 설명, 내용, 하단을 조합해 정보를 담아요."
    >
      <View className="space-y-4">
        {/* 카드 1: Header / Content / Footer(텍스트 + Button outline sm) */}
        <Card>
          <CardHeader>
            <CardTitle>안녕, UniKit!</CardTitle>
            <CardDescription>복사해서 쓰는 유니버설 컴포넌트</CardDescription>
          </CardHeader>
          <CardContent>
            <Text className="font-sans text-sm text-foreground">
              이 카드 하나가 React(웹)와 React Native 모두에서 똑같이
              렌더링돼요. 소스를 내 프로젝트로 가져와 자유롭게 고칠 수 있어요.
            </Text>
          </CardContent>
          <CardFooter>
            <Text className="font-sans text-sm text-muted-foreground">v0.1</Text>
            <Button variant="outline" size="sm">
              자세히
            </Button>
          </CardFooter>
        </Card>
        {/* 카드 2: Header / Content — 배치·다크 모드 시연 */}
        <Card>
          <CardHeader>
            <CardTitle>다크 모드도 한 번에</CardTitle>
            <CardDescription>
              오른쪽 위 토글로 전체 색이 전환돼요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Text className="font-sans text-sm text-foreground">
              색, 테두리, 배경이 모두 CSS 변수 토큰으로 정의되어 있어, 테마를
              바꾸면 화면 전체가 한꺼번에 바뀌어요.
            </Text>
          </CardContent>
        </Card>
      </View>
    </Section>
  );
}

/** Section: Input · Label — 라벨↔입력창 연결 3쌍(§3.4: nativeID↔accessibilityLabelledBy + onPress→ref.focus) */
function InputSection() {
  const nameInputRef = useRef<BridgeTextInputRef>(null);
  const emailInputRef = useRef<BridgeTextInputRef>(null);
  const disabledInputRef = useRef<BridgeTextInputRef>(null);

  return (
    <Section
      title="Input & Label — 입력창"
      description="레이블과 입력창을 함께 써요. 입력창을 클릭하면 테두리가 강조돼요."
    >
      <View className="space-y-4">
        {/* 입력창 1: 라벨이 입력창 바로 위(gap-2 스택) */}
        <View className="flex flex-col gap-2">
          <Label
            nativeID="unikit-label-name"
            onPress={() => nameInputRef.current?.focus()}
          >
            이름
          </Label>
          <Input
            ref={nameInputRef}
            accessibilityLabelledBy="unikit-label-name"
            placeholder="홍길동"
          />
        </View>
        {/* 입력창 2 */}
        <View className="flex flex-col gap-2">
          <Label
            nativeID="unikit-label-email"
            onPress={() => emailInputRef.current?.focus()}
          >
            이메일
          </Label>
          <Input
            ref={emailInputRef}
            accessibilityLabelledBy="unikit-label-email"
            placeholder="example@unikit.dev"
          />
        </View>
        {/* 입력창 3: 비활성 */}
        <View className="flex flex-col gap-2">
          <Label
            nativeID="unikit-label-disabled"
            onPress={() => disabledInputRef.current?.focus()}
          >
            비활성 입력창
          </Label>
          <Input
            ref={disabledInputRef}
            accessibilityLabelledBy="unikit-label-disabled"
            placeholder="비활성 상태예요"
            disabled
          />
        </View>
      </View>
    </Section>
  );
}

/** Section: Badge — 변형 4종 */
function BadgeSection() {
  return (
    <Section title="Badge — 배지" description="네 가지 스타일의 배지예요.">
      <View className="flex flex-row flex-wrap gap-2">
        <Badge variant="default">기본</Badge>
        <Badge variant="secondary">보조</Badge>
        <Badge variant="destructive">삭제</Badge>
        <Badge variant="outline">외곽선</Badge>
      </View>
    </Section>
  );
}

/** Section: 폼 컨트롤 6종 — Checkbox·RadioGroup·Switch·Toggle·ToggleGroup·Textarea
 *  (비제어 초기값 중심 — 컨트롤을 직접 눌러 상태가 바뀌는지 확인) */
function FormControlsSection() {
  return (
    <Section
      title="폼 컨트롤 — Checkbox, Radio, Switch, Toggle"
      description="눌러 보세요. 체크와 선택, 전환이 모두 한 벌 소스로 동작해요."
    >
      <View className="space-y-4">
        {/* Checkbox — 기본 선택 + 중간 상태(− 글리프) */}
        <View className="flex flex-col gap-2">
          <View className="flex flex-row items-center gap-2">
            <Checkbox defaultChecked accessibilityLabel="이메일로 받기" />
            <Text className="font-sans text-sm text-foreground">
              이메일로 받기 (기본 선택)
            </Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            <Checkbox indeterminate accessibilityLabel="일부만 선택됨" />
            <Text className="font-sans text-sm text-foreground">
              일부만 선택됨 (중간 상태)
            </Text>
          </View>
        </View>
        {/* RadioGroup — 3항목 단일 선택 */}
        <RadioGroup defaultValue="email" accessibilityLabel="알림 받을 방법">
          <View className="flex flex-row flex-wrap gap-6">
            <View className="flex flex-row items-center gap-2">
              <RadioGroupItem value="email" />
              <Text className="font-sans text-sm text-foreground">이메일</Text>
            </View>
            <View className="flex flex-row items-center gap-2">
              <RadioGroupItem value="sms" />
              <Text className="font-sans text-sm text-foreground">문자</Text>
            </View>
            <View className="flex flex-row items-center gap-2">
              <RadioGroupItem value="push" />
              <Text className="font-sans text-sm text-foreground">푸시</Text>
            </View>
          </View>
        </RadioGroup>
        {/* Switch — 기본 켜짐 + 크기 sm */}
        <View className="flex flex-row items-center gap-3">
          <Switch defaultChecked accessibilityLabel="알림 켜기" />
          <Text className="font-sans text-sm text-foreground">알림 켜기</Text>
          <Switch size="sm" accessibilityLabel="작은 스위치" />
          <Text className="font-sans text-sm text-muted-foreground">작게</Text>
        </View>
        {/* Toggle + ToggleGroup(single) */}
        <View className="flex flex-row flex-wrap items-center gap-3">
          <Toggle defaultPressed accessibilityLabel="즐겨찾기">
            <Star className="size-4" />
          </Toggle>
          <ToggleGroup type="single" defaultValue="list">
            <ToggleGroupItem value="list">목록</ToggleGroupItem>
            <ToggleGroupItem value="gallery">갤러리</ToggleGroupItem>
            <ToggleGroupItem value="map">지도</ToggleGroupItem>
          </ToggleGroup>
        </View>
        {/* Textarea */}
        <Textarea placeholder="여러 줄 메모를 입력해 보세요." />
      </View>
    </Section>
  );
}

/** Section: 여닫이 3종 — Tabs·Accordion·Collapsible */
function DisclosureSection() {
  return (
    <Section
      title="Tabs, Accordion, Collapsible"
      description="탭과 접기를 열고 닫아 보세요."
    >
      <View className="space-y-4">
        {/* Tabs — line 변형 리스트 + 콘텐츠 3개 */}
        <Tabs defaultValue="account">
          <TabsList variant="line">
            <TabsTrigger value="account">계정</TabsTrigger>
            <TabsTrigger value="profile">프로필</TabsTrigger>
            <TabsTrigger value="security">보안</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Text className="font-sans text-sm text-foreground">
              계정 탭 내용이에요.
            </Text>
          </TabsContent>
          <TabsContent value="profile">
            <Text className="font-sans text-sm text-foreground">
              프로필 탭 내용이에요.
            </Text>
          </TabsContent>
          <TabsContent value="security">
            <Text className="font-sans text-sm text-foreground">
              보안 탭 내용이에요.
            </Text>
          </TabsContent>
        </Tabs>
        {/* Accordion — 첫 항목 펼침 */}
        <Accordion defaultValue="what">
          <AccordionItem value="what">
            <AccordionTrigger>UniKit이 뭔가요?</AccordionTrigger>
            <AccordionContent>
              <Text className="font-sans text-sm text-muted-foreground">
                한 벌 소스로 React(웹)와 React Native 양쪽에 같은 모습을 내는
                컴포넌트 모음이에요.
              </Text>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="how">
            <AccordionTrigger>어떻게 쓰나요?</AccordionTrigger>
            <AccordionContent>
              <Text className="font-sans text-sm text-muted-foreground">
                npm으로 설치하거나 shadcn CLI로 소스를 복사해 쓸 수 있어요.
              </Text>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {/* Collapsible — 기본 펼침 */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger>자세히 보기</CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Text className="font-sans text-sm text-muted-foreground">
              접기를 접었다 펼 수 있어요.
            </Text>
          </CollapsibleContent>
        </Collapsible>
      </View>
    </Section>
  );
}

/** Section: 피드백 6종 — Alert·Progress·Separator·Skeleton·Avatar·Empty */
function FeedbackSection() {
  return (
    <Section
      title="Alert, Progress, Avatar, Empty"
      description="상태와 정보를 알려주는 표시 요소예요."
    >
      <View className="space-y-4">
        {/* Alert — 기본 + 위험 */}
        <Alert>
          <AlertTitle>저장 완료</AlertTitle>
          <AlertDescription>변경사항이 안전하게 저장됐어요.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>주의</AlertTitle>
          <AlertDescription>
            이 작업은 되돌릴 수 없어요.
          </AlertDescription>
        </Alert>
        {/* Progress + Separator */}
        <Progress value={72} accessibilityLabel="저장 공간 사용률" />
        <Separator />
        {/* Skeleton — 웹에서 펄스 애니메이션 */}
        <View className="flex flex-row items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <View className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </View>
        </View>
        {/* Avatar — 이니셜 폴백 + 그룹 */}
        <View className="flex flex-row flex-wrap items-center gap-3">
          <Avatar>
            <AvatarFallback>홍</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>유</AvatarFallback>
          </Avatar>
          <AvatarGroup>
            <Avatar>
              <AvatarFallback>김</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>이</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>박</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+5</AvatarGroupCount>
          </AvatarGroup>
        </View>
        {/* Empty — 빈 상태 안내 */}
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox className="size-6 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>아직 항목이 없어요</EmptyTitle>
            <EmptyDescription>
              첫 번째 항목을 추가해 보세요.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">항목 추가</Button>
          </EmptyContent>
        </Empty>
      </View>
    </Section>
  );
}

/** Section: 데이터·레이아웃 8종 — Breadcrumb·Pagination·Table·Kbd·AspectRatio·Item·ButtonGroup·Field */
function DataLayoutSection() {
  return (
    <Section
      title="Table, Breadcrumb, Pagination, 레이아웃"
      description="데이터를 담고 위치를 안내하는 컴포넌트예요."
    >
      <View className="space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onPress={() => {}}>홈</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onPress={() => {}}>문서</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>컴포넌트</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Pagination — 2번 활성 */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onPress={() => {}}
                label="이전"
                accessibilityLabel="이전 페이지로 이동"
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onPress={() => {}}>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive onPress={() => {}}>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onPress={() => {}}>3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onPress={() => {}}
                label="다음"
                accessibilityLabel="다음 페이지로 이동"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        {/* Table — 2행 3열 + 캡션 */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>홍길동</TableCell>
              <TableCell>관리자</TableCell>
              <TableCell>활성</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>김철수</TableCell>
              <TableCell>편집자</TableCell>
              <TableCell>대기</TableCell>
            </TableRow>
          </TableBody>
          <TableCaption>팀 구성원 2명</TableCaption>
        </Table>
        {/* Kbd + AspectRatio */}
        <View className="flex flex-row flex-wrap items-center gap-3">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          <AspectRatio ratio={2} className="w-40 overflow-hidden rounded-md">
            <View className="flex h-full w-full items-center justify-center bg-muted">
              <Text className="font-sans text-sm text-muted-foreground">
                2:1 비율
              </Text>
            </View>
          </AspectRatio>
        </View>
        {/* Item — 아이콘 미디어 + 본문 + 행동 */}
        <Item variant="outline">
          <ItemMedia variant="icon">
            <Star className="size-4 text-muted-foreground" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>즐겨찾는 프로젝트</ItemTitle>
            <ItemDescription>
              어디서나 같은 모습으로 열리는 UniKit이에요.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="outline" size="sm">
              열기
            </Button>
          </ItemActions>
        </Item>
        {/* ButtonGroup — 3버튼 연접 */}
        <ButtonGroup>
          <Button variant="outline">편집</Button>
          <Button variant="outline">복제</Button>
          <Button variant="outline">삭제</Button>
        </ButtonGroup>
        {/* Field — 라벨·입력창·설명 묶음 */}
        <Field>
          <FieldContent>
            <FieldLabel nativeID="unikit-label-field-team">팀 이름</FieldLabel>
            <Input
              accessibilityLabelledBy="unikit-label-field-team"
              placeholder="예: 유니키팀"
            />
            <FieldDescription>
              팀 이름은 언제든 바꿀 수 있어요.
            </FieldDescription>
          </FieldContent>
        </Field>
      </View>
    </Section>
  );
}
