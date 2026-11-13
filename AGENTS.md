# AGENTS.md — 코딩 에이전트 기여 지침

UniKit UI 저장소에서 작업하는 코딩 에이전트(Claude Code 등)를 위한 지침이에요. 사람 기여자는 [README.md](README.md)와 [docs/components.md](docs/components.md)를, AI 도구용 라이브러리 요약은 [llms.txt](llms.txt)를 보세요.

## 저장소 구조

```text
unikit-ui/  (bun 워크스페이스: apps/*, packages/*)
├── apps/expo/                  # Expo 데모 앱(쇼케이스·블록, uniwind 엔진)
├── apps/web/                   # Next.js 데모 앱(랜딩 /, /components, /blocks, 레지스트리 /r/)
├── packages/unikit/            # @unikit-bridge/ui — 본체
│   ├── src/bridge/             # 브리지 — web.tsx(default 조건)·native.tsx(react-native 조건)·types.ts(공통 계약)
│   ├── src/components/         # 컴포넌트 61종(배럴 진입 대상 60종 + chart)
│   ├── src/chart/              # 차트 렌더러(web.tsx·native.tsx·types.ts) — @unikit-bridge/ui/chart 진입점
│   ├── src/lib/overlay.tsx     # 통합 오버레이 훈(포털·백드롭·포커스 관리·앵커 위치 계산)
│   ├── src/lib/utils.ts        # cn(clsx + tailwind-merge)
│   ├── src/theme/              # tokens.ts(디자인 토큰 단일 출처)·Provider
│   ├── src/index.ts            # npm 배럴(chart는 제외)
│   ├── registry/ui/            # 소비자 복사용 소스 트리 — 본문은 src와 동일, import만 @/lib/utils 기준
│   ├── registry.json           # shadcn 규격 레지스트리(67 아이템 = UI 61 + utils 1 + theme 4 + animations 1)
│   ├── scripts/                # generate:design·audit:design·check:consumer
│   └── docs/tokens.md          # 생성된 토큰 카탈로그(직접 편집 금지)
├── shadcn-ref/                 # shadcn 원본 참조(이식 원본 — 수정 금지)
└── docs/                       # install.md·components.md·roadmap-components.md·expo-go.md·sdd/
```

- **브리지 분기 원칙**: 플랫폼 분기는 컴포넌트 코드가 아니라 패키지 exports 조건(`react-native` → native.tsx, `default` → web.tsx)이 담당해요. 컴포넌트·문서에서 `.web.tsx`·`Platform.select`를 쓰지 않아요.
- **두 트리 동기화**: `src/components/`와 `registry/ui/`는 본문이 같고 import 문만 달라요(`cn` 출처). 한쪽만 고치면 audit·소비 재현 검증에서 드러나요 — 항상 같이 고치고 `registry.json` 등록도 갱신해요.

## 검증 명령 (작업 후 반드시 실행)

```bash
bun install                        # 최초 1회 (패키지 매니저는 bun만 — pnpm 금지)
bun run typecheck                  # 워크스페이스 3패키지 tsc --noEmit (루트에서)
bun run audit:design               # 디자인 일관성 검사 9종(임의값 클래스·registry files 실재·WCAG 대비·브리지 flex 방향 등)
bun run generate:design            # 토큰 변경 시에만: globals.css·registry theme·tokens.md 재생성
```

- `audit:design`은 위반 1건이면 exit 1로 실패해요. 머리 주석의 원본 클래스 인용은 주석 라인 제외로 스캔해요(오탐 방지).
- 웹 데모 빌드 확인: `cd apps/web && bun run build`(prebuild가 `public/r/*.json` 정적 생성 + `output: "export"`). 레지스트리 확인: `bun x next dev -p 3000` 후 `/r/registry.json`. Cloudflare Pages 배포는 `apps/web/DEPLOY.md`.

## 컴포넌트 이식 규칙 9조 (shadcn → UniKit UI, docs/sdd/42-design-plan.md §3)

shadcn 컴포넌트를 이식·수정할 때 지키는 공통 규칙이에요. 원본은 `shadcn-ref/ui/{이름}.tsx`:

1. **원본의 export 명을 유지**해요. (API 호환이 최우선 — `forwardRef` 노출도 유지, 61종 전부 적용)
2. **변형(cva)을 유지**해요 — variant·size 구성과 값은 그대로.
3. **토큰 클래스를 유지**해요 — 원본의 색·간격 토큰 클래스(bg-background 등)를 바꾸지 않아요.
4. **radix·외부 엔진을 제거**하고 열림·선택 상태는 React state + context로 직접 관리해요.
5. **`data-[state=…]`·`group`/`peer` 셀렉터는 조건부 클래스 전개**로 치환해요(네이티브에 data 속성·셀렉터가 없어요).
6. **전경색은 내부 Text에 이중 지정**해요 — 배경·테두리는 컨테이너(View/Pressable), 글자색은 내부 Text. RN에서는 컨테이너 글자색이 자식으로 상속되지 않아요.
7. **웹 전용 효과는 `web:` 접두 클래스**로만 넣어요(호버 등). 단, 루프 애니메이션(회전·펄스)은 `web:animate-*` 클래스와 함께 브리지 `LoopRotate`/`LoopPulse` 프리미티브로 감싸 네이티브에서도 RN Animated(UI 스레드)로 구동해요.
8. **children에 문자열을 권장하는 곳은 주석으로 표기**해요(내부 Text 래핑이 있는 경우).
9. **파일 머리 주석에 포팅 판단을 기록**해요 — 원본 대비 차이·이유·미지원(로드맵) 항목.

보조 규칙(같은 맥락에서 확립):

- **임의값 클래스 금지** — `w-[340px]`·`max-w-[calc(...)]` 등 `[...]` 값은 audit (c) 실패. 동적 값은 `style` prop(동적 style 계약)으로.
- **`dark:` 변형 금지** — 다크 모드는 토큰 값 전환으로만(사이클 40 이식분부터 전면 제거 관행).
- **아이콘은 lucide（브리지 경유）** — 컴포넌트는 `@unikit-bridge/ui/primitives`의 `*Icon`만 써요. 웹은 `lucide-react`, 네이티브는 `lucide-react-native`를 브리지가 감싸요. 컴포넌트·registry에서 lucide를 직접 import하지 않아요.
- **새 의존·peer는 최소화** — registry `dependencies`는 실제 import하는 것만, 선택 연동은 `peerDependencies`(form→react-hook-form, chart→react-native-svg, 아이콘→lucide-react / lucide-react-native).

## 컴포넌트 추가 절차 (요약)

1. `src/components/<이름>.tsx` 작성(브리지 프리미티브 + className + cva + cn) → `src/index.ts` export 추가.
2. `registry/ui/<이름>.tsx`에 복사(import만 `@/lib/utils` 기준으로 치환).
3. `registry.json`에 등록(name·type·registryDependencies·dependencies·files) — `scripts/audit-design.ts`의 대상 목록도 갱신.
4. 토큰 건드렸으면 `bun run generate:design` → `bun run typecheck` + `bun run audit:design`.

기여 요약은 [README.md](README.md) «기여» 절, 소비자 설치는 [docs/install.md](docs/install.md)를 보세요.

## 금지 사항

- **pnpm(및 bun 외 패키지 매니저) 사용 금지** — 이 저장소는 bun 워크스페이스예요.
- **임의 커밋·푸시 금지** — 커밋은 사용자가 요청할 때만. 커밋 메시지는 한국어 Conventional Commits, attribution(Co-Authored-By 등) 금지.
- **생성물 직접 편집 금지** — `apps/web/app/globals.css` 토큰 블록·`registry.json` theme 항목·`packages/unikit/docs/tokens.md`은 `generate:design`의 산출물이에요.
- **`shadcn-ref/` 수정 금지** — 이식 판단의 기준 원본이에요.
- **지어낸 수치·구성 금지** — 컴포넌트 수·이름·의존성은 `ls`·`registry.json`·소스로 확인한 사실만 문서·보고에 써요.

## 문서 지침

- 문서는 한국어가 기본이에요. 예외: 루트 [README.md](README.md)(영어 우선, 한국어는 [README.ko.md](README.ko.md))·[packages/unikit/README.md](packages/unikit/README.md)(영어)·[docs/install.en.md](docs/install.en.md). 한국어 문체는 해요체 설명체를 따라요.
- 기존 문서를 고칠 때는 내용을 지우지 말고 병합해요(보존 원칙). 수치·날짜는 저장소에서 재검증 후 기입해요.
- 컴포넌트 수·상태 표기의 기준: `src/components`(61종)·`registry/ui`(61종)·`registry.json`(67 아이템 = UI 61 + utils 1 + theme 4 + animations 1). 미지원 기능은 각 컴포넌트 머리 주석의 "로드맵" 기록이 근거예요.
- 사람용 설치·소비 상세는 [docs/install.md](docs/install.md), 루트 [README.md](README.md)(영)·[README.ko.md](README.ko.md)(한)는 빠른 시작·요약만 담아요.
