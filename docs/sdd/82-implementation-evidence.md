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

브랜치 `cycle-73-web-mobile-reorg` 커밋 2건(ec13dad 코드 4파일·9a4b965 문서 3건) → push → main 대상 PR: https://github.com/loopy-lim/UniKit/pull/3. 커밋에서 사용자 WIP 6건(landing.tsx·demo 디렉터리 4건·expo 변경) 제외 확인.

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

## 잔여 관찰(로드맵 성격, 차단 아님)

- Sheet 내장 X 닫기 버튼의 `aria-label="Close"`가 영문 — 패키지 기본값. 현지화는 패키지 변경 과제(이번 사이클 범위 밖, apps/web 무변경 전제 유지).
