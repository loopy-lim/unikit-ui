# 사이클 71 사전 감사 — shadcn 원본 일치성 전수 대조 (조사)

- 작성: 오케스트레이터 + Codebase Researcher 3건(독립 컨텍스트, 읽기 전용) + 배포 사이트 렌더 실측 · 2026-11-11
- 기준 리비전: `d88922f` (main, 사이클 70 배포분)
- 배경: 사용자 방침 — «shadcn과 동일하게. 그 shadcn을 RN에서도 거의 사용할 수 있는 형태로.» 원본(`shadcn-ref/ui`)이 유일한 기준이고, 모든 이탈을 4분류한다.
  - **A 필수 이탈** — 9조·브리지 규칙이 요구하는 변환(결함 아님, 세지 않음)
  - **B 문서화된 근사** — 머리 주석 등에 사유 기록된 이탈
  - **C 무단 이탈** — 기록 없는 토큰·클래스·구조 차이
  - **D 결함** — 깨짐·동작 불가·누락 (P1 동작 파손 · P2 시각·기능 위반 · P3 경미)

## 1. 총계

- 범위: `src/components` 61종(chart 제외) 전수 + `src/chart` 제외 사유(원본 구조 상이)
- **D 결함 9건**(P1 1·P2 5·P3 3) + 렌더 실측 의심 1건(§3.2) · **C 무단 이탈 24건**(전부 P3)
- **원본 부재 28종**(감사 3건이 17종으로 과소 집계 — ls·registry.json 대조로 정정) → 사용자 승인으로 shadcn 공식 저장소(shadcn-ui/ui 커밋 `8ab2771` 고정)에서 `shadcn-ref/ui`에 보충 완료. 기존 33종은 수정 없이 신규 파일만 추가. §4.1.
- 렌더 실측(배포 사이트 ui.ll3.kr)으로 코드 감사가 못 본 런타임 결함 2건 추가 확인(§3).

## 2. P1·P2 결함 목록

| 위치 | 내용 | 분류 |
|---|---|---|
| `resizable.tsx:171` | ResizablePanelGroup 기본 클래스 `flex h-full w-full` — **flex-row 부재**. 브리지·RN 모두 column 기본이라 `direction="horizontal"`에서도 패널이 세로 적츱(배포 사이트 실측: 패널 A·B 각 638px 전폭 세로 적층, 핸들이 좌측 가장자리에 붕괴). 엔진 제거 시점부터 핵심 기능 파손으로 추정 | D·P1 |
| `calendar.tsx:220-247` | 날짜 칸 높이 클래스 부재 — 원본은 aspect-square·2rem 셀인데 이식본은 콘텐츠 높이(~20px)로 수축. 머리 주석은 "size-8 고정"이라 기록(불이행). 배포 사이트에서 격자가 텍스트 행 덩어리로 뭉개짐 실측 | D·P2 |
| `attachment.tsx:267` | 세로형에서 루트 w-24 고정 + 자식에 w-30 부여(원본은 루트가 w-24→w-30 확장) — 자식이 부모를 넘쳐 세로 첨부 카드 붕괴 | D·P2 |
| `sidebar.tsx:632-641` | MenuButton 기본 variant에 hover·active 피드백 전무(원본 hover:bg-sidebar-accent 등). 웹에서 반응 없는 메뉴 버튼 | D·P2 |
| `input-otp.tsx:126` | 루트 컨테이너 gap-2 누락(원본 `flex items-center gap-2`) — Separator와 셀 그룹 붙어 렌더 | D·P2 |
| `table.tsx:46-50` | 셀 `flex-1 items-center`가 브리지 View 기본 flex-col과 만나 **가로 중앙 정렬**로 해석됨(원본 td는 세로 중앙+좌측 텍스트). 배포 사이트 실측: 셀 내용이 칸 중앙에 위치. 원본 파일은 저장소에 없으나 shadcn classic 표 semantics와 불일치 | D·P2(원본 부재로 D 추정) |

P3 결함 3건: `dropdown-menu.tsx:177`·`context-menu.tsx:186` — 항목 하이라이트 시 글자색이 `focus:text-accent-foreground`로 전환되지 않음(원본 대비 누락). `accordion.tsx:196-204` — 열림 방향 회전이 `web:rotate-180` 웹 전용이라 네이티브에서 소실(§4.5).

## 3. 렌더 실측 추가 확인 (코드 감사가 못 본 런타임 결함)

1. **Resizable horizontal 세로 적츱** — 위 표 1행과 동일(오케스트레이터 DOM 실측: 패널 폭 638px 전폭·높이 214+198 적층). 정적 원본 대조 감사 3건 모두 미탐지 — 이식 클래스와 브리지 flex-col 기본의 상호작용은 실행 관찰에서만 보인다.
2. **Message 반응 배지가 타임스탬프와 3px 겹침**(kitchen-sink 메시지 데모 실측) — message.tsx 푸터 배치 후속 확인 대상.

## 4. 구조적 과제 (컴포넌트 코드 밖)

1. **원본 부재 28종 → 보충 완료(2026-11-11, 사용자 승인)** — accordion·alert·aspect-ratio·avatar·badge·breadcrumb·button·button-group·card·checkbox·collapsible·empty·field·input·item·kbd·label·pagination·progress·radio-group·separator·skeleton·switch·table·tabs·textarea·toggle·toggle-group. shadcn-ui/ui 상류 `apps/v4/registry/new-york-v4/ui/`에서 커밋 `8ab27715521cbd4f87ae6886cd989cbb678f6de7` 고정 다운로드. 상류는 61종 전부 + `_registry.ts`를 보유 — 부재분은 전부 초창기(`/tmp` 시절)·SDD 이식분이었고 머리 주석의 `/tmp/shadcn-ref/src/...` 경로는 재검증 불가였다. 보충으로 "동일" 검증 기준이 61종 전수로 서렸고, 별도 대조 감사(연구직, 읽기 전용)를 돌려 결과를 사이클 71 구현에 반영한다.
2. **`dark:` 변형 잔존 3종** — checkbox.tsx:77·skeleton.tsx:22·switch.tsx:118-119. "dark: 금지, 토큰 값 전환" 규칙(사이클 40~) 이전 이식분 잔재.
3. **stale 머리 주석 대량 잔존** — 글리프→SVG 전환(81f3c2e) 때 갱신 누락: accordion·alert·calendar·checkbox·input-otp·marker·navigation-menu·radio-group·resizable·sidebar·sonner 등 11종+(사이클 70에서 12종 정정했으나 누락분이 더 있었음). sheet은 구판 side 기록, sonner는 글리프 기록(실제 SVG).
4. **`web:` 접두 없는 hover** — sidebar.tsx:640 outline variant(`hover:border-accent hover:bg-accent`). 규칙 7 위반 1건.
5. **`web:rotate-180` 네이티브 회귀** — accordion·navigation-menu가 열림 회전을 웹 전용으로만 표현. 네이티브에서는 펼침 방향 표시 소실. uniwind가 transform을 지원하므로 접두 제거로 양 플랫폼 해소 가능.
6. **데모 앱 전용 CSS 의존** — `unikit-sheet-in-*`·`unikit-popover-in` 등장 애니메이션 클래스 정의가 `apps/web/app/site.css`에만 있고 registry에 css 아이템이 없다. 소비자 프로젝트에선 no-op — registry css 아이템 신설 등 구조 결정 필요.
7. **사이클 70 재판정 대상** — combobox 표시자 `size-3.5`는 select·dropdown과의 형제 통일이었으나, 감사 결과 select·dropdown·context-menu의 `size-3.5` 자체가 원본(size-4 슬롯+size-4 아이콘) 대비 무단 이탈이었다. 원본 우선 방침下 4종 모두 원본값으로 복원하는 것이 정합. (사이클 70의 ring→border 교환은 사유 기록된 B로 유지)

## 5. C·P3 전체 목록 (원본값 복원 대상)

- combobox 4: 표시자 size-4(§4.7)·Chips px-2.5+shadow-xs·칩 X -ml-1 opacity 전환·트리거 셰브론 opacity-50 제거
- command 3: CommandEmpty text-popover-foreground 복원·입력행 h-9(web: 접두 제거)·SearchIcon text-muted-foreground 제거
- dropdown-menu 2: CheckIcon size-4·SubContent overflow-hidden (하이라이트 글자색 미전환은 위 P3 결함으로 분류)
- select 1: 표시자 size-4 + 전경색 상속(§4.7)
- dialog 1: 닫기 버튼 rounded-xs 무패딩 원복(sheet 동일 항목과 세트)
- sheet 1: 닫기 버튼 rounded-xs·p-1 제거·open 상태 bg-secondary pill 복원
- slider 1: 썸 shadow-sm·hover:ring-4 복원
- sidebar 4: peer-data 세로 보정·MenuSubButton 상태 피드백·Rail left-0·outline hover web: 접두
- input-group 1: 에러 링 ring-destructive/20 복원
- bubble 1: BubbleReactions text-sm
- resizable 1: withHandle 박스 bg-border
- attachment 1: Title text-card-foreground
- skeleton·switch·checkbox: dark: 제거(§4.2)

(합계 24건 — context-menu 하이라이트 1건은 P3 결함으로 분류 이동)

## 6. 후속(사이클 71) 제안 편성

- **배치 1 — 기능·고가시 결함**: resizable flex-row·calendar 셀 크기·attachment·sidebar MenuButton·input-otp gap·table 셀 정렬·message 푸터 겹침 + web:rotate-180 네이티브 회귀
- **배치 2 — 무단 이탈 원본값 복원**: §5 전체(1~2개 클래스 스케일의 기계적 복원) + stale 주석 일괄 갱신
- **배치 3 — 구조**: dark: 제거(skeleton·checkbox — switch는 사용자 WIP 구역이라 제외)·site.css 애니메이션 클래스의 registry css 아이템화·보충된 28종 원본 재대조 감사 결과 반영(배치 2b)
- **사용자 WIP 구역(2026-11-11 작업 트리 미커밋)은 이번 사이클 편집 제외** — accordion·collapsible·switch·tabs·bridge(native·web·types). 사용자가 animateLayout 프리미티브 추가와 accordion web:rotate-180 네이티브 회귀 수정(아이콘 className rotate-180 감지→RN transform)을 진행 중 — 감사 P3의 rotate 항목은 사용자 수정으로 해소 중이므로 중복 적용 금지, 최종 검증에서만 확인.
- 검증: 배치마다 typecheck·audit:design·웹 빌드 + 배포 사이트 렌더 실측(오케스트레이터 관찰 — 감사와 분리), 엑스포 tsc·export

## 7. 감사 한계

- 원본 부재 28종은 감사 시점에 C/D 확정 불가였고 보충 후 재대조(배치 2b)로 닫는다.
- 렌더 실측은 kitchen-sink·주요 컴포넌트 페이지 중심(1280px 데스크톱). 모바일 뷰포트·모든 열림 상태(dialog·sheet·tooltip 개방 등)는 배치 수정 검증 시 함께 관찰 필요.
- 네이티브(에뮬레이터) 실물 관찰은 이번 감사에서 미실행 — web:rotate-180 등 네이티브 영향 판정은 코드 근거만 존재.
