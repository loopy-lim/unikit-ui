# UniKit 3차 사이클 설계·계획 — 프리셋 테마·재적용 (G1)

전제: docs/sdd/20-requirements.md(AC-13~16). 작성: System Architect + Platform/Tooling(오케스트레이터 역할 수행 — 2차와 동일, 관문 판정은 독립 스폰 유지) · 판정: 독립 Architecture & Plan Reviewer(validate-plan plan 모드).

## 0. G0 이월 결정 사항 확정 (20-requirements §7)

1. **값 출처(F-33 통일안 채택)**: Tailwind 공식 팔레트(hex — `node_modules/tailwindcss/colors.js`, TW 3.4 패키지 동일 재료)에서 계산 + WCAG 대비 기계 검증. 기본 zinc 현행 20값이 같은 공식(팔레트 hex→HSL 채널, 소수 1자리 반올림)의 유도값과 정확히 일치함을 G0에서 실측(예: zinc-800→`240 3.7% 15.9%` = 현행 다크 secondary). shadcn 공개 테마와 같은 재료·같은 관례(계산 결과가 shadcn slate 테마 값과 일치하는 단계 다수)이나, 출처 표기는 «Tailwind 공식 팔레트 계산 + 대비 검증» 하나로 한다.
2. **registry 항목 이름**: 기본은 **«theme» 유지**(README 기존 안내·2차 실측 전부 이 이름 — 변경 이득 없음). 프리셋 3종: `theme-blue`·`theme-emerald`·`theme-amber`.
3. **type 기반 필터(AC-15 (a))**: 감사는 `items.filter(i => i.type === "registry:theme")` 전수 수집 → ①항목 수·이름 집합이 소스 정의와 정확히 일치(누락·과잉 모두 FAIL) ②각 항목 cssVars를 대응 소스와 전수 대조. 이름 우연 매칭(`find(name==="theme")`) 폐지.

## 1. 설계 원칙 (2차 원칙 준용 + 3차 추가)

1. **값의 출처는 `src/theme/` 안 값 정의 파일들** — 기본 = tokens.ts(기존), 프리셋 3종 = presets.ts(신규). 그 외 모든 사본(registry theme 항목들·문서)은 generate가 생성.
2. **검사는 생성의 역** — (a2)는 type 기반 다중 항목 전수 대조로 확장. 기준 포맷터 공유 원칙 불변.
3. **신규 의존성 0** — 대비 계산(HSL→sRGB→상대휘도)도 자체 산수 함수(약 20줄)로 구현, 외부 패키지 없음.
4. **2차 산물 회귀 금지** — 기본 theme 항목값·globals.css 마커 영역·tokens.md 기본 값 표는 byte 불변. 감사 확장은 기존 8검사의 «강화»만(완화 금지).
5. **(추가) 색 품질은 규칙의 기계 표현으로 보증** — 프리셋 primary 단계 선택 규칙과 대비 기준을 감사가 매 실행 재계산(일회성 증명이 아니라 상시 시행).

## 2. 프리셋 데이터 설계

### 2.1 `packages/unikit/src/theme/presets.ts` (신규)

```ts
import type { UnikitThemeTokens } from "./tokens";

export interface ThemePreset {
  label: string;        // 카탈로그 표기용(값 아님)
  neutral: string;      // 중립 계열 이름(카탈로그·문서용)
  light: UnikitThemeTokens;
  dark: UnikitThemeTokens;
}

export const themePresets = {
  blue:     { label: "Blue",     neutral: "slate", light: {...}, dark: {...} },
  emerald:  { label: "Emerald",  neutral: "zinc",  light: {...}, dark: {...} },
  amber:    { label: "Amber",    neutral: "stone", light: {...}, dark: {...} },
} as const satisfies Record<string, ThemePreset>;
```

- 타입 `UnikitThemeTokens` 재사용으로 **키 20종 집합을 컴파일 타임 강제**(tokens.ts의 satisfies 패턴 준용).
- **기본(zinc)은 presets.ts에 정의하지 않는다** — tokens.ts의 `lightTokens`/`darkTokens`가 곧 기본 프리셋(값 사본 금지 원칙의 확장 적용). 이름 매핑: `theme`→기본(tokens.ts), `theme-blue`→`themePresets.blue`, … 는 generate·audit가 공유하는 상수 `THEME_ITEMS`(generate에서 export) 하나로 정의.

### 2.2 색 계산 규칙 (기계 표현 — R-2)

중립 계열 N(blue→slate, emerald→zinc, amber→stone — shadcn 관례), 주색 C. 라이트(L)/다크(D):

| 토큰 | 라이트 규칙 | 다크 규칙 |
|---|---|---|
| background | white | N-950 |
| foreground / *-foreground(배경류) | N-950 | N-50 |
| card / popover | white | N-950 |
| **primary** | **«C 단계 중 흰 전경과 대비 ≥4.5:1을 만족하는 가장 밝은 단계»** → blue-600·emerald-700·amber-700 | C-500 |
| **primary-foreground** | white | **N-950** |
| secondary / muted / accent | N-100 | N-800 |
| secondary-/accent-foreground | N-900 | N-50 |
| muted-foreground | N-500 | N-400 |
| destructive / destructive-foreground | **현행 기본값 공통**(red-600계 1차 WCAG 조정 보존) | **현행 다크값 공통** |
| border / input | N-200 | N-800 |
| ring | = primary | = C-500(= dark primary) |
| radius | 0.5rem | 0.5rem |

- **다크 primary-foreground를 주색-950이 아닌 중립-950로 하는 근거(실측)**: 주색-950은 blue에서 대비 4.00:1(WCAG AA 미달). 중립-950은 blue 5.48·emerald 7.84·amber 9.20 — 3종 전부 ≥4.5. 규칙이 단일(«중립-950»)이므로 기계 검증 가능.
- **라이트 primary 단계 선택의 실측 근거**: 더 밝은 단계는 전부 미달(blue-500 3.68·emerald-600 3.77·amber-600 3.19) → 채택 단계가 «가장 밝은 ≥4.5»임이 성립.
- **규칙↔기본 zinc 정합**: 라이트·다크의 **중립 계열 파생 항목 전부**(foreground·secondary·muted·accent·border·input 등)가 현행 기본값과 동일 공식 유도(실측). 예외 — 기본 테마는 현행값 그대로 유지(2차 산물, 원칙 4): ①라이트 primary=zinc-900(규칙 «가장 밝은 ≥4.5 단계»를 zinc에 적용하면 대비 4.62로 zinc-500이 유도되지만, 무채량 기본의 shadcn 관례는 어두운 primary — F-34 반영) ②라이트 primary-foreground=`0 0% 98%` ③다크 primary=`0 0% 98%`·primary-foreground=zinc-900·ring=zinc-300. 규칙은 프리셋 3종 정의에만 적용.

### 2.3 프리셋 값 표 (설계 확정값 — 구현은 이 표를 presets.ts로 옮긴다)

계산 재료: TW 3.4 공식 팔레트 hex → HSL 채널(소수 1자리). 전수 대비(라이트): primary↔전경 5.17/5.48/5.02, background↔foreground 20.17/19.90/19.76, background↔muted-foreground 4.76/4.83/4.80, secondary↔secondary-foreground 16.30/16.12/16.03, destructive↔전경 4.83(공통) — **전부 ≥4.5**. 다크 primary↔전경(중립-950): 5.48/7.84/9.20.

**theme-blue** (중립 slate):

| 토큰 | 라이트 | 다크 |
|---|---|---|
| --background | 0 0% 100% | 228.6 84% 4.9% |
| --foreground | 228.6 84% 4.9% | 210 40% 98% |
| --card | 0 0% 100% | 228.6 84% 4.9% |
| --card-foreground | 228.6 84% 4.9% | 210 40% 98% |
| --popover | 0 0% 100% | 228.6 84% 4.9% |
| --popover-foreground | 228.6 84% 4.9% | 210 40% 98% |
| --primary | 221.2 83.2% 53.3% | 217.2 91.2% 59.8% |
| --primary-foreground | 0 0% 100% | 228.6 84% 4.9% |
| --secondary | 210 40% 96.1% | 217.2 32.6% 17.5% |
| --secondary-foreground | 222.2 47.4% 11.2% | 210 40% 98% |
| --muted | 210 40% 96.1% | 217.2 32.6% 17.5% |
| --muted-foreground | 215.4 16.3% 46.9% | 215 20.2% 65.1% |
| --accent | 210 40% 96.1% | 217.2 32.6% 17.5% |
| --accent-foreground | 222.2 47.4% 11.2% | 210 40% 98% |
| --destructive | 0 72.2% 50.6% | 0 62.8% 30.6% |
| --destructive-foreground | 0 0% 98% | 0 0% 98% |
| --border | 214.3 31.8% 91.4% | 217.2 32.6% 17.5% |
| --input | 214.3 31.8% 91.4% | 217.2 32.6% 17.5% |
| --ring | 221.2 83.2% 53.3% | 217.2 91.2% 59.8% |
| --radius | 0.5rem | 0.5rem |

**theme-emerald** (중립 zinc — 중립값은 기본 테마와 동일, primary 계열만 상이):

| 토큰 | 라이트 | 다크 |
|---|---|---|
| --background | 0 0% 100% | 240 10% 3.9% |
| --foreground | 240 10% 3.9% | 0 0% 98% |
| --card / --card-foreground | 0 0% 100% / 240 10% 3.9% | 240 10% 3.9% / 0 0% 98% |
| --popover / --popover-foreground | 0 0% 100% / 240 10% 3.9% | 240 10% 3.9% / 0 0% 98% |
| --primary | 162.9 93.5% 24.3% | 160.1 84.1% 39.4% |
| --primary-foreground | 0 0% 100% | 240 10% 3.9% |
| --secondary / --muted / --accent | 240 4.8% 95.9% | 240 3.7% 15.9% |
| --secondary-foreground / --accent-foreground | 240 5.9% 10% | 0 0% 98% |
| --muted-foreground | 240 3.8% 46.1% | 240 5% 64.9% |
| --destructive / --destructive-foreground | 0 72.2% 50.6% / 0 0% 98% | 0 62.8% 30.6% / 0 0% 98% |
| --border / --input | 240 5.9% 90% | 240 3.7% 15.9% |
| --ring | 162.9 93.5% 24.3% | 160.1 84.1% 39.4% |
| --radius | 0.5rem | 0.5rem |

**theme-amber** (중립 stone):

| 토큰 | 라이트 | 다크 |
|---|---|---|
| --background | 0 0% 100% | 20 14.3% 4.1% |
| --foreground | 20 14.3% 4.1% | 60 9.1% 97.8% |
| --card / --card-foreground | 0 0% 100% / 20 14.3% 4.1% | 20 14.3% 4.1% / 60 9.1% 97.8% |
| --popover / --popover-foreground | 0 0% 100% / 20 14.3% 4.1% | 20 14.3% 4.1% / 60 9.1% 97.8% |
| --primary | 26 90.5% 37.1% | 37.7 92.1% 50.2% |
| --primary-foreground | 0 0% 100% | 20 14.3% 4.1% |
| --secondary / --muted / --accent | 60 4.8% 95.9% | 12 6.5% 15.1% |
| --secondary-foreground / --accent-foreground | 24 9.8% 10% | 60 9.1% 97.8% |
| --muted-foreground | 25 5.3% 44.7% | 24 5.4% 63.9% |
| --destructive / --destructive-foreground | 0 72.2% 50.6% / 0 0% 98% | 0 62.8% 30.6% / 0 0% 98% |
| --border / --input | 20 5.9% 90% | 12 6.5% 15.1% |
| --ring | 26 90.5% 37.1% | 37.7 92.1% 50.2% |
| --radius | 0.5rem | 0.5rem |

(계산 스크립트 /tmp/preset-full.ts는 휘발 매체 — 값은 본 표로 설계 영구화. 스키마별 전수값은 구현 후 `/r/theme-blue.json` 등에서도 관찰 가능.)

### 2.4 generate:design 확장 (`packages/unikit/scripts/generate-design.ts`)

- 기존 theme 항목 생성 로직을 `buildThemeItem(name, light, dark)`로 일반화. `THEME_ITEMS = [{ name: "theme", src: 기본 }, { name: "theme-blue", src: presets.blue }, ...]` 상수(export — audit 공유).
- registry 주입: theme(기존 위치·값 불변) + 프리셋 3종을 **그 뒤에 연속 주입**(utils, theme, theme-blue, theme-emerald, theme-amber, button, …). 기존 항목 직렬화 불변 가드(2차 무손실 가드)를 유지하되 가드의 strip 제외 목록을 theme 1개에서 **THEME_ITEMS 이름 전체**로 확장한다(F-35) — 현행 가드는 theme만 빼고 비교하므로 프리셋 3종 첫 주입이 무손실 검증 실패로 중단된다.
- **globals.css 산출 불변** — 기본 프리셋만 주입(쇼케이스는 기본 유지 — 범위 밖 4번). 재생성 결과 현행과 byte 동일해야 함(원칙 4, V-14 ③).
- tokens.md: 기존 구성(기본 값 표 20행 등) 불변 + 신규 §프리셋(생성): 표 4행(항목명·중립 계열·라이트 primary 단계·핵심 대비비[계산값]·add 명령 1줄) + «프리셋 전체 값은 `src/theme/presets.ts`와 `/r/theme-<이름>.json`» 안내. 프리셋 전체 값 표는 카탈로그에 넣지 않는다(AC-16 완료 기준은 목록+기본 값 표). **대비 산수 함수(`contrastRatioHsl`)는 generate에 구현해 export하고 audit가 import** — 포맷터 공유와 동일 구조로 «감사는 생성의 역» 원칙 적용(F-38).
- `export const VALUE_SOURCES = ["src/theme/tokens.ts", "src/theme/presets.ts"]` — 값 정의 파일 목록의 단일 정의점. audit (b)가 import해 제외 목록으로 쓴다(F-32 일반화: 값 파일 추가 시 generate의 import와 이 상수가 같은 파일에서 갱신됨).

### 2.5 audit:design 확장 (`packages/unikit/scripts/audit-design.ts`)

- **(a2) 다중화**(AC-15 (a)·AC-13 (b)(d)):
  1. `items.filter(type === "registry:theme")` 수집 → 이름 집합이 `THEME_ITEMS`와 정확히 일치(부족·과잉 FAIL).
  2. 각 항목 cssVars light/dark ↔ 대응 소스(tokens.ts 또는 presets.ts) **전수 비교**(프리셋 3종 = 120비교 추가).
  3. 각 프리셋 형식: 키 20종·HSL 채널 문자열·radius 1종(AC-13 (c)).
  4. **대비 산수 검사(신규, AC-13 (d)의 상시 시행)**: generate가 export한 `contrastRatioHsl`(HSL 채널→sRGB→WCAG 상대휘도→대비비)을 import해 사용. 각 프리셋 라이트 `primary↔primary-foreground`·`background↔foreground` ≥4.5 검사. 미달 시 FAIL(음성 시험: primary를 밝은 단계값으로 변조 → 적중).
- **(b) 제외 목록**: `["../src/theme/tokens.ts"]` 하드코드 → `VALUE_SOURCES`(generate 공유)로 전환.
- 검사 수 표기 «요구 기준 7종 (a)~(g)·내부 검사 8건» 유지 — (a2)가 다중 항목을 내부 루프로 처리(검사 수 불변, 20-requirements §5 제약 충족).
- (a1)(c)(d)(e)(f)(g) 로직 불변 — V-15 ① 현황 8/8로 회귀 확인.

### 2.6 소비자 검증 도구 — `packages/unikit/scripts/check-consumer-theme.ts` (신규, F-31)

- 실행: `bun run check:consumer <소비자 globals.css 경로> <프리셋명: zinc|blue|emerald|amber>` (packages/unikit 스크립트 등록).
- 동작: **중괄호 깊이 파서**(문자 스캔, depth 카운트 — 2차 실측에서 정규 `[^}]*`·문자열 split이 실패한 지점의 안전한 일반화)로 `:root`·`.dark` 선언 블록 추출 → UniKit 20키만 대조(`--sidebar*`·`--chart-*` 등 소비자 자산 무시) → 값 비교는 `hsl(...)` 함수 래핑 양쪽 허용(스트립 후 비교) → 불일치 키 상세 출력, 전부 일치 시 exit 0.
- 용도: AC-14 관찰 수단(설치·교체·멱단 판정) — 사람 눈 대조 제거.

### 2.7 README 갱신 (AC-16)

- 4-(d)에 **프리셋 선택 표**: 4행(테마·인상·add 명령 1줄 — `bunx shadcn@latest add http://localhost:3000/r/theme-blue.json -y` 등).
- **재적용 안내**(실증 동작과 일치 — R-1 실측 기반): 다른 프리셋 add 한 번 = 그 자리 값 교체(잔존 0)·같은 프리셋 재add = 멱등(값 불변). 일괄 add(`/r/registry.json`)는 안내하지 않는다(R-1 제약 ①).
- HSL 리터럴 0건 유지(값은 presets.ts·카탈로그에만).

## 3. 태스크 (T-17~T-21)

| 태스크 | 내용 | 산출 파일 | AC | 검증 |
|---|---|---|---|---|
| T-17 | presets.ts 작성(§2.3 값) + generate 확장(다중 theme 항목·tokens.md 프리셋 절·VALUE_SOURCES·THEME_ITEMS export) | presets.ts(신규)·generate-design.ts·registry.json·docs/tokens.md | AC-13 (a)(c) | V-14 |
| T-18 | audit 확장((a2) type 기반 다중화·대비 산수·(b) VALUE_SOURCES) + 음성 시험 5종 | audit-design.ts | AC-13 (d)·AC-15 | V-15 |
| T-19 | check-consumer-theme.ts 제작 + 단위시험(2차 소비자 실물 파일로 양성·변조 음성) | check-consumer-theme.ts(신규)·package.json(check:consumer 스크립트 — F-40 반영) | AC-14 도구 | V-16 |
| T-20 | 소비자 실증: 신규 소비자(§5 조합) → blue 설치 → emerald 교체 → 재실행 멱등(전부 -y만) | /tmp/my-unikit-app-3 + 시행 기록 | AC-14 | V-17 |
| T-21 | README 갱신(프리셋 표·재적용 안내) + 통합 회귀 + 구현 증거 문서(23-implementation-evidence.md) | README.md·docs/sdd/* | AC-16 | V-18 |

- 의존성: T-17 → {T-18, T-19}(병렬 가능 — 파일 소유권 ∅: audit-design.ts vs check-consumer-theme.ts) → T-20(T-17 레지스트리 + T-19 도구 필요) → T-21.
- 태스크별 수행 관점(F-37 — 전부 오케스트레이터 직접 수행, §7): T-17·T-18·T-19·T-21 = Platform/Tooling Engineer 관점, T-20 = Verification/Test Engineer 관점(소비자 실증).
- 파일 소유권: T-17 = presets.ts·generate-design.ts·registry.json·tokens.md(+globals.css 불변 확인) / T-18 = audit-design.ts / T-19 = check-consumer-theme.ts / T-20 = /tmp 산물(저장소 파일 수정 0 — 서빙만) / T-21 = README.md·docs/sdd/*.

## 4. 검증 계획 (V-14~V-18)

- **V-14 (T-17)**: ①멱등 — generate 2회 연속 산출 md5 불변 ②왕복 — presets.ts blue 라이트 primary 임시 변경 → 재생성 → registry theme-blue 1값·tokens.md 프리셋 표 반영 확인 → 원복 → 재생성 → 잔존 0 ③무손실 — 기본 theme 항목값 byte 불변·globals.css 마커 영역 byte 불변·registry 기존 항목(utils·컴포넌트 5종) 직렬화 불변·**tokens.md 기본 값 표(20행) 영역 byte 불변**(F-36) ④AC-13 (a)(c) — theme 항목 4개·각 20키 형식.
- **V-15 (T-18)**: ①현황 audit exit 0·8/8(회귀 없음) ②음성 5종(주입 → 대상만 FAIL·exit 1 → 원복 → exit 0): presets.ts 1값 오염→(a2) / registry theme-emerald 1값 오염→(a2) / registry theme 항목 1개 삭제→(a2) 누락 적중 / presets.ts primary를 blue-500값으로 변조→대비 검사 / provider.tsx에 `#fff` 주석→(b)(제외 목록이 presets.ts만 빼고 provider는 여전히 검사됨을 반증).
- **V-16 (T-19)**: ①양성 — 2차 소비자 실물 `/tmp/my-unikit-app/app/globals.css`로 zinc 지정 → 20/20·20/20 exit 0 ②음성 — 1값 변조본에서 정확히 해당 키·스킴 지적·exit 1 ③내성 — `--sidebar*` 8키·`--chart-*` 5키 무시 확인, hsl() 래핑·비래핑 양쪽 통과.
- **V-17 (T-20 = AC-14)**: 신규 소비자(§5 조합 재현)에서 ①`add /r/theme-blue.json -y` → 파서 blue 20/20·20/20 ②`add /r/theme-emerald.json -y` → 파서 emerald 20/20·20/20(전수 일치 = blue 잔존 0 자동 입증)·변수 수 불변(블록 증식 없음 — 키 카운트 대조) ③emerald 재add → globals.css md5 불변(멱등). 전 과정 플래그 `-y`만.
- **V-18 (T-21)**: 루트 typecheck 3패키지 exit 0·`/r/{theme,theme-blue,theme-emerald,theme-amber,button,registry}.json` 전부 HTTP 200·audit exit 0·`apps/expo/dist` mtime 불변·README/components.md HSL 리터럴 0건·`src/theme/tokens.ts` byte 불변·커밋 0.

## 5. 리스크와 대응

| 위험 | 대응 |
|---|---|
| registry 항목 4개로 /r/registry.json 응답 증가(~2KB×3) | 무해하나 V-18에서 200·내용 점검(항목 수 10종: utils+theme 4+컴포넌트 5) |
| 소비자 add 재실행이 «그 자리 치환»과 다르게 동작(버전 차이 등) | R-1 실측으로 동작 확인 완료(shadcn 4.23). V-17 결과가 다르면 AC-14 미충족으로 FAIL 처리 — 기준 낮춤 없음 |
| (a2) 확장이 기존 검사 의미 변화 | 기존 theme 항목 대조는 다중 루프의 첫 항목으로 동일하게 수행 — V-15 ① 현황 8/8으로 회귀 실증 |
| 프리셋 값 계산 오류(공식·반올림) | 기본 zinc 현행값과의 공식 정합 실측(G0) + 계산값이 shadcn 공개 slate 테마 값과 일치하는 단계 다수(교차 검증) + 대비 산수는 감사가 상시 재계산 |
| 다크 모드 대비 | 요구 기준(AC-13 (d))은 라이트이나, 채택 규칙으로 다크 primary 쌍도 전부 ≥4.5(§2.2) — 문서 기록으로 근거 보존 |

## 6. G3·G4 예고 — N/A 사유

- **G3 N/A**(2차 선례 준용): 컴포넌트 소스 불변. 변경 산출 = 스크립트 2종 확장·신규 도구 1·배포 메타(registry)·문서 — 실행 기반 검증은 G2 독립 재검증(Task QA Validator)이 전부 실시.
- **G4 N/A**: UI·쇼케이스·렌더링 불변(globals.css 재생성 결과 byte 동일 — V-14 ③으로 실증. 소비자 CSS 값 변화는 UniKit 렌더링 자체가 아님). UX 심사는 G5 완료 감사에 통합.

## 7. 검증 환경·직군 편성

- bun 1.4.4 전용. 소비자 실증은 /tmp 신규(2차 실측 조합 재현 — 20-requirements §5: create-next-app → shadcn init → TW 3.4 강등·globals는 TW4 문법 잔존 혼재). 레지스트리 서빙 3000(`force-dynamic` 런타임 로드 — 재빌드 불필요, 세션 휘발 시 `next start` 재기동).
- 작성: 오케스트레이터(System Architect + Platform/Tooling 관점 직접 수행 — 2차와 동일 구조, 13 문서 서두의 독립성 고지 방식 준용). 판정: G1 Architecture & Plan Reviewer(validate-plan plan) → G2 Task QA Validator(task) → G5 Release Gatekeeper(completion).
