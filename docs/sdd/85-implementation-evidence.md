# 사이클 74 구현 증거 — 데모 앱 컴포넌트 사용 확대·디자인 토큰 정합성

- 요구: docs/sdd/83-requirements.md · 설계: docs/sdd/84-design-plan.md
- 기준: 61bb7af(main) + 미커밋 데모 8파일(사용자 WIP 보존 위 수정). 패키지·레지스트리는 G5 시점까지 무변경이었으나(V-9 실측), 완료 보고 뒤 사용자 지적 결함 2건 중 1건이 패키지 결함으로 확인돼 Message 1종을 수정했다(아래 «완료 보고 뒤 사용자 지적 결함»). 현재 `git diff -- packages/`: native.tsx(사용자 WIP, Fabric 가드 9줄)·web.tsx(+3줄, 병렬 스레드 귀속 — 아래 간섭 기록)·message.tsx src·registry 사본 2파일(사이클 74 2차 수정, 최초 서술에서 web.tsx 누락했던 것도 정정).
- 수행: 2026-11-12. 편성·파일 경계는 84의 T-1~T-5 그대로.

## 구현 결과

- **T-1** `apps/expo/lib/token-colors.ts` 신규 — `useIconColors()`(`fg`·`muted`·`onPrimary`, getThemeTokens 유도) + 채널→레거시 hsl() 변환. 머리주석에 재타이핑 금지 계약 기록.
- **T-2** 엑스포 기존 2파일(`app/index.tsx`·`app/component/[slug].tsx`) 헬퍼 교체 — 지어낸 값(`240 5% 96%`·`45%`·`75%`)은 fg/muted 정규화, 데모 진입 블록 `text-[10px]`→`text-xs`.
- **T-3** 엑스포 데모 2파일(`app/demo/index.tsx`·`app/demo/chat.tsx`) — 헬퍼 교체(보내기 `onPrimary`), 임의값 치환, 헤더 ⋯ DropdownMenu, 첨부 Progress, 설정 시트 Field+Separator.
- **T-4** 웹 데모 — 같은 구성 + 작성줄 Kbd(Enter 실동작 연결). **경로 이동**: 구현은 `components/demo/·app/demo/`에서 시작했으나 검증 도중 병렬 스레드(사용자가 따로 띄운 apps/web 재구성)가 `components/blocks/assistant-screen.tsx`·`app/blocks/assistant/{page,chat/page}.tsx`로 이동. 본문 보존 확인(31종 컴포넌트 import 동일) 후 이동분에 이어서 수정·검증.
- **T-5** 이 문서.

## AC별 증거

### AC-1 아이콘 색 토큰 단일 출처 — PASS

- 4파일 전부 `useIconColors()` 사용: `app/index.tsx:88`, `app/component/[slug].tsx:17`, `app/demo/index.tsx:64`, `app/demo/chat.tsx:119`.
- grep `hsl(` apps/expo(tsx·ts) — 헬퍼 파일 제외 0건(V-7 재확인). `color="` 아이콘 지정은 icons.* 외 0건.
- 헬퍼는 `getThemeTokens`·`useUnikitTheme`만으로 색을 유도(토큰 키 `packages/unikit/src/theme/tokens.ts:21,27,31,45,51,55` 실재 확인).

### AC-2 다크 모드 보내기 버튼 — PASS

- `app/demo/chat.tsx` 보내기 `<ArrowUp color={icons.onPrimary}>` — `--primary-foreground` 유도. 다크 `240 5.9% 10%`(흰 배경 위 가시)·라이트 `0 0% 98%`(짙은 배경 위 가시)로 토큰값 대조(V-7).
- 에뮬레이터(emulator-5554) 라이트·다크 양 스킴에서 채팅 화면 스크린샷 육안 확인 — 버튼 안 화살표 배경과 구별(V-5, tool-results 스크린샷).
- 웹 다크(토글 후 `html.dark`, body `rgb(9,9,11)`)에서도 보내기·헤더·사이드바 렌더 확인(V-6).

### AC-3 임의값 클래스 소거 — PASS

- 치환 실시: `max-w-[640px]`→`max-w-2xl`(홈 양쪽), `w-[120px]`→`w-30`(웹 SelectTrigger), `w-[110px]`→`w-28`(엑스포 SelectTrigger), `max-w-[220px]`→`max-w-56`(첨부 양쪽), `max-w-[240px]`→`max-w-60`(작성줄 첨부 양쪽), `text-[10px]`→`text-xs`(데모 진입 3곳), 추가로 `text-[11px]` 2곳→`text-xs`, `max-w-[280px]`→`max-w-70`(`basic-sections.tsx:103`).
- grep `-\[` 작성자 범위 0건(잔여는 문자열 콘텐츠·병렬 스레드 소유 파일 `blocks-index.tsx`).
- 빌드 CSS에서 `.w-30{width:calc(var(--spacing)*30)}` 실생성 확인 — tailwind v4 동적 스페이싱(tailwindcss 4.3.5, 엑스포 uniwind도 같은 규칙).

### AC-4 컴포넌트 사용 확대 — PASS

- (a) 헤더 ⋯ DropdownMenu: `chat.tsx:321-344`·`assistant-screen.tsx:299-317` — «새 대화»·«설정» 통합, 기존 Plus/SlidersHorizontal 버튼 제거. `onSelect` 계약 정확(선택 후 자동 닫힘), 아이콘+텍스트 혼합 children은 wrapTextChildren 처리(V-7).
- (b) 설정 시트 Field 족+Separator: `chat.tsx:546-596`·`assistant-screen.tsx:537-585` — 창의성(Slider)·스트리밍(Switch, 가로 배치)·시스템 프롬프트(Textarea), `FieldLabel nativeID`↔`accessibilityLabelledBy` 연결(브리지 매핑으로 양 플랫폼 유효).
- (c) 첨부 Progress: `chat.tsx:510-516`·`assistant-screen.tsx:482-488` — 8→46(300ms)→80(600ms)→완료(900ms), value 0–100 계약 부합. 에뮬레이터 픽셀 프레임(.sdd-tmp/up_01~05.png)·웹 화면 양쪽 관찰.
- (d) 웹 Kbd Enter 힌트: `assistant-screen.tsx:526-532`(`hidden md:flex` 우측 정렬) + Enter 실동작(`onKeyDown`) — 거짜 힌트 아님. 엑스포 미사용 사유는 머리주석 기록.
- (e) 17+5=22종(DropdownMenu·Field·Separator·Progress·Kbd 실사용).

### AC-5 양 플랫폼 사본 동기 — PASS

- 빈 상태·추천 질문·메시지 목록·첨부 미리보기·작성줄·설정 시트 구조 대응, 핵심 클래스(max-w-56·max-w-60·h-1.5) 일치.
- 플랫폼 차이(키보드 회피·공유/복사·시트 side bottom/right·웹 Kbd·부제·max-w-2xl·web: 효과류)는 머리주석에 전부 기록 — G3 F-2·F-4 지적으로 주석 경로·서술을 갱신 완료.

### AC-6 검증 통과 — PASS

- 루트 `bun run typecheck` exit 0(3패키지, 최종 재실행 — F-1/F-2/F-4 수정 후 포함).
- `cd apps/web && bun run build` exit 0(정적 익스포트, /blocks/assistant/chat 포함 — V-7 실측).
- 루트 `bun run audit:design` 8/8 PASS.
- 에뮬레이터 라이트·다크 데모 홈·채팅 육면 확인, 웹 414px·1280px·다크 확인(아래 관문 원장).

## 구현·리뷰 중 발견해 고친 결함

- **타이머 cleanup 결함(구현 중 자체 발견)**: 웹 개발 모드(StrictMode 이중 마운트·Fast Refresh)에서 언마운트 cleanup이 ?q 자동 시작 타이머를 지워 답변이 «생각 중»에 멈춤. 수동 전송은 면역이라 초기 검증이 놓침. 수정: cleanup 제거, 타이머 정리는 새 대화(newChat)만 — 언마운트 뒤 발화는 setState no-op이라 무해(양 사본 동일 적용·주석 기록). 수정 후 웹 자동 시작 전체 스트리밍·에뮬레이터 전 흐름 회귀 통과. G3 F-3은 이 접근의 잔여 부작용(스트리밍 tick 체인의 no-op 지속)을 «허용 범위»로 평가 — 데모 규모에서 실해 없음, 미수정.
- **G3 F-1(P2) 한글 IME 조합 Enter 전송**: 조합 확정 Enter가 그대로 전송되던 결함. 1차 수정(합성 이벤트 `isComposing` 읽기)은 React 합성 키보드 이벤트가 isComposing을 노출하지 않아 무효 — 합성 이벤트 재시험으로 발견. 2차 수정: `nativeEvent.isComposing`까지 내려가 확인(`assistant-screen.tsx` onKeyDown). 검증: isComposing:true Enter는 전송 억제·입력 보존, 일반 Enter는 전송·입력 비움(브라우저 합성 이벤트 실측). 엑스포는 물리 키보드 대상이 아니라 미적용.
- **G3 F-2·F-4(P3) 주석 정합성**: 웹 사본 경로 낡음 2건(chat.tsx·demo/index.tsx 머리주석 — 병렬 이동 반영), 차이 서열 보강·«유요한다»→«유도한다» 오탈자. 수정 완료.
- **G4 P2 설정 시트 본문 가장자리 플러시**: SheetContent는 shadcn 원본 그대로 카드 자체 패딩이 없고(Header·Footer만 p-4) 설정 시트가 본문(Field 라벨·설명·구분선·텍스트영역)에 좌우 여백을 안 줘 패널 경계에 3-5px로 붙었음(웹 픽셀 확정). 패키지는 무변경 원칙·원본 충실 방침상 그대로 두고 소비자(데모)에서 수정 — 양 사본 모두 본문을 `gap-4 px-4` View로 감쌈(엑스포·웹 동일 구성). 재검증: 웹 1280px 라이트 시트에서 라벨·슬라이더·텍스트영역 16px 안쪽(x977, 패널 x960) 확인, 엑스포 에뮬레이터 시트(라벨·구분선·텍스트영역 전부) 확인. 구분선은 본문 폭으로 인셋.
- **G4 P3 2건(기록, 미수정)**: 입력 플레이스홀더가 좁은 폭에서 2줄로 흐름(표준 동작 — 예시 문안 «예: 몇 종 있어?»의 정보 가치 유지), 어시스턴트 버블·아바타 우측 잘림 의심(픽셀 재측정으로 재현 안 됨 — 오탐 판정, 기록만). — 2차: 둘 다 사용자 눈에는 실결함이었고 수정했다(아래 «완료 보고 뒤 사용자 지적 결함»). 우측 잘림 오탐 판정도 정정 — 웹에서만 측정해 엑스포 전용 결함을 놓친 것이 원인.

## 완료 보고 뒤 사용자 지적 결함(2차 수정, 2026-11-12)

사용자가 최종 화면을 보고 지적한 2건 + 오류창 재확인 요청. G4 P3으로 기록했던 두 항목이 실결함으로 확인된 것이라 판정을 정정한다.

- **엑스포 답변 글 넘침(오탐 판정 정정 → 실결함, 수정)**: 어시스턴트 답변 본문이 화면 우측 끝까지 흘렀다. 원인: `MessageContent`가 `w-full`인데 RN(Yoga)은 flex-shrink 기본값이 0이라 아바타 옆에서 수축하지 않는 것(웹은 기본값 1 — 그래서 웹 픽셀 측정에서 재현 안 됐다). 수정: `shrink`(flex-shrink:1)를 명시해 웹 결과 동작과 정합 — `packages/unikit/src/components/message.tsx`·`registry/ui/message.tsx` 양 트리 동일 수정 + 머리주석 포팅 판단 기록(패키지 무변경 원칙의 예외 사유: 결과 동작은 플랫폼 공통 계약). 재검증: 에뮬레이터 a11y rect로 답변 텍스트 우측 끝 780(화면 끝)→746(여백 확보) 측정 + 스크린샷 육안 확인. 웹은 동일값이라 변화 없음.
- **입력 플레이스홀더 2줄(표준 동작 판정 → 문안 단축으로 수정)**: 좁은 폭에서 «— 예: 몇 종 있어?»까지 2줄로 흐르는 게 사용자 눈에는 결함. 예시 문안을 덜어 «UniKit에 대해 물어보세요»로 단축 — `chat.tsx`·`assistant-screen.tsx` 양쪽. 재검증: 엑스포 스크린샷 한 줄 표시, 웹 414px a11y 입력상자(288×40) 한 줄.
- **오류창 재확인(사용자 요청)**: 3458 재기동 서버에서 /blocks/assistant/chat GET 200·Build Error 오버레이 없음·신규 콘솔 에러 없음(로그에 남은 500·full reload 1건은 위 수정 진행 중 Fast Refresh 일시 이력). 질의 전송→답변 완료 상태까지 화면 육안 확인.
- 2차 수정 뒤 재검증: `bun run typecheck` exit 0(3패키지), `bun run audit:design` 8/8 — (d) registry 사본 62종 동일(shrink 수정 동기화 포함).

## 병렬 작업 간섭 기록(소유 구분)

- 사용자가 따로 띄운 스레드가 검증 도중 apps/web을 재구성(showcase→components, demo→blocks 이동 + 레이아웃 신설). 이동된 페이지 2건의 import 깊이 오류(TS2307)를 기계적으로 수정(`app/blocks/assistant/page.tsx`·`chat/page.tsx` — ../../ → ../../../ 등) — 내 검증과 상대 라우트 둘 다 해소.
- `components/blocks/login-block.tsx` TS2305(lucide `Github` 미존재)는 병렬 스레드 소유 — 그쪽에서 해소(최종 typecheck exit 0으로 확인).
- `packages/unikit/src/bridge/web.tsx` +3줄(TextInput `accessibilityLabel`→`aria-label` 전달)도 병렬 스레드 소유로 기록한다(V-9 발견·귀속 실측): 수정 시각(2026-11-12 01:07)이 그 스레드의 `blocks-index.tsx`(01:05, `Input accessibilityLabel` 사용 — 이 전달이 없으면 웹에서 접근성 이름 없음) 직후이고, 사이클 74 파일들은 TextInput 계열에 accessibilityLabel을 쓰지 않아 이 변경이 불필요했다. 변경 자체는 무해(접근성 전달)하나 패키지 무변경 원칙 서술과 충돌해 원장에 명시한다. 커밋 시에는 병렬 README 정리 스레드의 lucide 전환이 web.tsx를 전면 재작성해 이 3줄도 lucide 전환 커밋에 함께 들어갔다(원래 의도했던 재구성분 귀속은 불가능해짐).
- dev 서버(공유 3457)에 남은 `app/showcase/[name]/page.tsx Can't resolve './component-doc'` 오류·Build Error 오버레이는 디스크에 없는 경로의 stale turbopack 그래프 노이즈 — 서버 재시작 시 소거되며 이번 변경의 결함이 아님.

## 관문 판정 원장

| 관문 | 평가(독립/자체) | 판정 | 근거 |
|---|---|---|---|
| G0 요구 | Requirements Auditor | PASS | 83-requirements.md(차단 질문 없음) |
| G1 설계 | Architecture & Plan Reviewer | PASS | 84-design-plan.md(AC↔T↔V 매핑) |
| G2 구현 | Task QA | PASS | T-1~T-4 diff·위 AC별 증거 |
| G3 코드 | Staff Code Reviewer(독립 스폰) | PASS(조건부→해소) | AC-1·3·4·5 PASS, AC-2 코드 근거 PASS, AC-6 실측 통과. 결함 F-1(P2)·F-2~F-4(P3)·F-5(병렬 소유) — F-1·F-2·F-4 수정·재검증, F-3 허용 범위 기록 |
| G4 사용성·디자인 | UX/Design Auditor(독립 스폰, 스크린샷 20장+Progress 프레임) | PASS(결함 수정 후 재검증) | AC-2·AC-4·AC-5 PASS(픽셀 측정·코드 교차검증), 반응형 414px 붕괴 없음, 슬롭 위반 없음. 결함 P2 1건(시트 본문 가장자리 플러시)·P3 2건 → P2 수정·재검증(아래), P3 기록 → 완료 뒤 사용자 지적으로 P3 2건 실결함 확정·수정·재검증(«완료 보고 뒤 사용자 지적 결함») |
| G5 완료 | Release Gatekeeper(독립 스폰) | PASS | AC-1~6 전항목 독립 실측 통과(관문 재실행: typecheck·웹 빌드 72페이지·audit:design 8/8). 정정 1건 반영 — 패키지 무변경 서술에서 web.tsx 병렬 귀속 누락(위 간섭 기록으로 정정 완료). 커밋 전 귀속 정리 권고 수용 |

| 검증 | 판정 | 근거 |
|---|---|---|
| V-1 typecheck | PASS | 3패키지 exit 0(최종: F-1 재수정 후 재실행, 2차 수정 뒤에도 재실행 exit 0) |
| V-2 web build | PASS | exit 0, 정적 익스포트(V-7 실측) |
| V-3 audit:design | PASS | 8/8(2차 수정 뒤 재실행 — (d) 사본 동일 shrink 반영 확인) |
| V-4 grep 실측 | PASS | hsl( 0건·`-\[` 작성자 범위 0건(V-7 재확인) |
| V-5 에뮬레이터 | PASS | 라이트·다크 홈·채팅, 보내기 양 모드 가시, ⋯ 메뉴·설정 Field·첨부 Progress 관찰. 타이머 수정 후 전 흐름(홈→카드→chat?q→완료 답변·공유/다시 생성) 회귀 통과 |
| V-6 웹 프리뷰 | PASS | 414px: ?q 자동 시작 스트리밍(타이머 수정 후)·⋯ 메뉴·설정 시트 Field×3+Separator·Enter 전송·Shift+Enter 줄바꿈. 1280px: Kbd 힌트 행·좌측 내비 셸·부제·max-w-2xl. 다크 토글 렌더 확인 |
| V-7 코드 리뷰 | PASS | 결함 F-1~F-5 전량 처리(수정 또는 소유·허용 범위 기록) |
| V-8 UX 감사 | PASS | AC-2 픽셀 확정(보내기 화살표 #18181b = onPrimary 유도값과 77 대 190 중 77 일치·배경 대비 약 5:1), AC-4 (a)(b)(c) 화면 확인·Progress 0/8/46/80% 프레임 정합, AC-5 구조 동등. 결함 P2 시트 플러시(수정)·P3 플레이스홀더 2줄(표준 동작, 기록)·P3 우측 잘림(재현 안 됨, 오탐 가능 — 2차: 엑스포에서는 실결함, 판정 정정 후 수정). 증거 공백 2건은 수정 재검증 때 메움 — 웹 Kbd 힌트 행 1280px 라이트에서 오버레이 없이 확인, 엑스포 최종 설정 시트(라벨·구분선·텍스트영역 전부) 확인 |
| V-9 완료 판정 | PASS | G5 PASS. AC-1~6 독립 실측(코드 행번·grep·명령 재실행·컴포넌트 22종 계산 검증 — 4파일 21종+레이아웃 Toaster 1). 화면 증거는 기록·스크린샷 산출물 대조로 수용(디바이스 기동 금지 제약). 지적: web.tsx 귀속 미기록(정정 완료), script.ts 문자열 `w-[340px]` 2건은 예외 관행 기록 가치 |

## 잔여 한계

- 관문 검증용 임시물 `.sdd-tmp/`(Progress 픽셀 프레임 up_01~05)은 G5 판정 뒤 정리했다 — 검증 시점에는 실재했음(V-9 확인). 본 증거 스크린샷 20장은 세션 tool-results 디렉터리에 남아 있다.
- 공유 dev 서버(3457)는 죽어서 3458로 재기동해 재검증했다 — stale 그래프 노이즈(삭제된 showcase 경로)·Build Error 오버레이 소거 확인, 오류창 없음(2차 재확인 완료).
- 병렬 스레드의 apps/web 재구성이 진행 중 — 최종 상태는 그 스레드 완료 후 사용자가 확인.
- 커밋·푸시는 요청 없어 수행하지 않음(지침).
