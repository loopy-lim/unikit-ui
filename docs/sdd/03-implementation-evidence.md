# UniKit G2 구현 실행 증거 (T-1~T-12 · V-1~V-8)

- 작성: 오케스트레이터(각 태스크 수행 에이전트 보고·통합 검증 결과 사실 종합) — **본 문서는 관문 판정이 아님**
- 날짜: 2026-11-07
- 실행 환경(최종): bun 1.4.4(`bunfig.toml` `[install] linker = "hoisted"`), node v26.13.0, Linux x86
- 수행 방식: 태스크 T-1~T-12는 독립 스폰 에이전트가 `Platform/Tooling Engineer`(PLAT: T-1~T-4, T-9~T-11) / `Frontend/UI Engineer`(FE: T-5~T-8, T-12) 역할로 수행, 오케스트레이터가 통합 조정. 원장(ledger.md)의 진행 중 변경 기록과 함께 읽을 것.

## 1. 태스크별 실행 증거

| T | 담당 | 산출(대표) | 완료 기준 실측 | 주요 조정(사실) |
|---|---|---|---|---|
| T-1 | PLAT | 루트 워크스페이스·tsconfig.base·git init(커밋 0 유지) | 워크스페이스 인식·`git status` 동작 | 당시 pnpm 기반(bun 전환은 §3) |
| T-2 | PLAT | `@unikit/core` 인프라(peerDeps·cn·exports→src) | 패키지 tsc 통과 | — |
| T-3 | PLAT | `apps/expo`(SDK 58·expo-router·NativeWind·web.output static) | `expo export --platform web` 성공(기본 화면) | 앱명 "expo" 충돌 → 임시명 후 이동·개명; `react-native-css-interop@0.2.7` 직접 의존성 추가(isolated 해석 실패 대응) |
| T-4 | PLAT | `apps/web`(next 16.4.5·RNW 별칭·transpilePackages·globals.css 토큰) | `next build` 성공(기본 페이지) | R-1: `react-native-safe-area-context: false` 별칭(딥 import Flow 구문 회피); 생성된 apps/web/pnpm-workspace.yaml·lockfile 삭제 후 루트 재설치; **2차 갱신**: globals.css 토큰 블록이 `generate:design` 재생성 영역으로 전환(값 불변 byte 기계 확인 — [13-implementation-evidence.md](13-implementation-evidence.md) §1) |
| T-5 | FE | `src/theme/`(zinc 토큰 19종+radius·UnikitThemeProvider·vars()·useUnikitTheme) | @unikit/core 프로그램 tsc 통과 | — |
| T-6 | FE | 컴포넌트 5종(Button·Card·Input·Label·Badge, cva 2/6/1/1/2)+index | 패키지 tsc 통과·5종 export 관찰 | Button children 문자열→내부 Text 변형별 색 적용; Input forwardRef(focus 노출)·disabled 치환 |
| T-7 | FE | `apps/expo/app/index.tsx` 쇼케이스(§1.2·§5 원문 준수) | `bun x tsc --noEmit` exit 0·`expo export --platform web` exit 0·dist DOM에서 §5 37문구 바이트 일치·aria 배선 관찰 | SafeAreaProvider(initialMetrics 0) 랩 추가; ScrollView 미사용(웹 문서 스크롤 — §6 잔여 한계); **bun isolated에서 `expo export` 불가 에스컬레이션** → §3 bunfig로 해소. 통합 시 오케스트레이터 정렬 3건(§2) |
| T-8 | FE | `apps/web/app/page.tsx`("use client"+동일 구성)·`components/nativewind-env.d.ts` | `bun x tsc --noEmit` exit 0·`next build` exit 0(정적 프리렌더)·index.html "UniKit" 포함·DOM 마커 관찰 | 간격 해석(§1.2 정독: 섹션 4종 래퍼에 space-y-10) — 통합 판정에서 채택; web min-h-screen 배경 래퍼(SafeAreaView 웹 대응) |
| T-9 | PLAT | `packages/unikit/registry.json`(6종)·`registry/{lib,ui}` 복사 트리·`apps/web/lib/registry.ts`·`app/r/[name]`(G3 F-2 개명)·`app/r/registry.json` 라우트 | node 파싱 OK·복사본 diff=import 1행만·`/r/button.json` 200·`/r/registry.json` 200·404 매핑·apps/web tsc exit 0 | shadcn 스키마를 `node_modules/shadcn`→`@shadcn/registry` 타입 정의에서 실측(`files[].target` 판별 유니언 확인→지정, 루트 homepage 필수 실측); Next 16 typed routes 파라미터 `{}` 생성→`Promise<{name?:string}>`+가드 |
| T-10 | PLAT | `/tmp/unikit-consumer` 소비 재현(재현물 보존) | `shadcn add …/r/button.json` exit 0·복사 파일 존재(target 경로)·의존성 6종 자동 설치·import 상대경로 0건·포트 해제 | 비대화형 조합 실측: `init -b base -p nova -y`; 참고 빌드: 소비자 nativewind 타입 미설정으로 tsc 탈락(판정 밖, T-12 입력); shadcn 4.23 퀴크 5건 기록(utils 특수 취급·주석 제거·overwrite 미동작 등) |
| T-11 | PLAT | V-1~V-7 실행(§2) | — (§2 표) | serve 경로 문서 결함 보고(반영 완료); 회귀 0건 |
| T-12 | FE | `README.md`·`docs/components.md`·`docs/expo-go.md`(한글) | README 기재 명령 전건 자체 실측 exit 0(신규 소비자 /tmp/unikit-docs에서 5종 복사+설정+tsc·build 통과까지) | 소비자 절차 재실측으로 순서 확정(TW 전환은 add 전·파일 설정은 add 후); 두 트리 동시 수정 절차 절 추가(02-architecture T-12/R-5 요구) |

## 2. 통합 검증(V-*) 실측 — T-11 실행(독립 에이전트)

| V | 핵심 명령(bun) | exit/관찰 |
|---|---|---|
| V-1 | grep 양쪽 import·분기 0건·`next build`·`expo export --platform web` | ①양쪽 `@unikit/core` import ②`Platform.select`/`.web\.tsx` 0건 ③0 ④0 |
| V-2(명령분) | expo dist 서빙(8081)·next dev(3000)·HTML 대조 | 양쪽 200; `role="button"` 13=13·`aria-disabled` 2=2·labelledby↔id 3쌍=3쌍·타이틀/섹션 4종 동일·`--background:0 0% 100%` 동일 (스크린샷은 G4) |
| V-3 | `expo export --platform android` | 0·실오류 없음·android Hermes hbc 번들(4MB) dist 산출(기본 동작으로 web 산출물 초기화됨 — 순서로 회피) |
| V-4 | `bun run --filter '*' typecheck` | 0 — 3패키지 전부 |
| V-5 | unikit tsc·cva grep·변형 grep·index grep | ①0 ②5파일 전부 1 이상(2/6/1/1/2) ③변형 6·크기 4 정의 ④5종 export |
| V-6(전제분) | 토글 DOM 전제 | `aria-label="색 테마 전환"` 양쪽·인라인 라이트 토큰·초기 문구 "🌙 다크" 양쪽 (클릭 전환은 G4) |
| V-7 | registry.json node 파싱·`/r/button.json` curl·③T-10 보고 인용 | ①0(items 6) ②0(files 배열·deps 6종) ③재현물 import 전부 소비자 경로/npm |
| V-8 | T-11 계속 실행: README 절차 그대로 20명령 | 18건 그대로 성공·**2건 문서 결함**(①`cd ..`→apps/ 도착으로 serve 404 ②(a)에 `jsx` 중복 키 안내) → **오케스트레이터 수정 완료**(`cd ../..`·`jsxImportSource` 단일 추가+주석). 수정분은 경로 산술·JSON 키 단일화로 자명하나 G2 평가자 재확인 권장 |

## 3. 진행 중 환경 변경(요약 — 상세 ledger.md)

- **D-7 bun 전환**(사용자 결정): 루트 `"workspaces"`+`bun.lock`; ① react-native·nativewind 2인스턴스 분할 → `@unikit/core` devDeps 앱 해석 버전 정렬로 통일 ② Metro/babel 상향 해석 실패 → `bunfig.toml` hoisted linker. 완료 태스크(T-1~T-6)의 pnpm 검증은 이행 이력.
- **오케스트레이터 통합 조정(G-D~G-E)**: ① §1.2 간격 정독 판정 → T-7 정렬(섹션 래퍼 space-y-10·Section 평탄화·입력쌍 `flex flex-col gap-2`) ② `apps/web/app/page.module.css` 미참조 삭제 ③ registry.json 5아이템 dependencies에 `react-native`·`react-native-web` 추가(복사본 import 요건) ④ V-2① serve 경로 명령 정정(루트 실행). 정렬 후 재검증: expo tsc·export web·web tsc·next build·루트 typecheck **전부 exit 0**.

## 4. 미해결·인계 사항

- G3(Staff Code Review)·G4(실물 관찰·UX 감사)·G5(완료 관문) 예정 — 본 문서는 G2 평가 입력.
- 네이티브 실물 외형·네이티브 테마 전환: 에뮬레이터 부재로 관찰 불가(00-requirements §5 잔여 한계 — AC-3은 android 번들 성공으로 갈음, docs/expo-go.md로 자체 확인 안내).
- registry.json `homepage`는 로컬 서빙 URL(`http://localhost:3000/r/registry.json`) — 원격 게 시(사용자 요청 시)에 갱신 필요.
- shadcn 4.23.0 퀴크(utils 특수 취급·주석 제거·overwrite 미동작·init 프리셋 프롬프트) — README "동작 참고"에 기재 완료.
- 소비자 절차에서 create-next-app은 TW4 설치 → README 2단계 다운그레이드 절차 필수(기재 완료).

## 5. G3 결함 수정·차등 재검증 (오케스트레이터 실행 — 판정은 ledger G3행)

- 수정: F-1 index.tsx ScrollView 랩(contentContainerClassName로 §1.2 컨테이너 클래스 이동)·F-2 `r/[name].json`→`r/[name]` 개명+문서 3곳 동기·F-3 layout.tsx(lang=ko·Geist 제거·UniKit 메타)·F-6 .gitignore. 재평가 신규 F-7(P3 route.ts 주석)도 즉시 갱신(주석 전용).
- 재검증(전부 bun): expo tsc 0 · `expo export --platform web` 0(dist에서 ScrollView 외곽 `overflow-y:auto`+`flex-1 bg-background`, 내부 div `w-full max-w-[640px] mx-auto px-4 pt-8 pb-12` 관찰) · web `rm -rf .next`→`next build` 0(라우트 테이블 `/r/[name]` ƒ 동적) · 프로덕션 `next start` `/r/{button,registry,utils}.json` 200 + 미등록 404 · 루트 `bun run --filter '*' typecheck` 3패키지 0. 참고: 개명 직후 `.next` 생성 타입 캐시가 옛 경로 참조로 @unikit/web tsc 일시 탈락 → 빌드 재생성으로 해소(캐시 요인, 소스 무관).

## 6. G4 관찰 준비·캡처 증거 (오케스트레이터 — 판정은 독립 UX/Design Auditor)

- 서버: Expo 웹은 **정적 프로덕션 산출 dist 서빙**(8081), Next는 **프로덕션 `next start`**(3000) — G3 F-2 교훈(프로덕션 경로 실측) 반영.
- 방법론(§4.1 준수 + G3 F-1 교훈): **390×844 고정 뷰포트 + 실스크롤**(컨테이너/window scrollTop 직접 조작)로 top·mid·bottom 캡처 — 풀페이지 캡처는 스크롤 결함을 은폐함. 환경 devicePixelRatio 2(물리 780×1688) — §4.1 "배율 100%" 대비 편차로 기록.

### 6.1 초회 캡처에서 발견된 결함(F-8~F-10)과 수정(02-design v3)

초회 캡처(라이트 top) 육안 분석 + DOM 실측으로 3건 확인, 전부 수정 후 전 증거 재캡처:

- **F-8(P1) 라우터 기본 헤더 잔류**: expo-router `<Stack />` 기본값 `headerShown:true` → 64px 흰색 "index" 바(실측 `r-1777fci r-12vffkv` div)가 쇼케이스 위에 렌더. §1.2 트리에 라우터 헤더 없음(비규격 크롬). 수정: `_layout.tsx` `<Stack screenOptions={{ headerShown: false }} />`. 재실측: index 바 요소 소멸·컨테이너 top=0.
- **F-9(P1) 배치 행 세로 스택**: §1.2의 `flex flex-wrap`(변형 6종·크기 4종·상태·배지 4곳)이 Expo에서 세로 스택으로 렌더 — computed `display:flex` + **`flexDirection:column`**(RN View 기본값; 웹 브라우저만 기본 row). 웹 앱은 정상 행이라 양측 불일치(AC-2 위반). 수정: 02-design v3 §1.2 4곳 `flex flex-row flex-wrap`(§3.1 컴포넌트 표의 flex-row 명시 원칙과 정합) + index.tsx·page.tsx 동기화. 재실측: `flexDirection:row`, 첫 두 버튼 동일 y(216)·x 16→86.
- **F-10(P2) 토글 우측 잘림**: 390px에서 헤더 행 내부 scrollWidth 386 > clientWidth 358 → 토글 right 402.3(뷰포트 390 초과, 12.3px 잘림). 원인: 좌측 타이틀 블록이 flex에서 축소되지 않음(RNW Text 자동 shrink 없음). 수정: 헤더 좌측 블록 `flex-1`(§1.2 v3) 양측 적용. 재실측: 좌측 폭 285·서브타이틀 2줄 랩·토글 right 374·넘침 0.
- 재검증(수정 후 전부 bun): expo `tsc --noEmit` 0 · `expo export --platform web` 0(dist 재생성) · web `rm -rf .next`→`next build` 0 · 루트 `bun run --filter '*' typecheck` 3패키지 0.
- 수정 파급: 세로 길이 축소(스크롤 scrollHeight 2018→1588) — 버튼 10종이 2행 wrap되면서 문서가 짧아짐. **양측 스크롤 최대치가 744px로 수치까지 일치**(AC-2 정합 신호).

### 6.2 최종 관찰 실측(수정 반영, 전 증거 현재 상태 기준)

- 스크롤 실측: Expo 내부 스크롤러 scrollHeight 1588/clientHeight 844(maxScrollTop 744) · Web 문서 스크롤 최대 744px — **양측 동일**.
- 테마 실측: 양측 토글 "🌙 다크"↔"☀️ 라이트", `--background` 0 0% 100% ↔ 240 10% 3.9% 인라인 전환(클릭 직후 동일 evaluate 타이밍 주의 — 반영은 다음 프레임).
- 상호작용 실측: Tab 링 = `rgb(255,255,255) 0 0 0 2px, rgb(24,24,27) 0 0 0 4px`(2px ring+2px offset) 버튼·입력창 동일 · "이름" 라벨 클릭→`input[aria-labelledby]` focus 실증(INPUT·boxShadow 링) · press는 **유지 캡처 불가(합성 이벤트로 :active 불가·신뢰 입력 필요)** → 컴파일 규칙 4종 실재로 대체(active:bg-primary/90·destructive/90·secondary/80·bg-accent+text-accent-foreground 전환).
- overscroll 관찰(G2 F-3 인계): html/body 배경 투명 — provider 래퍼(문서 전체 높이)가 테마 배경 담당, 문서 경계 밖 캔버스는 브라우저 기본색(iOS 러버밴드 시 다크 모드에서 백색 노출 가능, 데스크톱 무관).
- 캡처 증거 12종(docs/sdd/evidence/): ac2-{expo|web}-light{,-mid,-bottom}.png · ac2-{expo|web}-dark-bottom.png · ac6-{expo|web}-after-dark.png(전환 전 = ac2-*-light.png 겸) · ac4-web-focus-ring-button.png · ac4-web-label-click-focus.png — **전부 2026-11-08 수정본(F-8~F-10 반영) 재캡처**(초회 캡처 12종은 덮어쓰기, 결함 원본은 본문 기록으로 보존).

## 7. 안드로이드 네이티브 실물 관찰 (G5 이후 보충 검증 — 2026-11-08)

G5 잔여 한계 1순위 «네이티브 실물 외형 확인 불가»를 해소하기 위해 Android 에뮬레이터에서 관찰했다. 작성: 오케스트레이터(관찰·분석) — 판정은 독립 UX/Design Auditor 보충 검증(ledger.md 보충 행).

### 7.1 환경과 방법론

- 에뮬레이터: AVD `unikit`, headless(`-no-window -gpu swiftshader_indirect -no-snapshot`, KVM), **780×1688 물리 @ 320dpi(density 2.0) = 390×844 논리 dp** — 웹 관찰 뷰포트(390×844·DPR2)와 논리·물리 치수를 모두 일치시켜 캡처 픽셀 1:1 대조가 가능하다. (초기에 390 물리 @ 420dpi로 설정해 논리 폭 148.6dp가 된 탓에 거짓 결함 — 제목 줄바꿈·서브타이틀 5줄 — 이 관찰돼 재구성. dp = 물리 px ÷ 2.)
- 앱: `expo run:android` debug APK(`com.anonymous.unikitexpo`) + Metro(8081, dev client 딥링크 실행). 번들 1753 모듈, 기동 무크래시.
- 관찰 수단: ① `uiautomator dump`(접근성 트리 — 텍스트·bounds·clickable/focused, 물리 px 좌표) ② `adb exec-out screencap` 원시 RGBA(12바이트 헤더) 샘플 합 = 테마 밝기 실측(라이트 ≈ 240·다크 ≈ 55~62) ③ PNG 캡처 → 이미지 분석으로 웹 증거와 동일 루브릭 대조. 이모지는 덤프 XML에서 HTML 이스케이프(`&#127769;`)되므로 검증 grep은 한글만 사용.
- 교훈 기록: PNG 밝기를 행 필터 없이 디코드하면 쓰레기값(16)이 나온다 — 필터 언필터 후 평균할 것. zsh 다중 줄 스크립트에서 `read -t N < /dev/zero`(sleep 대체)은 **영구 블록**한다(무출력 exit 1의 원인) — `python3 -c "time.sleep(N)"`으로 대체.

### 7.2 관찰 결과 — 웹과 동일 구조 확인

- **기동·구조**: expo-router 기본 헤더 "index" 바 없음(F-8 수정 네이티브 확인). 제목 "UniKit" 1줄, 토글 «🌙 다크» 외곽선 4방향 온전·우측 여백 유지(F-10 확인 — 텍스트 우측 729px = 364.5dp, 뷰포트 390dp 내), 변형 버튼 행 가로 배치(F-9 확인: 기본·보조·삭제·외곽선·고스트 5종 동일 y=234px 물리, 링크 다음 줄 wrap), 크기 4종 동일 y=316, 카드 3종·입력 3종·배지 4종 순서·구조 웹과 동일.
- **폰트 렌더러 차이(결함 아님)**: 네이티브 Roboto는 글자 폭이 좁아 서브타이틀이 1줄(웹 2줄), 변형 행 wrap 지점도 5/1(웹 4/2) — flex-row+wrap 규칙 자체는 양측 동일하게 작동하며 wrap **지점**만 글리프 폭 차이로 다르다. 에뮬레이터 기본 fontScale 0.875로 text-sm 14→12.25 렌더(인스펙터 실측). 콘텐츠 총 높이 네이티브 ≈ 1138dp vs 웹 1588px(최대 스크롤 312dp vs 744px) — 같은 원인.
- **입력 포커스(AC-4 네이티브 분)**: 첫 입력창(이름·홍길동) 탭 → 다른 두 입력창(1px 연회색)과 구별되는 **두꺼운 검은 포커스 링 + 커서** 관찰(ac4-android-input-focus.png) — focus 스타일 전환이 네이티브에서도 렌더된다. 소프트키보드는 하드웨어 키보드 설정으로 미표시(정상).
- **다크 렌더링(AC-6 네이티브 분 — 상태 전환 제외)**: 토글 상호작용이 불가(§7.3 F-11)하여 `UnikitThemeProvider defaultColorScheme="dark"` 초기값으로 다크를 렌더해 관찰(관찰 후 원복). 배경·카드·입력 경계선·배지 4종(기본=밝은 배경 반전·보조=짙은 회색·삭제=짙은 적색·외곽선=투명+라인)이 웹 다크(ac2-web-dark-bottom.png)와 동일 구조·색 계열 — 이미지 분석 루브릭 대조 일치(독립 감사 픽셀 실측: 다크 배경 RGB(9,9,11) 웹=네이티브 완전 일치, 배지·버튼 색 토큰값 그대로). 토글 라벨도 «☀️ 라이트»로 전환돼 **상태→UI 전환 로직 자체는 정상 작동**함을 입증. 단 캡처 시점에 LogBox 경고 배너(ImageBackground deprecation, expo-router 내부 발생·debug 빌드 전용 크롬)가 하단을 가려 **다크 상태의 footer 텍스트는 미관찰**(footer 존재·문구는 라이트 캡처+덤프로 확인). 상태바 밴드는 밝은 회색(242,242,242)으로 다크 콘텐츠와 대비를 이룬다(expo-status-bar 스타일 미지정 추정 — 관찰 O-8).
- **테마 왕복(라이트→다크→라이트)은 F-11로 관찰 불가** — 기존 ac6-android-after-dark.png는 왕복이 실제로 일어나지 않은 프레임(밝기 240.9=라이트)이었으므로 **삭제**했다. ac6-android-dark-top.png는 위 초기값 방식으로 재캡처(밝기 60.9).

### 7.3 신규 결함 F-11 — 네이티브에서 Pressable onPress 미발화 (P1·미해결)

- **증상**: 쇼케이스 내 모든 `Button`(Pressable 기반)의 탭이 동작하지 않는다. 토글이 라이트↔다크로 전환되지 않음(텍스트·밝기 양측 실측). **웹은 동일 소스가 정상 동작**(G4 §4.3 실측) — 플랫폼 간 상호작용 결함.
- **원인 격리(전부 우리 코드 기각)**: ① 내부 Text에 `pointerEvents="none"` → 무효 ② Pressable `className`(NativeWind interop) 제거 → 무효 ③ `hitSlop` 제거 → 무효. 원상복구 후에도 재현. Metro 재기동·앱 클린 재시작·**에뮬레이터 전체 재부팅 후에도 동일** — 재현성 확정.
- **동작 대조(국소 범위 입증 — 독립 감사 보충 포함)**: ScrollView 스와이프(네이티브 제스처)·RN Dev Menu(네이티브 UI) 동작. **JS 터치 콜백 자체는 살아 있다** — «이름»·«이메일» 라벨(Text 기반 onPress→ref.focus()) 탭은 2/2 발화(독립 감사 실측). TextInput 직접 탭은 불안정(첫 창 성공·둘째 창 0/2 — 라벨 경유 focus()로는 성공). React Native DevTools **Element Inspector**로 토글 탭 시 `Button → CssInterop.Text → Text → PressableText → RCTText`에 히트((322.5, 110.0)·42.0×17.5) — **터치는 Pressable에 도달하나 Pressability 응답자의 onPress만 발화하지 않는다**.
- **추정 원인(독립 감사로 정정)**: 우리 컴포넌트 코드가 아닌 실행 환경 — 합성 터치 전반이 무시되는 게 아니라 **Pressable(Pressability) 응답자 경로만 국소 불발**(Text.onPress는 발화하므로). RN 0.88.1(New Architecture)의 Pressability와 에뮬레이터 합성 터치의 조합, 또는 dev 빌드 특유의 동작 추정. **실물 기기(또는 release 빌드) 확인이 필요**하다. docs/expo-go.md의 Expo Go 절차로 사용자 실물 확인 가능.
- **후속 실험(2026-11-08 심야 — 원장 감사 후 추가)**: ① 홀드 탭(motionevent DOWN→250ms→UP)·같은 지점 600ms 슬라이프 — **주입 방식 무관하게 불발**(라벨·밝기 240.8 불변). ② **release 빌드**(assembleRelease — JS 디버그 런타임·React Compiler dev 플래그 제외, APK 내장 번들)에서도 평범한 `input tap` 불발(«🌙 다크»·밝기 239.8 불변). ③ 동일 release에서 «이름» 라벨 Text.onPress→focus()는 성공(EditText focused=true 실측) — **Pressability 국소 불발은 dev 런타임 전용이 아니며**, 우리 코드·디버그 런타임 가설을 추가로 기각. 에뮬레이터 합성 입력 × RN 0.88.1 조합이 최종 추정, 실물 기기 확인 필요 결론 유지.
- **영향 범위**: AC-6의 «네이티브 테마 전환 상호작용» 실물 검증 불가(렌더링 자체는 §7.2로 입증). AC-2 외형·AC-4 포커스·AC-7 배포 관찰은 영향 없음. 소스는 원복 완료(git diff 0 — G4/G5 스냅샷 불변).

### 7.4 네이티브 캡처 증거 (docs/sdd/evidence/, 전부 780×1688 = 웹 캡처와 동일 물리 치수)

| 파일 | 내용 | 밝기 실측 |
|---|---|---|
| ac2-android-light-top.png | 라이트 top(헤더·토글·버튼 섹션) | 240.9 |
| ac2-android-light-mid.png | 라이트 Card 섹션 | — |
| ac2-android-light-bottom.png | 라이트 bottom(입력·배지·footer) | 247.0 |
| ac2-android-dark-bottom.png | 다크 bottom(§7.2 초기값 방식·LogBox 배너 가림 기록) | 54.9 |
| ac6-android-dark-top.png | 다크 top(헤더·토글 «☀️ 라이트») | 60.9 |
| ac4-android-input-focus.png | 첫 입력창 포커스 링·커서 | — |
| ~~ac6-android-after-dark.png~~ | **삭제** — 왕복 미발생 프레임이었음(§7.3) | (240.9였음) |

- 라이트 top 비교(이미지 분석 루브릭 대조): 네이티브 = 제목 1줄·서브타이틀 1줄·변형 5종 행·상태바 밴드(시계·배터리 아이콘은 미관찰 — 독립 감사 픽셀 실측 y<140 비흰 픽셀 0개, dark-top도 균일 밴드)·LogBox «!» 배지(디버그 크롬). 웹 = 제목 1줄·서브타이틀 2줄·변형 4종 행·크롬 없음. 차이는 전부 폰트 렌더러·디바이스 크롬(§7.2)으로 설명된다.
