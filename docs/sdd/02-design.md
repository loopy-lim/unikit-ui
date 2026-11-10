# UniKit UI/UX 설계 (G1)

- 작성 직군: `Product/UX Designer` (role-perspective, 오케스트레이터 컨텍스트에서 작성)
- 날짜: 2026-11-07
- 개정: v2 (2026-11-07) — G1 독립 평가(`UX/Design Auditor`) 결함 7건 반영: F-1 라벨 연결 재지정(`aria-labelledby`), F-2 Text 명시 색·폰트 패턴 전환, F-3 `aria-disabled` 교체, F-4 간격·정렬 체크리스트 추가, F-5 카피 정합, F-6 대비 재계산, F-7 접근성 체크리스트 추가
- 개정: v3 (2026-11-08) — G4 실물 관찰 결함 2건 반영(§1.2): ① 배치 행 `flex-row` 명시 4곳 — RN `View`의 기본 flexDirection는 **column**이라 `flex flex-wrap`만으로는 Expo(네이티브·웹 모두)에서 세로 스택이 됨(웹 브라우저만 기본 row). §3.1 컴포넌트 표의 `flex flex-row` 명시 원칙과 정합시킨 것. ② 헤더 좌측 타이틀 블록 `flex-1` — 390px에서 서브타이틀이 줄바꿈되지 않아 토글이 12.3px 잘렸음(RNW Text는 flex에서 자동 축소 안 함).
- 상태: **G1 PASS(v2)** — v3는 G4 관찰 결함 반영 수정(판정은 G4에서 관찰로 확인)
- 입력: `docs/sdd/00-requirements.md`(요구·AC), `docs/sdd/01-research.md`(기술 레시피)
- 범위: UI/UX 설계 전반. 파일 구조·빌드 설정·레지스트리 규격 상세는 `System Architect` 설계와 합침

## 0. 설계 전제와 원칙

1. **기술 스택은 확정된 값을 따른다.** Tailwind 3.4계(TW3) + NativeWind 4.2 + react-native-web(RNW) + cva/cn. 토큰은 TW3 방식 `hsl(var(--token))` 매핑(TW4 `@theme` 아님). RN 프리미티브(`View`/`Text`/`Pressable`/`TextInput`) + `className`만으로 표현 가능한 수준으로 설계한다.
2. **확인 수단은 브라우저다.** 에뮬레이터·실기기가 없으므로(00-requirements §5), 완료 기준의 모든 항목은 **Expo web과 Next.js의 웹 렌더링 스크린샷/DOM에서 관찰 가능**해야 한다. 웹에서만 관찰되는 상태(hover, focus-visible)는 "웹 확인"으로 명시하고, 네이티브 실물이 필요한 것은 완료 조건에 넣지 않는다(§6 잔여 한계 참조).
3. **두 앱은 같은 구성을 보여야 AC-2가 성립한다.** `apps/expo`와 `apps/web`의 쇼케이스는 섹션 순서·카피·컴포넌트 배열·간격이 완전히 동일한 **단일 쇼케이스 페이지**를 공유 구성으로 렌더링한다. 권장 구현: 쇼케이스 본문도 유니버설 컴포넌트(공유 소스)로 구성해 "같은 모습"을 소스 차원에서 보장(최종 파일 배치는 Architect 설계에서 확정).
4. **첫 개발자 배려.** 모든 카피는 한국어·친절 어조(§5). 색·크기는 shadcn/ui 기본 zinc 계열을 따라 학습 자료와의 대응이 쉽게 하되, 텍스트 대비(WCAG AA 4.5:1)를 충족하도록 `--destructive`(라이트)만 red-600 계로 조정한다.
5. **텍스트는 반드시 명시 스타일 지정(RNW 0.21.4 실측 제약).** react-native-web 0.21.4의 `Text`는 항상 요소 자체에 기본 색(`color: 'black'`)과 기본 폰트(`font: '14px System'`) 규칙을 직접 적용한다. 따라서 **부모 요소의 `text-*` 클래스가 자식 Text에 상속되지 않는다**(G1 감사 확인 — 예: 버튼 Pressable의 `text-primary-foreground`는 내부 Text에 닿지 않고, 미지정 시 텍스트는 검정으로 렌더된다). UniKit의 모든 `Text`/`TextInput`에는 (a) 전경색, (b) 폰트 크기, (c) 폰트 패밀리(`font-sans`)를 명시한다. 두 앱 모두 RNW로 렌더링하므로 **같은 명시 클래스 = 같은 절대 렌더 결과**이며, 이것이 §4의 HEX 기대값 비교의 전제다. HTML 기본 폰트 대응용 전역 CSS(`html { font-family: … }`)는 Text의 요소 자체 기본값을 대체하지 못하므로 사용하지 않는다.

## 1. 쇼케이스 정보 구조

### 1.1 화면 개요

- v0.1 쇼케이스는 **1페이지**(세로 스크롤)로 충분하다. 라우팅 분기가 없으므로 Expo Router와 Next.js 모두 단일 진입 화면이 된다.
- 기준 뷰포트: **390×844**(iPhone 14 논리 크기). 데스크톱 브라우저에서는 콘텐츠가 `max-w-[640px]`로 중앙 정렬되어 좁은 단일 컬럼을 유지한다(AC-2 비교 캡처는 390×844로 통일, §4.1).
- 페이지 배경 `bg-background`, 본문 텍스트 `text-foreground`.

### 1.2 화면 구성도 (레이아웃 트리)

```
ShowcaseScreen (w-full max-w-[640px] mx-auto px-4 pt-8 pb-12, 세로 스크롤)
├─ Header (flex-row items-center justify-between, mb-8)
│  ├─ 좌: 타이틀 블록 (flex-1 — 좁은 뷰포트에서 서브타이틀 줄바꿈, 토글 잘림 방지)
│  │  ├─ "UniKit" (font-sans text-2xl font-bold web:tracking-tight text-foreground)
│  │  └─ 서브타이틀 (font-sans text-sm text-muted-foreground)
│  └─ 우: 테마 토글 버튼 — UniKit Button(variant="outline", size="sm") 재사용
│     ├─ 라이트 모드일 때: "🌙 다크"
│     └─ 다크 모드일 때:  "☀️ 라이트"
├─ Section: Button (space-y-4)
│  ├─ 섹션 제목 "Button · 버튼" + 설명 문구
│  ├─ [변형 6종] flex flex-row flex-wrap gap-3 — 기본/보조/삭제/외곽선/고스트/링크 (모두 size="default")
│  ├─ [크기 4종] flex flex-row flex-wrap items-center gap-3 — sm/default/lg/icon (모두 variant="default")
│  └─ [상태] flex flex-row flex-wrap gap-3 — 비활성(default·disabled) 1개
│     (눌림 시연 안내는 섹션 설명 문구 "버튼을 꾹 눌러보세요"로 충당 — 별도 문구 없음)
├─ Section: Card (space-y-4)
│  ├─ 섹션 제목 "Card · 카드" + 설명 문구
│  ├─ 카드 1장: Header(Title+Description) / Content / Footer(텍스트 + Button outline sm)
│  └─ 카드 2장: Header(Title+Description) / Content — 다른 카드와의 배치·다크 모드 시연
├─ Section: Input · Label (space-y-4)
│  ├─ 섹션 제목 "Input · Label — 입력창" + 설명 문구
│  ├─ 입력창 1: Label("이름") + Input(placeholder "홍길동")
│  ├─ 입력창 2: Label("이메일") + Input(placeholder "example@unikit.dev")
│  └─ 입력창 3: Label("비활성 입력창") + Input(disabled)
├─ Section: Badge (space-y-4)
│  ├─ 섹션 제목 "Badge · 배지" + 설명 문구
│  └─ [변형 4종] flex flex-row flex-wrap gap-2 — 기본/보조/삭제/외곽선
└─ Footer (pt-10, text-center)
   └─ "UniKit v0.1 · Expo와 Next.js에서 같은 화면을 보고 있어요." (font-sans text-xs text-muted-foreground)

섹션 사이 간격: space-y-10 = 40px (부모 컨테이너가 관리)
각 섹션 내부: 제목 font-sans text-lg font-semibold text-foreground / 설명 font-sans text-sm text-muted-foreground / 본문 mt-4
카드 본문 등 트리에 클래스를 적지 않은 모든 텍스트 노드도 §0.5 규칙에 따라 색상·폰트를 명시한다(예: font-sans text-sm text-foreground)
```

Expo 앱에서만 최상단을 `SafeAreaView`(react-native-safe-area-context, peer 의존성으로 이미 설치됨)로 감싸 노치를 피한다. 이는 콘텐츠 배열을 바꾸지 않는 포장 차이만 허용한다.

### 1.3 섹션별 구성 상세

| 섹션 | 내용 | 시연 포인트 |
|---|---|---|
| Button | 변형 6종(default/secondary/destructive/outline/ghost/link) 한 줄, 크기 4종(sm/default/lg/icon) 한 줄, 비활성 1개 | 배경·전경색 조합, 높이 차이, press 시 색 변화, 링크 밑줄 |
| Card | 카드 2장(구성 요소 전부 사용) | 헤더/타이틀/설명/내용/푸터의 수직 구조와 패딩, 카드 배경색이 페이지 배경과 구분되는지(다크 모드에서 뚜렷) |
| Input · Label | 라벨+입력창 3조(일반 2, 비활성 1) | Label-Input 연결, placeholder 색상, 포커스 링, 비활성 반투명 |
| Badge | 변형 4종(default/secondary/destructive/outline) | 배지 배경색·테두리 유무, 작은 타이포 |

크기 시연의 `icon` 버튼 내용물은 의존성 없는 텍스트 **"+"**를 쓴다(아이콘 라이브러리 추가 금지, §0.1 표준 스택 유지).

### 1.4 라이트/다크 토글

- **위치**: 헤더 우측. v0.1에서 유일한 전역 컨트롤이므로 첫 화면(스크롤 없이)에서 항상 보여야 한다.
- **형태**: UniKit `Button`(variant=`outline`, size=`sm`)을 재사용한다 — 토글 자체가 컴포넌트 실사용 예시가 된다. 라벨은 이모지+텍스트("🌙 다크" / "☀️ 라이트", 이모지는 RN/웹 양쪽 무의존 렌더링). `accessibilityRole="button"`, `accessibilityLabel="색 테마 전환"`.
- **동작**: 누르면 앱 전역의 토큰이 **즉시 전환**된다(애니메이션 없음, v0.1 제외). 버튼 라벨은 "누르면 될 모드"를 표시한다(현재 모드의 반대).
- **기본값**: 라이트 모드에서 시작. 새로고침 후에도 유지(localStorage 등 영속화)는 v0.1 제외 — 네이티브 쪽 저장 의존성이 필요해지므로.
- **구현 지침(엔지니어 참고)**: 웹 표준은 루트 요소의 `.dark` 클래스 토글, 네이티브는 NativeWind `vars()` 재적용. 상태는 앱 로컬 상태(React state) 하나로 갖고 두 플랫폼에 같은 값을 내려준다(세부는 Architect/엔지니어 설계).

### 1.5 앱별 화면 파일 대응 (같은 구성의 이중 보장)

| apps/expo (Expo Router) | apps/web (Next.js App Router) | 역할 |
|---|---|---|
| `app/_layout.tsx` | `app/layout.tsx` | 루트. 테마 상태 보유(또는 공유 Provider), 전역 스타일 로드 |
| `app/index.tsx` | `app/page.tsx`(`"use client"` 필수 — RSC 미지원, 01-research §2.2) | 동일한 쇼케이스 화면 렌더링 |

양쪽 페이지는 같은 섹션 순서(§1.2)와 같은 카피(§5)를 렌더링한다. 이 원칙이 어겨지면 AC-2 비교 캡처가 성립하지 않는다.

## 2. 디자인 토큰 정의

shadcn/ui 표준 zinc 토큰을 기준으로 하되, 라이트 `--destructive`만 대비 확보를 위해 red-600 계(`0 72.2% 50.6%`)로 조정했다. 모든 값은 HSL 채널 값(공백 구분, TW3 `hsl(var(--token))` 매핑용)이며 HEX는 스크린샷 판정용 환산값이다.

> **수정 이력(사이클 30, G4 UX 감사 반영)**: 다크 `--destructive`는 shadcn 원본 값(`0 62.8% 30.6%`)을 그대로 쓰면 다크 배경 대비 1.99:1로 WCAG AA(4.5:1)에 크게 미달해 "경고" 텍스트가 사실상 안 읽힌다. red-400 계(`0 72% 65%`, #e66666)로 조정 — 다크 배경 대비 6.1:1. 라이트 값은 기존 red-600 유지(4.83:1).

### 2.1 색 토큰 표

| 변수 | 라이트 값 (HSL) | 라이트 HEX | 다크 값 (HSL) | 다크 HEX | 용도 |
|---|---|---|---|---|---|
| `--background` | `0 0% 100%` | #ffffff | `240 10% 3.9%` | #09090b | 페이지/앱 배경 |
| `--foreground` | `240 10% 3.9%` | #09090b | `0 0% 98%` | #fafafa | 기본 텍스트 |
| `--card` | `0 0% 100%` | #ffffff | `240 10% 3.9%` | #09090b | 카드 배경 |
| `--card-foreground` | `240 10% 3.9%` | #09090b | `0 0% 98%` | #fafafa | 카드 내 텍스트 |
| `--popover` | `0 0% 100%` | #ffffff | `240 10% 3.9%` | #09090b | 팝오버 배경(v0.1 예약, 미사용) |
| `--popover-foreground` | `240 10% 3.9%` | #09090b | `0 0% 98%` | #fafafa | 팝오버 텍스트(v0.1 예약) |
| `--primary` | `240 5.9% 10%` | #18181b | `0 0% 98%` | #fafafa | 주 행동 배경(기본 버튼, 기본 배지) |
| `--primary-foreground` | `0 0% 98%` | #fafafa | `240 5.9% 10%` | #18181b | 주 행동 위 텍스트 |
| `--secondary` | `240 4.8% 95.9%` | #f4f4f5 | `240 3.7% 15.9%` | #27272a | 보조 행동 배경 |
| `--secondary-foreground` | `240 5.9% 10%` | #18181b | `0 0% 98%` | #fafafa | 보조 행동 위 텍스트 |
| `--muted` | `240 4.8% 95.9%` | #f4f4f5 | `240 3.7% 15.9%` | #27272a | 흐린 배경(비강조 영역) |
| `--muted-foreground` | `240 3.8% 46.1%` | #71717a | `240 5% 64.9%` | #a1a1aa | 흐린 텍스트(설명문, placeholder) |
| `--accent` | `240 4.8% 95.9%` | #f4f4f5 | `240 3.7% 15.9%` | #27272a | hover/press 강조 배경(ghost·outline 버튼) |
| `--accent-foreground` | `240 5.9% 10%` | #18181b | `0 0% 98%` | #fafafa | accent 위 텍스트 |
| `--destructive` | `0 72.2% 50.6%` | #dc2626 | `0 72% 65%` | #e66666 | 위험·삭제 행동 배경 |
| `--destructive-foreground` | `0 0% 98%` | #fafafa | `0 0% 98%` | #fafafa | 위험 행동 위 텍스트 |
| `--border` | `240 5.9% 90%` | #e4e4e7 | `240 3.7% 15.9%` | #27272a | 일반 테두리(카드, outline 배지) |
| `--input` | `240 5.9% 90%` | #e4e4e7 | `240 3.7% 15.9%` | #27272a | 입력창 테두리 |
| `--ring` | `240 5.9% 10%` | #18181b | `240 4.9% 83.9%` | #d4d4d8 | 포커스 링(접근성, §3.6) |

주석: `--destructive` 라이트를 shadcn 기본값(`0 84.2% 60.2%` = #ef4444)이 아닌 red-600으로 정한 이유 — 전경 `--destructive-foreground`(#fafafa)와의 대비가 WCAG 공식식 기준 ≈3.6:1로 4.5:1 미달이기 때문. red-600(#dc2626)은 ≈4.63:1로 통과(§3.5 대비표).

### 2.2 반경 토큰과 파생

- `--radius: 0.5rem`(= 8px). 라이트/다크 공통(테마와 무관).
- TW3 `tailwind.config.js`의 `borderRadius` 확장 — 파생값:

| Tailwind 클래스 | 정의 | 실제 값 | 사용처 |
|---|---|---|---|
| `rounded-sm` | `calc(var(--radius) - 4px)` | 4px | (예비) |
| `rounded-md` | `calc(var(--radius) - 2px)` | 6px | Button, Input, Badge |
| `rounded-lg` | `var(--radius)` | 8px | (예비) |
| `rounded-xl` | Tailwind 기본값 유지(`0.75rem`) | 12px | Card |

### 2.3 토큰 적용 방식 (엔지니어 참고, 01-research §2.3과 동일 원칙)

- `tailwind.config.js` `theme.extend.colors`에서 모든 색을 `hsl(var(--token))` 형식으로 매핑(예: `primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" }`). `/50` 같은 불투명도 수식(`bg-primary/90`)이 동작하려면 `hsl(var(--primary))` 래핑이 TW3 표준 방식이다.
- 웹: 전역 CSS의 `:root { … }`(라이트 세트)와 `.dark { … }`(다크 세트)에 §2.1 값을 변수로 정의. 다크 토글은 루트 요소의 `.dark` 클래스 부착/제거로 수행(§1.4).
- 네이티브: 동일한 변수 세트를 NativeWind `vars()` 객체로 주입(라이트/다크 두 벌). 웹 확인이 기준이므로 네이티브 값 검증은 AC-3 번들 성공으로 갈음한다(잔여 한계, §6).
- 매핑 스니펫의 정확한 배치는 Architect 설계 파일에서 확정한다(본 문서는 값과 구조가 원천).

## 3. 컴포넌트별 변형·상태·접근성 명세

공통 사항(v0.1 전 컴포넌트): cva로 변형 정의, `cn()`으로 `className` 병합, TypeScript props는 기본 HTML/RN 속성을 확장. 아래 클래스 문자열은 NativeWind 4에서 그대로 쓸 수 있는 최종값이다. `web:` 접두사는 웹 전용 클래스, `active:`는 Pressable 눌림 상태(웹 포함 — RNW가 마우스 press에도 적용), `focus-visible:`은 웹 키보드 포커스 전용이다.

### 3.1 Button

프리미티브: `Pressable` + 내부 `Text`(children을 자체 `Text`로 감싸 렌더 — v0.1은 문자열 children 사용).

**cva 정의 — Pressable(컨테이너)과 Text(내부 텍스트) 이중 지정.** RNW 0.21.4에서는 부모의 전경색 클래스가 내부 Text에 상속되지 않으므로(§0.5), **변형별 전경색은 내부 Text 클래스로 명시**한다. 구현은 cva의 compoundVariants 또는 변형별 조회표로 Text 클래스를 계산하며, 아래 표가 그 원천이다.

| 변형 | Pressable 클래스 | 내부 Text 클래스 |
|---|---|---|
| base(공통) | `flex flex-row items-center justify-center gap-2 rounded-md web:select-none` | `font-sans text-sm font-medium web:whitespace-nowrap` |
| `default` | `bg-primary web:hover:bg-primary/90 active:bg-primary/90` | `text-primary-foreground` |
| `secondary` | `bg-secondary web:hover:bg-secondary/80 active:bg-secondary/80` | `text-secondary-foreground` |
| `destructive` | `bg-destructive web:hover:bg-destructive/90 active:bg-destructive/90` | `text-destructive-foreground` |
| `outline` | `border border-input bg-background web:hover:bg-accent active:bg-accent` | `text-foreground active:text-accent-foreground` |
| `ghost` | `web:hover:bg-accent active:bg-accent` | `text-foreground active:text-accent-foreground` |
| `link` | (배경 없음) | `text-primary underline underline-offset-4` |

| 그룹 | 값 | 클래스(Pressable) |
|---|---|---|
| size | `default` | `h-10 px-4 py-2` |
| size | `sm` | `h-9 px-3` |
| size | `lg` | `h-11 px-8` |
| size | `icon` | `h-10 w-10` |
| (전역) | disabled | `web:pointer-events-none opacity-50` |
| (전역) | focus-visible(웹) | `web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:ring-offset-background` |

disabled의 `opacity-50`은 Pressable에 적용되며 자식 렌더에 곱해져 Text에도 반영된다. 소비자가 자체 `Text`를 children으로 넘기는 고급 사용에는 색이 자동 지정되지 않으므로, 필요 시 TextClassContext 패턴(내부 Text가 변형 클래스를 소비)을 확장으로 안내한다 — v0.1 쇼케이스는 문자열 children만 사용하므로 불필요.

**상태 명세**

| 상태 | 시각 | 관찰 수단 |
|---|---|---|
| 정지(rest) | 변형별 배경(Pressable) + 전경(Text 명시 색) | 스크린샷 |
| 눌림(press) | default/destructive는 배경 불투명도 90%, secondary는 80%, ghost/outline은 배경 `--accent` 전환 + Text 전경 `--accent-foreground` 전환 | 웹에서 마우스 press 유지 캡처 |
| 비활성(disabled) | `opacity-50`(반투명), press 무반응 | 스크린샷 + 클릭 무반응 |
| 키보드 포커스(웹) | 2px `--ring` 링 + 2px 오프셋 | 웹에서 Tab 키 이동 캡처 |

**터치 타깃(44pt 최소)**: 시각 크기는 위 size 값을 유지하고, 실제 히트 영역은 `Pressable`의 `hitSlop`으로 보정한다 — `hitSlop = max(0, (44 − 시각높이px) / 2)`이므로 **sm: 4, default: 2, lg: 0, icon: 2** (각 방향 px). 웹에서 hitSlop은 시각에 영향을 주지 않아 AC-2 캡처에 변화가 없다.

**접근성**: `accessibilityRole="button"`(→ 웹 `role="button"`). `disabled` 시 Pressable의 `disabled` prop과 함께 **`aria-disabled={true}`**를 지정한다(→ 웹 `aria-disabled="true"`). `accessibilityState={{ disabled: true }}` 객체는 RNW 0.21.4에서 DOM으로 전달되지 않으므로(§3.6) 사용하지 않는다.

### 3.2 Card

프리미티브: `View` + `Text`. 하위 컴포넌트 5종(모두 개별 export).

| 컴포넌트 | 클래스 |
|---|---|
| `Card` | `rounded-xl border border-border bg-card shadow-sm` |
| `CardHeader` | `flex flex-col gap-1.5 p-6` |
| `CardTitle` | `font-sans text-foreground text-2xl web:tracking-tight font-semibold` (RN `Text`) |
| `CardDescription` | `font-sans text-sm text-muted-foreground` |
| `CardContent` | `p-6 pt-0` |
| `CardFooter` | `flex-row items-center gap-2 p-6 pt-0` |

주석: RNW 상속 차단(§0.5)으로 `Card`의 `text-card-foreground`는 자식 Text에 닿지 않으므로 Card 클래스에서 제거했다(`--card-foreground` 토큰 자체는 shadcn 호환용으로 §2.1에 유지). CardContent 안에 들어가는 본문 텍스트는 사용처(쇼케이스)에서 `font-sans text-sm text-foreground`처럼 명시한다(§1.2 표기 규칙).

주석: `shadow-sm`은 웹(box-shadow)과 iOS에서 유효, Android 네이티브에서는 그림자가 다르게/늦게 렌더될 수 있다(잔여 한계 §6). 카드 배경이 라이트에서는 페이지 배경과 동일한 `#ffffff`(테두리로 구분), **다크에서는 배경과 동일한 `#09090b`이지만 테두리 `#27272a`로 구분**된다 — shadcn zinc 표준 동작이며 체크리스트(§4.3)의 기대값이다.

### 3.3 Input

프리미티브: `TextInput`.

클래스: `font-sans h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background web:focus-visible:border-ring disabled:opacity-50`

| 항목 | 명세 |
|---|---|
| 크기 | 높이 40px, 좌우 패딩 12px, 텍스트 16px(`text-base` — iOS 모바일 브라우저의 포커스 시 자동 확대 방지 겸용) |
| placeholder | `--muted-foreground` 색 (§2.1, `placeholder:` 유틸리티 → `placeholderTextColor`) |
| 포커스 | 테두리가 `--input` → `--ring`으로 전환 + 2px `--ring` 링(오프셋 2px, 오프셋색=배경). Tab 이동으로도 동일 |
| 비활성 | `disabled` prop + **`aria-disabled={true}`**, 반투명 (`accessibilityState` 객체는 RNW 미전달, §3.6) |
| 접근성 | §3.4 Label 연계 시 `accessibilityLabelledBy`(→ 웹 `aria-labelledby`), 단독 사용 시 `accessibilityLabel`. `keyboardType` 등은 소비자가 props로 전달 |

### 3.4 Label

프리미티브: `Text`.

클래스: `font-sans text-sm font-medium leading-none text-foreground`

- **입력창 연결(RNW 0.21.4 실측 기준 재지정)**: RN 프리미티브만으로 `<label for>` 요소는 렌더할 수 없다 — RNW 0.21.4의 `Text`는 `htmlFor`를 DOM으로 전달하지 않는다(G1 감사 확인, §6 한계). 대신 다음 2개 메커니즘으로 연결한다.
  1. **스크린리더·DOM 연결(필수)**: Label의 `Text`에 `nativeID`를 지정한다(→ 웹 `id` 렌더 확인됨. 네이밍 규칙 `unikit-label-<name>`으로 충돌 방지). 대상 `TextInput`에 `accessibilityLabelledBy`에 같은 값을 전달한다(→ 웹 `aria-labelledby` 렌더 확인됨). 예: `nativeID="unikit-label-name"` ↔ `accessibilityLabelledBy="unikit-label-name"`.
  2. **클릭→포커스 연결(권장)**: Label이 `onPress`를 받아 대상 입력창 ref의 `focus()`를 호출한다. 웹에서 라벨 클릭 시 입력창 포커스 링이 뜨는 것으로 관찰 가능하다.
- 쇼케이스 3쌍(§1.2) 모두에 1+2를 적용한다. 시각 배치(라벨이 입력창 바로 위, `gap-2` 스택)는 변경 없음.

### 3.5 Badge

프리미티브: `View`(또는 `Text` 단일) + 내부 `Text`.

**cva 정의 — View(컨테이너)와 Text(내부 텍스트) 이중 지정**(§0.5 규칙, Button과 동일 패턴):

| 그룹 | 값 | View 클래스 | 내부 Text 클래스 |
|---|---|---|---|
| base | 공통 | `flex flex-row items-center rounded-md border px-2.5 py-0.5` | `font-sans text-xs font-semibold` |
| variant | `default` | `border-transparent bg-primary` | `text-primary-foreground` |
| variant | `secondary` | `border-transparent bg-secondary` | `text-secondary-foreground` |
| variant | `destructive` | `border-transparent bg-destructive` | `text-destructive-foreground` |
| variant | `outline` | `border-border` (배경 투명) | `text-foreground` |

**대비(contrast) 기준 — Badge·Button 공통**: 전경/배경 조합이 WCAG AA **텍스트 4.5:1** 이상이어야 한다. 본 토큰 세트의 주요 조합(WCAG 공식 상대휘도식으로 재계산, §2.1 HEX 기준):

| 조합 | 라이트 | 다크 |
|---|---|---|
| primary-foreground / primary | ≈17.0:1 통과 | ≈17.0:1 통과 |
| secondary-foreground / secondary | ≈16.1:1 통과 | ≈14.3:1 통과 |
| destructive-foreground / destructive | ≈4.63:1 통과 | ≈9.6:1 통과 |
| muted-foreground / background | ≈4.8:1 통과 | ≈7.8:1 통과 |
| foreground / background (outline 배지·고스트 버튼) | ≈19.9:1 통과 | ≈19.1:1 통과 |

**전 조합이 4.5:1 이상으로 WCAG AA 텍스트 기준을 통과한다(결론 불변).** `--accent`는 `--secondary`와 값이 동일(§2.1)하므로 ghost/outline 버튼의 hover·press(accent 배경 + accent-foreground) 조합도 secondary와 같은 대비다.

### 3.6 접근성 공통 (RN → react-native-web DOM 매핑)

쇼케이스 확인 수단이 웹이므로, RN 접근성 속성이 RNW에서 어떤 DOM으로 나오는지가 명세의 일부다.

| RN prop (컴포넌트에 지정) | RNW 웹 렌더 | 쇼케이스 확인 |
|---|---|---|
| `accessibilityRole="button"` (Button) | `role="button"` | DOM 검사 |
| `aria-disabled={true}` (Pressable·TextInput) | `aria-disabled="true"` | DOM 검사. ※ `accessibilityState={{ disabled: true }}` 객체는 RNW 0.21.4에서 DOM으로 전달되지 않음(실소스 확인) — **사용 금지** |
| `accessibilityLabel="…"` | `aria-label="…"` | DOM 검사 |
| `nativeID` (Label의 Text) | `id="…"` | DOM 검사 |
| `accessibilityLabelledBy` (TextInput) | `aria-labelledby="…"` | DOM 검사 + 라벨 클릭 시 대응 입력창 포커스 |
| `onPress` (Label의 Text) | 클릭 핸들러 | 라벨 클릭 → 입력창 focus 링 캡처 |
| `focus:` / `focus-visible:` 클래스 | 키보드 Tab 이동 시 ring 표시 | 웹 캡처 |
| 텍스트 명시 색상·폰트 (모든 Text, §0.5) | 요소 자체 `color`/`font-family` 스타일 | DOM computed style이 기대 HEX와 일치 |
| 텍스트 대비 | §3.5 표 기준 | 스포이드/계산 도구 |

터치 타깃: 모든 상호작용 요소 최소 44×44px(Button은 §3.1 hitSlop 규칙, 토글 버튼은 size `sm`이므로 동일 규칙 적용). 웹에서는 마우스 클릭 영역이 시각보다 넓은지 직접 확인하기 어려우므로 완료 조건이 아니라 구현 명세로 둔다(§4는 관찰 가능 항목만).

## 4. UI 완료 체크리스트 (AC-2 · AC-6 판정 기준)

이 장의 항목은 모두 **관찰 가능한 사실**로만 구성했다. 각 항목은 아래 캡처 조건에서 판정한다.

### 4.1 캡처 조건

- 브라우저 뷰포트 **390×844**, 배율 100%(DPR 1)로 통일.
- 대상: `apps/expo`(Expo web, `expo start --web`)과 `apps/web`(Next.js) **같은 브라우저에서** 각각 캡처.
- 증거 파일 권장명: `docs/sdd/evidence/ac2-{expo|web}-{light|dark}.png` (라이트 2장 = AC-2용), `ac6-{expo|web}-{light→dark}.png` (전환 전·후 각 2장 = AC-6용). 스크롤이 있는 화면은 풀페이지 캡처.

### 4.2 AC-2 체크리스트 (두 렌더링이 같은 모습)

기대값은 §2.1 HEX. 두 앱의 캡처를 나란히 놓고 판정한다. A·B그룹은 스크린샷(풀페이지 캡처 포함), C그룹은 웹 상호작용·DOM 검사로 확인한다.

**A. 구성·외형**

- [ ] 섹션이 두 앱 모두 같은 순서로 나타난다: 헤더 → Button → Card → Input·Label → Badge → 푸터
- [ ] 헤더의 타이틀("UniKit")·서브타이틀 문구가 두 앱에서 동일하게 보인다
- [ ] Button 변형 6종이 모두 렌더되고 두 앱에서 배경과 텍스트 색(내부 Text 명시 색, §3.1)이 같다: 기본 #18181b 배경/#fafafa 텍스트, 보조 #f4f4f5/#18181b, 삭제 #dc2626/#fafafa, 외곽선 흰 배경+1px #e4e4e7 테두리/#09090b 텍스트, 고스트 투명 배경, 링크 밑줄+#18181b
- [ ] Button 크기 4종의 높이 차이가 두 앱에서 동일하다: sm 36px < default 40px < lg 44px, icon은 40×40 정사각
- [ ] 버튼 텍스트가 두 앱에서 같은 크기(14px, medium)다
- [ ] Card 2장의 외형이 동일하다: 12px 라운드, 1px #e4e4e7 테두리, 24px 내부 패딩, 타이틀(큰 굵은 글씨)·설명(회색)·본문·푸터 수직 구조
- [ ] Card 푸터 안의 outline sm 버튼("자세히")이 두 앱에서 같다
- [ ] Input 3개의 외형이 동일하다: 높이 40px, 6px 라운드, 1px #e4e4e7 테두리, placeholder가 회색(#71717a)
- [ ] Label 3개가 입력창 바로 위에 같은 폰트 크기(14px medium)로 붙어 있다
- [ ] 비활성 입력창이 반투명(50%)으로 두 앱에서 같다
- [ ] Badge 4종이 동일하다: 기본 #18181b, 보조 #f4f4f5, 삭제 #dc2626, 외곽선 투명+테두리만(텍스트 #09090b)
- [ ] 전체 페이지 배경이 흰색(#ffffff), 제목·본문 텍스트(각 Text 명시 색상)가 #09090b로 같다

**B. 간격·정렬·폭 (풀페이지 캡처 비교)**

- [ ] 섹션 사이 수직 간격이 같다(40px, `space-y-10`)
- [ ] 행 간격이 같다: 컴포넌트 행 `gap-3`(12px), 배지 행 `gap-2`(8px)
- [ ] 헤더가 좌(타이틀 블록)·우(토글 버튼) 양 끝 정렬(`justify-between`)이고, 본문 좌우 여백(16px, `px-4`)이 같다
- [ ] 푸터 문구가 중앙 정렬로 두 앱에서 같다
- [ ] 카드 2장이 컨테이너와 같은 폭으로 위·아래(세로 스택) 배치된다
- [ ] 풀페이지 캡처의 전체 레이아웃 스켈레톤(여백·정렬·간격·요소 폭)이 두 앱에서 일치한다

**C. 폰트·웹 접근성 (DOM/상호작용)**

- [ ] 모든 텍스트에 명시 색상·폰트가 적용되어 두 앱의 타이포그래피가 동일하다 — (DOM) 기본 버튼 내부 텍스트 computed color #fafafa, 카드 본문 computed color #09090b가 기대값과 일치. *부모 상속에 기대면 RNW 기본값 `color: black`이 그대로 노출되어 검은 텍스트로 나타나므로 즉시 발견된다(§0.5)*
- [ ] (웹 상호작용) Tab 키로 토글·버튼·입력창을 차례로 방문할 때 2px `--ring` 링(오프셋 2px)이 각 요소에 캡처된다
- [ ] (DOM) 비활성 버튼과 비활성 입력창이 `aria-disabled="true"`를 렌더한다
- [ ] (DOM) 두 앱의 버튼 요소가 `role="button"`이고, 라벨-입력창이 `aria-labelledby`(Label의 `id` ↔ TextInput)로 연결되어 있다 — 라벨 클릭 시 대응 입력창에 포커스 링이 뜬다

### 4.3 AC-6 체크리스트 (테마 전환)

각 앱에서 헤더 우측 토글("🌙 다크")을 눌러 전·후를 캡처한다.

- [ ] 토글 버튼이 헤더 우측에 있고 라벨이 "🌙 다크"(라이트 상태)로 보인다
- [ ] 토글 1회 클릭으로 화면 전체가 즉시 전환된다(부분 전환·잔류 없음)
- [ ] 배경이 #ffffff → #09090b로 전환되고, 제목·본문 텍스트(각 Text의 명시 전경 클래스)가 #09090b → #fafafa로 전환된다
- [ ] Button 6종이 일괄 전환된다: 기본 버튼 배경 #fafafa/텍스트 #18181b(반전), 보조 #27272a, 삭제 #7f1d1d, 외곽선 배경 #09090b+테두리 #27272a, 고스트 투명, 링크 #fafafa 밑줄
- [ ] Card가 전환된다: 배경 #09090b, 테두리 #27272a(라이트의 #e4e4e7 → 다크 #27272a)
- [ ] Input 테두리가 #27272a로, placeholder가 #a1a1aa로 전환된다
- [ ] Badge가 전환된다: 기본 #fafafa 배경/#18181b 텍스트, 보조 #27272a, 삭제 #7f1d1d
- [ ] 토글 버튼 라벨이 "☀️ 라이트"로 바뀐다
- [ ] 다시 누르면 원래 라이트 모드로 완전히 복귀한다(왕복 안정성)
- [ ] **Expo web과 Next.js 양쪽 모두** 위 항목이 동일하게 성립한다

## 5. 한국어 카피 (전체 목록)

쇼케이스에 들어가는 모든 문구. 두 앱이 같은 카피를 쓴다(AC-2의 전제). 문체: 해요체, 친절·간결.

| 위치 | 문구 |
|---|---|
| 헤더 타이틀 | UniKit |
| 헤더 서브타이틀 | React와 React Native에서 같은 컴포넌트, 같은 모습. |
| 토글(라이트 상태) | 🌙 다크 |
| 토글(다크 상태) | ☀️ 라이트 |
| 토글 접근성 라벨 | 색 테마 전환 |
| Button 섹션 제목 | Button · 버튼 |
| Button 섹션 설명 | 여섯 가지 스타일과 네 가지 크기예요. 버튼을 꾹 눌러보세요. |
| 버튼(변형) 라벨 | 기본 / 보조 / 삭제 / 외곽선 / 고스트 / 링크 |
| 버튼(크기) 라벨 | 작게 / 보통 / 크게 / + (아이콘 버튼) |
| 비활성 버튼 라벨 | 비활성 |
| Card 섹션 제목 | Card · 카드 |
| Card 섹션 설명 | 제목·설명·내용·하단을 조합해 정보를 담아요. |
| 카드 1 타이틀 | 안녕, UniKit! |
| 카드 1 설명 | 복사해서 쓰는 유니버설 컴포넌트 |
| 카드 1 내용 | 이 카드 하나가 React(웹)와 React Native 모두에서 똑같이 렌더링돼요. 소스를 내 프로젝트로 가져와 자유롭게 고칠 수 있어요. |
| 카드 1 푸터 좌측 | v0.1 |
| 카드 1 푸터 버튼 | 자세히 |
| 카드 2 타이틀 | 다크 모드도 한 번에 |
| 카드 2 설명 | 오른쪽 위 토글로 전체 색이 전환돼요. |
| 카드 2 내용 | 색·테두리·배경이 모두 CSS 변수 토큰으로 정의되어 있어, 테마를 바꾸면 화면 전체가 한꺼번에 바뀌어요. |
| Input 섹션 제목 | Input · Label — 입력창 |
| Input 섹션 설명 | 레이블과 입력창을 함께 써요. 입력창을 클릭하면 테두리가 강조돼요. |
| 입력창 1 라벨/placeholder | 이름 / 홍길동 |
| 입력창 2 라벨/placeholder | 이메일 / example@unikit.dev |
| 입력창 3 라벨/placeholder | 비활성 입력창 / 비활성 상태예요 |
| Badge 섹션 제목 | Badge · 배지 |
| Badge 섹션 설명 | 네 가지 스타일의 배지예요. |
| 배지 라벨 | 기본 / 보조 / 삭제 / 외곽선 |
| 푸터 | UniKit v0.1 · Expo와 Next.js에서 같은 화면을 보고 있어요. |

## 6. 잔여 한계와 구현 참고

- **네이티브 실물 확인 불가**(00-requirements §5와 동일 인계): press 감촉·네이티브 런타임 테마 전환·Android `shadow-sm` 그림자의 실물 외형은 본 설계의 완료 조건에 넣지 않았다. 사용자는 README의 Expo Go 가이드로 직접 확인한다.
- **`<label for>` 불가(구조적 한계)**: RN 프리미티브(`Text`/`TextInput`)만으로는 HTML `<label for>` 요소를 렌더할 수 없다 — RNW 0.21.4의 `Text`는 `htmlFor`를 DOM으로 전달하지 않는다(G1 감사 실소스 확인). 라벨-입력창 연결은 `nativeID`(→ `id`) + `accessibilityLabelledBy`(→ `aria-labelledby`)와 라벨 `onPress`→ref `focus()`로 갈음한다(§3.4). 시맨틱 `<label>` 요소가 꼭 필요한 소비자는 웹 전용 래퍼를 자체 작성해야 하며 v0.1 범위 밖이다.
- **RNW Text 기본 스타일로 인한 제약**: RNW 0.21.4의 모든 `Text`는 요소 자체에 `color:'black'`·`font:'14px System'` 기본 규칙을 강제 적용하므로 부모 클래스 상속이 구조적으로 차단된다(§0.5). 이에 따라 UniKit의 모든 텍스트는 명시 색상·폰트 패턴(§3.1·§3.5의 이중 지정)으로만 스타일링한다. 상속 기반 스타일링은 금지.
- **`ring` 유틸리티**: 포커스 링은 NativeWind 4의 `ring-*`(box-shadow 기반)을 사용한다. 웹에서 렌더 확인이 기준이며(§4), 네이티브에서 ring이 일부러 미지원되어도 AC 판정에 영향이 없도록 체크리스트는 웹 캡처로만 구성했다.
- **`transition`·애니메이션**: v0.1에서 의도적으로 제외(의존성·복잡도 최소화). Badge의 `transition-colors` 등은 shadcn 원본에 있으나 RN 네이티브에서 의미가 없어 삭제했다.
- **구현 중 값 미세조정**: HEX 기대값은 본 문서의 HSL 토큰을 브라우저가 렌더한 결과와 대조한다. 브라우저 색공간 차이로 ±1 수준 오차는 통과로 본다(체크리스트 판정자 가이드).
- 본 문서의 클래스 문자열·토큰 값은 구현의 원천 출처다. 구현자가 임의로 변형을 추가·변경하면 AC-2 기대값과 어긋나므로, 변경이 필요하면 이 문서를 먼저 고친다.
