"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  UnikitThemeProvider,
  useUnikitTheme,
} from "@unikit-bridge/ui";

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
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link
        href="/"
        className="site-display site-focusable text-lg font-semibold tracking-tight text-foreground"
      >
        UniKit
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link
          href="/showcase"
          className="site-focusable text-muted-foreground transition-colors hover:text-foreground"
        >
          Showcase
        </Link>
        <a
          href="https://github.com/loopy-lim/UniKit"
          className="site-focusable hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}

function HeroStage() {
  return (
    <div
      aria-hidden="true"
      inert
      className="site-stage-band pointer-events-none w-full"
      style={{ minHeight: "42vh" }}
    >
      <div className="mx-auto flex h-full max-w-5xl flex-col justify-center gap-5 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>zinc</Badge>
          <Badge variant="secondary">web + native</Badge>
          <Badge variant="outline">@unikit-bridge/ui</Badge>
        </div>
        <div className="max-w-md">
          <Tabs defaultValue="web">
            <TabsList>
              <TabsTrigger value="web">Web</TabsTrigger>
              <TabsTrigger value="native">Native</TabsTrigger>
            </TabsList>
            <TabsContent value="web" className="mt-3">
              <Card>
                <CardHeader>
                  <CardTitle>동일 className</CardTitle>
                  <CardDescription>
                    DOM 브리지가 div·button에 같은 토큰을 얹습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-row flex-wrap gap-2">
                    <Button size="sm">Primary</Button>
                    <Button size="sm" variant="outline">
                      Outline
                    </Button>
                    <Button size="sm" variant="ghost">
                      Ghost
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="native" className="mt-3">
              <Card>
                <CardHeader>
                  <CardTitle>동일 소스</CardTitle>
                  <CardDescription>
                    RN 브리지 + uniwind가 같은 문자열을 해석합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-row flex-wrap gap-2">
                    <Button size="sm">Primary</Button>
                    <Button size="sm" variant="secondary">
                      Secondary
                    </Button>
                    <Button size="sm" variant="destructive">
                      Destructive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="pb-0 pt-6 sm:pt-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="site-fade-up site-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl">
          UniKit
        </p>
        <h1 className="site-fade-up mt-4 max-w-3xl text-xl leading-snug font-medium tracking-tight text-muted-foreground sm:text-2xl md:text-3xl">
          한 import로, 웹과 네이티브가 같은 화면.
        </h1>
        <p className="site-fade-up-delay mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          shadcn 형태·zinc 토큰·브리지 프리미티브. React와 React Native에서 같은
          컴포넌트를 씁니다.
        </p>
        <div className="site-fade-up-delay mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/showcase"
            className="site-focusable inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            쇼케이스 보기
          </Link>
          <a
            href="#install"
            className="site-focusable inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            설치 방법
          </a>
        </div>
      </div>
      <div className="site-fade-up-delay mt-10">
        <HeroStage />
      </div>
    </section>
  );
}

function ValueSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="site-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        한 벌 소스, 두 플랫폼.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        <code className="site-mono text-[0.95em]">
          import {"{ Button }"} from &quot;@unikit-bridge/ui&quot;
        </code>{" "}
        한 줄이면 Expo와 Next가 같은 className·같은 CSS 변수 토큰으로 렌더합니다.
        플랫폼 분기 파일 없이 브리지가 갈라 줍니다.
      </p>
    </section>
  );
}

function LiveDemo() {
  const [name, setName] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setSuccess(null);
      setError("이름을 입력해 주세요.");
      return;
    }
    setError(null);
    setSuccess(notify ? `준비됨 — ${trimmed}` : `준비됨 — ${trimmed} (알림 끔)`);
  }

  return (
    <section className="site-band py-16 sm:py-20">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="min-w-0">
          <h2 className="site-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            실제 컴포넌트로 만져 보기
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            아래는 목업이 아닙니다. `@unikit-bridge/ui`의 Field·Input·Switch·Button이
            그대로 동작합니다.
          </p>
          <pre className="site-mono mt-6 max-w-full overflow-x-auto rounded-md border border-border bg-background p-4 text-xs leading-relaxed break-words whitespace-pre-wrap text-foreground">
            {`import { Button, Field, Input } from "@unikit-bridge/ui"

<Field>
  <FieldLabel>이름</FieldLabel>
  <Input value={name} onChangeText={setName} />
</Field>`}
          </pre>
        </div>

        <Card className="min-w-0 w-full bg-background">
          <CardHeader>
            <CardTitle>프로젝트 이름</CardTitle>
            <CardDescription>빈 제출과 성공 피드백을 확인해 보세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field invalid={Boolean(error)}>
              <FieldLabel>이름</FieldLabel>
              <Input
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (error) setError(null);
                  if (success) setSuccess(null);
                }}
                placeholder="예: Orbit"
                />
              {error ? (
                <FieldError>{error}</FieldError>
              ) : success ? (
                <FieldDescription>{success}</FieldDescription>
              ) : (
                <FieldDescription>쇼케이스에 쓸 짧은 이름</FieldDescription>
              )}
            </Field>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">알림 받기</span>
              <Switch
                checked={notify}
                onCheckedChange={setNotify}
                accessibilityLabel="알림 받기"
              />
            </div>

            <CardFooter className="px-0 pt-2">
              <Button className="site-focusable" onPress={onSubmit}>
                만들기
              </Button>
            </CardFooter>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function InstallSection() {
  return (
    <section id="install" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="site-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        설치
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        npm 패키지로 쓰거나, shadcn CLI로 소스를 프로젝트에 복사할 수 있습니다.
      </p>
      <div className="mt-8 space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">npm</p>
          <pre className="site-mono overflow-x-auto rounded-md border border-border bg-muted/40 p-4 text-xs text-foreground">
            bun add @unikit-bridge/ui class-variance-authority clsx tailwind-merge
          </pre>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">shadcn registry</p>
          <pre className="site-mono overflow-x-auto rounded-md border border-border bg-muted/40 p-4 text-xs text-foreground">
            bunx shadcn@latest add https://ui.unikit.ll3.kr/r/button.json -y
          </pre>
        </div>
      </div>
    </section>
  );
}

function TeaserSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="site-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          28종 카탈로그
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          61종 카탈로그·컴포넌트별 Preview/Code를 쇼케이스에서 바로 확인할 수
          있습니다.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="sm">Button</Button>
          <Badge>Badge</Badge>
          <Badge variant="outline">Tabs</Badge>
          <Badge variant="secondary">Alert</Badge>
        </div>
        <div className="mt-8">
          <Link
            href="/showcase"
            className="site-focusable text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            전체 쇼케이스 열기 →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10">
      <p className="mx-auto max-w-5xl px-4 text-center text-xs text-muted-foreground sm:px-6">
        UniKit v0.2 · React · React Native · shadcn-shaped
      </p>
    </footer>
  );
}

export function LandingPage() {
  return (
    <UnikitThemeProvider>
      <div className="site-canvas">
        <SiteNav />
        <main>
          <Hero />
          <ValueSection />
          <LiveDemo />
          <InstallSection />
          <TeaserSection />
        </main>
        <Footer />
      </div>
    </UnikitThemeProvider>
  );
}
