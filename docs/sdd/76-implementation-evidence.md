# 사이클 71 구현 증거 — shadcn 원본 일치성 복원

- 계획: docs/sdd/75-design-plan.md · 감사 원장: docs/sdd/74-shadcn-fidelity-audit.md
- 원본 기준: shadcn-ref/ui/ (shadcn-ui/ui commit 8ab2771, new-york-v4 — 사용자 승인 «공식 소스로 보충»으로 28종 신규 추가, 기존 33종 무변경)
- 구현: 2026-11-11, 오케스트레이터 직접 수행(Frontend/UI Engineer 관점 — 기계적 원본값 복원이 위주라 위임 실익 없음, 계획 T-1 기재 사유).

## 수용 기준별 증거

### AC-1 — D 결함 복원 (WIP 제외 8건 + accordion·message 처리)

| 결함 | 처리 | 위치(src 기준) |
|---|---|---|
| resizable flex-row 누락(P1) | group에 `flex-row`/`flex-col` 명시, withHandle `bg-border` | src/components/resizable.tsx |
| calendar 셀 붕괴(P2) | gridcell `flex-1 items-center justify-center`, Pressable `size-8 flex-row` | src/components/calendar.tsx |
| attachment w-30(P2) | 루트에 `w-30`(콘텐츠 있을 때), Content 패딩 원본화, Title `text-card-foreground` | src/components/attachment.tsx |
| sidebar MenuButton hover(P2) | hover/active 배경+전경 이중 지정, outline·Rail·MenuSubButton 동반 | src/components/sidebar.tsx |
| input-otp 정렬(P2) | 루트 `flex-row items-center gap-2` | src/components/input-otp.tsx |
| table 셀 정렬(P2) | head/cell `flex-1 justify-center px-2 text-left`(flex-col 반전 보정 주석) | src/components/table.tsx |
| dropdown·context 하이라이트 글자색(P3) | 상수 3종에 `active:/web:hover:/web:focus-visible:` 전경 스위치, destructive 보존 오버라이드 | src/components/dropdown-menu.tsx·context-menu.tsx |
| accordion rotate(P3) | 사용자 WIP가 이미 수정(rotate-180·transition) — 중복 적용하지 않고 렌더만 확인 |
| message 푸터 겹침(의심) | 라이브러리 결함 아님 — kitchen-sink 데모 구성(사용자 WIP)의 여백 조합 문제로 판정, 컴포넌트 미수정 |

### AC-2 — C 무단 이탈 복원 (§5 + 재대조 추가분)

- §5 24건 적용: combobox(체브론 opacity-50 제거·indicator size-4·칩 px-2.5·제거 버튼 hover), command(h-9·아이콘·empty 전경색), select(체크 아이콘 size-4·항목 텍스트 스위치), dialog·sheet(닫기 버튼 rounded-xs·bg-accent/bg-secondary·아이콘 전경), slider(썸 shadow-sm·ring-ring/50 상시), input-group(invalid ring-destructive/20), checkbox(아이콘 size-3.5·strokeWidth 제거 — dark:bg-input/30은 원본 자체 클래스로 유지), dropdown SubContent(overflow-hidden·shadow-lg 전용 블록) 등.
- 재대조 감사(배치 2b) 추가분: item(`flex-row`·ItemActions/Header/Footer row), button-group(Text flex-row·separator bg-input), card(루트 `flex flex-col gap-6 py-6`·헤더 gap-2 px-6·타이틀 text-2xl 제거→leading-none·콘텐츠/푸터 px-6·CardAction 미이식 로드맵 기록), alert(destructive border 클래스 제거 — 구버전 유물), toggle(aria-invalid 미지원 주석), label(web:select-none), breadcrumb(List text-sm text-muted-foreground), button(사이즈 h-9 체계·xs·icon-* 4종 신설·outline shadow-xs·link hover 밑줄·destructive 포커스 링), badge(rounded-full·px-2·gap-1·font-medium·ghost·link 신설·self-start=w-fit 치환), input(h-9·py-1·min-w-0·shadow-xs·selection·md:text-sm·web:disabled cursor).

### AC-3 — 보충 28종 재대조 감사 결과 적용

- 백그라운드 재대조(연구직, 읽기 전용) 결과 D 3건(item flex-row·button-group text flex-row·card CardAction 부재) — 전 2건 적용, CardAction은 헤더 grid 의존으로 미이식+머리 주석 로드맵(계획상 B 분류).
- C 12건은 위 AC-2 추가분에 반영 완료.

### AC-4 — 양 트리 동기화

- 전 파일 diff: src/components와 registry/ui 본문 불일치 0건(cn import 경로만 상이 — 예상 차이).
- audit:design (d) "registry 사본 62종 동일(import 치환 제외)" 통과.

### AC-5 — 검증 명령 + 렌더 실측

- `bun run typecheck`(루트, 3패키지): @unikit-bridge/ui·@unikit/expo·@unikit/web 전부 exit 0.
- `bun run audit:design`: 8/8 PASS((a1)·(a2)·(b)~(g)).
- `cd apps/web && bun run build`: 67/67 정적 페이지 생성 성공.
- G4 로컬 렌더 실측(dev 서버, T3 프리뷰 — 사이클 40·70 전례대로 오케스트레이터 수행):
  - resizable: A·B 패널 좌우 분할 + 중앙 세로 핸들(P1 수정 실측).
  - calendar: 7열 균등 격자·정방형 셀·오늘 강조.
  - dropdown-menu: 열림 → 저장 항목 hover 시 accent 배경, 삭제 항목은 빨간 글자 유지(destructive 보존 실측).
  - dialog: 열림 → 닫기 버튼 우상단(top-4 right-4) 렌더, 취소·공유 버튼 높이 36px = 신설 h-9 반영 실측.
  - table: 셀 좌측 정렬·행 내 수직 중앙·컬럼 flex-1 분할.

### AC-6 — 사용자 WIP 보존

- 수정 파일 목록에 WIP 구역(src/bridge 3종·accordion·collapsible·switch·tabs·expo showcase 8종·kitchen-sink page·landing) 없음 — 라이브러리 수정이 WIP 파일을 건드리지 않았고 커밋 대상에서도 제외된다.

### G3 지적 P3 5건 후속 수정 (같은 커밋 범위, 양 트리 동기 적용)

| G3 지적 | 수정 | 사유(원본 근거) |
|---|---|---|
| context-menu CheckboxItem CheckIcon size-3.5 | size-4 | 원본 context-menu 154행 size-4 — dropdown과 통일 |
| skeleton `dark:bg-muted-foreground/60` | 제거(bg-accent만) | 원본 skeleton은 dark: 클래스가 없다 — dark: 금지 아키텍처, 다크는 accent 토큰 값 전환 |
| combobox 칩 제거 X 아이콘 size-4 | size-3 | 원본은 아이콘 크기 클래스 없음 — 부모 icon-xs의 [&_svg]:size-3 규칙 재현(셀렉터 미지원이라 직접 명시) |
| sidebar 696·892행 Text 전경 `web:active:` | 무접두 `active:` | dropdown·context·select·button 텍스트와 통일 — 네이티브 눌림 라벨 색 전환 복원 |
| sheet 닫기 아이콘 text-secondary-foreground | text-foreground | 원본은 전경 클래스 없음(상속 foreground) — 이중 지정 원칙으로 명시 |

- 부수 기록: input `web:md:text-sm`의 네이티브 상시 text-base 제한을 머리 주석에 명시(G3 리뷰 반영).
- 수정 후 재검증: 루트 typecheck 3패키지 exit 0, audit:design 8/8 PASS, apps/web build 67/67 재통과.

## 잔여 한계·기록 사항

1. focus 링 규약: 라이브러리 공통 규약 `ring-2 + ring-offset`을 유지(원본 ring-[3px] 무오프셋과 다름). 교차 컴포넌트 일괄 변경은 별도 사이클 과제로 기록 — 이번에 단독 바꾸면 라이브러리 전체 링 두께가 섞인다.
2. menubar 트리거 항목의 hover 텍스트 전환은 DropdownMenuTrigger 내부 Text 하드코딩 구조로 미적용 — select가 위임으로 처리한 것과 달리 menubar는 후속 과제.
3. dark: 유지 2건(원본 자체 클래스, 다크 가시성): checkbox·input의 `dark:bg-input/30`. 나머지 원본 dark:* 클래스(button·badge·alert 등)는 토큰 값 전환 아키텍처로 대체 — 각 파일 머리 주석에 기록.
4. 레지스트리 cn import 경로 혼재(50종 `../lib/utils` + 9종 `@/lib/utils`): registry/lib/utils.ts가 실재해 소비 재현·audit (d)가 통과하는 기존 상태. 통일은 별도 과제.
5. 미지원 로드맵(각 파일 머리 주석 기록): CardAction·badge [a&]:hover:*·input file:*/aria-invalid:*·button aria-invalid:*/has-[>svg]·toggle aria-invalid:*. message 뱃지·타임스탬프 3px 겹침은 데모 구성 문제(사용자 WIP 쪽 조정 대상).
6. 미실시(잔여): stale 머리 주석 갱신 11종(WIP accordion 제외)·site.css 애니메이션 클래스의 registry css 아이템화(계획 T-4 배치 3) — 이번 사이클 범위에서 보류.
7. G3·G5 판정은 아래에追加 기록.

## 관문 판정 기록

- G3(독립 Staff Code Reviewer): **PASS** — P1·P2 잔여 결함 0건. 28종 변경 파일을 shadcn-ref 원본과 클래스 단위 대조, AC-1~6 독립 재확인, typecheck·audit 재실행. 잔여 P3 5건(위 표)은 즉시 수정해 재검증 통과. 후속 과제 지적: T-4 미실시분(stale 머리 주석·site.css 아이템화)·커밋 전 렌더 재관찰 권고.
- G4(UX/Design Auditor 관점 렌더 실측): 위 AC-5 실측 5종 관찰 — 수정 항목이 화면에 반영됨 확인. PASS.
- G5(독립 Release Gatekeeper): **PASS** — AC-1~6 전부 통과(AC-2는 표집 대조). G3 P3 후속 수정 5건 반영을 src·registry 양 트리에서 표집 확인, typecheck·audit 재실행으로 독립 재확인. 잔여 한계 7건 수용 가능(6번 T-4 미실시분은 다음 사이클 과제로 명시). 참고: G5 확인 시점에 커밋 2cf4342에 사용자 WIP 성격 변경(애니메이션) 일부가 이미 포함돼 있었음 — 판정 제외 범위로만 확인, 커밋 행위는 이번 작업이 아니다.
