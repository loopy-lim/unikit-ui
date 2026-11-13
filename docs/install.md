# 내 프로젝트에 UniKit 추가하기

**한국어** · [English](install.en.md)

두 가지 방법이 있어요. **방법 1(npm 설치)**이 가장 간단하고, **방법 2(소스 복사)**는 shadcn/ui 방식대로 컴포넌트 코드를 가져와 자유롭게 고치는 방법이에요. 어느 쪽이든 디자인 토큰 설정은 같아요.

컴포넌트별 Props·변형은 [components.md](components.md), npm 패키지 개요(영어)는 [packages/unikit/README.md](../packages/unikit/README.md)를 보세요.

## 방법 1 — npm 패키지로 설치

```bash
bun add @unikit-bridge/ui class-variance-authority clsx tailwind-merge
```

아이콘 peer도 플랫폼에 맞게 추가해요(브리지가 감싸므로 컴포넌트 코드는 그대로예요):

```bash
# 웹
bun add lucide-react
# 네이티브(Expo 등)
bun add lucide-react-native
```

그다음 내 앱의 스타일링 엔진 쪽을 준비해요.

- **웹(Next.js 등)** — Tailwind CSS v4가 설정된 프로젝트면 돼요(create-next-app 기본). 전역 CSS(예: `app/globals.css`)에 아래를 추가하고:

  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  @custom-variant web (&:where(:root, :root *));   /* UniKit의 web: 접두 클래스 활성화 */
  @source '../node_modules/@unikit-bridge/ui/src'; /* 패키지 내부의 클래스 문자열 스캔 */
  ```

  토큰 값 20종(`:root`/`.dark` 블록)은 아래 방법 2의 **토큰 받기** 절과 같은 방식(`theme` 항목 add 한 줄)으로 받아요. Next.js라면 `next.config.ts`에 패키지 컴파일 설정 한 줄도 필요해요(방법 2 3단계 (a)와 동일).

- **네이티브(Expo)** — `bun add uniwind react-native` 후 Metro 설정(`withUniwindConfig`)과 전역 CSS(`cssEntryFile`)를 등록해요. 실제 동작하는 설정 전체가 궁금하면 데모 앱의 `apps/expo/metro.config.js`·`apps/expo/global.css`를 그대로 참고하세요.

사용 예:

```tsx
"use client";

import { UnikitThemeProvider, Button, Card, CardContent } from "@unikit-bridge/ui";

export default function Home() {
  return (
    <UnikitThemeProvider defaultColorScheme="light">
      <Card>
        <CardContent className="gap-2">
          <Button variant="default">기본 버튼</Button>
          <Button variant="outline" size="sm">외곽선 버튼</Button>
        </CardContent>
      </Card>
    </UnikitThemeProvider>
  );
}
```

> **게시분 참고** — npm `@unikit-bridge/ui` 0.2.0은 1차 28종 시점이에요. 저장소의 61종 상태는 다음 게시까지 아래 방법 2(레지스트리 복사)로 쓸 수 있어요.

## 방법 2 — shadcn CLI로 소스 복사

공개 레지스트리 기준 URL은 <https://ui.ll3.kr/r/> 예요(카탈로그: [registry.json](https://ui.ll3.kr/r/registry.json)). UniKit을 고치면서 로컬 서버를 쓸 때는 `http://localhost:3000/r/`로 바꾸면 돼요.

복사되는 것: 컴포넌트 소스 1개(`components/unikit/<이름>.tsx`)와 자동 설치되는 의존성이에요. 의존성은 컴포넌트마다 최소화되어 있어요 — 공통 `@unikit-bridge/ui`, 필요한 것만 추가(cva·clsx·tailwind-merge·tailwindcss — button은 5종 전부, dialog는 패키지뿐). `form`은 선택 의존 `react-hook-form`, `chart`는 `react-native-svg`를 peer로 안내해요. 복사본의 `cn` import는 내 프로젝트 경로(`@/lib/utils`)로, 브리지 프리미티브 import는 npm 패키지(`@unikit-bridge/ui/primitives`)로 해석돼요.

### 1단계 — Next.js 프로젝트 준비

새 프로젝트를 만들고 shadcn을 초기화해요. 프로젝트 이름은 예시로 `my-unikit-app`을 쓸게요:

```bash
bunx create-next-app@latest my-unikit-app --ts --tailwind --app --import-alias "@/*" --use-bun --yes --disable-git
cd my-unikit-app
bunx shadcn@latest init -b base -p nova -y
```

> shadcn CLI 4.23에서는 `-b base`(기본 색)와 `-p nova`(프리셋)를 함께 지정해야 대화형 질문 없이 진행돼요. 프리셋을 지정하지 않으면 선택을 기다리며 멈추니 주의하세요.

> create-next-app이 만드는 Tailwind CSS v4 환경을 그대로 써요 — 버전을 내리거나 별도 설정 파일을 만들 필요가 없어요.

### 2단계 — UniKit 레지스트리에서 컴포넌트 가져오기

소비자 프로젝트에서 컴포넌트를 추가해요. 하나씩:

```bash
bunx shadcn@latest add https://ui.ll3.kr/r/button.json -y
```

한 번에 여러 종:

```bash
bunx shadcn@latest add https://ui.ll3.kr/r/button.json https://ui.ll3.kr/r/card.json https://ui.ll3.kr/r/checkbox.json https://ui.ll3.kr/r/tabs.json https://ui.ll3.kr/r/avatar.json -y
```

등록된 아이템 67종(UI 61 + utils 1 + theme 4 + animations 1) 전체 목록은 <https://ui.ll3.kr/r/registry.json> 에서 확인할 수 있어요. `components/unikit/`에 소스가 복사되고 의존성이 자동으로 설치돼요.

> **로컬 레지스트리** — UniKit 저장소를 고치는 중이면 `cd apps/web && bun x next dev -p 3000` 후 URL만 `http://localhost:3000/r/...`로 바꿔요.

> **shadcn CLI 4.23 동작 참고** 두 가지:
> - `lib/utils.ts`는 CLI가 특수 취급해요. `add`가 `lib/utils.ts`를 "이미 존재한다"며 건너뛰는 출력이 나오는데, init이 만든 표준 cn(`export { cn } from "cn"`)이 그대로 쓰인다는 뜻이에요. UniKit 컴포넌트가 쓰는 `cn`과 기능이 같으니 그대로 두면 됩니다.
> - 복사된 컴포넌트 파일에서 원본 소스의 앞부분 주석은 CLI가 제거해요. 기능에는 영향이 없어요.

### 3단계 — 소비자 프로젝트 필수 설정

복사만으로는 빌드가 실패해요. 복사 컴포넌트가 npm 패키지 `@unikit-bridge/ui`의 브리지를 쓰므로, 내 프로젝트에 맞는 설정 3가지를 추가해야 해요. **이 단계를 빠뜨리는 것이 빌드 실패의 가장 흔한 원인**이에요.

**(a) Next.js가 패키지를 컴파일하도록** — `@unikit-bridge/ui`는 TypeScript 소스로 배포돼서 Next가 직접 컴파일하게 해야 해요. `next.config.ts`를 통째로 다음으로 바꿔도 됩니다(원본: UniKit의 `apps/web/next.config.ts`):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @unikit-bridge/ui는 TS 소스 배포 — Next가 직접 컴파일한다.
  transpilePackages: ["@unikit-bridge/ui"],
};

export default nextConfig;
```

(웹 번들에는 react-native가 아예 들어오지 않아요 — 브리지가 DOM으로 렌더링하므로 react-native 별칭·트랜스파일 설정은 더 이상 불필요해요.)

**(b) 전역 CSS 두 줄** — `app/globals.css`에 추가해요:

```css
@custom-variant dark (&:where(.dark, .dark *));  /* shadcn init이 이미 넣었으면 생략 */
@custom-variant web (&:where(:root, :root *));   /* UniKit의 web: 접두 클래스 활성화 */
@source '../node_modules/@unikit-bridge/ui/src'; /* 브리지 프리미티브 내부 클래스 스캔 */
```

- `web:` 변형 — UniKit 컴포넌트의 웹 전용 효과(그림자·전환 등)는 `web:shadow-*`처럼 접두가 붙어요. 이 줄이 있어야 웹에서 활성화돼요(네이티브는 uniwind가 같은 접두를 처리해요).
- `@source` — 복사한 파일이 아니라 **패키지 내부**(브리지 프리미티브의 기본 클래스)에 있는 클래스 문자열도 Tailwind가 생성하도록 스캔 대상에 넣는 줄이에요.

**(c) 토큰 받기** — 복사·붙여넣기 대신 레지스트리에서 **한 줄**로 받아요:

```bash
bunx shadcn@latest add https://ui.ll3.kr/r/theme.json -y
```

`app/globals.css`의 `:root`(라이트)와 `.dark`(다크) 블록에 UniKit 디자인 토큰 20종(색 19 + radius)이 자동으로 주입돼요. 이때 CLI가 값을 `hsl(...)` 함수 형태로 감싸 넣기도 하는데, 값 자체는 UniKit 토큰과 동일해요. 토큰별 값이 궁금하면 [packages/unikit/docs/tokens.md](../packages/unikit/docs/tokens.md)를 보세요. `<html>` 등 조상 요소에 `dark` 클래스를 붙이면 전체 토큰이 다크 값으로 전환돼요.

오버레이 등장 애니메이션(웹)이 필요하면 같은 방식으로 `animations` 항목도 받을 수 있어요. `dialog`·`sheet`·`popover`·`drawer`·`alert-dialog`는 레지스트리 의존으로 자동 포함돼요:

```bash
bunx shadcn@latest add https://ui.ll3.kr/r/animations.json -y
```

**프리셋 테마 선택** — 기본(zinc) 대신 미리 준비된 색 조합을 쓰고 싶으면, 같은 방식으로 해당 항목을 add하면 돼요(주색과 중립 계열이 바뀌고, 나머지 구조·토큰 이름은 동일):

| 테마 | 인상 | 설치(한 줄) |
|---|---|---|
| `theme` (기본 zinc) | 무채색·차분 | `bunx shadcn@latest add https://ui.ll3.kr/r/theme.json -y` |
| `theme-blue` | 파란 주색 + slate 중립 | `bunx shadcn@latest add https://ui.ll3.kr/r/theme-blue.json -y` |
| `theme-emerald` | 초록 주색 + zinc 중립 | `bunx shadcn@latest add https://ui.ll3.kr/r/theme-emerald.json -y` |
| `theme-amber` | 주황 주색 + stone 중립 | `bunx shadcn@latest add https://ui.ll3.kr/r/theme-amber.json -y` |

**재적용·교체** — 이미 토큰을 받은 프로젝트에서:

- **다른 프리셋으로 바꾸기**: 위 표에서 원하는 항목을 한 번 더 add하면 돼요. 기존 20개 값이 **그 자리에서 교체**돼요(이전 프리셋 값이 남지 않고, 블록이 늘어나지도 않아요 — 실증됨).
- **같은 프리셋 재실행**: 값을 고친 뒤 다시 add하면 최신 값으로 갱신돼요. 변경이 없으면 파일이 그대로 유지돼요(멱등 — 실증됨).

각 프리셋의 핵심 대비비(WCAG ≥4.5:1 검증)는 [토큰 카탈로그](../packages/unikit/docs/tokens.md)의 프리셋 절에서 기계 검증돼요.

### 4단계 — 사용해 보기

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

둘 다 오류 없이 끝나면 성공이에요. `"use client"` 지시문이 페이지에 필요해요(컴포넌트가 ref·상태를 다루는 클라이언트 컴포넌트라서요).
