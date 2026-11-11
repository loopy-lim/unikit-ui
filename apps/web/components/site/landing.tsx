"use client";

import Link from "next/link";
import {
  Badge,
  Button,
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
    <header className="border-b border-border/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
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
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-border/60 py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="site-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl">
          UniKit
        </p>
        <h1 className="mt-4 max-w-3xl text-xl font-medium leading-snug tracking-tight text-foreground sm:text-2xl md:text-3xl">
          한 import로, 웹과 네이티브가 같은 화면.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          React와 React Native에서 같은 컴포넌트, 같은 모습.
          shadcn 형태와 zinc 토큰, 브리지 프리미티브를 제공합니다.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
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
      </div>
    </section>
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
          버튼, 카드, 다이얼로그부터 폼 입력, 차트까지 — 웹과 React Native에서 검증된 61종 컴포넌트의 프리뷰와 코드를 확인해 보세요.
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
            전체 쇼케이스 보기 →
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
        UniKit v0.2 — React, React Native, shadcn-shaped
      </div>
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
          <InstallSection />
          <TeaserSection />
        </main>
        <Footer />
      </div>
    </UnikitThemeProvider>
  );
}
