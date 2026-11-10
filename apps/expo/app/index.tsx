// UniKit Expo 쇼케이스(T-7) — 화면 구성·카피·클래스는 docs/sdd/02-design.md v3
// §1.2(화면 구성 트리)·§5(한국어 카피)를 그대로 따른다(문구 수정 금지).
//
// - 컴포넌트 import는 오직 @unikit-bridge/ui(AC-1 단일 import 원칙). react-native ·
//   react-native-safe-area-context는 02-design §1.2이 지시한 Expo 전용 포장
//   (SafeAreaView)을 위한 인프라 import다.
// - 최상단 포장: _layout이 SafeAreaProvider를 제공하지 않으므로 화면 안에서
//   SafeAreaProvider(initialMetrics 0 — 정적 내보내기에서도 본문이 즉시 렌더됨)로
//   감싼 뒤 §1.2의 SafeAreaView(노치 회피)로 감싼다. 콘텐츠 배열은 바꾸지 않는다.
// - 세로 스크롤(§1.2 · G3 F-1): Expo 웹 산출물은 expo-reset이 body 스크롤을
//   잠그고(overflow:hidden) 네이티브 View는 스크롤되지 않으므로, ScrollView로
//   화면 전체를 랩해 웹·네이티브 모두 사용자 스크롤이 가능하게 한다.
//   컨테이너 클래스(max-w 등)는 contentContainerClassName로 옮긴다.
import { useRef, type ReactNode } from "react";
import { ScrollView, Text, View, type TextInputInstance } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import {
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
  Badge,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Kbd,
  KbdGroup,
  Label,
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
  Toaster,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  useUnikitTheme,
} from "@unikit-bridge/ui";

// 사이클 40 신규 섹션(T-4.6) — 신규 이식 33종 대표 데모. 웹 쇼케이스와 동일
// 섹션 제목·순서(Resizable·HoverCard는 웹 전용 — 안내 문구로 표시, Chart는
// 네이티브 SVG 렌더로 표시 — G3 F-8).
import {
  OverlaySection,
  PopupMenuSection,
} from "../components/showcase/overlay-sections";
import { ChartSection } from "../components/showcase/chart-section";
import {
  CommandNavigationSection,
  SelectSection,
} from "../components/showcase/command-sections";
import { FormInputsSection } from "../components/showcase/form-sections";
import { LayoutFeedbackSection } from "../components/showcase/layout-sections";
import { MessageUISection } from "../components/showcase/message-sections";

// 정적 내보내기 시에도 SafeAreaProvider가 children을 즉시 렌더하도록 하는 초기값.
// 웹에서 safe-area 인셋은 보통 0이고, 측정 후 실제 값으로 교정된다.
const ZERO_INITIAL_METRICS = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 0, height: 0 },
} as const;

// 섹션 뼈대(§1.2 하단 표기): 제목 text-lg semibold / 설명 text-sm muted / 본문 mt-4를
// space-y-4 섹션 컨테이너의 평평한 자식으로 둔다(제목↔설명 16px, 설명↔본문 16px —
// apps/web 쇼케이스(T-8)와 동일 구조, AC-2).
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
      <View className="mt-4 space-y-4">{children}</View>
    </View>
  );
}

export default function Index() {
  // 테마 토글(§1.4): Provider는 _layout이 이미 랩. 라벨은 "누르면 될 모드".
  const { colorScheme, toggleColorScheme } = useUnikitTheme();

  // Label → Input 클릭 연결용 ref(§3.4-2). Input은 forwardRef로 focus()를 노출.
  const nameInputRef = useRef<TextInputInstance>(null);
  const emailInputRef = useRef<TextInputInstance>(null);
  const disabledInputRef = useRef<TextInputInstance>(null);

  return (
    <SafeAreaProvider initialMetrics={ZERO_INITIAL_METRICS}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="w-full max-w-[640px] mx-auto px-4 pt-8 pb-12"
          keyboardShouldPersistTaps="handled"
        >
            {/* 헤더(§1.2 v3): 좌 타이틀 블록(flex-1 — 좁은 뷰포트에서 서브타이틀
                줄바꿈, 토글 잘림 방지) · 우 테마 토글 */}
            <View className="flex-row items-center justify-between mb-8">
              <View className="flex-1">
                <Text className="font-sans text-2xl font-bold web:tracking-tight text-foreground">
                  UniKit
                </Text>
                <Text className="font-sans text-sm text-muted-foreground">
                  React와 React Native에서 같은 컴포넌트, 같은 모습.
                </Text>
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

            {/* 섹션 4종 래퍼(§1.2 58행): 섹션 사이 간격 space-y-10 = 40px를 부모가 관리.
                헤더 mb-8(32px)·푸터 pt-10(40px)과 이중 적용되지 않게 래퍼로 분리
                — apps/web(T-8)과 동일 해석, AC-2. */}
            <View className="space-y-10">

            {/* Button 섹션: 변형 6종 · 크기 4종 · 비활성 1개 */}
            <Section
              title="Button · 버튼"
              description="여섯 가지 스타일과 네 가지 크기예요. 버튼을 꾹 눌러보세요."
            >
              {/* flex-row 명시(§1.2 v3): RN View 기본 flexDirection는 column —
                  flex만으로는 세로 스택이 된다(웹 브라우저만 기본 row). */}
              <View className="flex flex-row flex-wrap gap-3">
                <Button variant="default" size="default">
                  기본
                </Button>
                <Button variant="secondary" size="default">
                  보조
                </Button>
                <Button variant="destructive" size="default">
                  삭제
                </Button>
                <Button variant="outline" size="default">
                  외곽선
                </Button>
                <Button variant="ghost" size="default">
                  고스트
                </Button>
                <Button variant="link" size="default">
                  링크
                </Button>
              </View>
              <View className="flex flex-row flex-wrap items-center gap-3">
                <Button variant="default" size="sm">
                  작게
                </Button>
                <Button variant="default" size="default">
                  보통
                </Button>
                <Button variant="default" size="lg">
                  크게
                </Button>
                <Button variant="default" size="icon">
                  +
                </Button>
              </View>
              <View className="flex flex-row flex-wrap gap-3">
                <Button variant="default" size="default" disabled>
                  비활성
                </Button>
              </View>
            </Section>

            {/* Card 섹션: 카드 2장(1장째 = Header/Content/Footer, 2장째 = Header/Content) */}
            <Section
              title="Card · 카드"
              description="제목·설명·내용·하단을 조합해 정보를 담아요."
            >
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
                  <Text className="font-sans text-sm text-muted-foreground">
                    v0.1
                  </Text>
                  <Button variant="outline" size="sm">
                    자세히
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>다크 모드도 한 번에</CardTitle>
                  <CardDescription>
                    오른쪽 위 토글로 전체 색이 전환돼요.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Text className="font-sans text-sm text-foreground">
                    색·테두리·배경이 모두 CSS 변수 토큰으로 정의되어 있어, 테마를
                    바꾸면 화면 전체가 한꺼번에 바뀌어요.
                  </Text>
                </CardContent>
              </Card>
            </Section>

            {/* Input · Label 섹션: 3쌍 — nativeID ↔ accessibilityLabelledBy + 클릭 포커스 */}
            <Section
              title="Input · Label — 입력창"
              description="레이블과 입력창을 함께 써요. 입력창을 클릭하면 테두리가 강조돼요."
            >
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
            </Section>

            {/* Badge 섹션: 변형 4종 */}
            <Section
              title="Badge · 배지"
              description="네 가지 스타일의 배지예요."
            >
              <View className="flex flex-row flex-wrap gap-2">
                <Badge variant="default">기본</Badge>
                <Badge variant="secondary">보조</Badge>
                <Badge variant="destructive">삭제</Badge>
                <Badge variant="outline">외곽선</Badge>
              </View>
            </Section>

            {/* 폼 컨트롤 섹션: Checkbox·RadioGroup·Switch·Toggle·ToggleGroup·Textarea
                — apps/web 쇼케이스와 같은 구성·문구(1차 23종 전시). */}
            <Section
              title="폼 컨트롤 — Checkbox · Radio · Switch · Toggle"
              description="눌러 보세요. 체크·선택·전환이 모두 한 벌 소스로 동작해요."
            >
              <View className="flex flex-col gap-4">
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
                <View className="flex flex-row items-center gap-3">
                  <Switch defaultChecked accessibilityLabel="알림 켜기" />
                  <Text className="font-sans text-sm text-foreground">알림 켜기</Text>
                  <Switch size="sm" accessibilityLabel="작은 스위치" />
                  <Text className="font-sans text-sm text-muted-foreground">작게</Text>
                </View>
                <View className="flex flex-row flex-wrap items-center gap-3">
                  <Toggle defaultPressed accessibilityLabel="즐겨찾기">
                    ★ 즐겨찾기
                  </Toggle>
                  <ToggleGroup type="single" defaultValue="list">
                    <ToggleGroupItem value="list">목록</ToggleGroupItem>
                    <ToggleGroupItem value="gallery">갤러리</ToggleGroupItem>
                    <ToggleGroupItem value="map">지도</ToggleGroupItem>
                  </ToggleGroup>
                </View>
                <Textarea placeholder="여러 줄 메모를 입력해 보세요." />
              </View>
            </Section>

            {/* 여닫이 섹션: Tabs·Accordion·Collapsible */}
            <Section
              title="Tabs · Accordion · Collapsible"
              description="탭과 접기를 열고 닫아 보세요."
            >
              <View className="flex flex-col gap-4">
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

            {/* 피드백 섹션: Alert·Progress·Separator·Skeleton·Avatar·Empty */}
            <Section
              title="Alert · Progress · Avatar · Empty"
              description="상태와 정보를 알려주는 표시 요소예요."
            >
              <View className="flex flex-col gap-4">
                <Alert>
                  <AlertTitle>저장 완료</AlertTitle>
                  <AlertDescription>변경사항이 안전하게 저장됐어요.</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTitle>주의</AlertTitle>
                  <AlertDescription>이 작업은 되돌릴 수 없어요.</AlertDescription>
                </Alert>
                <Progress value={72} accessibilityLabel="저장 공간 사용률" />
                <Separator />
                <View className="flex flex-row items-center gap-4">
                  <Skeleton className="size-10 rounded-full" />
                  <View className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </View>
                </View>
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
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">◻</EmptyMedia>
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

            {/* 데이터·레이아웃 섹션: Breadcrumb·Pagination·Table·Kbd·AspectRatio·Item·ButtonGroup·Field */}
            <Section
              title="Table · Breadcrumb · Pagination · 레이아웃"
              description="데이터를 담고 위치를 안내하는 컴포넌트예요."
            >
              <View className="flex flex-col gap-4">
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
                <Item variant="outline">
                  <ItemMedia variant="icon">
                    <Text className="font-sans text-base text-muted-foreground">★</Text>
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
                <ButtonGroup>
                  <Button variant="outline">편집</Button>
                  <Button variant="outline">복제</Button>
                  <Button variant="outline">삭제</Button>
                </ButtonGroup>
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

            {/* ———— 사이클 40 신규 섹션(T-4.6): 신규 이식 33종 데모 ———
                웹 쇼케이스(apps/web/app/showcase)와 동일 제목·순서. 웹 전용
                (Resizable·HoverCard·Chart)은 안내 문구로 패리티를 유지한다. */}
            <OverlaySection />
            <PopupMenuSection />
            <CommandNavigationSection />
            <SelectSection />
            <FormInputsSection />
            <LayoutFeedbackSection />
            <MessageUISection />

            {/* Chart — 네이티브 SVG(react-native-svg). G3 F-8: 양측 데모
                충족 — 색은 global.css 소비자 @theme --color-chart-1..5. */}
            <ChartSection />

            </View>

            {/* 푸터(§1.2): pt-10 · 중앙 정렬 */}
            <View className="pt-10">
              <Text className="font-sans text-xs text-muted-foreground text-center">
                UniKit v0.1 · Expo와 Next.js에서 같은 화면을 보고 있어요.
              </Text>
            </View>
        </ScrollView>

        {/* Toaster(사이클 40) — 네이티브 비모달 포털 한계로 화면 루트(ScrollView
            밖)에 1개만 둔다. Sonner 섹션의 toast 호출이 여기에 쌓여요. */}
        <Toaster position="bottom-right" richColors closeButton />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
