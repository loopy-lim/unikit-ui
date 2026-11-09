# UniKit G1 통합 설계·계획 (마스터)

- 작성: 오케스트레이터(System Architect·Product/UX Designer 독립 스폰 초안 통합)
- 날짜: 2026-11-07
- 하위 문서: [`02-architecture.md`](02-architecture.md)(기술 설계·태스크 분해 — **T-*/V-*/구조의 원천**), [`02-design.md`](02-design.md)(UI/UX 설계 — **토큰·클래스·카피·체크리스트의 원천**)
- 상태: G1 게이트 독립 평가 대상(`Architecture & Plan Reviewer` + `UX/Design Auditor` 병렬)

## 1. 확정 결정 사항 (D-*)

| ID | 결정 | 근거 |
|---|---|---|
| D-1 | Tailwind **3.4계**(`^3.4.17`), NativeWind 4.2.7 정식 경로. TW4/`@theme`·nativewind 5-RC 금지 | 01-research A-2 수정 판정(공식 설치 문서 고정) |
| D-2 | 레지스트리 전략: **소비자용 복사본 트리(`packages/unikit/registry/`, `@/` import 기준) + apps/web 동적 서빙(`/r/[name]`)**. 빌드 시 재작성 기각 | 02-architecture §6(번들러가 패키지 내 `@/` 별칭을 못 푸는 구조적 이유 + 최소 가정) |
| D-3 | `@unikit/core`는 빌드 산출물 없이 **소스 직접 노출**(`exports → ./src/index.ts`), 앱은 `workspace:*` | 02-architecture §0(Metro/Next 공식 모노레포 패턴) |
| D-4 | 쇼케이스 화면은 **앱 로컬 파일(T-7/T-8)로 각각 구현**하되, `02-design.md` §1.2(구성 트리)·§5(카피 전체 목록)이 **유일 명세**로 양쪽에 똑같이 적용된다. 공유 소스 모듈화는 v0.1 제외(패키지 오염·exports 복잡도 회피). 어긋남은 V-2 나란히 비교로 즉시 포착 | 디자이너 권장(공유 소스) 대비 아키텍트 배치(앱 로컬) 조정 — 명세 단일화로 AC-2 성립 조건 보장 |
| D-5 | 토큰 세트는 shadcn zinc 표준 + `--destructive`(라이트)만 red-600 조정(WCAG AA 4.5:1 충족). 토큰·클래스 문자열·카피는 구현 중 임의 변경 금지(변경 시 02-design 먼저 수정) | 02-design §2.1·§3·§6 |
| D-6 | 태스크 수행은 오케스트레이터가 `Platform/Tooling Engineer`(PLAT)·`Frontend/UI Engineer`(FE) 역할 관점으로 실행(§2 담당 참조), 각 관문 판정은 독립 스폰 에이전트 | 겸임 금지 유지(작성≠평가) |
| D-7 | **패키지 매니저 bun 1.4.4**(2026-11-07, G2 G-D 진행 중 사용자 결정 — 당초 pnpm 12.15.0). 워크스페이스는 루트 package.json `workspaces`, 잠금파일 `bun.lock`, 명령은 `bun install`·`bunx`·`cd <pkg> && bun x …`. R-2 bun 판 2건 해소: ① RN 2인스턴스 → devDeps 버전 정렬 ② Metro/babel 상향 해석 실패 → `bunfig.toml` `linker = "hoisted"` | 사용자 지시; 실측·해소 기록 — 02-architecture §0 변결 노트·§5 R-2 |

## 2. 태스크·검증 요약 (상세는 02-architecture §2·§3)

| ID | 내용 | 담당 | 핵심 선행 |
|---|---|---|---|
| T-1 | 루트 워크스페이스 스캐폴드 + git init(커밋 금지) | PLAT | — |
| T-2 | `@unikit/core` 인프라(peerDeps·cn·index 스켈레톤) | PLAT | T-1 |
| T-3 | `apps/expo` 스캐폴드 + NativeWind·Router | PLAT | T-1, T-2 |
| T-4 | `apps/web` Next 스캐폴드 + RNW·NativeWind | PLAT | T-1, T-2 |
| T-5 | 테마 토큰·Provider·`hsl(var(--token))` 매핑 | FE | T-2~T-4 |
| T-6 | 유니버설 컴포넌트 5종(cva+cn+TS) | FE | T-2 |
| T-7 | Expo 쇼케이스(02-design 명세 그대로) | FE | T-3, T-5, T-6 |
| T-8 | Next 쇼케이스(동일 명세·동일 import) | FE | T-4, T-5, T-6 |
| T-9 | 레지스트리 구축 + `/r` 동적 서빙 | PLAT | T-4, T-6 |
| T-10 | 소비 재현(`/tmp/unikit-consumer`) | PLAT | T-9 |
| T-11 | 통합 검증 V-1~V-8(수정 권한 없음, 회귀 지시) | PLAT | T-3~T-10 |
| T-12 | 한글 문서(README·components·Expo Go) | FE | T-10, T-11 |

실행 그룹(02-architecture §4.1): `G-A: T-1→T-2` → `G-B: T-3∥T-4` → `G-C: T-5∥T-6` → `G-D: T-7∥T-8∥T-9` → `G-E: T-10` → `G-F: T-11` → `G-G: T-12`. 병렬 그룹 파일 소유권 교집합 ∅ 증명: 02-architecture §4.2.

AC↔T↔V 매핑: AC-1↔V-1, AC-2↔V-2, AC-3↔V-3, AC-4↔V-4, AC-5↔V-5, AC-6↔V-6, AC-7↔V-7, AC-8↔V-8 (전부 실제 명령 수반 — 02-architecture §3 표).

## 3. UI 설계 기준 (G4 관문의 판정 기준)

- AC-2 판정: 02-design §4.2 체크리스트(14항목, 기대 HEX 명시) — 캡처 조건 §4.1(390×844)
- AC-6 판정: 02-design §4.3 체크리스트(10항목, 왕복 안정성 포함)
- 접근성: §3.6 RN→RNW DOM 매핑 표(role/aria/label-for) — DOM 검사로 확인

## 4. 리스크 요약 (전체 목록 02-architecture §5)

R-1 Next16+Turbopack RNW 별칭(→ webpack 강제/next 15 하향) · R-2 의존성 인스턴스 분할(pnpm 판: hoisted 폴백으로 해소 · **bun 전환 판: devDeps 버전 정렬로 해소** — 02-architecture §5 R-2 실측) · R-3 NativeWind 미적용(→ `important:"html"`) · R-4 동적 서빙 실패(→ `shadcn build` 정적) · R-5 두 트리 드리프트(import 라인만 차이 허용 + README 3단계 절차) · R-6 RN 의존성 버전(`expo install`만 사용) · R-7 TW4 섞임(버전 고정 재설치)

## 5. 잔여 한계 (G5까지 인계)

- 네이티브 실물 외형·네이티브 테마 전환 확인 불가(에뮬레이터 부재, 00-requirements §5) → AC-3은 android 번들 성공으로 갈음, 사용자는 README Expo Go 가이드로 자체 확인
- NativeWind "Monorepos" 개별 문서 페이지 미취득(01-research §5) — 필요 시 T-3/T-4 중 재조회

## 6. G1 관문 평가 계획

- `Architecture & Plan Reviewer`(validate-plan `plan` 모드): 요구·추적성 렌즈 + 현행 실행 가능성 렌즈 — 가짜 경로·명령, AC↔T↔V 완전성, 파일 소유권 충돌, 폴백 타당성, D-2·D-4 결정 검증
- `UX/Design Auditor`(review-design 설계 모드): 상태·복구·접근성·반응형 반례 교차 비평, 체크리스트 관찰 가능성, AC-2/6 판정 기준으로서 충분성
- 두 평가 모두 읽기 전용 독립 스폰. 판정·F-*는 원장(ledger.md)에 기록
