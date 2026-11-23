# 이슈 #42 — «다 go» M3: @ui-sdk/core 53종 카탈로그화(이중 유지 검증 자동화)

- 상태: 완료(커밋 참조) · 에픽 #35 M3 슬라이스
- 산출물: `packages/unikit/src/behaviors/ui-sdk-catalog.ts`(단일 출처) ·
  `docs/ui-sdk-catalog.md`(전사) · 프로브 섹션 (14) · llms.txt(진입점 11개)
- 게이트: `probe:ui-sdk` **198검사 PASS**(193 + (14) 5검사) · 루트
  `typecheck` 6패키지 exit 0 · `audit:design` 10/10

## 왜 이 모양인가

M2까지 6유형 수직 슬라이스로 «커널이 RN에서 돈다»를 증명했다면, M3는
«53종 전부를 언제나 지도 위에 둔다»는 관리 계약이에요. 셋 다 같은 문제 —
카탈로그·문서·llms.txt는 사람이 쓰는 표현이라 패키지 실물과 어긋나면
조용히 썩어요. 그래서 단일 출처(카탈로그 데이터) → 전사(문서) → 상시
대조(프로브 (14)) 순으로 흐르게 했고, 문서는 «전사≫라 못박았어요.

## 카탈로그 계약 (14)

프로브가 매 실행마다 검사하는 5종:

1. **53종 팩토리 존재·함수** — `@ui-sdk/core/<sdk>` 동적 import로 팩토리
   export 확인. 53종 이름·팩토리 식별자는 `/tmp` 실험이 아니라 카탈로그에
   있는 값 그대로.
2. **families 재스캔 정확 일치** — dist 소스에서 상대 import 그래프를
   걸어(위치 불문 — components 내부도 통과하는 «전체 이행적 폐쇄») foundation
   의존만 뽑아 패밀리 7종으로 환원. 카탈로그 `families`와 문자열 비교.
   빈 스캔 = `["press"]`(벽 없음 상태기계).
3. **이중 유지 35종** — UniKit 동일 기능 대응의 소스
   (`src/components/<이름>.tsx`)와 배럴 재수출(`./components/<이름>`) 존재.
4. **역방향 드리프트 감지** — 패키지 exports의 컴포넌트급 서브경로가 전부
   카탈로그에 등재됐는지. 버전 승급·신규 export가 오면 여기서 걸려요.
5. **screen 실증 12종** — 기기 화면 근거 항목 수 고정.

## 패밀리 유도 규칙(재스캔과 카탈로그가 공유)

foundation 하위 모듈 → 패밀리: `popups→popup` · `focus→roving` ·
`forms→form` · `direct-manipulation|drag-and-drop→gesture` ·
`platform/{layers,keyboard,document,scrollbar}·kernel/modality→modality` ·
`motion→motion`. 나머지 kernel/platform 헬퍼(attrs·events·derive 등)는
패밀리 없음.

집계(53종 기준): modality 43 · roving 36 · form 32 · motion 24 · popup 16 ·
gesture 10 · press 4(avatar·meter·progress·separator). 5패밀리 이상 조합은
autocomplete·combobox·command·date-picker·drawer·menu·select·toast·
trigger-menu 9종.

## 실측 정정 2건

- «51종» → **53종**: alert-dialog(dialog 모듈 내 별도 export)·time-input
  (date-input 모듈 내 export)이 발표 시점 집계에서 빠져 있었음.
- «34종 이중 유지» → **35종**: trigger-menu↔context-menu 대응 포함 재계산.
  이름 상이 4쌍 — menu↔dropdown-menu·trigger-menu↔context-menu·
  otp-input↔input-otp·radio↔radio-group, 그리고 toast↔sonner(포팅).

## 스캔 방법 정착까지 (발견 기록)

1. 직접 import 스캔 — modality 누락 다수(진입 파일이 박막 재export면
   커널 의존이 안 보임).
2. foundation 이행 스캔 — `sub` 비교에 `.js` 확장자가 붙어
   `layers.js === 'layers'` 매칭 실패 → modality가 전멸한 척 보임.
   **확장자 제거 후 정상**.
3. 진입 파일만의 폐쇄 — autocomplete 등이 과소 계상. «전체 이행적
   폐쇄(위치 불문 통과)≫로 정착 — export 하나가 실제로 끌어오는 모든
   커널이 그 export의 패밀리 집합이에요.

## 판정 기준

- rn: `screen` = 에뮬레이터 기기 화면 실증 12종(button·checkbox·dialog·
  field·input·popover·radio·segmented-control·slider·switch·tabs·toggle).
  `family` = 소속 커널 패밀리 전부가 프로브 (1)–(13)으로 검증됨(개별 화면
  미구성). motion은 예외 규칙 — RN은 등장/퇴장을 즉시 전환하고 수명
  계약(언마운트)은 modality 검증이 대신 담당(이슈 #41).
- unikit: 동일 기능 = 소비자 입장에서 같은 문제를 푸는 컴포넌트.
  구조·API 동일까지는 요구하지 않음(한 벌 소스가 아니라 이중 유지니까).

## v1 경계

- 패밀리 유도 규칙이 하드코딩된 모듈→패밀리 표 — @ui-sdk/core가 foundation
  구조를 재배치하면 (2)가 실패로 알려요(실패가 목적. 그때 규칙과 카탈로그을
  같이 고치는 것이 M0 승급 계약).
- screen 근거는 카탈로그 데이터(사람이 기록) — 프로브는 개수만 고정.
  새 화면을 실증하면 카탈로그 항목의 rn을 옮기고 개수 검사를 맞춰요.
