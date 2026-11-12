# 사이클 74 설계·계획 — 데모 앱 컴포넌트 사용 확대·디자인 토큰 정합성

- 요구: docs/sdd/83-requirements.md · 기준 리비전: 61bb7af + 미커밋 데모 8파일(보존 대상 위 수정)
- 검증 환경: 루트 `bun run typecheck`·`bun run audit:design`, `cd apps/web && bun run build`(전부 실존 명령). 엑스포: 안드로이드 에뮬레이터(emulator-5554, 메트로 8083 관행) + T3 디바이스 도구 스크린샷. 웹: 프리뷰 414px·1280px.

## 편성(압축형 — UI 변경, 규모 中)

- 수행: `Frontend/UI Engineer` 단일(오케스트레이터 role-perspective self-execution, 파일 7개 직렬 — 병렬 무교집합 분할 이득 없음).
- 독립 평가: `Staff Code Reviewer`(G3 — 요구·계획 대조 Task QA 렌즈 겸장), `UX/Design Auditor`(G4 — 실화면 스크린샷 격리 평가), `Release Gatekeeper`(G5). 위임 도구(Agent)로 격리 스폰 — 작성≠평가 분리.

## 태스크(T)

| 태스크 | 내용 | 파일(수정 허용 경계) | 선행 |
|---|---|---|---|
| T-1 | 토큰 유도 헬퍼 신규 — `useIconColors()`(getThemeTokens 기반 fg·muted·onPrimary) + 채널→레거시 hsl() 변환 | `apps/expo/lib/token-colors.ts`(신규) | — |
| T-2 | 엑스포 기존 2파일 아이콘 색 헬퍼 교체(지어낸 값 → fg/muted 정규화) + 앱 인덱스 데모 진입 블록 `text-[10px]`→`text-xs` | `apps/expo/app/index.tsx`, `apps/expo/app/component/[slug].tsx` | T-1 |
| T-3 | 엑스포 데모 2파일 — 아이콘 색 헬퍼(+보내기 onPrimary), 임의값 치환, 헤더 ⋯ DropdownMenu, 첨부 Progress, 설정 시트 Field+Separator | `apps/expo/app/demo/index.tsx`, `apps/expo/app/demo/chat.tsx` | T-1 |
| T-4 | 웹 데모 2파일 — 임의값 치환, 헤더 ⋯ DropdownMenu, 첨부 Progress, 설정 시트 Field+Separator, 작성줄 Kbd(Enter 실동작 연결) | `apps/web/components/demo/assistant-screen.tsx`, `apps/web/app/demo/page.tsx` | — |
| T-5 | 구현 증거 문서(AC별 증거·관문 판정 원장) | `docs/sdd/85-implementation-evidence.md` | T-1~T-4·V 후 |

> 경로 갱신(2026-11-12, 사이클 75에서 이동): T-4의 웹 데모 파일은 Blocks 섹션 편성으로
> `apps/web/components/blocks/assistant-screen.tsx`·`apps/web/app/blocks/assistant/`로
> 이동했다. 당시 기준 경로는 위 표 기록 그대로 보존한다.

## 설계

### T-1 헬퍴(`apps/expo/lib/token-colors.ts`)

- `getThemeTokens(colorScheme)`의 채널 문자열(`"240 10% 3.9%"`)을 RN 파서가 확정 지원하는 레거시 형식 `hsl(240, 10%, 3.9%)`로 변환(`replaceAll(" ", ", ")`)해 반환.
- `useIconColors()` 훅: `useUnikitTheme()`에서 colorScheme을 받아 `{ fg, muted, onPrimary }` 반환 — 각 `--foreground`·`--muted-foreground`·`--primary-foreground` 유도. 머리주석에 «hsl 재타이핑 금지, 이 훅에서만 유도» 계약 기록.
- 정규화 매핑: 기존 `iconColor`→`fg`, `mutedIconColor`→`muted`, `subtleIconColor`(지어낸 45%/75%)→`muted`(웹 대응물이 `text-muted-foreground/60`인 것과 계열 일치), 보내기 화살표 `hsl(0 0% 98%)`→`onPrimary`.

### T-3/T-4 컴포넌트 투입(양 플랫폼 같은 구조)

- **헤더 오버플로우(DropdownMenu)**: `Plus`·`SlidersHorizontal` 아이콘 버튼 2개를 `⋯`(lucide `MoreHorizontal`) 트리거 1개로 통합 — 항목 «새 대화»·«설정». 모바일 헤더(아바타+제목+Select) 밀도 개선이 목적. 동작(새 대화 초기화·설정 시트 열림)은 기존과 동일.
- **설정 시트(Field+Separator)**: 항목 3개(창의성·스트리밍·시스템 프롬프트)를 raw Text 2줄 조합에서 `Field > FieldContent > (FieldLabel · 컨트롤 · FieldDescription)`로 재구성, 항목 사이 `Separator`. «스트리밍» 행은 가로 배치 유지(`Field flex-1` + `Switch`).
- **첨부 업로드 Progress**: 작성줄 첨부 그룹 아래 `Progress`(h-1.5, 가짜 진행 8→46→80→완료, 900ms — 기존 업로드 지연과 같은 타이밍). 업로드 없으면 미표시. `accessibilityLabel="첨부 업로드 진행"`.
- **웹 Kbd**: 작성줄 아래 `Enter ↵` 힌트(`hidden md:flex`, 우측 정렬). **Enter 실동작을 연결한다**(브리지 Textarea의 웹 onKeyDown 전달 가능 여부를 구현 시 확인 — 불가 시 `web:` 클래스가 아니라 실 이벤트가 없으면 힌트를 «⇧+↵ 줄바꿈» 사실만으로 한정하거나 미조합 시 Kbd 미사용으로 전환 — 거짓 힌트 금지).
- **임의값 치환표**: `max-w-[640px]`→`max-w-2xl`(672px), `w-[120px]`→`w-30`(120px), `w-[110px]`→`w-28`(112px), `max-w-[220px]`→`max-w-56`(224px), `max-w-[240px]`→`max-w-60`(240px), `text-[10px]`→`text-xs`.

### 동기·회귀 경계

- 양 플랫폼 사본 구조 일치(기존 머리주석 계약). 엑스포 전용(KeyboardAvoidingView·Share·SafeAreaView·아이콘 색 헬퍼)·웹 전용(Kbd·Copy·링크 라우팅) 차이는 주석 유지.
- 대화 흐름(스트리밍·재시도·첨부 완료 상태) 로직 무변경 — UI 조합만 교체.
- 사용자 WIP 3파일(landing.tsx·native.tsx·앱 인덱스 진입 블록) 중 수정은 앱 인덱스 `text-[10px]` 1곳뿐(데모 진입 블록 품질 보정, 기능 불변).

## 검증(V)

| 검증 | 내용 | AC | T |
|---|---|---|---|
| V-1 | 루트 `bun run typecheck` exit 0 | AC-6 | 전체 |
| V-2 | `cd apps/web && bun run build` exit 0 | AC-6 | T-3·T-4 |
| V-3 | 루트 `bun run audit:design` exit 0 | AC-6 | — |
| V-4 | grep: `apps/expo/app`·`apps/web` 데모에서 hsl( 리터럴 0건(헬퍼 파일 제외), `-\[` 임의값 0건(주석 제외) | AC-1·3 | T-1~4 |
| V-5 | 에뮬레이터(emulator-5554) 라이트·다크: 데모 홈·채팅 스크린샷 — 보내기 버튼 양 모드 가시(AC-2), ⋯ 메뉴·설정 Field·첨부 Progress 관찰. 오케스트레이터가 device_screenshot으로 직접 육안 확인 | AC-2·4·5 | T-3 |
| V-6 | 웹 프리뷰 414px·1280px: 홈·채팅 — Kbd·⋯ 메뉴·설정 시트 관찰 | AC-4·5 | T-4 |
| V-7 | 독립 `Staff Code Reviewer` diff 리뷰(요구·계획 대조 포함) PASS | 전체 | 전체 |
| V-8 | 독립 `UX/Design Auditor` 스크린샷 평가 PASS | AC-2·4 | 전체 |
| V-9 | 독립 `Release Gatekeeper` 최종 판정 PASS | 전체 | 전체 |

## 위험과 완화

- 브리지 Textarea의 웹 key 이벤트 미지원 → Enter 실동작 불가 시 Kbd 힌트 내용을 실동작 기반으로만 구성(설계에 명시).
- DropdownMenu 오버플로우가 데스크톱 웹에서 1클릭 더 요구 → 모바일 밀도 개선·양 플랫폼 일치의 이득이 우선(기존 버튼 2개가 차지하던 폭 회수). 리뷰에서 이견 시 재검토.
- Progress 가짜 진행이 «속임»으로 읽힐 수 있음 → 데모 앱 특성(대본 응답)과 동일한 맥락, 업로드 완료 상태 전이는 실제 타이머와 일치.
