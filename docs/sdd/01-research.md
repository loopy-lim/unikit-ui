# UniKit 조사 보고서 (조사 단계)

- 작성 직군: `Tooling & Runtime Analyst` + `Codebase Researcher`(role-perspective, 오케스트레이터 실행 — 저장소가 빈 디렉터리라 코드베이스 조사 대상 없음, 외부 공식 문서 조사로 대체)
- 날짜: 2026-11-07
- 입력: `docs/sdd/00-requirements.md` §5 가정 4건, npm 레지스트리 조회, 공식 문서 원문
- 검증 방식: 공식 문서 원문 취득(webReader) + npm registry 실측(`npm view`). 근거 없는 기억은 사실로 채택하지 않음

## 0. 요약: 가정 판정

| # | 가정 (요구 문서) | 판정 | 근거 |
|---|---|---|---|
| A-1 | Expo SDK 58 + pnpm 모노레포 + Metro 공식 지원 | **확인** (단, 가이드 상세 최신화) ※ 2026-11-07 사용자 결정으로 패키지 매니저 pnpm→bun 전환 — 아래 pnpm 서술은 당시 조사 이력 | docs.expo.dev/guides/monorepos (2026-10-16 갱신): pnpm 워크스페이스 1급 지원, SDK 54+ isolated dependencies 지원, SDK 55+ 모노레포 autolinking 자동 |
| A-2 | NativeWind 4.2 + Tailwind **v4** CSS-first 공식 설정 | **수정** → Tailwind **v3.4계** 사용 | nativewind.dev/getting-started/installation: 공식 설치 명령이 `tailwindcss@^3.4.17` 고정 + `nativewind/preset` + `@tailwind` 디렉티브. Tailwind v4 조합은 nativewind **5.0.0-rc**(2026-09~ 개발중) 영역 — 첫 개발자 프로젝트에 RC 부적합 |
| A-3 | Next.js + react-native-web + NativeWind 공식 지원 | **확인** (범위 명시: "use client" 라우트) | 같은 문서 "Installation with Next.js" 섹션: nativewind/preset + tsconfig `jsxImportSource: "nativewind"` + `transpilePackages: ["nativewind", "react-native-css-interop"]`. RSC 비지원("use client" 필수) |
| A-4 | shadcn CLI 4.x 커스텀 레지스트리 지원 | **확인** | ui.shadcn.com/docs/registry(getting-started, registry-json): 규격·`shadcn build`·GitHub 저장소 레지스트리·로컬 URL 설치 모두 공식 |

## 1. 측정된 버전·호환성 (npm registry, 2026-11-07)

| 항목 | 값 | 비고 |
|---|---|---|
| nativewind | 4.2.7 (2026-09-14) | peer `tailwindcss >3.3.0`, engines node>=16. 5.0.0-rc.1는 RC(채택 안 함) |
| tailwindcss v3계 최신 | 3.4.19 | 공식 문서 고정은 `^3.4.17` — 3.4계 내 사용 |
| react-native-web | 0.21.4 | peer react/react-dom `^18 || ^19` → react-dom 19.3.1 호환 |
| react-native-reanimated | 4.7.1 | 정확한 버전은 `npx expo install`이 SDK 58에 맞춰 해결 |
| shadcn CLI | 4.23.0 | registry 규격·`build`·`add <url>` 확인 |
| @react-native-reusables/cli | 0.7.1 | 참조 구현: github.com/**founded-labs/react-native-reusables** (원조 패턴 저장소, 실측 확인) |

## 2. 확정 기술 레시피 (G1 설계 입력)

### 2.1 Expo 앱 (SDK 58, apps/expo)

- 생성: `pnpm create expo-app --template default@sdk-58 apps/expo` (공식 모노레포 가이드의 권장 흐름)
- NativeWind 4 설치: `npx expo install nativewind tailwindcss@^3.4.17 react-native-reanimated react-native-safe-area-context` (reanimated/safe-area-context는 peer 필수)
- `tailwind.config.js`: `presets: [require("nativewind/preset")]`, `content`에 **앱 자신 + `../../packages/unikit/**/*.{ts,tsx}`** 포함(모노레포 핵심 — 유니버설 패키지의 className이 빌드에 잡히도록)
- `babel.config.js`: `babel-preset-expo`에 `jsxImportSource: "nativewind"` + `nativewind/babel` preset
- `metro.config.js`: `withNativeWind(config, { input: "./global.css" })`, `global.css`는 `@tailwind base/components/utilities`
- `app.json`: `expo.web.bundler: "metro"` (웹도 Metro로 번들 → Expo web에서 RNW 렌더)
- Expo Router: 템플릿 default@sdk-58에 **이미 포함**(npm 실측: expo-template-default@sdk-58 deps에 expo-router ~58.0.30, react-native-reanimated, react-native-safe-area-context, react-native-web 포함) → 별도 설치 불필요, 템플릿 기본 화면(tabs 등)을 UniKit 쇼케이스 용도로 정리하는 작업만 필요. (G1 감사 F-3 반영 — 초안의 "미포함" 기술은 오류였음)

### 2.2 Next.js 앱 (apps/web)

- NativeWind 공식 "Installation with Next.js" 경로:
  - `tailwind.config.js`에 `presets: [require("nativewind/preset")]` + content에 `../../packages/unikit/**/*.{ts,tsx}` 포함
  - `tsconfig.json` `compilerOptions.jsxImportSource: "nativewind"` (SWC 경로)
  - `next.config.js` `transpilePackages: ["nativewind", "react-native-css-interop", "react-native", "react-native-web", "react-native-reanimated", "react-native-safe-area-context"]` + react-native → react-native-web 별칭(RNW 표준: webpack `resolve.alias` / Turbopack `resolveAlias`)
  - 쇼케이스 페이지는 `"use client"` 필수 (RSC 미지원 — 공식 명시)
  - 스타일 덮어쓰기 문제 시 `important: "html"` 옵션 존재
- **위험(구현 시 관리)**: next 16.4.5 최신은 Turbopack 기본. RNW 별칭이 Turbopack에서 안 되면 (a) webpack 설정 강제 또는 (b) next 15.x 하향 — G2에서 증거 기반 결정, 계획에 폴백 명시

### 2.3 packages/unikit (유니버설 컴포넌트)

- 소스는 RN 프리미티브(`View`/`Text`/`Pressable`/`TextInput`) + `className`(NativeWind) + cva + cn(clsx+tailwind-merge)로만 작성 → 앱쪽 플랫폼 분기 없음
- peerDependencies: `react`, `react-native`, `nativewind`, `class-variance-authority`, `clsx`, `tailwind-merge` (앱에서 이미 설치된 것 재사용)
- 테마: shadcn 호환 CSS 변수(`--background`, `--foreground` 등)를 tailwind.config `colors`에서 `hsl(var(--...))`로 매핑(TW3 표준 방식). 웹은 `:root`/`.dark`, 네이티브는 NativeWind `vars()` — 참조: founded-labs/react-native-reusables 패턴

### 2.4 레지스트리 (shadcn 규격)

- 원본 규격(실측, registry-json 문서): 루트 `registry.json` = `{ $schema, name, homepage, items: [{ name, type: "registry:ui", title, description, registryDependencies, dependencies, files: [{ path, type }] }] }` 또는 `include` 합성
- GitHub 공개 저장소 자체가 레지스트리가 됨(루트 registry.json) — 다만 v0.1은 GitHub 게시 없음 → **로컬 재현**으로 AC-7 충족
- 로컬 재현 경로(공식 getting-started): 소스 registry.json을 두고 `npx shadcn@latest add <URL>` — URL은 HTTP 여야 하므로, apps/web(Next)에서 `shadcn/registry`의 `loadRegistry`/`loadRegistryItem` 라우트 핸들러로 `/r/registry.json`, `/r/[name].json` 동적 서빙(또는 `shadcn build` 후 정적 파일) → 소비자 프로젝트에서 `npx shadcn@latest add http://localhost:3000/r/button.json` 설치 재현
- 파일 배치 권장: registry 항목 파일은 소스 트리 `packages/unikit` 컴포넌트를 가리키게 하고, 항목 내 import는 소비자 프로젝트 경로(`@/components/unikit/...` 방식)로 변환된 소스를 제공 — 구체 변환 방식(레지스트리용 복사본 유지 vs 경로 재작성)은 G1에서 결정

## 3. 참조 구현

- **founded-labs/react-native-reusables** (npm 실측): shadcn 스타일 RN 컴포넌트 모음 + 전용 CLI. UniKit과 목적이 같은 선행 사례 — 컴포넌트 소스 구조(cva/cn/RN 프리미티브)와 tailwind/preset 구성의 정합성 근거로 사용. 코드 복사가 아닌 패턴 참조만 함(라이선스·독자 구현 유지)

## 4. G1에 넘기는 결정 사항

1. Tailwind **3.4계 고정**(nativewind 4.2.7 정식 경로). "TW4 CSS-first"는 v0.1 제외 — nativewind 5 정식 출시 시 업그레이드 과제로 기록
2. Next.js 16(Turbopack 기본)의 RNW 별칭 리스크 → G2 폴백 계획 필수(webpack 강제 / next 15 하향)
3. 레지스트리 아이템의 import 경로 전략(G1 확정): 소비자 복사본이 `@/` 경로로 동작하도록 레지스트리 전용 소스(`registry/` 트리, shadcn 공식 권장 배치)를 둘지, 빌드 시 재작성할지
4. 테마 토큰: TW3 `hsl(var(--token))` 매핑 방식 채택(TW4 `@theme` 아님)

## 5. 증거 기록

- 방법: webReader로 4개 공식 문서 원문 취득(nativewind installation / expo monorepos / shadcn registry+getting-started; nativewind guides/nextjs·monorepos 개별 페이지는 404·네트워크 오류 → installation 페이지 내 Next.js 섹션으로 대체 충족) + `npm view` 6건
- 환경: node v26.13.0, npm 11.20.0, /home/loopy/dev/ll3/UniKit(빈 저장소)
- 한계: NativeWind "Using with Monorepos" 개별 문서 페이지를 직접 취득하지 못함(404) — 그러나 모노레포 설정 요건(content glob에 패키지 경로 포함)은 installation 문서와 rnr 참조 구현으로 입증 가능. 구현 중 추가 확인 필요 시 재조회
