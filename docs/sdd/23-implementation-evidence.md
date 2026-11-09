# 23. 구현 증거 (3차 사이클 — 프리셋 테마·재적용)

- 사이클: 3차 (T-17~T-21, AC-13~AC-16 — [20-requirements.md](20-requirements.md) · [22-design-plan.md](22-design-plan.md))
- 원 요청: «그러면 토큰에 대해서 다시 잘 적용할 수 있도록 하고, 미리 준비된 디자인도 사용할 수 있게 할꺼지?»
- 기간: 2026-11-09 · 환경: bun 1.4.4, Linux
- **수행 방식(독립성 고지)**: T-17~T-21 구현과 본 문서 작성은 오케스트레이터가 `Platform/Tooling Engineer`(T-17·T-18·T-19·T-21)·`Verification/Test Engineer`(T-20) 관점으로 직접 수행했다(2차 13 문서와 동일 구조). 따라서 본 문서는 작성자 자기 검증 성격이며, 관문 판정(G2)은 **독립 `Task QA Validator` 스폰**(writer≠evaluator)으로 수행한다. 판정 결과는 [ledger.md](ledger.md) G2(3차) 행.
- 커밋 0 유지(사용자 요청 시에만 커밋).

## 1. T-17 프리셋 소스 + generate 확장 (AC-13 (a)(c), V-14)

산출: `packages/unikit/src/theme/presets.ts`(신규 — 프리셋 3종, `UnikitThemeTokens` 타입으로 키 20종 컴파일 강제), `generate-design.ts` 확장(`THEME_ITEMS`·`VALUE_SOURCES`·`contrastRatioHsl` export, theme 항목 4종 주입, tokens.md 프리셋 절), `registry.json`(항목 7→10종), `docs/tokens.md`(프리셋 절 추가).

V-14 실측 (전 과정 `/tmp/t17-backup/` 사전 백업 3종+α):

- **무손실 전환(확장 첫 실행)**: 기본 theme 항목 registry값 기존과 **byte 동일**(python sort-keys 대조 True)·기존 항목(utils+컴포넌트 5종) 불변 True·**globals.css md5 무변경**(기본만 주입 — 원칙 4)·tokens.md 기본 값 표 20행 무변화(diff: 헤더 출처 1줄 갱신·프리셋 절 삽입·사본 표 2행 갱신만). 항목 순서 `utils, theme, theme-blue, theme-emerald, theme-amber, button, …` 10종.
- **멱등**: 연속 3회 실행 산출 3종(registry·tokens.md·globals) md5 불변(`md5sum -c` OK).
- **왕복**: presets.ts blue 라이트 primary를 `99.9%`로 임시 변경 → 재생성 → registry theme-blue 1값 반영(기본 theme 무오염 True)·tokens.md 대비 표 재계산(5.17→1.00 — 같은 색 대비 산수 정상) → 원복 → 재생성 → `99.9%` 잔존 **0건**(3파일 전수)·산출 3종 최초 실행 상태로 md5 복귀.
- **F-35 반영 확인**: 무손실 가드 strip 제외 목록을 THEME_ITEMS 전체로 확장해 프리셋 3종 첫 주입이 정상 통과(현행 그대로였다면 검증 실패로 중단됐을 경로 — 22-design-plan §2.4).
- **대비 산수(`contrastRatioHsl`, 채널 문자열 기반)**: blue 5.17/다크 5.49·emerald 5.49/7.84·amber 5.01/9.20 — 설계 §2.3 hex 기반값(5.17/5.48·5.48/7.84·5.02/9.20)과 ±0.01 내 일치(반올림 경로 차).

## 2. T-18 audit 확장 (AC-13 (d)·AC-15, V-15)

산출: `audit-design.ts` — (a2) type 기반(`type === "registry:theme"`) 다중화: ①이름 집합 일치(누락·과잉) ②값 전수(4종×2스킴) ③형식(키 20종·HSL 채널 정규식·radius) ④WCAG 대비 산수(generate 공유 함수 — 라이트 ≥4.5). (b) 제외 목록 `VALUE_SOURCES` 공유 상수로 전환(F-32). 검사 수 표기 «요구 7종/내부 8건» 유지.

### V-15 — 현황 + 음성 시험 5종 (주입 → exit 1 + 대상 FAIL → 원복 → exit 0)

현황: **8/8 PASS, exit 0** — (a2) `theme 항목 4/4종 — 값 8스킴 전수·형식·대비(≥4.5) 일치`, (b) `값 정의 2파일 제외` 표기. 기존 (a1)(c)(d)(e)(f)(g) 로직 불변(회귀 0).

| # | 주입 | exit | FAIL |
|---|---|---|---|
| 1 | presets.ts secondary 1값 오염(`96.1%`→`96.2%`) | 1 | (a2)만 |
| 2 | registry theme-emerald 라이트 primary 오염 | 1 | (a2)만 |
| 3 | registry theme-amber 항목 삭제 | 1 | (a2)만(«항목 누락» 적중) |
| 4 | presets.ts blue primary를 blue-500값으로 변조 | 1 | (a2)+(f) |
| 5 | provider.tsx에 `#fff` 주석 | 1 | (b)만 |

- 시험 4의 (a2) 위반 상세에 **«primary↔primary-foreground 대비 3.68:1 < 4.5 (소스 값 품질)»** 명시 확인(대비 검사 적중). (f) 동시 FAIL은 정당한 전파 — 카탈로그 프리셋 표가 계산 대비값을 심으므로 소스 변경 시 재생성 필요 상태가 됨(오탐 아님·원복 후 소멸).
- 시험 5는 제외 목록 확장의 반증: presets.ts(제외)와 provider.tsx(검사 대상)가 나뉘어 동작함을 실증.
- 원복 후 exit 0·원복 byte 일치 3/3(presets.ts·provider.tsx·registry.json `cmp` OK).

## 3. T-19 소비자 검증 도구 (AC-14 관찰 수단 — F-31, V-16)

산출: `packages/unikit/scripts/check-consumer-theme.ts`(신규) + 패키지 스크립트 `check:consumer`. 중괄호 깊이 파서(선택자는 «줄 시작+선택자+{» 만 인정 — `@custom-variant dark (&:is(.dark *))` 본문 언급 미오인), `hsl()` 래핑 스트립, UniKit 20키만 대조.

| 시험 | 입력 | 결과 |
|---|---|---|
| ① 양성 | 2차 소비자 실물 `/tmp/my-unikit-app/app/globals.css` + zinc | :root 20/20·.dark 20/20, 소비자 자산 13키 무시, exit 0 |
| ② 음성 | ①의 `--primary` 1값 변조본 | «:root --primary: 소비자=240 5.9% 11% / 기대=…10%» 정확 적중, exit 1 |
| ③ 내성 | ①에서 `hsl()` 래핑 전부 제거본(비래핑) | 20/20·20/20 통과(양쪽 형식 허용 실증), exit 0 |

## 4. T-20 소비자 설치·재적용 실증 (AC-14, V-17)

소비자 재현: `/tmp/my-unikit-app-3` — **2차 실측 조합 그대로**(F-28): `create-next-app@latest --ts --tailwind --app --use-bun` → `shadcn init -b base -p nova -y` → `tailwindcss@^3.4.17` 강등(`@tailwindcss/turbopack` 제거·postcss 설정) — globals.css는 `@theme inline`(TW4 문법) 잔존 혼재 확인. 기존 `/tmp/my-unikit-app`(2차 증거)은 미변경 보존. 전 과정 플래그 `-y`만 사용(R-1 제약 ②).

| 단계 | 명령(전부 한 줄) | 관찰(전부 check:consumer 기계 판정) |
|---|---|---|
| ① 프리셋 P 설치 | `add http://localhost:3000/r/theme-blue.json -y` | «Updating app/globals.css» → **blue :root 20/20·.dark 20/20** exit 0. 키 수 :root 33·.dark 33(20 UniKit+13 소비자 자산), 중복 0 |
| ② 다른 프리셋 Q로 재적용 | `add http://localhost:3000/r/theme-emerald.json -y` | **emerald 20/20·20/20** exit 0(전수 일치=blue 값 잔존 0 자동 입증). blue 고유값 grep(221.2/228.6/217.2/214.3 계열) **0건**. 키 수 33·33 불변·중복 0(블록 증식 없음) |
| ③ 같은 프리셋 재실행 | `add …/theme-emerald.json -y` (재) | globals.css **md5 불변**(`md5sum -c` OK) → 멱등 |

- ①→②→③은 R-1 사전 실측(/tmp/reapply-probe)의 공식 재현 — 관찰 수단을 사람 눈에서 파서 도구로 대체해 재판정 가능성 확보.
- hsl() 래핑 주입(TW4 소비자 규격 변환) 관찰 — 값 무손실(파서 스트립 비교 통과).
- 특이 흔적(F-42, G5 관찰): 3차 소비자 globals.css의 소비자 자산 영역에 `var(----radius)` 사중 대시 참조가 존재 — shadcn init nova 프리셋의 TW4 잔존 산물이며 **UniKit 20키와 무관**(파서 무시 목록이라 감사·실증 영향 0. «TW4 문법 잔존 혼재» 조합의 구체적 사례로 기록).

## 5. V-18 — 통합 회귀

| 검사 | 결과 |
|---|---|
| 루트 `bun run --filter '*' typecheck` (3패키지) | exit 0 |
| `/r/{theme,theme-blue,theme-emerald,theme-amber,button,registry}.json` | 전부 200 (항목 추가만으로 신규 엔드포인트 자동 서빙 — force-dynamic 런타임 로드 실증) |
| `audit:design` | PASS 8/8, exit 0 |
| `apps/expo/dist` | mtime 2026-11-08 00:18 불변 — 3차 사이클 중 재생성 없음 |
| README·components.md HSL 리터럴 | **0건** (프리셋 add 명령만 추가 — 값은 카탈로그·소스에만) |
| `src/theme/tokens.ts` | 이번 사이클 수정 0 — mtime 2026-11-09 00:23(2차 왕복 시험 원복 시각과 동일·본 사이클 접근 없음. 값 정합은 audit (a1)(a2)가 기계 실증) |
| git | 커밋 0 유지 |

## 6. 문서 갱신 (AC-16)

- **README 4-(d)**: 프리셋 선택 표 4행(테마·인상·add 한 줄) + **재적용·교체 안내**(«그 자리 교체·잔존 없음·블록 무증식 — 실증됨», «같은 프리셋 재실행 멱등 — 실증됨») 추가. 일괄 add(`/r/registry.json`)는 안내하지 않는다(R-1 제약 ①). HSL 리터럴 0건 유지.
- **docs/tokens.md**(생성물): §프리셋 테마 — 4행 표(항목·중립 계열·라이트 primary 단계·핵심 대비비[generate가 매번 재계산]·add 명령) + 프리셋 전체 값 안내(presets.ts·/r/theme-*.json). 감사 (f)가 드리프트 차단.
- **README 저장소 구조 절**(F-39, G2 판정 직후 반영 — F-41): registry 항목 수 표기를 «아이템 7종»에서 **«아이템 10종: utils + 컴포넌트 5종 + theme 4종[기본+프리셋 3]»**으로 갱신.

## 7. 잔여 사항·한계

- **F-26·F-27(P3, 2차 이월)**: 그대로 유지 — F-26(audit (d) names 하드코딩)은 이번 확장 대상 아니었음(컴포넌트 추가 없음·현 트리 동치). F-27도 동일.
- **F-11(P1, 1차 이월)**: 범위 밖 유지(실물 기기 확인 대기 — 03 문서 §7.3).
- 소비자 재현물 `/tmp/my-unikit-app-3`는 증거 보존용(재부팅 시 소실 가능) — 재현 절차는 본 문서 §4·README 4단계에 전부 기록.
- shadcn CLI 4.23 실측 기준(상위 버전 호환 미보증 — 2차 한계 승계).
- `tokens.ts` mtime이 2차 왕복 시험(2026-11-09 00:23) 이후라는 점은 위 §5 표에 기록한 대로 내용 정합을 감사가 대리 실증하므로 증빙 공백 아님.
