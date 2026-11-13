"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Star } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
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
  Progress,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useUnikitTheme,
} from "@unikit-bridge/ui";
import { SiteBrand, UnikitMark } from "./brand";
import { ThemeCustomizer } from "./site-theme";
import { CommandSearchTrigger } from "../showcase/command-search";

/** Hero·TeaserSection 공통 CTA 링크 클래스 — 문자열이 같아 상수로 공유(한쪽만 고치면 외관이 갈라진다) */
const CTA_PRIMARY_CLASS =
  "site-focusable inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90";
const CTA_SECONDARY_CLASS =
  "site-focusable inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent";

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  return (
    <Button
      variant="outline"
      size="sm"
      onPress={toggleColorScheme}
      accessibilityLabel="색 테마 전환"
      className="site-focusable"
    >
      {colorScheme === "light" ? "다크" : "라이트"}
    </Button>
  );
}

function SiteNav() {
  return (
    <header className="border-b border-border/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <SiteBrand />
        <nav className="flex items-center gap-2.5 text-sm sm:gap-3">
          <Link
            href="/blocks"
            className="site-focusable text-muted-foreground transition-colors hover:text-foreground"
          >
            Blocks
          </Link>
          <Link
            href="/components"
            className="site-focusable text-muted-foreground transition-colors hover:text-foreground"
          >
            Components
          </Link>
          <a
            href="https://github.com/loopy-lim/UniKit"
            className="site-focusable hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <CommandSearchTrigger />
          <ThemeCustomizer />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-border/60 py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-5">
          <UnikitMark
            size={96}
            className="size-16 sm:size-20 md:size-24"
          />
          <p className="site-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl">
            UniKit
          </p>
        </div>
        <h1 className="mt-4 max-w-3xl text-xl font-medium leading-snug tracking-tight text-foreground sm:text-2xl md:text-3xl">
          한 import로, 웹과 네이티브가 같은 화면.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          React와 React Native에서 같은 컴포넌트, 같은 모습.
          shadcn 형태와 zinc 토큰, 브리지 프리미티브를 제공합니다.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/components" className={CTA_PRIMARY_CLASS}>
            컴포넌트 보기
          </Link>
          <a href="#install" className={CTA_SECONDARY_CLASS}>
            설치 방법
          </a>
        </div>
      </div>
    </section>
  );
}

function ValueSection() {
  return (
    <section className="border-b border-border/60 py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="site-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          한 벌 소스, 두 플랫폼
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          <code className="site-mono text-[0.95em]">
            import {"{ Button }"} from &quot;@unikit-bridge/ui&quot;
          </code>{" "}
          한 줄이면 Expo와 Next가 같은 className과 같은 CSS 변수 토큰으로 렌더합니다.
          플랫폼 분기 파일 없이 브리지가 자동으로 연결합니다.
        </p>
      </div>
    </section>
  );
}

function InstallSection() {
  return (
    <section id="install" className="scroll-mt-20 border-b border-border/60 py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="site-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          설치
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          npm 패키지로 쓰거나, shadcn CLI로 소스를 프로젝트에 복사할 수 있습니다.
        </p>
        <div className="mt-8 max-w-3xl space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">npm</p>
            <pre className="site-mono overflow-x-auto rounded-md border border-border bg-muted p-4 text-xs text-foreground">
              bun add @unikit-bridge/ui class-variance-authority clsx tailwind-merge
            </pre>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">shadcn registry</p>
            <pre className="site-mono overflow-x-auto rounded-md border border-border bg-muted p-4 text-xs text-foreground">
              bunx shadcn@latest add https://ui.ll3.kr/r/button.json -y
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 라이브 미리보기 장면 카드 — 라벨 칩 + 실제 컴포넌트 구성(정적 링크 아님, 조작 가능) */
function PreviewScene({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="site-card rounded-xl border border-border bg-background p-5 hover:border-foreground/25">
      <div className="mb-4 flex">
        <Badge variant="outline">{label}</Badge>
      </div>
      <div className="flex min-h-32 flex-col justify-center gap-4">{children}</div>
    </div>
  );
}

function TeaserSection() {
  return (
    <section className="py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="site-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          컴포넌트 61종
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          버튼, 카드, 다이얼로그부터 폼 입력, 차트까지 — 웹과 React Native에서 검증된 61종 컴포넌트예요. 아래는 전부 실제 컴포넌트예요. 눌러 보세요.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <PreviewScene label="폼">
            <Field>
              <FieldContent>
                <FieldLabel nativeID="landing-team">팀 이름</FieldLabel>
                <Input
                  accessibilityLabelledBy="landing-team"
                  placeholder="예: 유니키팀"
                />
                <FieldDescription>입력하면 바로 팀이 만들어져요.</FieldDescription>
              </FieldContent>
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Switch defaultChecked accessibilityLabel="초대 알림 받기" />
                <span className="text-sm text-foreground">초대 알림 받기</span>
              </div>
              <Button size="sm">팀 만들기</Button>
            </div>
          </PreviewScene>
          <PreviewScene label="상태·피드백">
            <Alert>
              <AlertTitle>저장 완료</AlertTitle>
              <AlertDescription>
                변경사항이 두 플랫폼에서 같은 모습으로 저장돼요.
              </AlertDescription>
            </Alert>
            <Progress value={72} accessibilityLabel="배포 진행률" />
            <div className="flex flex-wrap items-center gap-2">
              <Badge>신규</Badge>
              <Badge variant="secondary">베타</Badge>
              <Badge variant="outline">안정</Badge>
            </div>
          </PreviewScene>
          <PreviewScene label="탐색">
            <Tabs defaultValue="account">
              <TabsList variant="line">
                <TabsTrigger value="account">계정</TabsTrigger>
                <TabsTrigger value="security">보안</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <span className="text-sm text-foreground">
                  탭을 눌러 내용을 바꿔 보세요.
                </span>
              </TabsContent>
              <TabsContent value="security">
                <span className="text-sm text-foreground">
                  같은 소스로 웹·앱 모두 전환돼요.
                </span>
              </TabsContent>
            </Tabs>
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
          </PreviewScene>
          <PreviewScene label="목록·프로필">
            <Item variant="outline">
              <ItemMedia variant="icon">
                <Star className="size-4 text-muted-foreground" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>즐겨찾는 프로젝트</ItemTitle>
                <ItemDescription>어디서나 같은 모습으로 열려요.</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm">
                  열기
                </Button>
              </ItemActions>
            </Item>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AvatarGroup>
                <Avatar>
                  <AvatarFallback>홍</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>이</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>박</AvatarFallback>
                </Avatar>
                <AvatarGroupCount>+5</AvatarGroupCount>
              </AvatarGroup>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </div>
          </PreviewScene>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/components" className={CTA_PRIMARY_CLASS}>
            전체 컴포넌트 보기
          </Link>
          <Link href="/blocks" className={CTA_SECONDARY_CLASS}>
            블록 데모 보기
          </Link>
          <Link href="/components/kitchen-sink" className={CTA_SECONDARY_CLASS}>
            한 페이지 전체 데모
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        UniKit v0.3 — React, React Native, shadcn-shaped
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="site-canvas">
      <SiteNav />
      <main>
        <Hero />
        <ValueSection />
        <InstallSection />
        <TeaserSection />
      </main>
      <Footer />
    </div>
  );
}
