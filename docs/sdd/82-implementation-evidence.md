# 사이클 73 구현 증거 — 웹 데모 모바일 정리

- 요구: docs/sdd/80-requirements.md · 설계: docs/sdd/81-design-plan.md
- 구현 리비전: 브랜치 `cycle-73-web-mobile-reorg`(기준 7af9a2b) · 수행: Frontend/UI Engineer(오케스트레이터 role-perspective)
- 관찰 환경: dev 서버 `localhost:3000`, 뷰포트 414×896(iphone-xr)·1024×800·1280×800, T3 프리뷰 도구로 실화면·DOM 측정.

## 태스크 수행 기록

| 태스크 | 결과 | 파일 |
|---|---|---|
| T-1 | `.site-scrollbar-none`(webkit·firefox) 추가 | apps/web/app/site.css |
| T-2 | Sheet 드로어 목차 + 헤더 개편(햄버거·GitHub 텍스트 링크·DocsNavGroups 공용화) | apps/web/components/showcase/docs-shell.tsx |
| T-3 | 카테고리 칩 바(sticky) + THUMB_SCALE 모바일 기준값·sm: 오버라이드 + 스트립 h-44 sm:h-40 | apps/web/app/showcase/page.tsx |
| T-4 | 키친싱크 본문 테마 토글 제거 | apps/web/app/showcase/kitchen-sink/page.tsx |
| T-5 | 이 문서 | docs/sdd/82-implementation-evidence.md |

구현 중 조정: THUMB_SCALE calendar 초깃값 `scale-[0.75]`(실측 186×246 — 월 캡션 «2026년 11월» 행이 스트립(176px) 위로 26px 잘림) → `scale-[0.55]`(136×180, 캡션 topInStrip +4px 노출). 자연 크기 248×328이라 176px 스트립 완전 수용 한계 배율 ≈0.537.

## AC별 증거

### AC-1 모바일 목차 드로어 — 충족

414px /showcase 실측(2026-11-11):

- 헤더: `[≡ 목차 열기][UniKit] ⋯ [GitHub][다크]`. 트리거 `aria-expanded`/`aria-controls` 실측 전환.
- 열림: 패널 `310.5×896px`(= 414×3/4, `w-3/4`), 제목 «목차»(`aria-labelledby` → sheet-title), 링크 65개 = 주요 4(소개·Components·Kitchen sink·GitHub) + 컴포넌트 61(«전체 목록»은 G3 F-1 반영으로 드로어에서 제외 — 최초 실측 66개).
- 닫힘 4경로 전부 실측: 백드롭 클릭(dialog 제거·라벨 «목차 열기» 복귀·body overflow 복원) / ESC(동일 + 포커스 트리거 복귀) / X 버튼(동일 + 포커스 복귀) / 링크 클릭(→ `/showcase/button` 이동·드로어 제거·스크롤 잠금 해제).
- 현재 경로 하이라이트: `/showcase/button`에서 드로어·사이드바 모두 «Button»만 `bg-muted` 활성(단어 단위 클래스 검증 — `hover:bg-muted/50` 오탐 제거).
- 인라인 펼침 목차 분기 삭제 확인(모바일 문서 페이지에 인라인 목차 블록 부재).
- 다크 모드 드로어 관찰 ✓(토큰 전환으로 패널·링크·백드롭 정상 — 스크린샷 mwc23lu9).

### AC-2 GitHub 링크·md+ 회귀 없음 — 충족

- 414px 헤더에 «GitHub» 텍스트 링크(`https://github.com/loopy-lim/UniKit`, target=_blank rel=noreferrer) 상시 노출 실측.
- 1280px: 햄버거 `display:none`, sm 텍스트 nav 3개(소개·Components·Kitchen sink) 표시, 사이드바 `position:sticky top:64px`(=top-16, 헤더 h-16 정합), `/showcase/button` 사이드바 활성 «Button», 본문 pl-40px 기존과 동일. 랜딩 `/` 헤더·히어로·설치·미리보기·푸터 회귀 없음(사용자 WIP «데모 앱» 링크도 그대로 보존).

### AC-3 카테고리 칩 바 — 충족

- 414px: `nav[aria-label="컴포넌트 카테고리"]` 높이 51px **1행**, 칩 8개 가로 스크롤(«데이터»·«메시지·차트» 우측 화면 밖 — 스크롤 가능 신호), 헤더 바로 아래 sticky(top-16, z-30 < 헤더 z-40 < 드로어 z-50).
- 2줄 줄바꿈 없음(과거 flex-wrap 목록 대체). 섹션 `scroll-mt-32`로 앵커 도착 위치 헤더+칩 바 아래.

### AC-4 썸네일 렌더 폭 — 충족

getBoundingClientRect 실측(px, 폭×높이). 모바일 카드 폭 382 / 데스크톱 2열(1024) 카드 324 / 3열(1280) 카드 296.

| 데모 | 모바일(414, 1열) | 데스크톱 2열(1024) | 데스크톱 3열(1280) | 판정 |
|---|---|---|---|---|
| calendar | 136×180 | 124×164 | 124×164 | ✓ |
| card | 209×184 | 116×130 | 105×130 | ✓ |
| chart | 278×160 | 174×120 | 157×120 | ✓ |
| command | 348×138 | 261×124 | 236×124 | ✓ |
| empty | 191×120 | 131×120 | 118×120 | ✓ |
| message-scroller | 296×170 | 174×120 | 157×120 | ✓ |
| sidebar | 313×144 | 218×120 | 197×120 | ✓ |

7종 전부 모바일 렌더 폭 ≥ 데스크톱 2열값(AC 기준). 이전(단일 배율) 대비 예: card 139→209.

### AC-5 키친싱크 토글 일원화 — 충족

414px·1280px `/showcase/kitchen-sink`: `색 테마 전환` 버튼 문서 전체에 1개(셸 헤더) 실측. 본문 헤더는 타이틀 블록만.

### AC-6 정적 검증 — 충족

최종 상태(모든 편집 후) 재실행:

- `bun run typecheck` exit 0(워크스페이스 3패키지)
- `cd apps/web && bun run build` exit 0
- `bun run audit:design` 8/8 PASS(패키지 무변경 — 이번 사이클 apps/web만 변경)

스크린샷(414px: 인덱스·드로어·다크 드로어·데이터 섹션·키친싱크 / 1280px: 인덱스·button 문서·키친싱크·랜딩) — T3 프리뷰 아티팩트로 보존.

### AC-7 PR 생성 — 충족

브랜치 `cycle-73-web-mobile-reorg` → push → main 대상 PR: https://github.com/loopy-lim/UniKit/pull/3. 커밋에서 사용자 WIP 6건(landing.tsx·demo 디렉터리 4건·expo 변경) 제외 확인. 최초 기록은 «커밋 2건(ec13dad·9a4b965)»으로 적었으나 정정(추가 평가 CR-F2) — 브랜치 기점이 로컬 main이고 사이클 72 커밋 3건(9bfca8a·ac1632c·7af9a2b)이 origin/main에 아직 푸시되지 않은 상태라 PR에는 사이클 73분 3건을 포함해 총 6커밋이 올라가 있다(스택 구조). 사이클 72분 병합 순서는 사용자 결정 사항.

## 관문 판정 원장

| 관문 | 평가 | 판정 |
|---|---|---|
| G0 요구 | Requirements Auditor(독립) | PASS(사전 과정, 80호 기록) |
| G1 설계 | Architecture & Plan Reviewer(독립) | PASS(결함 F-1~F-8 반영 후, 80·81호 기록) |
| G2 구현 | Task QA(오케스트레이터 실측 증거) | PASS(위 AC별 증거) |
| G3 코드 | Staff Code Reviewer(독립 스폰) | PASS(P3 5건 — F-1·F-2·F-3·F-4 즉시 반영, F-5 한계 기록. 반영 후 typecheck·build 재실행 exit 0, 브라우저 재확인) |
| G4 UX | UX/Design Auditor(독립 스폰, 실화면) | PASS(P3 2건 — 닫기 «Close» 라벨은 패키지 로드맵 항목으로 아래 잔여 관찰에 기록, 잘린 마지막 칩은 스크롤 신호로 의도된 동작(site.css 주석 방침)) |
| G5 완료 | Release Gatekeeper(독립 스폰) | PASS(2026-11-11 — 명령 3종 본인 재실행 exit 0, diff↔증거 정합, 실화면 스팟 재검증, 커밋 7파일·WIP 6건 제외 목록 확인. P4 지적 1건(본 문서 66→65 수치) 반영 완료) |

## G4 감사 결과(2026-11-11, 독립 실화면 관찰)

AC-1~5 전부 실측 충족 판정. 주요 재검증: 닫힘 4경로(백드롭 x=380 클릭·ESC 포커스 복귀·X·링크 → kitchen-sink 이동 후 드로어 소멸), 767/768px 경계 동작(햄버거↔사이드바 전환), 앵커 도착 top 128px(헤더 64 + 칩 바 51 클리어런스), calendar 캡션 무결(scrollWidth==clientWidth + 이미지 분석), 다크 모드 칩 바·드로어 가독, AI Slop 이상 없음(애니메이션 시트 슬라이드인·transition-colors뿐). 범위 밖 관찰(후속 제안, 비차단): THUMB_SCALE 외 썸네일(form·native-select) 소형 렌더, 다크 모드 secondary·outline 배지 저대비.

## G3 리뷰 결함 처리(2026-11-11)

- **F-1(P3) 드로어 `/showcase` 중복 링크** → `DocsNavGroups`에 `showAllLink` prop 추가, 드로어는 `false` 전달. 재확인: 드로어 링크 66→65개, `/showcase` 링크는 «Components» 1개뿐.
- **F-2(P3) 드로어 주요 링크 클래스 중복** → `docsNavLinkClass(pathname === href)` 재사용으로 치환.
- **F-3(P3) md+ 칩 바 좌측 8px 어긋남** → <md 풀블리드 유지, md+는 `md:mx-0 md:px-0`로 본문 열 시작에 정렬. 재확인: 1280px 칩 바 left 328 = 첫 카드 left 328(사이드바 경계 288 관통 없음), 414px는 0~414 풀블리드 유지.
- **F-4(P3) 설계 문서 scroll-mt 부정확** → 81호 T-3 문구 정정(`scroll-mt-32` 상향 사유 기록).
- **F-5(P3) 리사이즈 엣지 케이스** → 미수정·한계로 수용: 모바일에서 드로어 연 채 ≥768px로 리사이즈하면 트리거 없는 드로어가 남으나 ESC·X·백드롭·링크 4경로로 닫을 수 있어 기능 손실 없음(리뷰어 판정 동일). JS 미디어쿼리 훅 추가는 이 규모에서 과잉.

## 추가 평가(2026-11-11, PR #3 머지 전 재평가)

사용자 요청으로 독립 에이전트 4개(Staff Code Reviewer /review-changes + UX/Design Auditor 3렌즈: 과업 흐름·접근성·시각 위계)를 병렬 스폰해 PR 변경분을 재평가했다. 결과: 앱측 수정 11건 반영, 패키지 소유 관찰 3건 기록, 지적 1건 기각. 수정 후 전 항목 실화면 재검증 + 격리 워크트리 정적 검증 재실행.

### 수정 11건(전부 apps/web, 반영 후 실측)

1. **드로어 스크롤 구조(CR-F1)** — `overflow-y-auto`를 SheetContent에서 안쪽 목록 View로 이동, 제목 행은 `shrink-0` 고정 헤더로. 실측: 목록 scrollHeight 2946/client 843로 내부 스크롤, 바닥 스크롴 시 제목 top 0·내장 X top 16 유지(스크롤에 따라가지 않음), 마지막 링크 Attachment 노출.
2. **calendar 배율(시각 렌즈)** — `scale-[0.55] sm:scale-[0.5]` → `scale-[0.53] sm:scale-[0.48]`. 414px 세로 174 ≤ 스트립 176(상 1·하 2 여백), sm 스트립 160 이내.
3. **card 배율(시각 렌즈)** — `scale-[0.6]` → `scale-[0.57]`. 414px 세로 174 ≤ 176(카드 하단 버튼 행까지 온전).
4. **md+ 로고 16px 우측 밀림(V-F3)** — 원인: Sheet 루트가 항상 View 래퍼를 렌더해 트리거(`md:hidden`)가 화면에서 숨겨진 뒤에도 빈 플렉스 아이템으로 남아 헤더 gap이 한 칸 더 적용됨. 래퍼에 `md:hidden` 부여로 해결. 실측: 768px 로고 x 24 = 사이드바 24(수정 전 40 대 24), 1024px 32 = 32(수정 전 48 대 32).
5. **트리거 라벨 고정** — 제어형이라 트리거는 열기만 가능해 «목차 닫기»는 유령 라벨이었다. 상시 «목차 열기» + `aria-expanded`로 상태 전달(닫힘/열림 실측 false→true).
6. **드로어 GitHub 앵커 클래스 중복(CR-F4)** — 인라인 클래스를 `docsNavLinkClass(false)`로 치환.
7. **GitHub 링크 aria-label(A-F3)** — 헤더·드로어 2곳에 «GitHub (새 창에서 열림)» 추가(접근성 트리에 새 창 힌트 노출 확인).
8. **showcase 404(TF-F3)** — `app/showcase/not-found.tsx` 신규. catalog에 없는 이름(`/showcase/does-not-exist`)에서 셸 레이아웃 안에 «문서를 찾을 수 없어요» + «← 전체 목록»(/showcase) 링크 렌더 실측. 이전은 Next 기본 404가 셸 밖에 떴다.
9. **복사 실패 피드백(TF-F4)** — CodeBlock `catch`가 조용히 실패했던 것을 «복사 실패» 버튼 문구(1.5초 후 복귀)로 변경. clipboard.writeText 거부 주입 실측: «복사»→«복사 실패»→«복사».
10. **드로어 활성 링크 스크롤** — 열림 시 활성(현재 문서) 링크를 `scrollIntoView`로 끌어오기. `/showcase/chart`에서 열면 «Chart» 링크 top 582(뷰포트 896, 수동 스크롤 없이) 노출 실측.
11. **카드 화살표 터치 가시(시각 렌즈)** — hover 전용 `opacity-0 group-hover:opacity-100`을 <md 상시 노출(`opacity-100 md:opacity-0 md:group-hover:opacity-100`)로.

### 패키지 소유 관찰 3건(범위 밖 기록 — 이번 사이클 apps/web 무변경·shadcn 원본 방침 유지)

- Sheet 내장 X 닫기 버튼 히트 에어리어 16×16(size-4 아이콘·패딩 없음) — 터치 타깃 권장(≥24) 미달. 패키지 변경 과제.
- 같은 버튼 `accessibilityLabel="Close"` 영문 — 기존 잔여 관찰과 동일 항목(현지화).
- 테마 선택 미영속 — 새로고침 시 기본으로 복귀. 패키지 Provider 과제(localStorage 등).

### 기각 1건

- 칩 바 활성 추적(스크롤스파이) — 81호에 «활성 추적 없음(단순 앵커 — 제외 범위)»로 명시된 설계 제외 항목. 근거 없는 확장 요구로 기각.

### 접근성 렌즈 정상 관찰(참고 기록)

- 썸네일 61카드 inert 적용 — 내부 포커서블 107개가 탭 순서에서 배제(칩 → 카드 링크 직결).
- 실측 타깃 크기(414px): 햄버거 36×36, 칩 높이 34, 드로어 링크 36×286, 드로어 폭 311.
- 확대: 320px(WCAG reflow 기준) 문서 가로 넘침 없음·헤더 1행(65px) 유지. 240px(200% 근사, 도구 최소폭)에서 드로어 폭 180·링크 잘림 0건·제목/X 겹침 없음.

### 수정 후 정적 검증(격리 시행)

사용자 WIP `apps/web/app/demo/layout.tsx`를 병행 편집 중이라 공유 트리 typecheck가 해당 파일 오류로 오염됨 — HEAD+변경분만 담은 격리 워크트리에서 재검증: `bun run typecheck` 3패키지 exit 0, `cd apps/web && bun run build` 67페이지 성공, `bun run audit:design` 8/8 PASS.

## 잔여 관찰(로드맵 성격, 차단 아님)

- Sheet 내장 X 닫기 버튼의 `aria-label="Close"`가 영문 — 패키지 기본값. 현지화는 패키지 변경 과제(이번 사이클 범위 밖, apps/web 무변경 전제 유지).
- Sheet 내장 X 닫기 버튼 히트 에어리어 16×16 — 터치 타깃 권장 미달(추가 평가, 패키지 변경 과제).
- 테마 선택 미영속(새로고침 시 복귀) — 패키지 Provider 과제(추가 평가).
