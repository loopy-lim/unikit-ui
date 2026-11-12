// 기초 컴포넌트 카탈로그 엔트리(엑스포) — app/index.tsx에 인라인으로 있던
// 1차 23종 데모를 컴포넌트별 엔트리로 옮겼다(카탈로그 재구성 — RNR식
// 목록→상세 구조). 데모 JSX는 기존 것을 그대로 옮기고 Section/DemoLabel
// 포장만 벗겼다(문구·구성 유지).
import { useRef, type ReactNode } from "react";
import { Text, View, type TextInputInstance } from "react-native";
import { Inbox, Plus, Star } from "lucide-react-native";
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
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@unikit-bridge/ui";

import type { CatalogEntry } from "./catalog";

/** 슬라이드 본문 공통 세로 간격 래퍼 */
function Stack({ children }: { children: ReactNode }) {
  return <View className="flex flex-col gap-4">{children}</View>;
}

// ---------------------------------------------------------------------------
// 기초 티어
// ---------------------------------------------------------------------------

function ButtonDemoVariants() {
  return (
    <View className="flex flex-row flex-wrap items-center justify-center gap-2 max-w-70">
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
  );
}

function ButtonDemoSizes() {
  return (
    <View className="flex flex-row flex-wrap items-center justify-center gap-3">
      <Button variant="default" size="sm">
        작게
      </Button>
      <Button variant="default" size="default">
        보통
      </Button>
      <Button variant="default" size="lg">
        크게
      </Button>
      <Button variant="default" size="icon" accessibilityLabel="추가">
        <Plus size={16} />
      </Button>
    </View>
  );
}

function ButtonDemoDisabled() {
  return (
    <View className="flex flex-row flex-wrap items-center justify-center gap-3">
      <Button variant="default" size="default" disabled>
        비활성
      </Button>
    </View>
  );
}

function CardDemo() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>알림 설정</CardTitle>
        <CardDescription>새로운 활동 알림을 받습니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <Text className="font-sans text-sm text-foreground">
          프로젝트 변경 사항과 피드백을 실시간으로 알려드려요.
        </Text>
      </CardContent>
      <CardFooter className="flex-row items-center justify-between">
        <Text className="font-sans text-xs text-muted-foreground">언제든 변경 가능</Text>
        <Button variant="outline" size="sm">
          관리
        </Button>
      </CardFooter>
    </Card>
  );
}

/** Input · Label — nativeID ↔ accessibilityLabelledBy 연결 + 클릭 포커스 */
function InputLabelDemo() {
  const nameInputRef = useRef<TextInputInstance>(null);
  const emailInputRef = useRef<TextInputInstance>(null);
  const disabledInputRef = useRef<TextInputInstance>(null);
  return (
    <Stack>
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
    </Stack>
  );
}

function CheckboxDemo() {
  return (
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
  );
}

function RadioGroupDemo() {
  return (
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
  );
}

function SwitchDemo() {
  return (
    <View className="flex flex-row items-center gap-3">
      <Switch defaultChecked accessibilityLabel="알림 켜기" />
      <Text className="font-sans text-sm text-foreground">알림 켜기</Text>
      <Switch size="sm" accessibilityLabel="작은 스위치" />
      <Text className="font-sans text-sm text-muted-foreground">작게</Text>
    </View>
  );
}

function ToggleDemo() {
  return (
    <Stack>
      <View className="flex flex-row flex-wrap items-center gap-3">
        <Toggle defaultPressed accessibilityLabel="즐겨찾기">
          즐겨찾기
        </Toggle>
        <ToggleGroup type="single" defaultValue="list">
          <ToggleGroupItem value="list">목록</ToggleGroupItem>
          <ToggleGroupItem value="gallery">갤러리</ToggleGroupItem>
          <ToggleGroupItem value="map">지도</ToggleGroupItem>
        </ToggleGroup>
      </View>
    </Stack>
  );
}

function TabsDemo() {
  return (
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
  );
}

function AccordionDemo() {
  return (
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
  );
}

function CollapsibleDemo() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>자세히 보기</CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <Text className="font-sans text-sm text-muted-foreground">
          접기를 접었다 펼 수 있어요.
        </Text>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AlertDemo() {
  return (
    <Stack>
      <Alert>
        <AlertTitle>저장 완료</AlertTitle>
        <AlertDescription>변경사항이 안전하게 저장됐어요.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>주의</AlertTitle>
        <AlertDescription>이 작업은 되돌릴 수 없어요.</AlertDescription>
      </Alert>
    </Stack>
  );
}

function AvatarDemo() {
  return (
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
  );
}

function EmptyDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox size={28} className="text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>아직 항목이 없어요</EmptyTitle>
        <EmptyDescription>첫 번째 항목을 추가해 보세요.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">항목 추가</Button>
      </EmptyContent>
    </Empty>
  );
}

function BreadcrumbDemo() {
  return (
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
  );
}

function PaginationDemo() {
  return (
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
  );
}

function TableDemo() {
  return (
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
  );
}

function AspectRatioDemo() {
  return (
    <AspectRatio ratio={2} className="w-40 overflow-hidden rounded-md">
      <View className="flex h-full w-full items-center justify-center bg-muted">
        <Text className="font-sans text-sm text-muted-foreground">2:1 비율</Text>
      </View>
    </AspectRatio>
  );
}

function ItemDemo() {
  return (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <Star size={16} className="text-muted-foreground" />
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
  );
}

function FieldDemo() {
  return (
    <Field>
      <FieldContent>
        <FieldLabel nativeID="unikit-label-field-team">팀 이름</FieldLabel>
        <Input
          accessibilityLabelledBy="unikit-label-field-team"
          placeholder="예: 유니키팀"
        />
        <FieldDescription>팀 이름은 언제든 바꿀 수 있어요.</FieldDescription>
      </FieldContent>
    </Field>
  );
}

/** 기초 티어 엔트리 — 카테고리·순서는 app/index.tsx(구) 섹션 순서를 따른다. */
export const BASIC_ENTRIES: CatalogEntry[] = [
  {
    slug: "button",
    title: "Button",
    subtitle: "버튼",
    category: "기초",
    description: "여섯 가지 스타일과 네 가지 크기예요.",
    slides: [
      { name: "변형 6종", element: <ButtonDemoVariants /> },
      { name: "크기 4종", element: <ButtonDemoSizes /> },
      { name: "비활성", element: <ButtonDemoDisabled /> },
    ],
  },
  {
    slug: "card",
    title: "Card",
    subtitle: "카드",
    category: "기초",
    description: "제목, 설명, 내용, 하단을 조합해 정보를 담아요.",
    slides: [{ name: "구성", element: <CardDemo /> }],
  },
  {
    slug: "badge",
    title: "Badge",
    subtitle: "배지",
    category: "기초",
    description: "네 가지 스타일의 배지예요.",
    slides: [
      {
        name: "변형 4종",
        element: (
          <View className="flex flex-row flex-wrap gap-2">
            <Badge variant="default">기본</Badge>
            <Badge variant="secondary">보조</Badge>
            <Badge variant="destructive">삭제</Badge>
            <Badge variant="outline">외곽선</Badge>
          </View>
        ),
      },
    ],
  },
  {
    slug: "alert",
    title: "Alert",
    subtitle: "알림 상자",
    category: "기초",
    description: "정보와 주의를 알려요.",
    slides: [{ name: "변형 2종", element: <AlertDemo /> }],
  },
  {
    slug: "progress",
    title: "Progress",
    subtitle: "진행률",
    category: "기초",
    description: "작업이 얼마나 진행됐는지 보여요.",
    slides: [
      {
        name: "72%",
        element: (
          <Progress value={72} accessibilityLabel="저장 공간 사용률" />
        ),
      },
    ],
  },
  {
    slug: "separator",
    title: "Separator",
    subtitle: "구분선",
    category: "기초",
    description: "내용 사이를 나눠요.",
    slides: [{ name: "기본", element: <Separator /> }],
  },
  {
    slug: "skeleton",
    title: "Skeleton",
    subtitle: "스켈레톤",
    category: "기초",
    description: "로딩 중 자리를 맥동으로 알려요(네이티브 RN Animated).",
    slides: [
      {
        name: "카드형",
        element: (
          <View className="flex flex-row items-center gap-4">
            <Skeleton className="size-10 rounded-full" />
            <View className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </View>
          </View>
        ),
      },
    ],
  },
  {
    slug: "avatar",
    title: "Avatar",
    subtitle: "아바타",
    category: "기초",
    description: "프로필 자리와 겹침 그룹이에요.",
    slides: [{ name: "단일과 그룹", element: <AvatarDemo /> }],
  },
  {
    slug: "empty",
    title: "Empty",
    subtitle: "빈 상태",
    category: "기초",
    description: "데이터가 없을 때 보여요.",
    slides: [{ name: "기본", element: <EmptyDemo /> }],
  },
  {
    slug: "input-label",
    title: "Input & Label",
    subtitle: "입력창, 레이블",
    category: "폼",
    description:
      "레이블과 입력창을 함께 써요. 입력창을 클릭하면 테두리가 강조돼요.",
    slides: [{ name: "3쌍", element: <InputLabelDemo /> }],
  },
  {
    slug: "checkbox",
    title: "Checkbox",
    subtitle: "체크박스",
    category: "폼",
    description: "기본 선택과 중간 상태를 보여요.",
    slides: [{ name: "상태 2종", element: <CheckboxDemo /> }],
  },
  {
    slug: "radio-group",
    title: "RadioGroup",
    subtitle: "라디오 그룹",
    category: "폼",
    description: "여럿 중 하나를 골라요.",
    slides: [{ name: "단일 선택", element: <RadioGroupDemo /> }],
  },
  {
    slug: "switch",
    title: "Switch",
    subtitle: "스위치",
    category: "폼",
    description: "켜고 끄는 전환이에요.",
    slides: [{ name: "크기 2종", element: <SwitchDemo /> }],
  },
  {
    slug: "toggle",
    title: "Toggle & ToggleGroup",
    subtitle: "토글",
    category: "폼",
    description: "눌린 상태를 유지하는 버튼과 그룹이에요.",
    slides: [{ name: "단일과 그룹", element: <ToggleDemo /> }],
  },
  {
    slug: "textarea",
    title: "Textarea",
    subtitle: "여러 줄 입력",
    category: "폼",
    description: "긴 문장을 입력해요.",
    slides: [
      {
        name: "기본",
        element: <Textarea placeholder="여러 줄 메모를 입력해 보세요." />,
      },
    ],
  },
  {
    slug: "tabs",
    title: "Tabs",
    subtitle: "탭",
    category: "여닫이",
    description: "탭으로 내용을 전환해요.",
    slides: [{ name: "라인 변형", element: <TabsDemo /> }],
  },
  {
    slug: "accordion",
    title: "Accordion",
    subtitle: "아코디언",
    category: "여닫이",
    description: "접혀 있는 항목을 펼쳐요.",
    slides: [{ name: "기본", element: <AccordionDemo /> }],
  },
  {
    slug: "collapsible",
    title: "Collapsible",
    subtitle: "접기",
    category: "여닫이",
    description: "간단한 접기 블록이에요.",
    slides: [{ name: "기본", element: <CollapsibleDemo /> }],
  },
  {
    slug: "breadcrumb",
    title: "Breadcrumb",
    subtitle: "이동 경로",
    category: "데이터",
    description: "현재 위치의 경로를 보여요.",
    slides: [{ name: "기본", element: <BreadcrumbDemo /> }],
  },
  {
    slug: "pagination",
    title: "Pagination",
    subtitle: "페이지 이동",
    category: "데이터",
    description: "목록 페이지를 오가요.",
    slides: [{ name: "기본", element: <PaginationDemo /> }],
  },
  {
    slug: "table",
    title: "Table",
    subtitle: "표",
    category: "데이터",
    description: "행과 열로 데이터를 담아요.",
    slides: [{ name: "기본", element: <TableDemo /> }],
  },
  {
    slug: "kbd",
    title: "Kbd",
    subtitle: "키보드 키",
    category: "데이터",
    description: "키보드 입력을 표시해요.",
    slides: [
      {
        name: "그룹",
        element: (
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        ),
      },
    ],
  },
  {
    slug: "aspect-ratio",
    title: "AspectRatio",
    subtitle: "비율 컨테이너",
    category: "데이터",
    description: "정해진 비율로 자리를 잡아요.",
    slides: [{ name: "2:1", element: <AspectRatioDemo /> }],
  },
  {
    slug: "item",
    title: "Item",
    subtitle: "목록 항목",
    category: "데이터",
    description: "미디어와 내용, 동작을 한 줄에 담아요.",
    slides: [{ name: "outline 변형", element: <ItemDemo /> }],
  },
  {
    slug: "button-group",
    title: "ButtonGroup",
    subtitle: "버튼 그룹",
    category: "데이터",
    description: "관련 버튼을 붙여 묶어요.",
    slides: [
      {
        name: "기본",
        element: (
          <ButtonGroup>
            <Button variant="outline">편집</Button>
            <Button variant="outline">복제</Button>
            <Button variant="outline">삭제</Button>
          </ButtonGroup>
        ),
      },
    ],
  },
  {
    slug: "field",
    title: "Field",
    subtitle: "필드",
    category: "폼",
    description: "레이블과 입력, 설명을 한 덩어리로 묶어요.",
    slides: [{ name: "기본", element: <FieldDemo /> }],
  },
];
