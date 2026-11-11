# 사이클 72 구현 증거 — 링 규약·menubar·주석·registry css

- 요구: docs/sdd/77-requirements.md · 계획: docs/sdd/78-design-plan.md
- 기준 리비전: a067e1b. 구현: 2026-11-11, 위임 2건 병렬(T-1~3 Frontend/UI Engineer, T-4 Platform/Tooling Engineer) + 오케스트레이터(collapsible 주석 1건 추가).

## 수용 기준별 증거

### AC-1 — 링 통일 (T-1)

- 대상 16종(button·checkbox·native-select·select·toggle·item·radio-group·navigation-menu·combobox·input·textarea·input-otp·calendar·accordion·switch·tabs) × 양 트리: `ring-2→ring-3`·`ring-ring→ring-ring/50`·`ring-offset-2 ring-offset-background` 제거·누락분 `focus-visible:border-ring` 추가. destructive 3건 `/20` 유지. tabs `web:focus-visible:outline-1 web:outline-ring`, navigation-menu `web:focus-visible:outline-1`만 + 기존 `web:focus-visible:outline-none`→`outline-1` 치환(원본 :131 정합).
- 변경 금지 8종(bubble·avatar·dialog·sheet·sidebar·attachment·slider·input-group) 무변경 — 구현 보고 + G3 대조 예정.
- 접두 규칙: 기존 접두 승계(input·textarea·input-otp 무접두 — uniwind 네이티브 box-shadow 경로 보존, 나머지 web:).

### AC-2 — menubar (T-2)

- MenubarTrigger가 문자열 children을 자체 `<Text>`로 감싸 `font-medium` + `menu.isOpen && text-accent-foreground` + `web:hover:`·`active:` 전경 전환 부여. 요소 자식은 통과(select 위임 패턴). 배경 전환 현행 유지.

### AC-3 — 주석 갱신 (T-3)

- 15종(글리프→SVG 6: alert·calendar·checkbox·input-otp·navigation-menu·sonner / 교차 스펙 1: attachment / 경로 인용 8: breadcrumb·kbd·pagination·separator·skeleton·table·aspect-ratio·progress) + 오케스트레이터 추가 collapsible(구 경로 인용 — 구현 위임 발견, T-3 동일 계열). 본문 변경 없음. T-1 파일의 링 규약 서술 갱신 포함(button·input·badge 등).

### AC-4 — registry animations (T-4)

- registry.json 신규 `animations` 아이템(type `registry:style`, css 레코드 14키 = 클래스 7 + keyframes 6 + reduced-motion 1, files 부재 — theme 선례). 추출 원본은 `git show HEAD:apps/web/app/site.css`(작업 트리 WIP 미참조). dialog·sheet·popover·drawer·alert-dialog 5종 registryDependencies에 추가(기존 "utils" 보존). 아이템 66→67. README 1줄(영어).
- **검증된 계획 이탈**: css를 문자열이 아니라 구조화 레코드로 등록 — 설치된 @shadcn/registry 0.2.1 스키마가 Record만 허용(문자열 "expected record" 실패 실측), CLI 병합기도 셀렉터→선언 의미론만 처리(문자열이면 keyframes 유실). 계획 78의 «문자열로»는 스키마 부적합 — 이탈 정당.

### AC-5 — 통합 검증 (오케스트레이터 실행, T-4 완료·collapsible 추가 후)

| 검증 | 결과 |
|---|---|
| V-1 `bun run typecheck`(루트) | 3패키지(unikit·web·expo) exit 0 |
| V-2 `bun run audit:design` | 8/8 PASS — (c) 임의값 0건·(d) 62종 동일·(e) 67항목 |
| V-3 `apps/web && bun run build` | 67/67 정적 페이지 생성 성공(작업 트리에 사용자 WIP apps/web 4파일 포함 상태 — 빌드 정상) |
| V-5 레지스트리 산출 | public/r/animations.json 실재(css 14키)·public/r/registry.json 67 아이템·dialog deps `["utils","animations"]` |

### G4 렌더 실측 (오케스트레이터, dev 서버 + 브라우저 프리뷰)

- **버튼 포커스 링**(/showcase/button, 키보드 포커스 → :focus-visible): 합성 box-shadow 링 레이지 `oklab(0.21 0.0016 -0.0056 / 0.5) 0px 0px 0px 3px` — 3px·링 색 50%·오프셋 0 = 원본 규격. 첫 판독 시 투명 임시값이 나왔으나 재판독에서 안정 확인(포커스 직후 스타일 재계산 전 판독 문제).
- **인풋 포커스 링**(/showcase/input): 동일 3px/50% 링 + `focus:border-ring` 적용(테두리 rgb(24,24,27)) + web:shadow-xs 유지. 무접두 focus: 경로 웹 정상.
- **menubar hover**(/showcase/menubar 상세 페이지 — 인덱스 카드는 클릭 오버레이가 hover 차단): 트리거 «파일» hover 시 라벨 rgb(9,9,11)→rgb(24,24,27)(foreground→accent-foreground), 배경 zinc-100(accent) 전환 실측.
- **menubar 열림**: 클릭 후 메뉴 노출(«새 문서저장»), 열린 동안 라벨 accent-foreground·배경 accent 지속.
- 무회귀: 변경 금지 8종은 클래스 수준 무변경(구현 보고·audit) — 시각 확인은 G3 원본 대조로 갈음.

### AC-6 — WIP 보존

- 사용자 WIP 4파일(apps/web/app/showcase/page.tsx·app/site.css·components/showcase/docs-shell.tsx·components/site/landing.tsx) 미수정 — git status로 확인 예정(G5). T-4는 site.css를 `git show HEAD:`로만 읽음.

## 관문 판정 기록

- G0: 요구 문서 77 — role-perspective(오케스트레이터 Product Manager 관점). 막힌 질문 없음.
- G1(독립 Architecture & Plan Reviewer): **PASS** — F-1(P1 원본 outline 인용 부정확: navigation-menu에는 outline-ring 없음)·F-2(P2 badge.tsx:6 규약 주석 누락)·F-3(P3 overlay 무링 확인 문구) 전부 계획에 반영 후 G2 스폰. F-4(P3 input-group slim 링 유지의 목표 긴장) — 문서화된 이탈(B) 유지, G3 재확인 대기.
- G2: 구현 2건 병렬 위임 완료(보고 상단) + 통합 검증 AC-5 표.
- G3(독립 Staff Code Reviewer, 재스폰 — 1차는 API 한도 실패): **FAIL → 수정 후 갱신 PASS**. 결함 2건 — F-1(P2) menubar 라벨의 focus-visible 전환은 미구현(구조 원인: PressableProps에 onFocus/onBlur 계약 부재로 내부 Text 전파 불가)인데 머리 주석이 근사한 것처럼 오기록, F-2(P3) tabs 머리 주석의 원본 인용 부정확(원본은 outline-1·outline-ring 둘 다 focus-visible: 접두). 통과 항목: 원본 대조 ①계열 14종·tabs·navigation-menu 정합, 변경 금지 8종 무변경(attachment는 T-3 계획된 주석 전용 변경), menubar 위임 구조·이중 지정·font-medium·isOpen 전환 정합, 주석 글리프→SVG 6종·경로 인용 8종+collapsible 전부 실재, registry.json 66 아이템 무훼손·animations css 14키 `git show HEAD:site.css`와 전수 정합(180/200/260/160ms·cubic-bezier·±12/16px·scale·reduced-motion), 계약(export 무변경·양 트리 62종·임의값 0건·dark: 신규 0건·사용자 WIP 4파일 무수정 — site.css unikit 블록 무변경 확인), 검증 재실행 일치. G1 F-4(input-group slim 링 유지)는 **수용** 판정. 집계 비고: 위임 범위는 «31종×2»가 아니라 실제 30종×2. 후속 수정(오케스트레이터): F-1·F-2 주석 정정 4파일(menubar·tabs 양 트리 — 라벨 focus-visible 미구현을 한계·로드맵으로 기록, tabs 인용 교정) → typecheck 3종 exit 0·audit 8/8 재통과. 리뷰어가 «F-1 수정 후 재심사 없이 판정 갱신 가능한 수준»이라 명시해 갱신 처리.
- G4(오케스트레이터 렌더 실측): 위 표 — PASS.
- G5(독립 Release Gatekeeper): **PASS** — AC 6/6 성립·관문 원장 일관·재검증(typecheck·audit) 재실행 일치·사이클 커밋 0건 확인(사용자 WIP 4파일은 사용자가 33a337e로 직접 커밋, packages 분 미포함). P3 1건: 잔여 한계 2건(keyframes 소비자 배치·원격 실설치 미실측)의 명시 기록 부재 → 아래 잔여 한계 절으로 보완(커밋 전 처리 완료).

## 잔여 한계 (G5 확정)

1. **menubar 라벨 focus-visible 미구현** — PressableProps에 onFocus/onBlur 계약이 없어 내부 Text로 전파 불가. 배경은 web:focus-visible 근사. 근거: src/components/menubar.tsx:26-27(양 트리) — 한계·로드맵으로 문서화. 구조적 해법(브리지 포커스 계약 추가)은 후속 사이클 과제.
2. **input-group slim 링 근사** — 원본은 컨트롤 링을 0으로 두고 그룹에 링을 옮기지만 셀렉터 의존이라 계층 불가능. per-control ring-1 근사로 유지(G1 F-4 제기 → G3 수용 판정). 근거: src/components/input-group.tsx:14 머리 주석.
3. **keyframes의 소비자 CSS 배치 한계** — shadcn CLI update-css가 css 레코드를 소비자 전역 CSS에 병합하는 의미론에 의존(@shadcn/registry 0.2.1 로컬 스키마 검증까지. 소비자 측 실제 병합 결과는 미관측).
4. **소비 측 실설치 미실측** — V-5는 로컬 빌드 산출물(public/r/animations.json·67 아이템) 검증까지. `bunx shadcn add` 원격 소비 절차의 실측은 다음 배포 사이클 과제.
