# 102 — nsh 네이티브 킵: React 심 제거, nsh 자체 런타임 위의 UniKit

- 날짜: 2026-11-24
- 상태: 완료(게이트 통과 — §6)
- 후속: [103-nsh-kit-050-fixes.md](103-nsh-kit-050-fixes.md)(0.5.0 게시분 검증 결함
  수리 — §7의 «Dialog/Sheet Trigger 컴파운드»·«아이콘 색 스킴 갱신» 해소, 이슈 #45)
- 선행: [101-nsh-react-runtime.md](101-nsh-react-runtime.md)(React-on-nsh 사전 번들 — 이 사이클에서 **제거됨**, §1)

## 1. 요구

사용자 판단: 101의 React 심(react-reconciler 사전 번들)은 nsh 앱 작성에
의미가 없다 — "nsh에서는 tsx를 내부적으로 지원하는거 아니야? 그거 기반으로
기본 UI/UX를 구현하는 게 목적이고, 심지어 ui-sdk를 원함도 있어서."

확정된 방향(대화 합의):

- **형태는 같게** — 컴포넌트 API·변형·토큰은 기존 UniKit(web/RN)과 동일 관습.
- **nsh에서 돌아가게만** — React 없이 nsh 자체 TSX 런타임(signal)으로 구동.
- ui-sdk(@ui-sdk/core)의 nsh 구동 포함.

## 2. 조사(실측)

| 질문 | 결과 | 근거 |
| --- | --- | --- |
| nsh 앱 작성 모델 | Solid형 — `signal`·`computed`·`effect`·`batch`·`context`(Accessor+Provider)·`resource`·`ErrorBoundary`·`mount`, 컴포넌트는 1회 실행(프롭은 getter) | `.nsh/types/nsh/index.d.ts` |
| 폼 프리미티브 | `nsh/base` 모듈이 헤드리스 shadcn형 킵을 제공 — `Button`("눌림·disabled·role 소유, 모양은 class가 담당")·`Checkbox`(indicator 슬롯)·`Switch`(track/thumb)·`Select`(items/value/onChange·trigger 슬롯)·`Sheet`(side/detents)·`Dialog`·`Input`·`Radio(Group)` 등. 상태 변형(`checked:`·`disabled:`·`active:`·`hover:`·`focus-visible:`)을 파트에 자동 전파 | `nsh-types/base.d.ts` 각 인터페이스 |
| 패키지 TSX 소비 | **가능** — nsh 번들러가 패키지 exports의 `.tsx` 소스를 직접 컴파일한다(`/tmp/nsh-native-probe` 실증: 패키지 진입 .tsx + signal + press 헤드리스 통과). 사전 번들 불필요 | 프로브 |
| 속성 스프레드 | **children은 전달되지 않는다** — `{...props}`는 다른 prop은 넘기지만(미지원 prop 경고로 확인) children은 컴파일러가 별도 채널로 처리해 사라진다. 래퍼는 children을 명시적으로 넘기고, `className`은 `split()`으로 떼어 `class`로 치환해야 미지원 prop 경고가 안 난다 | 프로브 3종(`{...props}` 단독·split·명시적 children) |
| children 인트로스펙션 | **불가** — JSX children은 컴포넌트 실행 결과(렌더물)로 전달된다(옵션 children 프로브: `[null,null,null]`). 데이터 기반 prop(`options`)이 nsh 관습 | 프로브 |
| 테마 | nsh.json `theme.cssVars.{light,dark}`가 shadcn cssVars 형식을 네이티브 해석 — UniKit 토큰명 그대로. `token()`·`setColorScheme("light"|"dark"|"system")`·`colorScheme()` 접근자 | `theme.rs` 주석("A theme file is shadcn's cssVars")·index.d.ts |
| 타입 | `nsh`은 npm 패키지가 아니다 — 앱 스캐폴드(`nsh init` → `.nsh/types`)가 타입을 제공한다. 패키지 쪽은 이 타입을 vendor(`nsh-types/`, `bun run sync:nsh-types` 재생성)하고 전용 tsconfig(`jsx: preserve`·`jsxImportSource: "nsh"`·paths)로 컴파일한다 | `apps/nsh/.nsh/tsconfig.json` 구조 |

## 3. 설계

```
packages/unikit/
  src/nsh-ui/                  # 네이티브 킵 — @unikit-bridge/ui/nsh 진입점
    index.ts                   # 배럴(프리미티브·컴포넌트 12패밀리 26export·아이콘)
    lib.ts                     # nshClass 정규화(web:/dark: 제거·native:X→X)·입력 매핑
    types.ts                   # JSX.Element 재수출(children 타입)
    primitives.tsx             # View/Text/Image/ScrollView/Pressable(className 관습 어댑터)
    icons.tsx                  # lucide 32종 Canvas+Path2D(101에서 계승)
    lucide-icons.generated.ts  # 생성물(generate:nsh-icons)
    ui-sdk.tsx                 # /behaviors/ui-sdk-nsh — @ui-sdk/core button 어댑터
    components/*.tsx           # badge·button·card·checkbox·dialog·input·radio-group·select·separator·sheet·switch·textarea
  nsh-types/                   # nsh 런타임 타입 vendor(sync:nsh-types 생성물)
  tsconfig.nsh-ui.json         # 전용 프로젝트(메인 tsconfig는 src/nsh-ui 제외)
  scripts/sync-nsh-types.ts    # nsh init → 타입 복사
```

- **컴포넌트 = nsh/base 헤드리스 + UniKit cva 클래스.** 원본 변형 문자열에서
  `web:` 접두·`dark:` 변형·반응형 접두(`sm:`)를 제거한 값 사용(나머지는 원본
  그대로 — hover:/active:/focus-visible:/checked: 등은 nsh가 자체 지원).
  이중 지정(전경색은 내부 Text)·터치 타깃 hitSlop 보정·`className` 병합 +
  nshClass 정규화 관습 유지.
- **상태 소유권**: 제어형 prop 우선, 비제어는 내부 `signal`(`Switch`·
  `Checkbox`·`Select`·`RadioGroup` context). Select는 트리거 텍스트가 양
  모드에서 갱신되도록 선택 mirror signal을 둔다.
- **아이콘**: 101의 Canvas+Path2D 구현을 TSX로 계승(색은 생성 시 1회 고정 —
  스킴 전환 미갱신, 로드맵 승계).
- **ui-sdk-nsh(M1)**: `useSdkNshPrimitive`(인스턴스 생성 1회 + subscribe →
  signal bump + cleanup 해지 + 옵션 effect 추적)과 `SdkButton`(button 커널 →
  nsh/base Button 호스트, api.internal.press() 발송, pending/disabled 상태
  반영). aria-* part 속성 매핑·나머지 프리미티브는 로드맵.

### 제거(101 → 102)

`src/nsh/`(renderer.ts·nsh-rt.d.ts·nsh-jsx.d.ts·index.ts), `src/bridge/nsh.tsx`,
`scripts/build-nsh.ts`, `tsconfig.nsh-types.json`, `nsh-env.d.ts`, `dist/nsh.mjs`·
`dist/nsh-types/`, package.json의 `build:nsh`. 계승: lucide 경로 생성물
(`generate:nsh-icons`), apps/nsh 데모·테스트 뼈대, nsh.json 테마.
101의 기록(§7 게이트 이력 포함)은 문서로 보존한다.

## 4. 구현 증거(2026-11-24 실측)

- 데모 번들: **154,048 B**(101 React 심 1,087,703 B → 약 7배 감소, React 미포함).
- 헤드리스 회귀(`apps/nsh`, nsh test): 8단계 PASS — ① 초기 렌더(제목·카운터·
  뱃지) ② press 2회("Tapped 2 times") ③ type "ns"(뱃지·echo 텍스트) ③-1
  clear(조건부 언마운트) ④ Switch 토글 2회 ⑤ Select 커밋(Banana) ⑥ ui-sdk
  커널 press("Sdk tapped 1 times") ⑦ 색 스킴 전환. **런타임 경고 0**.
- 스프레드/children 계약 프로브: /tmp/nsh-native-probe(3종 변주 — §2 표).

## 5. 결함 기록(이 사이클)

1. **프리미티브 래퍼가 children을 잃는다** — `{...props}` 스프레드가 children을
   전달하지 않는다(§2). 수정: 모든 래퍼가 children을 명시적으로 넘긴다.
2. **className이 host에 새어 미지원 prop 경고** — `split(props, ["className"])`
   으로 분리 후 `class`로 치환(경고 0 회복).
3. **Select children 옵션 추출 불가** — children이 실행 결과라 props를 읽을
   수 없다. 수정: `options` 데이터 prop으로 전환(문서화).
4. **패키지 서브패스 확장자 오기** — exports가 `.ts`를 가리켜 런타임 import
   오류("only registered native modules"). 수정: `.tsx`로 정정.
5. **`@ui-sdk/core` 루트에 `button` 없음** — 서브패스 `@ui-sdk/core/button`.
6. **Signal.set에 함수 전달** — set은 값, 갱신 함수는 `update`(tsc 포착).
7. **(G3 리뷰) 잔여 `build:nsh` 스크립트·아이콘 생성 경로** — 삭제한
   `scripts/build-nsh.ts`를 가리키는 스크립트와 `src/nsh/`로 쓰는 생성
   outPath가 남아 있었다(재생성 시 죽은 트리 부활). 수정: 스크립트 제거·
   outPath를 `src/nsh-ui`로 정정 후 재생성.
8. **(G3 리뷰) checkbox indeterminate 글리프 비반응 + − 마크 누락** — 몸통에서
   계산한 indicator를 넘겨 런타임 전환이 얼고, 초기 중간 상태가 표시가 없었다.
   수정: JSX 안 조건 분기 + MinusIcon(CheckIcon 대체).
9. **(G3 리뷰) RadioGroup disabled 무시** — 그룹 disabled가 항목에 전파되지
   않았다. 수정: GroupState에 `disabled()` 추가·항목이 병합.
10. **(G3 리뷰) 커널 `destroy()` 미호출** — RN 어댑터와 같은 언마운트 정리가
    없었다(onDestroy·watcher 해지 누락). 수정: `cleanup(() => instance.destroy())`.
11. **(G3 리뷰) Switch/Checkbox/Radio hitSlop 부재** — 원본의 44px 보정 표가
    Button에만 있었다. 수정: 원본 값 그대로 이식(13/15·14·14).
12. **(G3 리뷰) 상태 토큰 이탈** — switch 꺼짐 트랙 bg-input·checkbox/radio
    링 border-primary 등 원본의 G4 대비 조정(bg-foreground/50)에서 벗어났다.
    수정: 원본 토큰으로 정렬(select 트리거 text-sm·radio gap-3 포함).

## 6. 게이트(2026-11-24)

- `bun run typecheck` — 7 워크스페이스 exit 0(packages/unikit은 메인 +
  nsh-ui 두 프로젝트).
- `bun run audit:design` — 10/10 PASS.
- `cd apps/nsh && nsh check` — exit 0. `nsh test` — 8단계 PASS(6단계는 커널
  pending 게이팅 — pending 중 "…" 접미 + 재눌림 차단 + release 후 확정),
  경고 0.
- fresh clone 순서: `bun install` → `cd apps/nsh && nsh check`(스캐폴드) → 게이트.

## 7. 로드맵(이월)

- 킵 확장: 나머지 shadcn형 컴포넌트(nsh/base가 Accordion·Combobox·Tabs·
  Toast·Popover·Tooltip·DataTable 등을 이미 제공 — 감싸기만 하면 된다).
- ui-sdk-nsh: aria-* part 속성 매핑, switch·checkbox·field·input·dialog
  어댑터(RN 판 bindSdkPart 상당의 이식), 계약 프로브(nsh 타깃).
- Select Option-children API(컴파일러 개선 시), Dialog/Sheet Trigger 컴파운드.
- 아이콘 색 스킴 갱신(draw 1회 소비 — 101 승계), tokens.ts → nsh.json
  cssVars 생성 스크립트, registry 등록 검토(nsh 소비자 복사형 배포).

## 8. 독립 리뷰(2026-11-24, 클린 컨텍스트 1회)

- 판정: **«OK with notes»** — P1 없음. P2 6건(F1 잔여 build:nsh·F2 아이콘
  생성 경로·F3 indeterminate 비반응·F4 RadioGroup disabled 무시·F5 커널
  destroy 미호출·F6 hitSlop 부재)과 P3 10건 산출.
- 반영: P2 전건 + P3 중 문서 수치(F13)·Sdk pending 검증(F9)·테스트 주석
  (F8)·Separator 역할 주석(F10)·SdkButton 변형 재사용(F14)·Pressable 타입
  좁힘(F15)·Button/Badge JSX 호이스트(F12)·react-reconciler devDep 제거.
  미반영 2건은 근거 기록으로 남긴다: F16(썸 기하 — 실기기 시각 확인 필요,
  이동량은 실측 기하 translate-x-3/2로 보정 완료), F11(Proxy 커널 결합 —
  가정을 ui-sdk.tsx 머리 주석에 기록, probe:ui-sdk 승급 계약이 파악).
- 커널 검증: press 경로가 인스턴스 `api.internal.press()`를 경유함을
  @ui-sdk/core dist 소스(button.js) 대조로 확인.
