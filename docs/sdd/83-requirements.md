# 사이클 74 요구 — 데모 앱 컴포넌트 사용 확대·디자인 토큰 정합성

- 원 요청(해석 없음): «지금 보니간 아직도 사용하는 부분들이 많이 부족해보여. 그리고 디자인 토근이제대로 안쓰이는거 같아서 이부분을 모두 보고 진행해주면 안될까?»
- 기준 리비전: 61bb7af(main). 작업 트리 미커밋 상태(전부 보존 대상, 이번 작업은 그 위에서 데모 품질을 마저 다듬는다): 데모 앱 8파일 신규 + `apps/expo/app/index.tsx`(데모 진입 링크)·`apps/web/components/site/landing.tsx`(내비 링크)·`packages/unikit/src/bridge/native.tsx`(안드로이드 Fabric 가드) 수정.
- 조사: 2026-11-12, 오케스트레이터(Codebase Researcher 관점 — 전 파일 직독·grep 실측).

## 배경 실측

### 1. 디자인 토큰 미사용(엑스포 앱 전반)

- 패키지는 토큰 단일 출처 API를 공개 중: `@unikit-bridge/ui` → `getThemeTokens(colorScheme)`·`lightTokens`·`darkTokens`(`src/theme/tokens.ts`, `src/index.ts`의 `export * from "./theme"`로 확인).
- 그러나 엑스포 앱 4파일이 lucide-react-native 아이콘 색을 **토큰값을 손으로 다시 베껴 쓴 hsl 리터럴**로 지정한다(RN은 currentColor 상속이 없어 명시 색이 필요한 건 맞지만, 출처가 토큰이어야 한다):
  - `apps/expo/app/index.tsx:89-94`, `apps/expo/app/component/[slug].tsx:18-21`, `apps/expo/app/demo/index.tsx:64-69`, `apps/expo/app/demo/chat.tsx:110-113`.
  - 그중 일부는 **토큰에 존재하지 않는 지어낸 값**이다: `hsl(240 5% 96%)`(다크 전경 토큰은 `0 0% 98%`), `hsl(240 5% 45%)`·`hsl(240 5% 75%)`(subtle 자리 — 대응 토큰 없음). `hsl(240 5% 65%)`도 다크 muted-foreground(`240 5% 64.9%`)와 미일치.
- **실결함**: `apps/expo/app/demo/chat.tsx:513` 보내기 버튼 아이콘 `hsl(0 0% 98%)` 하드코딩 — 다크 모드에서 버튼 배경(bg-primary = 다크 토큰 `0 0% 98%` 흰색)에 흰 아이콘이 돼 안 보인다. 라이트 전경 값(primary-foreground 라이트)을 플랫폼 무관 고정한 것이 원인.
- 웹 데모는 lucide-react(currentColor 상속)라 이 문제가 없다 — 엑스포 고유.

### 2. 임의값 클래스(데모 — 패키지 규칙 `w-[340px]` 금지와 같은 맥락)

- `max-w-[640px]`(엑스포 데모 홈:76), `text-[10px]`(엑스포 데모 홈:174·웹 데모 홈:133·엑스포 앱 인덱스 데모 진입 블록), `w-[120px]`(웹 어시스턴트:268), `w-[110px]`(엑스포 채팅:298), `max-w-[220px]`(양쪽 첨부:354·384), `max-w-[240px]`(양쪽 작성줄 첨부:432·463).
- `audit:design`는 패키지·globals.css 범위라 앱 파일을 검출하지 않는다 — 데모가 규칙 밖에서 규칙을 위반 중.

### 3. 컴포넌트 사용 부족

- 데모(홈+어시스턴트, 웹·엑스포 합산)가 실사용하는 컴포넌트는 17종(Attachment, Avatar, Badge, Bubble, Button, Card, Empty, Item, Message, MessageScroller, Select, Sheet, Slider, Spinner, Switch, Textarea, Toaster) — 61종 중 28%.
- 미사용 컴포넌트 중 데모 맥락(채팅 어시스턴트 앱)에 **자연스럽게** 들어맞는 것: DropdownMenu(헤더 오버플로우), Field 족+Separator(설정 시트 — 현재 raw Text 2줄로 라벨을 직접 짜고 섹션 구분 없음), Progress(첨부 «올리는 중» 가짜 진행), Kbd(웹 작성줄 Enter 힌트 — ChatGPT 계열 실제 패턴).
- 부자연스러운 것은 넣지 않는다: Tooltip은 press 토글 근사 포팅(`src/components/tooltip.tsx` 머리주석)이라 액션 버튼과 조합하면 탭 동작과 충돌, Skeleton/Table/Chart/Tabs 등은 어시스턴트 앱에 억지로 들어가면 UI slop. 이런 경계는 시트가 아니라 쇼케이스(kitchen-sink)의 몫.

## 목표와 범위

- **목표**: 미커밋 데모 앱(웹+엑스포)을 ① 토큰 단일 출처에 정렬하고 ② 임의값 클래스를 걷어내며 ③ 자연스러운 컴포넌트 투입으로 사용 종수를 17→22종으로 늘려, «컴포넌트를 실제 앱처럼 쓴다»는 데모의 목적에 맞게 다듬는다.
- **포함**: 엑스포 4파일(기존 쇼케이스 2 + 데모 2) 아이콘 색 토큰화, 신규 헬퍼 1, 웹 데모 2파일, 엑스포 앱 인덱스 데모 진입 블록의 임의값 클래스, 사이클 문서 3종(83–85).
- **제외**: 패키지(`packages/unikit`)·레지스트리·`shadcn-ref/` 무변경(브리지 native.tsx의 사용자 WIP는 그대로 보존). 억지 컴포넌트 확장(Skeleton·Tooltip 등 — 근거 위 참조). 사용자 WIP 3파일의 기능 변경. 커밋·PR(요청 없음).

## 수용 기준(AC)

- **AC-1 아이콘 색 토큰 단일 출처(엑스포)**: 엑스포 4파일의 hsl 리터럴 재타이핑이 `getThemeTokens(colorScheme)`에서 유도한 값으로 교체되고, 토큰에 없던 값(240 5% 96%·45%·75%)은 대응 토큰(foreground·muted-foreground)으로 정규화된다. 앱·데모 tsx에서 `hsl(` 리터럴 잔존 0건(grep).
- **AC-2 다크 모드 보내기 버튼 수복**: 엑스포 채팅 보내기 아이콘 색이 primary-foreground 토큰 유도값이 된다. 에뮬레이터 다크 모드 스크린샷에서 버튼 안 화살표가 배경과 구별되는 것을 직접 확인.
- **AC-3 임의값 클래스 소거(데모)**: 데모 관련 5파일에서 `[...]` 임의값 클래스 7건이 표준 스케일 클래스(max-w-2xl·text-xs·w-30·w-28·max-w-56·max-w-60)로 치환된다. grep `-\[` 0건(주석 제외).
- **AC-4 컴포넌트 사용 확대(양 플랫폼 데모)**: 다섯 가지가 관찰된다 — (a) 헤더 «⋯» DropdownMenu 오버플로우(새 대화·설정 진입 통합), (b) 설정 시트가 Field(FieldContent·FieldLabel·FieldDescription)+Separator로 재구성, (c) 첨부 «올리는 중» 상태에 Progress(가짜 진행), (d) 웹 작성줄 Enter 힌트 Kbd(엑스포는 물리 키보드 가정 없음 — 미사용 사유 주석), (e) 사용 컴포넌트 22종(17+5). 동작은 기존과 동일(새 대화·설정 열림·첨부 흐름 회귀 없음).
- **AC-5 양 플랫폼 사본 동기**: 웹·엑스포 데모 화면 구조가 일치(기존 «복사·수정 시 함께» 계약 유지), 플랫폼 차이(공유/복사·Kbd·시트 side)는 머리주석에 기록된 범위 그대로.
- **AC-6 검증 통과**: 루트 `bun run typecheck` exit 0, `cd apps/web && bun run build` exit 0, 루트 `bun run audit:design` exit 0, 엑스포 에뮬레이터 라이트·다크 두 스킴에서 데모 홈·채팅을 스크린샷으로 직접 확인(보내기 버튼 포함), 웹 414px·1280px 프리뷰 확인.

## 제약

- bun만 사용. 패키지·레지스트리 무변경. 문서는 한국어(해요체). 임의 커밋 금지.
- 데모 앱은 소비자 앱 — 아이콘 lucide(앱 관행) 유지, 패키지 «아이콘은 글리프» 규칙 적용 안 함(사이클 73과 동일 경계).

## 차단 질문

- 없음 — 원 요청의 «모두 보고 진행»이 범위(데모 전수 조사·수정)와 완료 정의(위 AC)를 확정한다.
