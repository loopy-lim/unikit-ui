# UniKit 기술 설계·태스크 분해 (G1)

- 작성 직군: `System Architect` (role-perspective, 오케스트레이터 컨텍스트에서 작성)
- 날짜: 2026-11-07
- 상태: G1 게이트 평가 대상 **초안** (`Architecture & Plan Reviewer` + `UX/Design Auditor` 검토 전). 본 문서는 관문 판정이 아니며 AC 변경·약화를 포함하지 않는다.
- 입력: `docs/sdd/00-requirements.md`(AC-1~AC-8, 환경 사실), `docs/sdd/01-research.md`(확정 기술 레시피, 버전 실측)
- 환경 전제: 빈 저장소(`git init`은 G2의 T-1에서 실시, **커밋 금지**), 네이티브 에뮬레이터 없음(번들 빌드로 갈음), 브라우저 실행·스크린샷은 호스트 미리보기 도구로 가능. 태스크 완료 기준·검증 명령은 node/bun/bunx/curl/grep으로만 구성한다(미존재 도구 가정 금지).

> **패키지 매니저 변경(2026-11-07, 사용자 결정)**: pnpm → **bun 1.4.4**. 워크스페이스 선언은 루트 `package.json`의 `"workspaces"`(pnpm-workspace.yaml·.npmrc는 삭제), 잠금파일은 `bun.lock`. 치환표: `pnpm install`→`bun install` · `pnpm -r exec tsc --noEmit`→`bun run --filter '*' typecheck`(각 패키지에 `typecheck` 스크립트 등록) · `pnpm --filter <pkg> exec <cmd>`→`cd <pkg경로> && bun x <cmd>` · `npx`→`bunx`. 본문의 pnpm 서술 중 **이미 완료된 태스크(T-1~T-6)의 완료 기준·생성 명령은 당시 이행 이력으로 보존**하고, 이후 실행 분(V-1~V-8, T-10, R 폴백)은 bun 명령으로 기재한다. R-2 실측 2건: ① bun isolated 레이아웃에서도 peer 조합 차이(react 19.3.1↔19.3.0, @types/react 19.2.18↔19.3.0)로 react-native·nativewind 2인스턴스 분할 → `@unikit/core` devDeps를 앱과 동일 해석 버전(react 19.3.0, @types/react ~19.3.0, react-native 0.88.1)으로 정렬해 단일 인스턴스 통일. ② bun isolated는 루트 node_modules가 비어 Expo/Metro·babel의 상향 해석이 실패(`expo export` → Cannot find module 'babel-preset-expo', T-7 실측) → **`bunfig.toml` `[install] linker = "hoisted"`로 전환**(pnpm hoisted 폴백과 동일 역할) — 순정 `bun x expo export --platform web` exit 0 재확인.

## 0. 확정 스택·버전 (01-research §1·§4 재확인, 본 설계에서 변경 없음)

| 항목 | 값 | 비고 |
|---|---|---|
| expo | SDK 58 (58.0.23) | `bunx create-expo-app --template default@sdk-58`(당초 pnpm으로 생성 — 이력) |
| 패키지 매니저 | **bun 1.4.4** | 2026-11-07 사용자 결정으로 전환(당초 pnpm 12.15.0). 워크스페이스는 루트 package.json `workspaces`, 잠금파일 `bun.lock` |
| react-native / expo-router | 0.88.1 / 58.0.30 | 정확한 버전은 `bunx expo install`이 SDK 58에 맞춰 해결 |
| nativewind | 4.2.7 | **5.0.0-rc 금지**(RC — 첫 개발자 부적합) |
| tailwindcss | `^3.4.17` (3.4.x 계열) | **TW4 금지** — nativewind 4.2 정식 경로는 TW3. 토큰 매핑은 `hsl(var(--token))` 방식(`@theme` 아님) |
| react-native-web | 0.21.4 | peer `react/react-dom ^18||^19` → react-dom 19.3.1 호환 |
| next | 16.4.5 | Turbopack 기본. RNW 별칭 리스크 → §5 R-1 폴백(webpack 강제 또는 15.x 하향) |
| shadcn CLI | `npx shadcn@latest` (4.23.0 실측) | registry 규격·`build`·`add <url>` 공식 지원(01-research A-4) |
| 워크스페이스 패키지명 | `@unikit/core`(packages/unikit) · `@unikit/expo` · `@unikit/web` | npm 배포는 v0.1 제외이나 경로·스크립트 참조를 위한 고유명 확정. 디렉터리명은 00-requirements §3 지정대로 유지 |

패키지 소비 방식: `@unikit/core`는 **빌드 산출물 없이 소스(`src/`) 직접 노출**(package.json `exports`가 `./src/index.ts`를 가리킴). Expo(Metro)와 Next(`transpilePackages`) 양 번들러가 워크스페이스 패키지의 TS 소스를 직접 번들하는 공식 모노레포 패턴(01-research §2.1·A-1)을 따른다. 앱 의존성은 `"@unikit/core": "workspace:*"`.

## 1. 모듈 구조

```text
UniKit/
├── package.json                  # 루트: private, 공통 스크립트(typecheck 등)          [T-1]
├── bun.lock                      # bun 잠금파일(2026-11-07 bun 전환 — 당초 pnpm-workspace.yaml·.npmrc·pnpm-lock.yaml은 삭제됨) [T-1]
├── .gitignore                    # node_modules, .expo, .next, dist 등                 [T-1]
├── tsconfig.base.json            # 공통 strict 옵션 — 각 워크스페이스가 extends         [T-1]
├── README.md                     # 한글 메인 문서(빠른 시작·구조·컴포넌트 추가)         [T-12]
├── docs/
│   ├── components.md             # 컴포넌트별 사용법(한글)                             [T-12]
│   ├── expo-go.md                # 사용자 스마트폰 Expo Go 실행 가이드                  [T-12]
│   └── sdd/                      # 기존 SDD 문서(수정 금지 — T-* 경계에서 제외)
├── apps/
│   ├── expo/                     # @unikit/expo — Expo SDK 58 데모(쇼케이스)
│   │   ├── package.json          # expo, expo-router, nativewind, @unikit/core(ws:*)   [T-3]
│   │   ├── app.json              # scheme, plugins:["expo-router"], web.bundler:"metro" [T-3]
│   │   ├── babel.config.js       # jsxImportSource:"nativewind" + nativewind/babel      [T-3]
│   │   ├── metro.config.js       # withNativeWind(input:"./global.css")                [T-3]
│   │   ├── tailwind.config.js    # nativewind/preset + content에 unikit src 포함       [T-3→T-5]
│   │   ├── global.css            # @tailwind base/components/utilities                 [T-3]
│   │   ├── tsconfig.json         # extends 루트 base + expo/tsconfig.base              [T-3]
│   │   ├── nativewind-env.d.ts   # nativewind/types 레퍼런스                           [T-3]
│   │   └── app/
│   │       ├── _layout.tsx       # Router 루트 + global.css import(+Provider 랩: T-5)  [T-3→T-5]
│   │       ├── index.tsx         # 쇼케이스 진입(5종 전시 + 테마 토글)                  [T-7]
│   │       └── showcase/         # 컴포넌트별 쇼케이스 섹션                             [T-7]
│   └── web/                      # @unikit/web — Next.js 16 데모 + 레지스트리 서빙
│       ├── package.json          # next, react-dom, react-native(-web), nativewind,
│       │                         #   @unikit/core(ws:*), shadcn(runtime, /r용)          [T-4]
│       ├── next.config.ts        # transpilePackages + RNW resolveAlias(R-1)           [T-4]
│       ├── tailwind.config.js    # nativewind/preset + content에 unikit src 포함       [T-4→T-5]
│       ├── postcss.config.js     # tailwindcss/postcss                                 [T-4]
│       ├── tsconfig.json         # jsxImportSource:"nativewind"                        [T-4]
│       ├── lib/
│       │   └── registry.ts       # loadRegistry/loadRegistryItem(shadcn 패키지 re-export) [T-9]
│       ├── components/           # 웹 쇼케이스 보조(테마 토글 등)                        [T-8]
│       └── app/
│           ├── layout.tsx        # globals.css import                                  [T-4]
│           ├── globals.css       # @tailwind 3줄(T-4) + :root/.dark 변수 블록(T-5)     [T-4→T-5]
│           ├── page.tsx          # 쇼케이스("use client" 필수) + 테마 토글              [T-8]
│           └── r/
│               ├── [name]/       # (G3 F-2: [name].json→개명 — Next 16 production에서
│               │   └── route.ts  #   점 포함 동적 세그먼트가 staticRoutes로 오분류됨)
│               │                 # GET /r/<item>.json → item JSON 동적 서빙          [T-9]
│               └── registry.json/
│                   └── route.ts  # GET /r/registry.json → 카탈로그(인덱스) 응답       [T-9]
└── packages/
    └── unikit/                   # @unikit/core — 유니버설 컴포넌트 패키지
        ├── package.json          # peerDeps(react, react-native, nativewind, cva, clsx,
        │                         #   tailwind-merge) + exports → ./src/index.ts          [T-2]
        ├── tsconfig.json         # strict, extends 루트 base                            [T-2]
        ├── registry.json         # shadcn 규격 루트 레지스트리(AC-7)                    [T-9]
        ├── src/
        │   ├── index.ts          # 공개 내보내기(스켈레톤: T-2 → 완성: T-6)
        │   ├── lib/
        │   │   └── utils.ts      # cn(clsx + tailwind-merge)                            [T-2]
        │   ├── theme/
        │   │   ├── tokens.ts     # 라이트/다크 토큰 단일 출처(진실 원본)                 [T-5]
        │   │   └── provider.tsx  # UnikitThemeProvider(vars() 주입)                     [T-5]
        │   └── components/       # 유니버설 컴포넌트 5종(RN 프리미티브 + cva + cn)      [T-6]
        │       ├── button.tsx    #   변형 6종 × 사이즈 4종
        │       ├── card.tsx      #   Header/Title/Description/Content/Footer
        │       ├── input.tsx
        │       ├── label.tsx
        │       └── badge.tsx
        └── registry/             # 소비자 복사용 소스 트리(§6 전략 — import "@/lib/utils" 기준) [T-9]
            ├── lib/
            │   └── utils.ts      # registry:lib 아이템 "utils"의 복사원
            └── ui/
                ├── button.tsx
                ├── card.tsx
                ├── input.tsx
                ├── label.tsx
                └── badge.tsx
```

`[T-n]` 표기는 소유 태스크(§2), `A→B`는 생성 후 소유 이전(순차 의존에서만 허용, §4). 참고: Expo Router 파일 라우팅의 `app/`은 Expo 앱 전용이며 Next 앱의 `app/`과 무관하다.

## 2. 태스크 분해 (T-1 ~ T-12)

담당 직군 약어: **FE** = `Frontend/UI Engineer`, **PLAT** = `Platform/Tooling Engineer` (00-requirements §7).

### 2.1 태스크 요약 표

| ID | 내용 | 담당 | 수정 허용 경계(요약) | 선행 |
|---|---|---|---|---|
| T-1 | 루트 워크스페이스 스캐폴드 + `git init` | PLAT | 루트 설정 5종 + `.git/` | — |
| T-2 | `@unikit/core` 패키지 인프라(peerDeps·exports·cn·index 스켈레톤) | PLAT | `packages/unikit/{package.json,tsconfig.json}`, `src/{index.ts,lib/utils.ts}` | T-1 |
| T-3 | `apps/expo` 스캐폴드 + NativeWind·Expo Router 설정 | PLAT | `apps/expo/**` 단 `app/{index.tsx,showcase/}` 제외 | T-1, T-2 |
| T-4 | `apps/web`(Next) 스캐폴드 + RNW·NativeWind 설정 | PLAT | `apps/web/{package.json,next.config.ts,tailwind.config.js,postcss.config.js,tsconfig.json}`, `apps/web/app/{layout.tsx,globals.css}` | T-1, T-2 |
| T-5 | 테마 토큰·Provider·색 매핑(웹 CSS 변수 + nativewind `vars()`) | FE | `packages/unikit/src/theme/**`, `apps/expo/tailwind.config.js`·`apps/web/tailwind.config.js`(colors 블록), `apps/web/app/globals.css`(변수 블록), `apps/expo/app/_layout.tsx`(Provider 랩) | T-2, T-3, T-4 |
| T-6 | 유니버설 컴포넌트 5종(cva 변형 + cn + TS 타입) | FE | `packages/unikit/src/components/**`, `packages/unikit/src/index.ts` | T-2 |
| T-7 | Expo 쇼케이스 화면(5종 전시 + 토크 토글) | FE | `apps/expo/app/{index.tsx,showcase/**}` | T-3, T-5, T-6 |
| T-8 | Next 쇼케이스 페이지(동일 import + 토글) | FE | `apps/web/app/page.tsx`, `apps/web/components/**` | T-4, T-5, T-6 |
| T-9 | 레지스트리 구축 + `/r` 동적 서빙 라우트 | PLAT | `packages/unikit/{registry.json,registry/**}`, `apps/web/{lib/registry.ts,app/r/**}` | T-4, T-6 |
| T-10 | 레지스트리 소비 재현 검증(임시 소비자 프로젝트) | PLAT | 저장소 외 `/tmp/unikit-consumer/**` + 재현 절차 초안(README 반영분은 T-12에 인계) | T-9 |
| T-11 | 통합 검증·빌드 관문(V-1~V-8 실행, 오류 수정 조정) | PLAT | 수정 권한 없음(오류는 원 소유 영역으로 회귀 지시 — 오케스트레이터가 조정) | T-3~T-10 전부 |
| T-12 | 한글 문서(README·컴포넌트 사용법·Expo Go 가이드) | FE | `/README.md`, `/docs/{components.md,expo-go.md}`(`docs/sdd/` 제외) | T-10, T-11 |

### 2.2 태스크 상세(경계·산출물·완료 기준)

**T-1 루트 워크스페이스 스캐폴드 — PLAT**
- 경계(생성·수정 허용): `/package.json`, `/pnpm-workspace.yaml`, `/.npmrc`, `/.gitignore`, `/tsconfig.base.json`, `.git/`(init만, 커밋 금지)
- 내용: 워크스페이스 선언, 루트 스크립트(`typecheck` = `pnpm -r exec tsc --noEmit` 등 V-4/V-11에서 쓰는 명령 등록), 공통 tsconfig(strict), `git init`.
- 산출물: 워크스페이스 3패키지가 인식되는 뼈대. 완료 기준: `pnpm install -r`가 워크스페이스 없음 오류 없이 통과(빈 상태), `git status` 동작.

**T-2 `@unikit/core` 인프라 — PLAT**
- 경계: `packages/unikit/package.json`, `packages/unikit/tsconfig.json`, `packages/unikit/src/index.ts`(스켈레톤), `packages/unikit/src/lib/utils.ts`
- 내용: peerDependencies(react, react-native, nativewind, class-variance-authority, clsx, tailwind-merge — 01-research §2.3), `exports` → 소스 직접 노출, devDep typescript, `cn` 구현(clsx + tailwind-merge 합성), index 스켈레톤(cn만 내보냄).
- 산출물: 설치 가능한 빈 패키지. 완료 기준: `pnpm --filter @unikit/core exec tsc --noEmit` 통과.

**T-3 `apps/expo` 스캐폴드 — PLAT**
- 경계: `apps/expo/**` 단 `apps/expo/app/index.tsx`, `apps/expo/app/showcase/` 제외(T-7 소유). `_layout.tsx`·`tailwind.config.js`는 생성 후 T-5에 소유 이전.
- 내용(01-research §2.1 레시피 그대로): `pnpm create expo-app --template default@sdk-58` → 패키지명 `@unikit/expo` → `npx expo install nativewind tailwindcss@^3.4.17 react-native-reanimated react-native-safe-area-context` → `scheme`/`plugins` 설정 → babel(`jsxImportSource`+`nativewind/babel`), metro(`withNativeWind`), `global.css`, `app.json` `web.bundler:"metro"`, tailwind `content`에 `../../packages/unikit/src/**/*.{ts,tsx}` 포함, `"@unikit/core": "workspace:*"` 추가. 단서: `default@sdk-58` 템플릿은 expo-router와 tabs 기본 화면을 **이미 포함**하므로 expo-router 재설치 대신, 템플릿 기본 화면은 루트 `app/`이 아닌 **`src/app/{_layout,index,explore}.tsx` + `src/components/**`(탭 구현 포함)**에 위치하므로(템플릿 tarball 실측, G1 재검증 F-6), 이 `src/app/`·`src/components/` 트리를 UniKit 쇼케이스 용도로 정리(불필요한 탭·플레이스홀더 제거, 최종 루트 `app/` 구조로 이전)하는 작업을 T-3 범위에 포함한다.
- 산출물: Expo Router + NativeWind 구동되는 빈 앱. 완료 기준: `pnpm --filter @unikit/expo exec expo export --platform web`이 기본 화면에서 성공.

**T-4 `apps/web` 스캐폴드 — PLAT**
- 경계: `apps/web/package.json`, `next.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `app/layout.tsx`, `app/globals.css`(@tailwind 3줄까지만; 변수 블록은 T-5). `app/page.tsx`·`components/`·`lib/`·`app/r/`은 제외(T-8·T-9 소유).
- 내용(01-research §2.2): create-next-app(TS·App Router·Tailwind) → 패키지명 `@unikit/web` → RNW 의존성(react-native, react-native-web, nativewind, tailwindcss ^3.4.17) → **런타임 의존성 2종 추가**: ① `"@unikit/core": "workspace:*"`(쇼케이스 소비용), ② `shadcn`(runtime dependency — 공식 문서 "Install shadcn as a runtime dependency" 근거, 4.23.0의 exports에 `./registry` 실재 → T-9의 `loadRegistry`/`loadRegistryItem` 소비) → `transpilePackages: ["nativewind","react-native-css-interop","react-native","react-native-web","react-native-reanimated","react-native-safe-area-context","@unikit/core"]` + react-native→react-native-web 별칭(Turbopack `resolveAlias`, R-1 폴백 대상) → `jsxImportSource:"nativewind"` → tailwind preset + content에 unikit src.
- 산출물: RNW+NativeWind 구성된 Next 앱. 완료 기준: `pnpm --filter @unikit/web exec next build` 성공(기본 페이지).

**T-5 테마 토큰 시스템 — FE**
- 경계: `packages/unikit/src/theme/**`(신규), `apps/expo/tailwind.config.js`·`apps/web/tailwind.config.js`(colors 블록만), `apps/web/app/globals.css`(:root/.dark 변수 블록만), `apps/expo/app/_layout.tsx`(Provider 감싸기만)
- 내용: `tokens.ts`에 shadcn 호환 토큰(라이트/다크)의 **단일 출처** 정의 → 웹은 `globals.css` `:root`/`.dark`로 값 복사, 네이티브는 `vars()`용 객체로 변환해 `UnikitThemeProvider`가 주입(01-research §2.3). 양 앱 tailwind `colors`를 `hsl(var(--token))` 매핑.
- 산출물: 토큰 1벌로 웹·네이티브 동일 색. 완료 기준: 두 앱 tailwind.config의 매핑 키가 동일 집합, `globals.css` 변수값이 `tokens.ts`와 일치(값 대조).

**T-6 유니버설 컴포넌트 5종 — FE**
- 경계: `packages/unikit/src/components/**`(신규), `packages/unikit/src/index.ts`(완성 — T-2 스켈레톤에서 소유 이전)
- 내용: Button(변형 default/secondary/destructive/outline/ghost/link × 사이즈 sm/default/lg/icon), Card(하위 5종), Input, Label, Badge. 전부 RN 프리미티브 + `className` + cva + `cn`, 완전한 props 타입. 플랫폼 분기 금지.
- 산출물: `@unikit/core` 공개 API. 완료 기준: `pnpm --filter @unikit/core exec tsc --noEmit` 통과 + 5종이 index.ts에서 내보내짐.

**T-7 Expo 쇼케이스 — FE**
- 경계: `apps/expo/app/index.tsx`, `apps/expo/app/showcase/**`(신규)
- 내용: 5종 전시(버튼 변형 6×4 그리드 포함), 라이트/다크 토글(`UnikitThemeProvider` 스키마 전환), `import { Button } from "@unikit/core"` 단일 import만 사용.
- 산출물: AC-1·2·6의 Expo 측 증거 화면. 완료 기준: `expo export --platform web` 성공 후 렌더 확인.

**T-8 Next 쇼케이스 — FE**
- 경계: `apps/web/app/page.tsx`(신규), `apps/web/components/**`(신규)
- 내용: `"use client"` 페이지에서 T-7과 동일 컴포넌트·동일 import·동일 변형 세트 렌더 + 토글(html `.dark` 클래스 전환).
- 산출물: AC-1·2·6의 Next 측 증거 화면. 완료 기준: `next build` 성공 + dev 서버에서 렌더 확인.

**T-9 레지스트리 구축·서빙 — PLAT**
- 경계: `packages/unikit/registry.json`, `packages/unikit/registry/**`(신규), `apps/web/lib/registry.ts`, `apps/web/app/r/**`(신규)
- 내용: §6 전략 구현 — 소비자용 소스 트리(본문은 src와 동일, import만 `@/lib/utils` 기준), registry.json 작성(아이템 6종: utils + 컴포넌트 5종), 서빙 라우트 — 단일 아이템 `app/r/[name]/route.ts`(핸들러가 파라미터에서 `.json` 확장자를 제거해 아이템 조회; 최초엔 공식 규약 그대로 `[name].json` 폴더였으나 **G3 F-2로 개명** — Next 16 production 빌드에서 점 포함 동적 세그먼트가 staticRoutes로 오분류되어 404, 소비자 URL `/r/<item>.json`은 불변)와 `app/r/registry.json/route.ts`(카탈로그 인덱스) 2개 핸들러, `lib/registry.ts`는 T-4에서 설치한 `shadcn` 패키지(runtime dep)의 `loadRegistry`/`loadRegistryItem` re-export. `target` 필드(소비자 배치 경로 제어) 지원 여부는 공식 문서 대조 후 확정.
- 산출물: `curl http://localhost:3000/r/button.json`이 유효한 item JSON 반환. 완료 기준: registry의 각 ui 아이템 본문이 `src/components` 대응본과 import 라인 제외 시 일치.

**T-10 소비 재현 검증 — PLAT**
- 경계: `/tmp/unikit-consumer/**`(저장소 외 — 저장소 오염 없음), 재현 절차 문서 초안(본문 반영은 T-12 인계)
- 내용: 01-research §2.4 절차 — `@unikit/web` dev 기동 → 임시 소비자(`npx create-next-app` + `npx shadcn@latest init`) → `npx shadcn@latest add http://localhost:3000/r/button.json` → 복사 결과·import 해석 가능성 확인.
- 산출물: AC-7 재현 로그. 완료 기준: 소비자 프로젝트에 컴포넌트 파일이 복사되고 복사본의 모든 import가 소비자 내부 경로(`@/...`) 또는 npm 패키지로 해석 가능(상대 경로 잔존 없음).

**T-11 통합 검증·빌드 관문 — PLAT**
- 경계: **소유 파일 없음** — 발견된 오류의 수정은 원 소유 태스크(T-3~T-10) 영역으로 회귀 지시하고 오케스트레이터가 재분배(단독 파일 수정 금지로 병렬 소유권 원칙 유지).
- 내용: §3의 V-1~V-8 전체 실행(타입체크·양쪽 프로덕션 빌드·android 번들·스크린샷 캡처·레지스트리 curl·재현 절차 리허설), 결과 기록.
- 산출물: G2 검증 증거 묶음(관문 평가 입력).

**T-12 한글 문서 — FE**
- 경계: `/README.md`, `/docs/components.md`, `/docs/expo-go.md`(`docs/sdd/` 제외)
- 내용: 빠른 시작(설치→실행→컴포넌트 추가, T-11에서 실제 통과한 명령만 기재), 모노레포 구조 안내, 컴포넌트 추가 가이드(src와 registry 두 트리 동시 수정 절차 포함 — §6), Expo Go 가이드(네이티브 실물 확인 잔여 한계를 사용자가 자체적으로 닫는 절차).
- 산출물: AC-8 문서. 완료 기준: 문서 내 빠른 시작 명령을 신규 복제 관점에서 그대로 실행해 전 단계 성공.

## 3. AC ↔ T ↔ V 매핑 (검증은 전부 실제 실행 가능 명령)

전제: 경로를 명시하지 않은 명령은 저장소 루트 `/home/loopy/dev/ll3/UniKit`에서, `cd <pkg> && bun x …` 형태는 해당 패키지 디렉터리에서 실행. 패키지명은 §0. 스크린샷은 00-requirements §5가 명시한 "호스트 미리보기 도구(브라우저)"로 캡처한다.

| AC | T | V | 검증 명령 | 관찰 기준(통과 조건) |
|---|---|---|---|---|
| AC-1 단일 소스·단일 import | T-3, T-4, T-6, T-7, T-8 | V-1 | ① `grep -rn "@unikit/core" apps/expo/app apps/web/app` ② `grep -rn "Platform.select\|\.web\.tsx" apps/expo/app apps/web/app packages/unikit/src`(분기 부재 확인 — 컴포넌트 본체 포함) ③ `cd apps/web && bun x next build` ④ `cd apps/expo && bun x expo export --platform web` | ① 양쪽 앱에서 동일 패키지 import 관찰 ② 앱 사용부·컴포넌트 본체(`packages/unikit/src`) 모두 플랫폼 분기 0건 ③④ exit 0. 스크린샷 증거는 V-2가 공유 |
| AC-2 같은 모습 | T-5, T-6, T-7, T-8 | V-2 | ① `cd apps/expo && bun x expo export --platform web` 후 **저장소 루트에서** `bunx serve apps/expo/dist -l 8081`(백그라운드 — apps/expo 기준 상대경로로 serve를 띄우면 대상 디렉터리가 없어 404, T-11 실측) ② `cd apps/web && bun x next dev --port 3000`(백그라운드) ③ 호스트 미리보기 도구로 `http://localhost:8081`, `http://localhost:3000` 캡처 | 두 스크린샷에서 Button 변형 6종×사이즈 4종 포함 5종 전부 렌더링, 두 웹(react-native-web) 렌더링 간 토큰·디자인 일치(컴포넌트별 육안 비교) |
| AC-3 네이티브 번들 | T-3, T-6, T-7 | V-3 | `cd apps/expo && bun x expo export --platform android` | exit 0, 출력에 error 없음, `apps/expo/dist`에 android 번들 산출. (실물 화면은 잔여 한계 — 00-requirements §5) |
| AC-4 정적 품질 | T-1~T-9 | V-4 | `bun run --filter '*' typecheck`(루트 — 각 워크스페이스 `typecheck` 스크립트 = `tsc --noEmit`) | exit 0 — 3개 워크스페이스 전부 오류 0건 |
| AC-5 컴포넌트 API | T-2, T-6 | V-5 | ① `cd packages/unikit && bun x tsc --noEmit` ② `grep -c "cva(" packages/unikit/src/components/{button,card,input,label,badge}.tsx` ③ `grep -n "secondary\|destructive\|outline\|ghost\|link\|sm:\|lg:\|icon" packages/unikit/src/components/button.tsx` ④ `grep -n "Button\|Card\|Input\|Label\|Badge" packages/unikit/src/index.ts` | ① exit 0 ② 5파일 모두 1 이상 ③ 변형 6종·사이즈 4종 정의 관찰 ④ 5종 내보내기 관찰 |
| AC-6 테마 전환 | T-5, T-7, T-8 | V-6 | V-2의 두 서버 기동 상태에서 토글 클릭 전·후 각각 캡처(앱별 2장×2 = 4장) | 스크린샷에서 색 토큰 전환(예: background/foreground 반전)이 웹에서 실제 관찰됨 |
| AC-7 shadcn 배포 형태 | T-9, T-10 | V-7 | ① `node -e "const r=require('./packages/unikit/registry.json'); process.exit(r.items?.length?0:1)"` ② `cd apps/web && bun x next dev --port 3000` 기동 후 `curl -sf http://localhost:3000/r/button.json` ③ T-10 절차: `/tmp/unikit-consumer`에서 `bunx shadcn@latest init` 후 `bunx shadcn@latest add http://localhost:3000/r/button.json` | ① exit 0 ② 유효한 JSON(files 배열 포함) 응답 ③ add exit 0 + 복사 로그·복사 파일 존재 + 복사본 import가 전부 소비자 경로(`@/...`) 또는 npm 패키지 |
| AC-8 문서 | T-12 | V-8 | README 빠른 시작 절차를 검증자가 순서대로 실행(예: `bun install` → V-2 서버 기동 → 화면 확인 → 컴포넌트 추가 가이드 1회 수행) | 문서에 기재된 모든 명령이 기재된 대로 성공(불일치 0건) |

V-1~V-8의 실행 주체는 T-11(통합 검증)이며, 각 태스크의 완료 기준(§2.2)은 이에 대응하는 V의 부분집합을 사전 확인용으로 사용한다.

## 4. 의존성 순서·병렬화 계획·통합 검증 지점

### 4.1 실행 그룹(위상 순서)

```text
G-A(순차 프롤로그): T-1 → T-2
G-B(병렬 2):        T-3(apps/expo)  ∥  T-4(apps/web)
G-C(병렬 2):        T-5(테마)      ∥  T-6(컴포넌트 5종)
G-D(병렬 3):        T-7(expo 화면) ∥  T-8(web 화면) ∥ T-9(레지스트리)
G-E(단독):          T-10(소비 재현)
G-F(단독):          T-11(통합 검증 — V-1~V-8 전체)
G-G(단독):          T-12(문서 — 확정된 실제 명령만 기재)
```

의존 근거: T-3/T-4는 `workspace:*` 연결을 위해 `packages/unikit/package.json`(T-2) 선행. T-5·T-6은 T-2(cn) 선행이며 서로 무관. T-7/T-8은 화면에 쓸 컴포넌트(T-6)·토큰(T-5)·앱 뼈대(T-3/T-4) 선행. T-9는 소스 확정(T-6)과 서빙 앱(T-4) 선행. T-10은 서빙(T-9) 선행. T-11은 전부, T-12는 검증 통과 명령(T-11)과 재현 절차(T-10) 선행.

### 4.2 병렬 그룹의 파일 소유권 교집합 = ∅ 증명

| 그룹 | 태스크 | 소유 파일 집합(요약) | 교집합 |
|---|---|---|---|
| G-B | T-3 | `apps/expo/**`(화면 파일 제외) | ∅ — 서로 다른 앱 디렉터리 |
| | T-4 | `apps/web/{package.json,next.config.ts,tailwind.config.js,postcss.config.js,tsconfig.json,app/layout.tsx,app/globals.css}` | |
| G-C | T-5 | `packages/unikit/src/theme/**` + 양 앱 `tailwind.config.js`(colors) + `apps/web/app/globals.css`(변수) + `apps/expo/app/_layout.tsx` | ∅ — unikit 내부에서 `src/theme/` vs `src/components/`+`src/index.ts` 분리; 앱 파일은 T-5가 T-3/T-4 완료 후 소유 이전받은 것(순차 전제) |
| | T-6 | `packages/unikit/src/components/**` + `src/index.ts` | |
| G-D | T-7 | `apps/expo/app/{index.tsx,showcase/**}` | ∅ — expo/web 서로 다른 하위 경로 + unikit registry 트리 |
| | T-8 | `apps/web/app/page.tsx` + `apps/web/components/**` | |
| | T-9 | `packages/unikit/{registry.json,registry/**}` + `apps/web/{lib/registry.ts,app/r/**}` | |

소유 이전 규칙: 한 파일이 여러 태스크에 관여할 때는 생성 태스크 → 후속 태스크로 순차 이전하며(§1 트리의 `[T-n→T-m]` 표기), 이전받는 태스크의 선행 의존성에 생성 태스크가 반드시 포함된다. 대상 4건: `apps/expo/tailwind.config.js`(T-3→T-5), `apps/web/tailwind.config.js`(T-4→T-5), `apps/web/app/globals.css`(T-4→T-5), `apps/expo/app/_layout.tsx`(T-3→T-5), `packages/unikit/src/index.ts`(T-2→T-6). 병렬로 동시에 열리는 태스크 간에는 파일 공유가 전혀 없다.

### 4.3 통합 검증 지점

- **지점 1(각 태스크 완료 시)**: §2.2의 태스크별 완료 기준(국소 tsc/빌드).
- **지점 2(G-D 완료 직후, T-11 착수)**: V-4(`bun run --filter '*' typecheck`)로 크로스 패키지 타입 합류 확인 — unikit↔앱 간 타입 불일치는 이 시점에서 처음 드러난다.
- **지점 3(T-11, 단일 통합 관문)**: V-1~V-8 전체. 네이티브 에뮬레이터 부재로 AC-3은 `expo export --platform android` 번들 성공으로 갈음하고, 네이티브 실물 외형·테마 전환은 잔여 한계로 G5까지 명시된다(00-requirements §5). T-11은 오류 수정 권한이 없어 수정은 원 소유 태스크 회귀로 처리 — 병렬 소유권 원칙이 관문 단계에서도 유지된다.

## 5. 리스크·폴백

| ID | 리스크 | 영향 태스크 | 폴백(증거 기반, G2에서 결정) |
|---|---|---|---|
| R-1 | Next 16(4.x Turbopack 기본)에서 react-native→react-native-web `resolveAlias` 미동작 → 빌드 실패 또는 RN 웹 번들 오염 | T-4, V-1 | 1차: Next 16 공식 문서 대조 후 Turbopack용 올바른 별칭 설정 수정. 2차: webpack 빌드 강제(공식 지원 플래그·설정 여부를 문서 대조로 확인). 3차: `next` 15.x 하향(`cd apps/web && bun add next@^15`) — 01-research §2.2 명시된 선택지. 폴백 시 V 명령(`next build`)은 동일 |
| R-2 | pnpm isolated 모드에서 Expo/Metro의 워크스페이스 심볼릭 링크·autolinking 해석 실패 | T-3, V-3 | 1차: `.npmrc`를 `node-linker=hoisted`로 전환 후 재설치(Expo 모노레포 가이드의 대안 — G-C에서 `pnpm-workspace.yaml` `nodeLinker: hoisted`로 실행·해결). 2차: metro.config에 watchFolders/node_modules 경로 수동 지정. **bun 전환 후(2026-11-07)**: bun isolated 레이아웃에서 ① peer 서명 차이로 react-native·nativewind 2인스턴스 분할 재발 → `@unikit/core` devDeps를 앱과 동일 해석 버전으로 정렬(react 19.3.0 exact, @types/react ~19.3.0, react-native 0.88.1 exact)로 단일 인스턴스 통일 ② 루트 node_modules 공백으로 Metro/babel 상향 해석 실패(`expo export` ≠성립) → **`bunfig.toml` `[install] linker = "hoisted"` 전환으로 해결**(순정 `bun x expo export --platform web` exit 0 실측) |
| R-3 | Next에서 NativeWind 스타일 미적용(transpile 누락·우선순위 충돌) | T-4, T-8 | `transpilePackages`·`jsxImportSource` 재점검 → nativewind 공식 폴백 `important: "html"` 옵션 적용(01-research §2.2) |
| R-4 | `/r` 동적 서빙(shadcn 패키지 `loadRegistryItem`)의 Next 16 라우트 핸들러 호환 문제 | T-4, T-9, V-7 | `npx shadcn@latest build`로 정적 파일(public/r/[name].json) 생성 방식 전환 — 01-research §2.4가 제시한 공식 대안. 소비자 URL(`http://localhost:3000/r/button.json`)은 동일해 V-7 불변 |
| R-5 | `src/`와 `registry/` 소스 2벌 드리프트(§6 전략의 구조적 비용) | T-9, T-12 | T-9 완료 기준으로 "본문 차이는 import 라인뿐" 강제 + README 컴포넌트 추가 가이드에 두 트리 동시 수정 절차 고정(1벌 수정 누락 시 V-7 재현에서 즉시 포착됨) |
| R-6 | react-native-reanimated 등 peer 의존성 버전 충돌 | T-3 | 원칙: 모든 RN 관련 설치는 `npx expo install`로만 수행(SDK 58 호환 버전 자동 해결 — 01-research §1) |
| R-7 | tailwindcss 4.x가 create-next-app 기본값으로 섞여 들어옴 | T-4 | 설치 후 `package.json`에서 tailwindcss를 `^3.4.17`로 고정·재설치(§0 버전 룰). postcss 설정도 TW3 계열 유지 |

레지스트리 로컬 재현 절차(01-research §2.4)의 표준 경로와 폴백: **기본** = apps/web 동적 서빙(`/r/<item>.json`) + 소비자 `npx shadcn@latest add http://localhost:3000/r/<item>.json` → **폴백(R-4)** = `npx shadcn@latest build` 정적 서빙. 어느 쪽이든 AC-7의 관찰 기준(V-7 ③)은 동일하다.

## 6. 레지스트리 아이템 import 경로 전략 결정 (01-research §4.3 미결 사항 확정)

### 결정

1. **소스 형태 — "레지스트리 전용 복사본 트리" 채택, "빌드 시 경로 재작성" 기각.** 소비자에게 복사될 소스는 `packages/unikit/registry/`(shadcn 공식 권장 `registry/[style]/` 배치의 UniKit 버전 — 단일 스타일이므로 style 계층 없음)에 두고, 그 내부 import는 **처음부터 소비자 프로젝트 기준**(`@/lib/utils` + npm 패키지)으로 작성한다.
2. **서빙 — 동적 서빙 채택.** apps/web의 `app/r/[name]/route.ts`(단일 아이템 — 파라미터 `.json` 확장자를 제거해 조회; 폴더명은 G3 F-2로 `[name].json`에서 개명)와 `app/r/registry.json/route.ts`(카탈로그)에서, T-4가 runtime dependency로 설치한 `shadcn` 패키지의 `loadRegistry`/`loadRegistryItem`으로 item JSON을 조립해 `http://localhost:3000/r/<item>.json`로 응답한다(폴백: R-4 정적 빌드).

### 근거

- **단일 소스 + 절대경로는 원천 불가능**: 번들러(Metro·Next)는 소비 앱의 설정만 해석하므로, `@unikit/core` 패키지 내부의 `@/...` 별칭을 앱 번들 시점에 풀어줄 수 없다. 따라서 모노레포용 소스(`src/`)는 상대 경로 import가 강제되고, 소비자용 소스는 `@/` 절대 경로여야 한다 — 두 형태는 한 파일에 공존할 수 없어 "트리 분리" 또는 "재작성" 중 하나가 필연이다.
- **재작성 기각 사유**: (a) 자체 재작성 스크립트는 비표준 커스텀 툴링(00-requirements §5 제약 위반), (b) `shadcn build`의 내장 변환은 조사 단계에서 동작 세부를 확보하지 못해 검증 부담이 있고, (c) 복사본 트리는 CLI의 어떤 변환 기능도 가정하지 않고 "복사된 파일이 소비자 별칭 그대로 동작"을 구조적으로 보장한다 — AC-7의 "복사되어 사용 가능"을 최소 가정으로 충족한다.
- **동적 서빙 사유**: 소스 수정→산출물 재생성 단계가 없어 재현 절차(T-10)와 검증(V-7)이 최단이고, 01-research §2.4가 제시한 1안이다.
- **드리프트(2벌 유지 비용) 통제**: `registry/`와 `src/components/`의 본문 차이는 import 문뿐임을 T-9 완료 기준으로 강제하고, 컴포넌트 추가 절차(README)를 "① `src/` 작성 → ② `registry/`에 import만 교체해 복사 → ③ `registry.json` 등록" 3단계로 고정한다(R-5).

### registry.json 초안 구조(T-9 구현 기준)

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "unikit",
  "homepage": "(GitHub 게시 전까지 로컬 재현 절차로 대체 — T-9에서 확정)",
  "items": [
    { "name": "utils", "type": "registry:lib", "title": "cn utility",
      "files": [{ "path": "registry/lib/utils.ts", "type": "registry:lib" }] },
    { "name": "button", "type": "registry:ui", "title": "Button",
      "registryDependencies": ["utils"],
      "dependencies": ["class-variance-authority", "clsx", "tailwind-merge", "nativewind"],
      "files": [{ "path": "registry/ui/button.tsx", "type": "registry:ui" }] }
  ]
}
```

(`button` 외 `card`/`input`/`label`/`badge` 동일 구조. `dependencies`에 nativewind를 포함해 RN 소비자 프로젝트에 자동 설치되게 한다. react/react-native는 peer 성격이라 소비자에 이미 존재한다고 본다.) **T-9 확정 대상(근거 확보 후)**: ① `files[].target` 필드로 소비자 내 배치 경로(예: `components/unikit/`) 지정 가능 여부, ② `registryDependencies`의 로컬 서빈 시 해석 방식, ③ `homepage` 필드값 — 모두 ui.shadcn.com/docs/registry 공식 문서 대조로 결정하며, 근거 없이 가정하지 않는다(01-research 검증 원칙 준수).

