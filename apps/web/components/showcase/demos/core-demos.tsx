"use client";

import { useRef } from "react";
import {
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Progress,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@unikit-bridge/ui";
import { Text, View, type BridgeTextInputRef } from "@unikit-bridge/ui/primitives";
import { ArrowUp, Inbox, MoreHorizontal, Star } from "lucide-react";

import type { ShowcaseDemo } from "./types";

export const buttonDemo: ShowcaseDemo = {
  Demo: function ButtonDemo() {
    return (
      <View className="flex flex-row flex-wrap items-center justify-center gap-3">
        <Button>계속하기</Button>
        <Button variant="outline">취소</Button>
        <Button size="icon" variant="outline" accessibilityLabel="공유">
          <ArrowUp className="size-4" />
        </Button>
      </View>
    );
  },
  code: `import { Button } from "@unikit-bridge/ui";

<Button>계속하기</Button>
<Button variant="outline">취소</Button>`,
  examples: [
    {
      title: "Variants",
      description: "강조도에 따라 기본·보조·위험·외곽선·고스트·링크를 골라요.",
      Demo: function ButtonVariants() {
        return (
          <View className="flex flex-row flex-wrap items-center justify-center gap-2">
            <Button variant="default">기본</Button>
            <Button variant="secondary">보조</Button>
            <Button variant="destructive">삭제</Button>
            <Button variant="outline">외곽선</Button>
            <Button variant="ghost">고스트</Button>
            <Button variant="link">링크</Button>
          </View>
        );
      },
    },
    {
      title: "Size",
      description: "작게·기본·크게·아이콘 크기.",
      Demo: function ButtonSizes() {
        return (
          <View className="flex flex-row flex-wrap items-center justify-center gap-2">
            <Button size="sm">작게</Button>
            <Button size="default">기본</Button>
            <Button size="lg">크게</Button>
            <Button size="icon" accessibilityLabel="더보기">
              <MoreHorizontal className="size-4" />
            </Button>
          </View>
        );
      },
    },
    {
      title: "Disabled",
      Demo: function ButtonDisabled() {
        return (
          <View className="flex flex-row flex-wrap items-center justify-center gap-2">
            <Button disabled>비활성</Button>
            <Button variant="outline" disabled>
              외곽선
            </Button>
          </View>
        );
      },
    },
  ],
};

export const badgeDemo: ShowcaseDemo = {
  Demo: function BadgeDemo() {
    return (
      <View className="flex flex-row flex-wrap items-center justify-center gap-2">
        <Badge>신규</Badge>
        <Badge variant="secondary">베타</Badge>
        <Badge variant="outline">초안</Badge>
      </View>
    );
  },
  code: `import { Badge } from "@unikit-bridge/ui";

<Badge>신규</Badge>
<Badge variant="secondary">베타</Badge>`,
  examples: [
    {
      title: "Variants",
      Demo: function BadgeVariants() {
        return (
          <View className="flex flex-row flex-wrap items-center justify-center gap-2">
            <Badge>기본</Badge>
            <Badge variant="secondary">보조</Badge>
            <Badge variant="destructive">위험</Badge>
            <Badge variant="outline">외곽선</Badge>
          </View>
        );
      },
    },
  ],
};

export const cardDemo: ShowcaseDemo = {
  Demo: function CardDemo() {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle>프로젝트 만들기</CardTitle>
          <CardDescription>
            이름과 설명을 입력하면 바로 시작할 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <View className="flex flex-col gap-2">
            <Label nativeID="card-name">이름</Label>
            <Input
              accessibilityLabelledBy="card-name"
              placeholder="UniKit Demo"
            />
          </View>
          <View className="flex flex-col gap-2">
            <Label nativeID="card-desc">설명</Label>
            <Input
              accessibilityLabelledBy="card-desc"
              placeholder="간단한 소개"
            />
          </View>
        </CardContent>
        <CardFooter className="flex flex-row justify-end gap-2">
          <Button variant="outline" size="sm">
            취소
          </Button>
          <Button size="sm">만들기</Button>
        </CardFooter>
      </Card>
    );
  },
  code: `import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@unikit-bridge/ui";

<Card>
  <CardHeader><CardTitle>프로젝트 만들기</CardTitle></CardHeader>
  <CardFooter><Button>만들기</Button></CardFooter>
</Card>`,
};

export const inputDemo: ShowcaseDemo = {
  Demo: function InputDemo() {
    const ref = useRef<BridgeTextInputRef>(null);
    return (
      <View className="flex w-full flex-col gap-2">
        <Label nativeID="demo-input" onPress={() => ref.current?.focus()}>
          이메일
        </Label>
        <Input
          ref={ref}
          accessibilityLabelledBy="demo-input"
          placeholder="you@example.com"
          inputMode="email"
        />
        <Text className="font-sans text-xs leading-5 text-muted-foreground">
          계정에 사용할 이메일을 입력하세요.
        </Text>
      </View>
    );
  },
  code: `import { Input, Label } from "@unikit-bridge/ui";

<Label nativeID="email">이메일</Label>
<Input accessibilityLabelledBy="email" placeholder="you@example.com" />`,
  examples: [
    {
      title: "Disabled",
      Demo: function InputDisabled() {
        return (
          <View className="flex w-full flex-col gap-2">
            <Label nativeID="demo-input-disabled">비활성</Label>
            <Input
              accessibilityLabelledBy="demo-input-disabled"
              placeholder="수정할 수 없어요"
              editable={false}
            />
          </View>
        );
      },
    },
  ],
};

export const labelDemo: ShowcaseDemo = {
  Demo: function LabelDemo() {
    return <Label nativeID="demo-label-only">이메일 주소</Label>;
  },
  code: `import { Label } from "@unikit-bridge/ui";

<Label nativeID="field-id">이메일</Label>`,
};

export const alertDemo: ShowcaseDemo = {
  Demo: function AlertDemo() {
    return (
      <Alert className="w-full">
        <AlertTitle>저장 완료</AlertTitle>
        <AlertDescription>변경사항이 안전하게 저장됐어요.</AlertDescription>
      </Alert>
    );
  },
  code: `import { Alert, AlertTitle, AlertDescription } from "@unikit-bridge/ui";

<Alert>
  <AlertTitle>저장 완료</AlertTitle>
  <AlertDescription>변경사항이 안전하게 저장됐어요.</AlertDescription>
</Alert>`,
  examples: [
    {
      title: "With action",
      description: "알림 옆에서 바로 이어갈 액션을 붙일 수 있어요.",
      Demo: function AlertWithAction() {
        return (
          <View className="w-full gap-3">
            <Alert className="w-full">
              <AlertTitle>업데이트 가능</AlertTitle>
              <AlertDescription>
                새 버전이 준비됐어요. 지금 적용할까요?
              </AlertDescription>
            </Alert>
            <View className="flex flex-row justify-end gap-2">
              <Button variant="outline" size="sm">
                나중에
              </Button>
              <Button size="sm">업데이트</Button>
            </View>
          </View>
        );
      },
    },
  ],
};

export const progressDemo: ShowcaseDemo = {
  Demo: function ProgressDemo() {
    return (
      <View className="w-full gap-3">
        <Progress value={72} accessibilityLabel="진행률" />
        <Progress value={28} accessibilityLabel="업로드" />
      </View>
    );
  },
  code: `import { Progress } from "@unikit-bridge/ui";

<Progress value={72} accessibilityLabel="진행률" />`,
};

export const separatorDemo: ShowcaseDemo = {
  Demo: function SeparatorDemo() {
    return (
      <View className="gap-2">
        <Text className="font-sans text-sm text-foreground">위</Text>
        <Separator />
        <Text className="font-sans text-sm text-foreground">아래</Text>
      </View>
    );
  },
  code: `import { Separator } from "@unikit-bridge/ui";

<Separator />`,
};

export const skeletonDemo: ShowcaseDemo = {
  Demo: function SkeletonDemo() {
    return (
      <View className="flex flex-row items-center gap-4">
        <Skeleton className="size-10 rounded-full" />
        <View className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </View>
      </View>
    );
  },
  code: `import { Skeleton } from "@unikit-bridge/ui";

<Skeleton className="h-4 w-2/3" />`,
};

export const avatarDemo: ShowcaseDemo = {
  Demo: function AvatarDemo() {
    return (
      <View className="flex flex-row items-center gap-3">
        <Avatar>
          <AvatarFallback>홍</AvatarFallback>
        </Avatar>
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>김</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>이</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </View>
    );
  },
  code: `import { Avatar, AvatarFallback } from "@unikit-bridge/ui";

<Avatar><AvatarFallback>홍</AvatarFallback></Avatar>`,
};

export const emptyDemo: ShowcaseDemo = {
  Demo: function EmptyDemo() {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox className="size-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>항목이 없어요</EmptyTitle>
          <EmptyDescription>첫 항목을 추가해 보세요.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm">추가</Button>
        </EmptyContent>
      </Empty>
    );
  },
  code: `import { Empty, EmptyTitle, EmptyDescription } from "@unikit-bridge/ui";

<Empty><EmptyTitle>비어 있어요</EmptyTitle></Empty>`,
};

export const breadcrumbDemo: ShowcaseDemo = {
  Demo: function BreadcrumbDemo() {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onPress={() => {}}>홈</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>컴포넌트</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
  code: `import { Breadcrumb, BreadcrumbList, BreadcrumbPage } from "@unikit-bridge/ui";

<Breadcrumb><BreadcrumbList>...</BreadcrumbList></Breadcrumb>`,
};

export const paginationDemo: ShowcaseDemo = {
  Demo: function PaginationDemo() {
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onPress={() => {}} label="이전" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive onPress={() => {}}>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext onPress={() => {}} label="다음" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  },
  code: `import { Pagination, PaginationContent, PaginationLink } from "@unikit-bridge/ui";

<Pagination><PaginationContent>...</PaginationContent></Pagination>`,
};

export const tableDemo: ShowcaseDemo = {
  Demo: function TableDemo() {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>역할</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>홍길동</TableCell>
            <TableCell>관리자</TableCell>
          </TableRow>
        </TableBody>
        <TableCaption>팀 1명</TableCaption>
      </Table>
    );
  },
  code: `import { Table, TableHeader, TableBody, TableRow, TableCell } from "@unikit-bridge/ui";

<Table><TableBody><TableRow><TableCell>셀</TableCell></TableRow></TableBody></Table>`,
};

export const kbdDemo: ShowcaseDemo = {
  Demo: function KbdDemo() {
    return (
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    );
  },
  code: `import { Kbd, KbdGroup } from "@unikit-bridge/ui";

<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>`,
};

export const aspectRatioDemo: ShowcaseDemo = {
  Demo: function AspectRatioDemo() {
    return (
      <AspectRatio ratio={2} className="w-40 overflow-hidden rounded-md">
        <View className="flex h-full w-full items-center justify-center bg-muted">
          <Text className="font-sans text-sm text-muted-foreground">2:1</Text>
        </View>
      </AspectRatio>
    );
  },
  code: `import { AspectRatio } from "@unikit-bridge/ui";

<AspectRatio ratio={16 / 9}>...</AspectRatio>`,
};

export const itemDemo: ShowcaseDemo = {
  Demo: function ItemDemo() {
    return (
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Star className="size-4 text-muted-foreground" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>즐겨찾기</ItemTitle>
          <ItemDescription>UniKit 프로젝트</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            열기
          </Button>
        </ItemActions>
      </Item>
    );
  },
  code: `import { Item, ItemTitle, ItemContent } from "@unikit-bridge/ui";

<Item><ItemContent><ItemTitle>항목</ItemTitle></ItemContent></Item>`,
};

export const buttonGroupDemo: ShowcaseDemo = {
  Demo: function ButtonGroupDemo() {
    return (
      <ButtonGroup>
        <Button variant="outline">편집</Button>
        <Button variant="outline">복제</Button>
        <Button variant="outline">삭제</Button>
      </ButtonGroup>
    );
  },
  code: `import { ButtonGroup, Button } from "@unikit-bridge/ui";

<ButtonGroup><Button variant="outline">편집</Button></ButtonGroup>`,
};

export const fieldDemo: ShowcaseDemo = {
  Demo: function FieldDemo() {
    return (
      <Field>
        <FieldContent>
          <FieldLabel nativeID="demo-field">팀 이름</FieldLabel>
          <Input accessibilityLabelledBy="demo-field" placeholder="유니키팀" />
          <FieldDescription>언제든 바꿀 수 있어요.</FieldDescription>
        </FieldContent>
      </Field>
    );
  },
  code: `import { Field, FieldLabel, FieldDescription } from "@unikit-bridge/ui";

<Field><FieldLabel>라벨</FieldLabel></Field>`,
};
