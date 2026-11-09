# UniKit

> "HeroUI처럼 한개의 import로 react, react-native에서 두개 같이 보이게 만들고 싶어.
> 형태는 shad/cn 처럼 이루어지게 하면 좋을꺼 같아." — 이 프로젝트의 원 요청

UniKit은 **import 문 하나로 React(웹)와 React Native 양쪽에서 똑같이 보이는** UI 컴포넌트 모음이에요.

- **단일 소스·단일 import** — 컴포넌트는 React Native 프리미티브(`View`/`Text`/`Pressable`/`TextInput`)와 NativeWind의 `className`으로만 작성돼요. 플랫폼 분기(`.web.tsx` 등)는 없고, 웹에서는 react-native-web이 같은 소스를 렌더링해요. 모노레포 안에서는 `import { Button } from "@unikit/core"` 하나면 Expo 앱과 Next.js 앱 양쪽에서 동작합니다.
- **같은 모습** — 색·테두리·간격이 모두 CSS 변수 토큰(zinc 계열, 라이트/다크)으로 정의되어 있어 두 플랫폼에서 동일한 디자인이 나와요.
- **shadcn/ui 형태 배포** — npm 패키지로 배포하는 대신, shadcn CLI로 **컴포넌트 소스를 내 프로젝트로 복사**해서 쓰는 형태예요. 복사한 코드는 내 것이 되니 자유롭게 고칠 수 있고, `cn`(clsx + tailwind-merge)·`class-variance-authority`(cva)·CSS 변수 토큰 패턴은 shadcn/ui 표준을 따릅니다.
- **v0.1 컴포넌트 5종** — Button, Card, Input, Label, Badge (+ cn 유틸). 변형·접근성 명세는 [docs/components.md](docs/components.md)에 있어요.

처음 개발하는 분을 위해 모든 안내를 한글로 작성했어요. 이 README의 모든 명령은 실제로 실행해서 성공하는 것을 확인한 것뿐이에요.

## 필요한 것

- [bun](https://bun.sh) 1.4.4 이상 (이 저장소는 bun 워크스페이스로 구성되어 있어요. 실측 환경: bun 1.4.4, Linux)

## 빠른 시작

저장소를 받은 위치(이 README가 있는 폴더)에서 시작해요. 아래 명령은 모두 **저장소 루트에서** 실행합니다(`cd` 명령이 있는 줄은 해당 폴더로 이동한 뒤 실행).

### 1. 의존성 설치와 타입 검사

```bash
bun install
bun run --filter '*' typecheck
```

- `bun install` — 워크스페이스 3개(`apps/expo`, `apps/web`, `packages/unikit`)의 의존성을 한 번에 설치해요.
- `bun run --filter '*' typecheck` — 세 패키지 모두에서 TypeScript 검사(`tsc --noEmit`)를 돌려요. 오류 없이 "Exited with code 0"가 3번 나오면 성공이에요.

### 2. 쇼케이스 화면 확인

UniKit에는 같은 화면을 보여주는 데모 앱이 두 개 있어요. 둘 다 띄워 보고 같은 모습인지 비교해 보세요.

**Expo 앱(웹 번들로 확인)** — 정적으로 내보내기한 뒤 로컬 서버로 띄워요:

```bash
cd apps/expo && bun x expo export --platform web
```

내보내기가 끝나면(`Exported: dist` 메시지) **저장소 루트로 돌아와서** 서버를 띄워요:

```bash
cd ../..
bunx serve apps/expo/dist -l 8081
```

> **주의**: `serve`는 반드시 **저장소 루트에서** 실행하세요. `apps/expo` 안에서 실행하면 경로(`apps/expo/dist`)를 찾지 못해 404가 떠요.

브라우저에서 <http://localhost:8081> 을 열면 UniKit 쇼케이스가 보여요. 확인이 끝나면 `Ctrl+C`로 서버를 종료하세요.

**Next.js 앱(개발 서버)**:

```bash
cd apps/web && bun x next dev -p 3000
```

브라우저에서 <http://localhost:3000> 을 열어요. Expo 쪽과 **같은 화면**이 나오는지, 오른쪽 위 토글 버튼("🌙 다크")을 누르면 양쪽 모두 색이 전환되는지 확인해 보세요. 종료는 `Ctrl+C`예요.

**스마트폰 실물에서 확인하고 싶다면** — [docs/expo-go.md](docs/expo-go.md)의 Expo Go 가이드를 따라 하면 실제 기기에서 네이티브 화면을 볼 수 있어요.

## 내 프로젝트에 컴포넌트 추가하기

shadcn CLI로 UniKit 컴포넌트 소스를 내 Next.js 프로젝트로 복사하는 절차예요. UniKit 저장소가 로컬에 있어야 해요(아래 3단계에서 레지스트리 서버를 띄우니까요).

복사되는 것: 컴포넌트 소스 1개(`components/unikit/<이름>.tsx`)와 자동 설치되는 의존성 6종(`class-variance-authority`, `clsx`, `tailwind-merge`, `nativewind`, `react-native`, `react-native-web`)이에요. 복사본의 import는 전부 내 프로젝트 경로(`@/lib/utils`) 또는 npm 패키지로 해석돼요.

### 1단계 — Next.js 프로젝트 준비

새 프로젝트를 만들고 shadcn을 초기화해요. 프로젝트 이름은 예시로 `my-unikit-app`을 쓸게요:

```bash
bunx create-next-app@latest my-unikit-app --ts --tailwind --app --import-alias "@/*" --use-bun --yes --disable-git
cd my-unikit-app
bunx shadcn@latest init -b base -p nova -y
```

> shadcn CLI 4.23에서는 `-b base`(기본 색)와 `-p nova`(프리셋)를 함께 지정해야 대화형 질문 없이 진행돼요. 프리셋을 지정하지 않으면 선택을 기다리며 멈추니 주의하세요.

### 2단계 — Tailwind를 4에서 3.4로 낮추기

최신 create-next-app은 Tailwind 4를 설치하는데, UniKit이 의존하는 NativeWind 4.2는 **Tailwind 3.4계**가 필요해요. 프로젝트 폴더에서:

```bash
bun add -d tailwindcss@^3.4.17 postcss autoprefixer
bun remove @tailwindcss/turbopack
```

그리고 프로젝트 루트에 `postcss.config.js` 파일을 만들어요:

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 3단계 — UniKit 레지스트리에서 컴포넌트 가져오기

**다른 터미널**에서 UniKit 저장소 루트로 이동해 레지스트리 서버를 띄워요:

```bash
cd apps/web && bun x next dev -p 3000
```

서버가 뜨면 브라우저에서 <http://localhost:3000/r/registry.json> 을 열어 카탈로그가 나오는지 확인할 수 있어요.

다시 **소비자 프로젝트 터미널**로 돌아와 컴포넌트를 추가해요. 하나씩 추가해도 되고:

```bash
bunx shadcn@latest add http://localhost:3000/r/button.json -y
```

한 번에 5종을 가져와도 돼요:

```bash
bunx shadcn@latest add http://localhost:3000/r/button.json http://localhost:3000/r/card.json http://localhost:3000/r/input.json http://localhost:3000/r/label.json http://localhost:3000/r/badge.json -y
```

`components/unikit/` 폴더에 소스가 복사되고 의존성이 자동으로 설치돼요. 확인이 끝나면 레지스트리 서버는 `Ctrl+C`로 종료해도 됩니다.

> **shadcn CLI 4.23 동작 참고** 두 가지:
> - `lib/utils.ts`는 CLI가 특수 취급해요. `add`가 `lib/utils.ts`를 "이미 존재한다"며 건너뛰는 출력이 나오는데, init이 만든 표준 cn(`export { cn } from "cn"`)이 그대로 쓰인다는 뜻이에요. UniKit 컴포넌트가 쓰는 `cn`과 기능이 같으니 그대로 두면 됩니다.
> - 복사된 컴포넌트 파일에서 원본 소스의 앞부분 주석은 CLI가 제거해요. 기능에는 영향이 없어요.

### 4단계 — 소비자 프로젝트 필수 설정

복사만으로는 빌드가 실패해요. UniKit 컴포넌트가 React Native 프리미티브 + NativeWind로 작성되어 있어서, 내 프로젝트에 맞는 설정 4가지를 추가해야 해요. **이 단계를 빠뜨리는 것이 빌드 실패의 가장 흔한 원인**이에요.

**(a) NativeWind 타입 보강** — `className` prop을 TypeScript가 알아보게 만들어요.

`tsconfig.json`의 `compilerOptions`에 한 줄을 추가하고:

```json
"jsxImportSource": "nativewind",
```

(`"jsx": "react-jsx"`는 create-next-app이 이미 만들어 두니 **건드리지 마세요** — 같이 넣으면 JSON에 같은 키가 두 번 생겨 깨져요.)

프로젝트 루트에 `nativewind-env.d.ts` 파일을 만들어요:

```ts
/// <reference types="nativewind/types" />
```

**(b) react-native → react-native-web 별칭 + 트랜스파일 설정** — 웹 번들에서 React Native를 react-native-web으로 치환해요. `next.config.ts`를 통째로 다음으로 바꿔도 됩니다(원본: UniKit의 `apps/web/next.config.ts`):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // UniKit 컴포넌트는 RN 프리미티브 + nativewind로 작성되므로 번들러가 함께 트랜스파일해야 해요.
  transpilePackages: [
    "nativewind",
    "react-native-css-interop",
    "react-native",
    "react-native-web",
  ],
  // 웹 번들에서 react-native를 react-native-web으로 치환(RNW 표준 설정).
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
    },
  },
};

export default nextConfig;
```

**(c) Tailwind 3.4 설정 파일** — `tailwind.config.js`를 프로젝트 루트에 새로 만들어요(NativeWind 프리셋 + UniKit 토큰 매핑. 원본: UniKit의 `apps/web/tailwind.config.js`):

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
```

**(d) 토큰 CSS 변수** — 복사·붙여넣기 대신 레지스트리에서 **한 줄**로 받아요. **3단계에서 띄운 레지스트리 서버(3000 포트)가 아직 실행 중이어야 해요.** 소비자 프로젝트 터미널에서:

```bash
bunx shadcn@latest add http://localhost:3000/r/theme.json -y
```

`app/globals.css`의 `:root`(라이트)와 `.dark`(다크) 블록에 UniKit 디자인 토큰 20종(색 19 + radius)이 자동으로 주입돼요. 이때 CLI가 값을 `hsl(...)` 함수 형태로 감싸 넣기도 하는데, 값 자체는 UniKit 토큰과 동일해요. 토큰별 값이 궁금하면 [packages/unikit/docs/tokens.md](packages/unikit/docs/tokens.md)를 보세요. `<html>` 등 조상 요소에 `dark` 클래스를 붙이면 전체 토큰이 다크 값으로 전환돼요.

**프리셋 테마 선택** — 기본(zinc) 대신 미리 준비된 색 조합을 쓰고 싶으면, 같은 방식으로 해당 항목을 add하면 돼요(주색과 중립 계열이 바뀌고, 나머지 구조·토큰 이름은 동일):

| 테마 | 인상 | 설치(한 줄) |
|---|---|---|
| `theme` (기본 zinc) | 무채색·차분 | `bunx shadcn@latest add http://localhost:3000/r/theme.json -y` |
| `theme-blue` | 파란 주색 + slate 중립 | `bunx shadcn@latest add http://localhost:3000/r/theme-blue.json -y` |
| `theme-emerald` | 초록 주색 + zinc 중립 | `bunx shadcn@latest add http://localhost:3000/r/theme-emerald.json -y` |
| `theme-amber` | 주황 주색 + stone 중립 | `bunx shadcn@latest add http://localhost:3000/r/theme-amber.json -y` |

**재적용·교체** — 이미 토큰을 받은 프로젝트에서:

- **다른 프리셋으로 바꾸기**: 위 표에서 원하는 항목을 한 번 더 add하면 돼요. 기존 20개 값이 **그 자리에서 교체**돼요(이전 프리셋 값이 남지 않고, 블록이 늘어나지도 않아요 — 실증됨).
- **같은 프리셋 재실행**: 값을 고친 뒤 다시 add하면 최신 값으로 갱신돼요. 변경이 없으면 파일이 그대로 유지돼요(멱등 — 실증됨).

각 프리셋의 핵심 대비비(WCAG ≥4.5:1 검증)는 [토큰 카탈로그](packages/unikit/docs/tokens.md)의 프리셋 절에서 기계 검증돼요.

### 5단계 — 사용해 보기

페이지에서 복사한 컴포넌트를 가져다 써 보세요. import 경로만 내 프로젝트 경로(`@/components/unikit/...`)로 바꾸면 UniKit 데모 앱과 똑같이 동작해요:

```tsx
// app/page.tsx
"use client";

import { Button } from "@/components/unikit/button";
import { Badge } from "@/components/unikit/badge";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <Button variant="default" size="default">기본 버튼</Button>
      <Button variant="outline" size="sm" className="mt-4">외곽선 버튼</Button>
      <Badge variant="secondary" className="mt-4">보조 배지</Badge>
    </main>
  );
}
```

설정이 잘 됐는지 확인하려면:

```bash
bun x tsc --noEmit
bun run build
```

둘 다 오류 없이 끝나면 성공이에요. `"use client"` 지시문이 페이지에 필요해요(NativeWind는 서버 컴포넌트를 지원하지 않아요). 컴포넌트별 props·변형·접근성 동작은 [docs/components.md](docs/components.md)를 참고하세요.

## UniKit에 새 컴포넌트 추가하기 (저장소 기여)

UniKit 자체에 컴포넌트를 추가할 때는 **소스가 두 벌**이라는 점을 기억하세요. 모노레포용(`src/`)과 소비자 복사용(`registry/`) 트리가 있고, 본문 차이는 import 문뿐이어야 해요. 절차는 3단계예요:

1. **`packages/unikit/src/components/`에 컴포넌트 작성** — RN 프리미티브 + `className` + cva + `cn`, 플랫폼 분기 금지. `src/index.ts`에서 export도 추가하세요.
2. **`packages/unikit/registry/ui/`에 복사** — 본문은 그대로 두고 import만 소비자 기준으로 바꿔요: `import { cn } from "../lib/utils"` → `import { cn } from "@/lib/utils"`.
3. **`packages/unikit/registry.json`에 아이템 등록** — `name`·`type: "registry:ui"`·`registryDependencies: ["utils"]`·`dependencies`(nativewind, react-native, react-native-web 등)·`files`(`path` + `target: "components/unikit/<이름>.tsx"`).

토큰(색·radius)을 바꿀 때는 소스가 `packages/unikit/src/theme/tokens.ts` 하나뿐이에요. 값을 고친 뒤 저장소 루트에서:

```bash
bun run generate:design   # 사본 3종(globals.css · registry.json theme 항목 · docs/tokens.md) 재생성
bun run audit:design      # 일관성 기계 검사 8종 — 위반이 있으면 0이 아닌 종료 코드로 실패
```

한 벌만 수정하면 레지스트리 소비 재현 검증에서 바로 드러나니, 항상 두 트리를 같이 고쳐주세요. 쇼케이스(`apps/expo/app/index.tsx`, `apps/web/app/page.tsx`)에 전시하려면 두 앱의 화면도 같이 갱신해요(두 앱은 같은 구성을 보여야 해요).

## 저장소 구조

```text
UniKit/
├── apps/
│   ├── expo/          # @unikit/expo — Expo(SDK 58) 데모 앱. 쇼케이스 화면 + 테마 토글
│   └── web/           # @unikit/web — Next.js 16 데모 앱. 같은 쇼케이스 + 레지스트리 서빙(/r/)
├── packages/
│   └── unikit/        # @unikit/core — 유니버설 컴포넌트 패키지
│       ├── src/       #   모노레포용 소스(components 5종 + cn + 테마 토큰/Provider)
│       ├── registry/  #   소비자 복사용 소스 트리(import가 @/lib/utils 기준)
│       ├── docs/tokens.md  # 생성된 토큰 카탈로그(generate:design 산출)
│       └── registry.json  # shadcn 규격 레지스트리(아이템 10종: utils + 컴포넌트 5종 + theme 4종[기본+프리셋 3])
├── docs/
│   ├── components.md  # 컴포넌트별 사용법·Props·접근성 (한글)
│   ├── expo-go.md     # 스마트폰 Expo Go 실물 확인 가이드 (한글)
│   └── sdd/           # 요구·설계·검증 문서(개발 과정 증거)
├── bun.lock           # bun 잠금파일
└── package.json       # 워크스페이스 루트(workspaces: apps/*, packages/*)
```

두 데모 앱(`apps/expo`, `apps/web`)은 **같은 컴포넌트를 같은 import(`@unikit/core`)로** 렌더링해요. 이것이 "한 개의 import로 양쪽에서 같이 보이게"라는 원 요청의 실증이에요.

## 문서

- [docs/components.md](docs/components.md) — Button·Card·Input·Label·Badge별 import, Props 표, 변형·크기 전체 목록, 접근성 동작, 테마 다루기
- [packages/unikit/docs/tokens.md](packages/unikit/docs/tokens.md) — 디자인 토큰 20종의 값·역할 카탈로그(자동 생성)
- [docs/expo-go.md](docs/expo-go.md) — 내 스마트폰의 Expo Go 앱으로 실물 네이티브 화면을 확인하는 가이드
- [docs/sdd/](docs/sdd/) — 요구 정의·기술 설계·검증 원장 등 개발 과정 문서

## 알려진 한계

- **네이티브 실물 확인** — 이 저장소의 자동 검증은 웹 렌더링(react-native-web)과 네이티브 번들 빌드까지만 가능해요(개발 환경에 에뮬레이터가 없어요). 실물 기기의 화면·테마 전환은 [docs/expo-go.md](docs/expo-go.md)로 직접 확인하세요.
- **v0.1 범위 밖** — npm 배포(`@unikit/*` 퍼블리시), GitHub 공개·CI, 컴포넌트 추가(Dialog·Select 등), 애니메이션은 후속 버전 과제예요.
