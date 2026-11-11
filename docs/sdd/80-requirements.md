# 사이클 73 요구 — 웹 데모 모바일 정리(Astryx 벤치마크)

- 원 요청(해석 없음): «지금 모바일 보니깐 하나도 정리가 되어 있는게 없는데, astryx같은거 보고 정리하게 해줄 수 있을까?» + «(SDD)로 하게 해주고, PR 생성까지 해줘.»
- 기준 리비전: 7af9a2b. 작업 트리에 병행 진행 중인 사용자 WIP 존재(2026-11-11 실측, 계속 증가 중): `apps/web/app/demo/`(layout·page·assistant/page 3파일), `apps/web/components/demo/`(script.ts·assistant-screen.tsx), `M apps/web/components/site/landing.tsx`(데모 앱 링크 추가), `M apps/expo/app/index.tsx`, `apps/expo/app/demo/`·`apps/expo/components/demo/` — **전부 보존 대상이며 이번 커밋에서 제외**.
- 조사·벤치마크 실측: 2026-11-11, 오케스트레이터(브라우저 프리뷰 414×896 직접 관찰).

## 배경 실측

### 벤치마크 — Astryx(astryx.atmeta.com/components, 414px)

- 헤더 48px sticky: 로고 | 아이콘 버튼들(검색·테마·커뮤니티·GitHub) + CTA | 우측 햄버거.
- 햄버거 → 백드롭 있는 전체 높이 드로어: 주요 섹션(Docs·Components·Templates·Themes·Playground) + 검색 + 전체 컴포넌트 목차.
- 컴포넌트 인덱스: 짧은 소개(제목·한 줄·CTA 2개) → 구분선 → 카테고리 헤딩(Action 등) + 1열 카드(라이브 데모 + 이름).

### 현재 문제 — UniKit 웹 데모(414px 실측)

1. 문서 셸(`apps/web/components/showcase/docs-shell.tsx`) «목차» 버튼이 사이드바를 **인라인으로 펼칠 뿐**(드로어 아님) — 콘텐츠를 아래로 밀고 61종 목차가 페이지 가운데로 끼어듦. 닫으려면 다시 위로 스크롤해야 함.
2. 모바일 헤더에 GitHub 진입 수단 없음(텍스트 링크가 `sm:`에서만 표시), 보조 nav(소개·Kitchen sink)도 전부 숨음.
3. `/showcase` 카테고리 바로가기 8개가 텍스트 링크 2줄 wrap(`apps/web/app/showcase/page.tsx`:43-58) — 정리 안 된 인상의 주 원인.
4. 라이브 썸네일 축소 배율 `THUMB_SCALE`(page.tsx:19-27) 7종이 데스크톱 카드 폭 기준 값 — 모바일 카드(382px)에서 상대적으로 작게 렌더(예: card 0.4 → 데스크톱 ~116px·모바일 ~153px로 카드 대비 빈 공간 과다, 실측 스크린샷).
5. `/showcase/kitchen-sink` 페이지 안 «🌙 다크» 토글이 셸 헤더 토글과 이중(kitchen-sink/page.tsx:170-177).

## 목표와 범위

- **목표**: `apps/web` 문서 셸·쇼케이스 인덱스·키친싱크의 모바일(<md) 경험을 Astryx 패턴(햄버거 드로어·정돈된 인덱스)으로 정리한다. 데스크톱(md+)은 현재 구성·동작을 유지한다(회귀 금지).
- **포함**: docs-shell 헤더·사이드바(모바일 분기), `/showcase` 인덱스 칩 바·썸네일 배율, kitchen-sink 중복 토글 제거, site.css 유틸 1건, 사이클 문서 3종(80–82).
- **제외(후속 제안)**: 검색·스크롤스파이·«이 페이지 목차»·랜딩(`/`) 개편·Expo 앱 — 원 요청은 «모바일 정리»이며 랜딩 모바일은 실측상 이미 단순 구조(스크롬샷 근거).

## 수용 기준(AC)

- **AC-1 모바일 목차 드로어**: 414px에서 쇼케이스 계열 페이지 헤더의 목차 버튼이 패키지 `Sheet`(side="left") 드로어를 백드롭과 함께 열고, (a) 백드롭 클릭 (b) ESC (c) 닫기 버튼 (d) 링크 클릭·이동으로 닫힌다. 드로어 내용: 주요 링크(소개·Components·Kitchen sink·GitHub) + 카테고리별 전체 목차(현재 경로 하이라이트). 기존 인라인 펼침 방식은 제거.
- **AC-2 헤더 정리**: 모바일 헤더에서 GitHub 링크(텍스트 링크 «GitHub» — 링크 텍스트 자체가 접근성 라벨)에 접근 가능하다. md+ 기존 텍스트 nav·사이드바 sticky(`top-16`)·문서 페이지 레이아웃에 회귀가 없다.
- **AC-3 카테고리 칩 바**: `/showcase` 카테고리 바로가기가 가로 스크롤 단일 행 칩 바(헤더 바로 아래 sticky, 스크롤바 숨김)로 바뀌고 칩 클릭 시 해당 섹션 앵커 이동이 유지된다. 414px에서 2줄 wrap이 소멸한다.
- **AC-4 썸네일 모바일 배율**: `THUMB_SCALE` 대상 7종(calendar·card·chart·command·empty·message-scroller·sidebar)의 렌더 폭이 모바일 카드(382px)에서 데스크톱 2열 카드(~288px) 대비 작아지지 않는다(getBoundingClientRect 실측). 스트립 높이·배율 조정으로 카드 안 빈 공간을 줄인다(7종 414px 스크린샷 근거).
- **AC-5 키친싱크 토글 일원화**: `/showcase/kitchen-sink` 본문의 테마 토글(«🌙 다크»/«☀️ 라이트»)을 제거하고 셸 헤더 토글로 일원화한다.
- **AC-6 검증 통과**: 루트 `bun run typecheck` exit 0, `apps/web` `bun run build` exit 0(사용자 WIP demo 라우트 포함 상태), 루트 `bun run audit:design` exit 0(패키지 무변경), 모바일(414px)·데스크톱(1280px) 스크린샷에서 랜딩·문서 페이지·사이드바 회귀 없음, 드로어 접근성(role="dialog"·aria-modal·ESC) 관찰.
- **AC-7 PR 생성**: G5 PASS 후 이 사이클 변경물(문서 80–82 + T-1~T-5 파일)만 담은 브랜치를 만들어 커밋·푸시하고 `main` 대상 PR을 생성한다(한국어 Conventional Commits, attribution 금지, 사용자 WIP 파일 미포함).

## 제약

- 패키지(`packages/unikit`)·`shadcn-ref/`·레지스트리 무변경 — 웹 데모 앱 전용 변경.
- bun만 사용. 문서는 한국어(해요체). 커밋은 사용자가 요청한 PR 생성 범위에서만(한국어 Conventional Commits, attribution 금지).
- 패키지 컴포넌트 재사용 원칙: 드로어는 직접 만들지 않고 `@unikit-bridge/ui` `Sheet`(ModalOverlay 내장: 포털·백드롭·ESC·포커스 복귀·스크롤 잠금)를 쓴다(도그푸딩).

## 차단 질문

- 없음 — 벤치마크 대상(Astryx)과 완료 정의(PR 생성)가 원 요청에 확정돼 있음.
