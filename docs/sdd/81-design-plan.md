# 사이클 73 설계·계획 — 웹 데모 모바일 정리

- 요구: docs/sdd/80-requirements.md · 기준 리비전: 7af9a2b
- 검증 환경(실측): bun 워크스페이스 루트 `/home/loopy/dev/ll3/UniKit`, `bun run typecheck`·`bun run audit:design`·`cd apps/web && bun run build` 전부 실존·실사용 명령(사이클 72 증거 79호와 동일 경로). 브라우저 관찰: 오케스트레이터 스레드의 프리뷰 탭(dev 서버 `localhost:3000`, 프리셋 iphone-xr 414×896 / 데스크톱 1280×800).

## 태스크(T) — 담당 직군·파일 소유권·의존성

수행: Frontend/UI Engineer 단일(오케스트레이터 role-perspective). 파일 소유권 교집합 = ∅(직렬 수행, 병렬 스폰 불필요 — 총 규모 5파일: 코드 4 + 문서 1).

| 태스크 | 내용 | 파일(수정 허용 경계) | 선행 |
|---|---|---|---|
| T-1 | 스크롤바 숨김 유틸 `.site-scrollbar-none` 추가(generate:design 마커 밖, 마케팅 표면 영역) | `apps/web/app/site.css` | — |
| T-2 | 문서 셸: Sheet 드로어 목차 + 헤더 개편(햄버거·GitHub 텍스트 링크) | `apps/web/components/showcase/docs-shell.tsx` | — |
| T-3 | `/showcase` 인덱스: 카테고리 칩 바 + THUMB_SCALE 반응형화 + 스트립 높이 | `apps/web/app/showcase/page.tsx` | T-1 |
| T-4 | 키친싱크 본문 테마 토글 제거(셸 토글로 일원화) | `apps/web/app/showcase/kitchen-sink/page.tsx` | — |
| T-5 | 구현 증거 문서 작성(AC별 증거·관문 판정 원장) | `docs/sdd/82-implementation-evidence.md` | T-1~T-4·V 완료 후 |

## UI 설계

### T-2 문서 셸(docs-shell.tsx)

- **헤더**(전체 뷰포트): `[≡ 목차 열기][UniKit] ⋯ [GitHub 텍스트 링크][테마 버튼(기존)]`.
  - 햄버거: `SheetTrigger`에 lucide `Menu` 아이콘(1.71.0 타입 선언 실존 확인) + `accessibilityLabel="목차 열기"`, `md:hidden`. 아이콘은 이미 사이트가 쓰는 lucide(landing `Star`)와 동일 계열 — 패키지 컴포넌트 머리주석의 «아이콘은 글리프» 규칙은 패키지 소스에만 적용(앱 셸은 기존에도 lucide 사용).
  - GitHub: **텍스트 링크 «GitHub»**(lucide-react 1.71.0에 `Github` 아이콘 부재 — 감사 F-1 반영). 랜딩 헤더의 GitHub 링크와 같은 형태로 셸 헤더에 **신규 추가**(셸 헤더에는 지금 없음 — 랜딩에만 존재), 전체 뷰포트 상시. sm+ 보조 nav(소개·Components·Kitchen sink)는 기존 그대로.
  - 헤더 높이 `h-16` 유지 — 사이드바 `md:top-16`·`md:h-[calc(100dvh-4rem)]`·`scroll-mt-*` 정합 그대로.
- **드로어**: `Sheet`(제어형 `open`/`onOpenChange`) + `SheetContent side="left"`(기본 폭 `w-3/4 sm:max-w-sm` — 414px에서 310px, Astryx 드로어와 유사 폭).
  - 내용: 여백(X 버튼과 겹치지 않게 상단 여유) + `SheetTitle` «목차» + 주요 링크 4(소개 `/`·Components `/showcase`·Kitchen sink·GitHub 외부) + 구분선 + 카테고리별 전체 목차.
  - 목차 목록 렌더는 기존 `DocsSidebar` 그룹 로직을 docs-shell.tsx 안의 공용 내부 컴포넌트로 추출해 사이드바(md+)·드로어(<md)가 같은 마크업을 공유(활성 링크 하이라이트 포함, 신규 파일 없음 — T-2 소유권 그대로). 링크 클릭 → `onOpenChange(false)`.
  - 접근성: `role="dialog"`·`aria-modal`·ESC·백드롭 클릭·스크롤 잠금·포커스 복귀는 ModalOverlay가 제공(패키지 사양) — V-6에서 실물 관찰.
- **사이드바(md+)**: 현행 유지. `<md` 인라인 펼침 분기(`open ? block : hidden`) 삭제 — 모바일은 드로어로 완전 대체.

### T-3 쇼케이스 인덱스(showcase/page.tsx)

- **칩 바**: 헤더 아래 `sticky top-16 z-30`, 배경 `bg-background/90 backdrop-blur` + 하단 보더, <md 좌우 마이너스 마진 풀블리드(md+는 본문 열 시작 정렬 — G3 리뷰 F-3 반영). 내부: `nav aria-label="컴포넌트 카테고리"` + 가로 스크롤(`overflow-x-auto site-scrollbar-none`) + 칩(`shrink-0 rounded-full border px-3 py-1.5 text-sm text-muted-foreground`, hover 전경 반전). 앵커 `#category` 이동·`scroll-mt-32`(헤더 64px + 칩 바 약 51px 클리어런스 — 구현 시 24에서 상향, G3 리뷰 F-4 문서 정정).
- **썸네일**: `THUMB_SCALE` 값을 모바일 기준값 + `sm:` 오버라이드 2단으로 전환(예: card `scale-[0.6] sm:scale-[0.4]`). 스트립 높이 `h-44 sm:h-40`(모바일 여유). 초기값은 추정이므로 V-4 실측(렌더 폭·시각) 후 7종 각각 조정 — 실측값을 82호 증거에 기록.

### T-4 키친싱크(kitchen-sink/page.tsx)

- 본문 헤더 행의 테마 토글 버튼·`useUnikitTheme` 훅 호출(토글 전용이면) 제거. 문구·«← 컴포넌트 목록» 링크 유지.

## 상태 전이·반응형 기준

- 드로어: 닫힘(기본) ↔ 열림(햄버거) — 닫힘 경로 4종(백드롭·ESC·X·링크). 라우트 이동 후에도 닫힘 유지.
- 칩 바: 활성 추적 없음(단순 앵커 — 스크롤스파이는 제외 범위).
- 브레이크포인트: `<640`(썸네일 배율·스트립 높이 모바일값) / `<768`(드로어 노출, 사이드바 숨김) / `≥768`(사이드바·텍스트 nav — 현행).

## 검증(V) — AC ↔ T ↔ V 매핑

| 검증 | 내용 | AC | T |
|---|---|---|---|
| V-1 | 루트 `bun run typecheck` exit 0 | AC-6 | 전체 |
| V-2 | `cd apps/web && bun run build` exit 0(사용자 WIP 포함) | AC-6 | 전체 |
| V-3 | 루트 `bun run audit:design` exit 0(패키지 무변경 확인 겸장) | AC-6 | — |
| V-4 | 414px 관찰: 드로어 열림/닫힘 4경로·칩 바 1줄·썸네일 7종 렌더 폭 실측(getBoundingClientRect ≥ 데스크톱 2열 카드값)·키친싱크 토글 부재 — 스크린샷·수치 기록 | AC-1·3·4·5 | T-2·3·4 |
| V-5 | 1280px 관찰: `/showcase`·`/showcase/button`·`/`(랜딩) 회귀 없음(사이드바·헤더·썸네일) | AC-2·6 | 전체 |
| V-6 | 드로어 접근성 관찰: `role="dialog"`·`aria-modal`·ESC 닫힘·링크 라벨 | AC-1 | T-2 |
| V-7 | 독립 `Staff Code Reviewer`(±`Task QA Validator`) diff 리뷰 PASS | AC-1~6 | 전체 |
| V-8 | 독립 `UX/Design Auditor` 실화면 관찰(구현 모드) PASS | AC-1~5 | 전체 |
| V-9 | PR 생성 확인: 브랜치 푸시·`main` 대상 PR URL·변경 파일 목록에 사용자 WIP 미포함 | AC-7 | T-1~T-5 |

## 위험과 완화

- 썸네일 배율 추정 초깃값의 과·소축 → V-4 실측 루프로 7종 개별 보정(종료 조건: AC-4 폭 기준 + 시각 확인).
- Sheet 드로어가 `DocsProviders`의 `Toaster`·테마 컨텍스트와 중첩 → 시트는 자체 포털을 쓰지만 테마는 문서 루트 클래스라 영향 없음(패키지 사양). V-4에서 다크 모드 드로어 확인.
- sticky 칩 바 z-순서가 드로어(z-50)·헤더(z-40)와 겹침 → 칩 바 z-30으로 헤더보다 아래·드로어보다 아래 고정.
