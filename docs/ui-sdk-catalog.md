# @ui-sdk/core 53종 카탈로그 — RN 구동 («다 go» M3, 이슈 #42)

`@unikit-bridge/ui/behaviors/ui-sdk-catalog`가 단일 출처예요. 이 문서는 그
전사(轉寫)고, `bun run probe:ui-sdk` (14)가 매 실행마다 실물과 대조해요.

## 요약

- **53종** — 에픽 표기 «51종»은 발표 시점 집계(실측: alert-dialog·time-input
  별도 export 포함). 전종 팩토리가 존재·함수.
- **이중 유지 35종** — UniKit 62종과 동일 기능(에픽 표기 34종 — 재계산에서
  trigger-menu↔context-menu 대응 포함). 양쪽 중 어느 한쪽이 바뀌면 계약이
  갈라져요 — 프로브가 소스·배럴 재수출 존재를 검사해요.
- **screen 12종** — 에뮬레이터 기기 화면까지 실증(button·checkbox·dialog·
  field·input·popover·radio·segmented-control·slider·switch·tabs·toggle —
  `apps/expo/app/uisdk-*.tsx`). 나머지 41종은 소속 커널 패밀리 전부가
  프로브 (1)–(13)으로 검증된 «패밀리» 근거.
- **커널 패밀리 의존(이행적)** — form 32종·gesture 10종·modality 43종·motion 24종·popup 16종·press 4종·roving 36종.

## 패밀리

| 패밀리 | 커널 | RN 계약 | 검증 |
|---|---|---|---|
| press | 상태기계(벽 없음) | 프레임워크 이벤트만 | 프로브 (2)–(7)·uisdk-press/toggle |
| popup | createPopup | position() rect 캐시·문서 실 이벤트 대상 | 프로브 (9)·uisdk-popover |
| form | ElementInternals 등가 | attachInternals·ownerDocument 리스너 | 프로브 (10)·uisdk-form |
| roving | 가상 포커스 레지스트리 | document.activeElement | 프로브 (11)·uisdk-roving |
| gesture | 문서 포인터 드래그 | pointermove/rAF flush | 프로브 (12)·uisdk-slider |
| modality | layers·창 리스너 | 바깥누름·Escape·잠금 | 프로브 (13)·uisdk-dialog |
| motion | 등장/퇴장 presence | 즉시 전환(마운트 수명은 modality에서 검증) | 프로브 (13) 언마운트 수명 |

## 53종 전체

| @ui-sdk/core | 팩토리 | 패밀리(이행적) | UniKit 동일 기능 | RN 근거 | 비고 |
|---|---|---|---|---|---|
| `accordion` | `accordion` | form·modality·motion | accordion | 패밀리 |  |
| `alert-dialog` | `alertDialog` | modality·motion·popup·roving | alert-dialog | 패밀리 | dialog 모듈 내 별도 export |
| `autocomplete` | `autocomplete` | form·modality·motion·popup·roving | — | 패밀리 |  |
| `avatar` | `avatar` | press | avatar | 패밀리 |  |
| `button` | `button` | form·modality | button | 화면 |  |
| `calendar` | `calendar` | form·modality·roving | calendar | 패밀리 |  |
| `carousel` | `carousel` | gesture·modality·motion·roving | carousel | 패밀리 |  |
| `checkbox` | `checkbox` | form·modality·motion·roving | checkbox | 화면 |  |
| `collapsible` | `collapsible` | form·modality·motion | collapsible | 패밀리 |  |
| `color-picker` | `colorPicker` | form·gesture·modality·roving | — | 패밀리 |  |
| `combobox` | `combobox` | form·modality·motion·popup·roving | combobox | 패밀리 |  |
| `command` | `command` | form·modality·motion·popup·roving | command | 패밀리 |  |
| `date-input` | `dateInput` | form·modality | — | 패밀리 |  |
| `date-picker` | `datePicker` | form·modality·motion·popup·roving | — | 패밀리 |  |
| `dialog` | `dialog` | modality·motion·popup·roving | dialog | 화면 |  |
| `drawer` | `drawer` | gesture·modality·motion·popup·roving | drawer | 패밀리 |  |
| `field` | `field` | form | field | 화면 |  |
| `file-input` | `fileInput` | form·modality·roving | — | 패밀리 |  |
| `hover-card` | `hoverCard` | modality·motion·popup·roving | hover-card | 패밀리 |  |
| `image-cropper` | `imageCropper` | gesture·modality | — | 패밀리 |  |
| `input` | `input` | form·modality | input | 화면 |  |
| `label` | `label` | form | label | 패밀리 |  |
| `listbox` | `listbox` | form·modality·motion·roving | — | 패밀리 |  |
| `menu` | `menu` | gesture·modality·motion·popup·roving | dropdown-menu | 패밀리 | 이름 상이(UniKit dropdown-menu) |
| `menubar` | `menubar` | popup·roving | menubar | 패밀리 |  |
| `meter` | `meter` | press | — | 패밀리 |  |
| `navigation-menu` | `navigationMenu` | modality·motion·popup·roving | navigation-menu | 패밀리 |  |
| `number-input` | `numberInput` | form·gesture·modality·roving | — | 패밀리 |  |
| `otp-input` | `otpInput` | form·modality | input-otp | 패밀리 | 이름 상이(UniKit input-otp) |
| `pagination` | `pagination` | modality | pagination | 패밀리 |  |
| `password-input` | `passwordInput` | form·modality | — | 패밀리 |  |
| `popover` | `popover` | modality·motion·popup·roving | popover | 화면 |  |
| `progress` | `progress` | press | progress | 패밀리 |  |
| `radio` | `radioGroup` | form·modality·motion·roving | radio-group | 화면 | 이름 상이(UniKit radio-group) |
| `rating` | `rating` | form·modality·roving | — | 패밀리 |  |
| `resizable` | `resizable` | form·gesture·modality·roving | resizable | 패밀리 |  |
| `scroll-area` | `scrollArea` | gesture·roving | scroll-area | 패밀리 |  |
| `segmented-control` | `segmentedControl` | form·modality·roving | — | 화면 |  |
| `select` | `select` | form·modality·motion·popup·roving | select | 패밀리 |  |
| `separator` | `separator` | press | separator | 패밀리 |  |
| `slider` | `slider` | form·gesture·modality·roving | slider | 화면 |  |
| `switch` | `switchPrimitive` | form·modality | switch | 화면 |  |
| `tabs` | `tabs` | modality·motion·roving | tabs | 화면 |  |
| `time-input` | `timeInput` | form·modality | — | 패밀리 | date-input 모듈 내 export |
| `timeline` | `timeline` | roving | — | 패밀리 |  |
| `toast` | `toast` | gesture·modality·motion·popup·roving | sonner | 패밀리 | UniKit은 sonner 포팅 |
| `toggle` | `toggle` | form·modality·roving | toggle | 화면 |  |
| `token-input` | `tokenInput` | form·modality·motion·roving | — | 패밀리 |  |
| `toolbar` | `toolbar` | form·roving | — | 패밀리 |  |
| `tooltip` | `tooltip` | modality·motion·popup·roving | tooltip | 패밀리 |  |
| `tree` | `tree` | form·modality·motion·roving | — | 패밀리 |  |
| `trigger-menu` | `triggerMenu` | form·modality·motion·popup·roving | context-menu | 패밀리 | 이름 상이(UniKit context-menu) |
| `waterfall` | `waterfall` | modality·roving | — | 패밀리 |  |

## 이중 유지 검증(자동화)

`cd packages/unikit && bun run probe:ui-sdk` — 섹션 (14)가 매번:

1. 53종 팩토리가 `@ui-sdk/core/<sdk>` export에 존재·함수인지
2. 카탈로그 `families`가 dist 소스의 이행적 foundation 의존 재스캔과 **정확히 일치**하는지
3. 이중 유지 35종의 UniKit 소스(`src/components/<이름>.tsx`)와 배럴 재수출이 존재하는지
4. 역방향 — 패키지 exports의 컴포넌트급 서브경로가 전부 카탈로그에 등재됐는지(버전 승급·신규 컴포넌트 드리프트 감지)

`@ui-sdk/core` 버전을 올리면 (2)·(4)가 커널 재배치·신규 export를 잡아요 —
카탈로그를 고치고 프로브를 다시 맞추는 것이 승급 절차예요(M0 계약).
