"use client";
// Next.js 쇼케이스 페이지(T-8) — docs/sdd/02-design.md v3 §1.2(구성 트리)·§5(카피) 원문 준수.
// Expo 쇼케이스(T-7, apps/expo/app/index.tsx)와 같은 섹션 순서·문구·클래스·간격을 렌더링한다(AC-2).
//
// - "use client" 유지(테마 상태·이벤트 사용 — DOM 브리지 렌더링).
// - 컴포넌트 import는 오직 @unikit-bridge/ui(AC-1). 플랫폼 분기 없음.
// - 테마: page 최상위에서 UnikitThemeProvider로 감싼다 — 웹 브리지가
//   문서 루트의 .dark 클래스를 토글한다(표준 Tailwind dark 변형).
// - SafeAreaView는 Expo 전용 포장(02-design §1.2) — 웹은 min-h-screen 배경 래퍼로 대응.
// - 모든 Text에 명시 색·크기·font-sans(§0.5 — DOM 브리지도 부모 상속에 기대지 않는다).
import { useRef, type ReactNode } from "react";
import {
  Text,
  View,
  type BridgeTextInputRef,
} from "@unikit-bridge/ui/primitives";

import {
  UnikitThemeProvider,
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
} from "@unikit-bridge/ui";

/** 페이지 진입 — Provider 랩 + 쇼케이스 본문 */
export default function Home() {
  return (
    <UnikitThemeProvider>
      <ShowcaseScreen />
    </UnikitThemeProvider>
  );
}

/** 쇼케이스 본문 — 02-design §1.2 트리 그대로. 헤더 → Button → Card → Input·Label → Badge → 푸터 */
function ShowcaseScreen() {
  return (
    // 웹 배경 포장: 전체 뷰포트 높이에 --background 색을 깐다(Expo의 SafeAreaView 포장 대응).
    <View className="min-h-screen bg-background">
      {/* ShowcaseScreen 컨테이너(§1.2): w-full max-w-[640px] mx-auto px-4 pt-8 pb-12 */}
      <View className="w-full max-w-[640px] mx-auto px-4 pt-8 pb-12">
        {/* Header — flex-row items-center justify-between, mb-8 */}
        <Header />

        {/* 섹션 4종 블록: 섹션 사이 간격 space-y-10 = 40px(부모 컨테이너가 관리 — §1.2) */}
        <View className="space-y-10">
          <ButtonSection />
          <CardSection />
          <InputSection />
          <BadgeSection />
        </View>

        {/* Footer — pt-10, text-center */}
        <View className="pt-10">
          <Text className="font-sans text-xs text-muted-foreground text-center">
            UniKit v0.1 · Expo와 Next.js에서 같은 화면을 보고 있어요.
          </Text>
        </View>
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
      title="Button · 버튼"
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
        {/* [크기 4종] 모두 variant="default" — icon 버튼은 텍스트 "+"(아이콘 라이브러리 금지) */}
        <View className="flex flex-row flex-wrap items-center gap-3">
          <Button size="sm">작게</Button>
          <Button size="default">보통</Button>
          <Button size="lg">크게</Button>
          <Button size="icon">+</Button>
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
      title="Card · 카드"
      description="제목·설명·내용·하단을 조합해 정보를 담아요."
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
              색·테두리·배경이 모두 CSS 변수 토큰으로 정의되어 있어, 테마를
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
      title="Input · Label — 입력창"
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
    <Section title="Badge · 배지" description="네 가지 스타일의 배지예요.">
      <View className="flex flex-row flex-wrap gap-2">
        <Badge variant="default">기본</Badge>
        <Badge variant="secondary">보조</Badge>
        <Badge variant="destructive">삭제</Badge>
        <Badge variant="outline">외곽선</Badge>
      </View>
    </Section>
  );
}
