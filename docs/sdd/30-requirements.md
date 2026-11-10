# 요구 정의 — 사이클 30: shadcn 카탈로그 전면 이식 (1차)

- 원 요청(2026-11-10): "그러면 일단 설명 업데이트 해주고, /sdd를 통해 shadcn의 모든 컴포넌트를 구현 및 가져가도록 해보자"
- 작성 직군: Product Manager (role-perspective) · 검토: Requirements Auditor(독립) — 감사 기록은 32-design-plan.md 말미

## 목표와 범위

1. **설명(문서) 최신화** — 갭 분석(2026-11-10) P1-2: 낡은 아키텍처 설명을 현재 상태(브리지·npm 게시·CI 완료)로 교정.
2. **shadcn 전체 컴포넌트를 UniKit 유니버설 버전으로 구현·공급** — shadcn 공식 `registry:ui` 61종(실측: ui.shadcn.com/r/styles/new-york-v4/registry.json) 중 기존 5종 완료, 잔여 56종이 프로그램 전체 목표. **본 사이클(30번대)은 1차 배치 23종 + 전체 로드맵 문서**를 끝까지 검증·완료한다. 잔여 분량은 후속 사이클로 인계(범위 축소가 아니라 다회차 프로그램 선언).

## 수용 조건 (AC-*)

| ID | 수용 조건 (관찰 가능) |
|---|---|
| AC-1 | 루트 README.md·docs/components.md·docs/expo-go.md·packages/unikit/README.md가 현재 아키텍처와 일치 — `@unikit/core`·`NativeWind`(nativewind 소문자 포함)·`Tailwind 3.4` 잔존 0건(docs/sdd/ 역사 문서 제외), 문서가 언급하는 파일·경로·스크립트는 실존 |
| AC-2 | shadcn registry:ui 61종 전체의 구현 상황(완료/1차 배치/후속 티어·필요 브리지 기능)을 담은 로드맵 문서가 docs/에 있고 실제 상태와 일치 |
| AC-3 | 1차 배치 23종 각각이 (a) src/components/`<n>`.tsx (b) registry/ui/`<n>`.tsx — 본문 byte 동일(cn import 경로만 상이, audit (d)가 기계 검증) (c) registry.json 아이템 등록 (d) src/index.ts export (e) docs/components.md 절 (f) audit-design names 배열 포함 (g) apps/expo·apps/web 양쪽 쇼케이스 전시 — 전 충족 |
| AC-4 | CI와 동일한 현장 검증 전부 exit 0: `bun run typecheck`(3종) · `bun run audit:design`(8/8) · apps/web `bun run build` · apps/expo `bun x expo export --platform android` |
| AC-5 | 웹 렌더 증거 — `expo export --platform web` 정적 산출을 띄워 1차 배치 컴포넌트의 렌더를 라이트·다크 스크린샷으로 확인 |
| AC-6 | 소비자 공급 경로 — 로컬 레지스트리에서 23종 전부 `/r/<n>.json`이 shadcn 규격 페이로드(files[].content 포함) 반환(전종 curl 확인), 구조는 shadcn/registry 로더로 스키마 검증 |

## 제약

- 패키지 매니저 bun 고정(pnpm 금지). 커밋·푸시는 사용자 요청 시에만(본 사이클 자동 범위 밖).
- 기존 docs/sdd/00~23번 문서는 당시 증거이므로 수정하지 않는다(새 30번대 문서로만 기록).
- 1차 배치 선정 기준: 현재 브리지 프리미티브(View/Text/Pressable/TextInput/Image + 확장 접근성)만으로 구현 가능한 종목. 포털·제스처·애니메이션·차트 의존 종목은 후속 티어로 로드맵에 기록한다.
- 아이콘(lucide 등) 신규 의존성은 추가하지 않는다 — 글리프(Text)로 대체하고 한계를 문서화(아이콘 인프라는 후속 과제).

## 막힌 질문

없음 — 배치 범위(23종 선정)는 위 제약 기준에 따른 실행 판단으로 32-design-plan.md에 근거와 함께 기록.
