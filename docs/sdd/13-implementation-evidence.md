# 13. 구현 증거 (2차 사이클 — 디자인 토큰 일관성 시스템)

- 사이클: 2차 (T-13~T-16, AC-9~AC-12 — [10-requirements.md](10-requirements.md) · [12-design-plan.md](12-design-plan.md))
- 원 요청: «모든 디자인에 대해서 일관성을 쉽게 지키도록 하면 좋을꺼 같아. 특히 디자인에 대한 토큰 등 있자나.» (F-11 눌림 확인 트랙은 [03-implementation-evidence.md](03-implementation-evidence.md) §7 참조)
- 기간: 2026-11-08 ~ 2026-11-09 · 환경: bun 1.4.4, Linux
- **수행 방식(독립성 고지)**: T-13~T-16 구현과 본 문서 작성은 오케스트레이터가 `Platform/Tooling Engineer` 관점으로 직접 수행했다. 따라서 본 문서의 서술은 작성자 자기 검증 성격이며, 관문 판정(G2)은 **독립 `Task QA Validator` 스폰**(writer≠evaluator)으로 대체 수행했다. 판정 결과는 [ledger.md](ledger.md) G2(2차) 행에 있다.
- 커밋 0 유지(1차 인계 그대로 — 사용자 요청 시에만 커밋).

## 1. T-13 `generate:design` — 사본 3종 자동 생성 (AC-9, V-9)

산출: `packages/unikit/scripts/generate-design.ts`, 루트 `package.json` 스크립트(`generate:design`).

생성 모델 — 값 출처는 `src/theme/tokens.ts` 단 하나, 사본 3종:

| 사본 | 위치 | 방식 |
|---|---|---|
| ① 웹 전역 CSS | `apps/web/app/globals.css` | `/* ⛔ UNIKIT-TOKENS:BEGIN */`~`END */` 마커 사이 `@layer base` 블록 |
| ② 레지스트리 theme 항목 | `packages/unikit/registry.json` `items[1]` | `type: "registry:theme"`, `cssVars {light, dark}` 20키씩 |
| ③ 토큰 카탈로그 | `packages/unikit/docs/tokens.md` | 값 표 20행 + 일관성 규칙 + 사본 위치표 (전체 생성) |

V-9 실측 (전 구간 `/tmp/unikit-gen-backup/` 4종 사전 백업 — globals.css·registry.json·README.md·components.md):

- **무손실 전환(첫 실행)**: 마커 없는 globals.css의 기존 `@layer` 블록을 괄호 세기로 정확히 추출해 생성물과 byte 대조 → 일치 확인 후 마커 삽입. diff는 **마커 2줄만** (변수 0행 변경). registry.json은 파싱 수준 무손실 가드(theme 외 항목 직렬화 동일 확인)로 `theme` 1건만 주입(utils 다음 고정 위치).
- **멱등**: 재실행 2→3회 산출 md5 동일(`md5 -c` OK). `generate:design` 직접 실행 exit 0, globals.css md5 무변경.
- **왕복 반영**: `tokens.ts`의 `--ring` 라이트값을 임시 변경 → 재생성 → 3산출 전부 반영(globals 1행·registry theme 1값·tokens.md 1행) → 원복 → 재생성 → 3산출 원상복귀, 임시값 잔존 0건.
- 첫 실행 출력: «무손실 검증 통과 → 마커 삽입(첫 실행) / theme 항목 주입(utils 다음) / docs/tokens.md 생성».

## 2. T-14 `audit:design` — 일관성 기계 감사 (AC-10, V-10·V-11)

산출: `packages/unikit/scripts/audit-design.ts`, 루트 `package.json` 스크립트(`audit:design`). 요구 기준 7종 (a)~(g)를 내부 검사 8건((a1)(a2) 분해)으로 검사, 위반 시 exit 1. 검사 기준 포맷터(`buildGlobalsBlock`·`buildTokensDoc`·마커)를 generate 스크립트와 공유 — «감사는 생성의 역» 원칙.

**구현 중 자체 발견·수정 결함(정직 기록)**: 첫 버전에서 generate 모듈의 최상위 실행 코드가 audit의 import로 함께 실행되어, 감사가 파일을 **재생성한 뒤** 검사하는 구조였다(드리프트 주입이 재생성으로 덮여 (a1)/(f)가 영원히 OK가 되는 은폐 구조). 첫 실행 로그에 «generate:design 완료» 줄이 섞여 나온 것으로 발견 → `import.meta.main` 가드로 진입점 실행 분리. 수정 후 «감사 실행 전후 산출 3종 md5 무변경»으로 무부수효과 확인.

### V-10 — 현재 상태 통과

```
[OK] (a1) globals.css 생성 영역 일치(1321B)      [OK] (e) files 경로 전부 실재(7항목)
[OK] (a2) theme cssVars light/dark 값 일치        [OK] (f) tokens.md 생성물과 byte 일치(2956B)
[OK] (b) 원색 리터럴 0건 (9파일)                 [OK] (g) Tailwind 팔레트 클래스 0건 (10파일)
[OK] (c) 임의값 클래스 0건 (10파일)              [OK] (d) registry 사본 6종 동일(import 치환 제외)
→ audit:design PASS — 8/8 검사 통과, exit 0
```

### V-11 — 음성 시험 8종 (주입 → exit 1 + 대상 FAIL → 원복 → exit 0)

주입 위치는 검사별 격리를 설계했다 — (c)/(g)는 원본·사본 **양쪽에 동일 줄** 추가로 (d) 통과를 유지, (b)는 (d) 대상 밖인 `src/theme/provider.tsx`에 주입.

| # | 주입 | exit | FAIL |
|---|---|---|---|
| 1 | (a1) globals `--background` `100%`→`99%` | 1 | (a1)만 |
| 2 | (a2) registry theme cssVars 라이트 1값 오염 | 1 | (a2)만 |
| 3 | (b) provider.tsx에 `#fff` 주석 | 1 | (b)만 |
| 4 | (c) button 원본·사본 양쪽 `w-[37px]` 주석 | 1 | (c)만 |
| 5 | (d) `registry/ui/button.tsx`에 drift 줄 | 1 | (d)만 |
| 6 | (e) files 경로 → 존재하지 않는 `ghost.tsx` | 1 | (e)만 |
| 7 | (f) tokens.md 첫 값 `100%`→`99%` | 1 | (f)만 |
| 8 | (g) button 양쪽 `hover:bg-zinc-500` 주석 | 1 | (g)만 |

- 8종 전부 exit 1 + **대상 검사만** FAIL(교차 오발생 0). 전량 원복 후 exit 0, 원복 byte 일치 6/6파일.
- (g) 매처 단위시험(G1 확정 regex — 12-design-plan §2.2 양성/음성 사례): 양성 8종(`bg-zinc-500`·`text-white`·`from-black`·`border-gray-200`·`ring-red-500`·`hover:bg-zinc-500`·`web:text-white`·`focus-visible:bg-rose-100/50`) 전부 감지, 음성 12종(`web:hover:bg-primary/90`·`placeholder:text-muted-foreground`·`focus-visible:ring-2`·`ring-ring`·`ring-offset-background`·`outline-none` + 토큰 유틸리티 6종) 오경보 0.
- 시험 7의 첫 시도는 주입 실패(exit 0)였다 — 원인은 검증 도구 쪽 함정: GNU sed에서 백틱 앞 `\` 는 리터럴이 아니라 **버퍼 시작 앵커**(`\A`)로 해석되어 미매칭. 백슬래시 없는 패턴으로 재시험해 exit 1·(f) 적중 확인. (피감사물 결함이 아니라 시험 도구 결함이며, 재시험으로 보완.)

## 3. T-15 소비자 전달 — `theme` 항목 한 줄 설치 (AC-11·AC-12, V-12)

레지스트리 전선(`apps/web/app/r/[name]/route.ts`·`lib/registry.ts`)은 **수정 0** — theme 항목이 registry.json에 있으니 그대로 서빙된다.

- `/r/theme.json` → HTTP 200, `type: registry:theme`, `cssVars` light/dark 각 20키 (기존 `.next` 프로덕션 빌드 + `force-dynamic` 런타임 로드 — 재빌드 불필요 실측).
- **소비자 재현**(신규, `/tmp/my-unikit-app` 보존): `create-next-app@latest --ts --tailwind --app --use-bun` → `shadcn init -b base -p nova -y` → Tailwind 3.4 강등(README 2단계 절차 준용).
- **핵심 절차 1줄**: `bunx shadcn@latest add http://localhost:3000/r/theme.json -y` → «✔ Updating app/globals.css».
- **주입 검증**: 소비자 globals.css의 `:root` 라이트 20/20 · `.dark` 다크 20/20 값 전부 주입. 관찰: shadcn CLI가 채널 문자열(`0 0% 100%`)을 `hsl(0 0% 100%)` 함수형으로 감싸 넣음(Tailwind 4 소비자 규격 변환) — **값 자체는 무손실**. `--radius`는 그대로.
- **문서 대체(AC-12 — 근사 값 사본 2→0)**:
  - README 4-(d): 57행 CSS 값 블록 통째로 → `theme.json` add 1줄 절차(서버 실행 중 주의 + hsl 래핑 노트 + 카탈로그 링크).
  - docs/components.md §테마: 값 나열 표 13행 제거 → 역할 구조 요약(값 없음) + 카탈로그(`packages/unikit/docs/tokens.md`) 참조로 교체. destructive WCAG 조정·radius 파생 규칙은 값 없이 유지.
  - README 부수 갱신: 기여 절에 `generate:design`/`audit:design` 명령 안내, 저장소 구조(registry.json 아이템 7종·docs/tokens.md), 문서 목록에 카탈로그 추가.
- **완료 기준 스캔**: README.md·docs/components.md에서 HSL 리터럴 패턴(`\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%`) **0건**.

## 4. V-13 — 통합 회귀

| 검사 | 결과 |
|---|---|
| 루트 `bun run typecheck` (3패키지) | @unikit/core·expo·web 모두 exit 0 |
| `/r/button.json`·`/r/registry.json`·`/r/theme.json` | 200·200·200 (회귀 0) |
| `apps/expo/dist` (8081 정적 산출) | mtime 2026-11-08 00:18 불변 — 2차 사이클 중 재생성 없음 |
| README·components.md 값 사본 | 0건 (위 §3) |
| `audit:design` | PASS 8/8, exit 0 |

## 5. 잔여 사항·한계

- **G2 독립 검증 인계(F-26·F-27, 전부 P3 — 이번 스냅샷 유지)**: F-26 — audit (d) 검사의 컴포넌트 목록이 5종 하드코딩(현 트리는 전수와 동치). **6번째 컴포넌트 추가 사이클에서 디렉터리 스캔 쌍 대조로 개선할 것.** F-27 — 루트 `generate:design` 스크립트를 계획에 명시 없이 추가(README «루트 실행» 안내와는 일치).
- F-11(Pressable onPress, P1)은 이번 사이클 범위 밖(10-requirements §4 scope-out). 에뮬레이터에서는 귀결 완료·실물 확인 대기(03 문서 §7.3).
- 레지스트리 홈페이지 주소가 `localhost:3000`인 것은 1차 인계 그대로(공개 시 README 갱신 필요).
- 소비자 재현물 `/tmp/my-unikit-app`는 증거 보존용(재부팅 시 소실 가능) — 재현 절차는 README 1~4단계에 전부 문서화돼 있어 재생 가능.
