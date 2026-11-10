# 사이클 30 — 구현 증거 (shadcn 카탈로그 1차 23종)

요청: "설명 업데이트 후 /sdd 로 shadcn의 모든 컴포넌트를 구현 및 가져가기" — 본 사이클(30번대)은 그중 **1차 배치 23종 구현·공급 + 전체 로드맵 문서**를 담당한다. 잔여 33종은 후속 티어로 인계(AC-2).

## 태스크 ↔ 산출물 ↔ 증거

### T-1 문서 최신화 (완료)
- README.md 전면 재작성(브리지 아키텍처·소비 2경로·필수 설정 3종), docs/components.md 브리지 패키지명 교체·접근성 표, docs/expo-go.md 정리, packages/unikit/README.md 과장 문구 삭제.
- V-1 grep 검증: 낡은 용어(@unikit/core, NativeWind 절차 등) 0건, 문서 경로 13종 실재.

### T-2 브리지 계약 확장 (완료)
types.ts / native.tsx / web.tsx:
- `BridgeStyle = Record<string, string | number | undefined>` — 동적 값 전용 인라인 스타일(progress 폭 %, aspect-ratio 비율). 전 프리미티브 `style?`.
- TextInput `multiline?` — 웹은 `<input>` 대신 `<textarea>` 렌더 분기(textarea).
- Image `onError?: () => void`(무인자) — avatar 폴백 전환용.
- Pressable `"aria-pressed"?` — toggle용.
- **F-1 수정(구현 중 발견)**: native.tsx가 aria-*를 accessibilityState로만 변환했으나 react-native-web 0.21은 accessibilityState를 폐기하고 aria-* 직접 전달만 DOM에 렌더함 → expo-web에서 `aria-selected/checked/expanded/hidden/pressed/controls` 전부 소실. 수정: RN 0.77+ 네이티브 관용 별칭으로 aria-* 직접 전달 + accessibilityState 병렬 유지, `aria-pressed`·`aria-controls`(RN 코어 타입에 없음)는 무형 스프레드로 전달, View에도 원시 `aria-hidden` 추가. 검증: 재수출 후 DOM에서 `aria-selected=true/false`(탭), `aria-checked=true|mixed`(체크박스), `aria-checked=true`(스위치·라디오), `aria-pressed=true`(토글), `aria-controls`(탭↔패널) 전부 확인.

### T-3a~T-3d 컴포넌트 23종 구현 (완료, 4개 조 병렬)
- 각 조 무교집합 파일 소유. 전 조 보고: 자기 파일 tsc 0오류, src↔registry diff byte 동일.
- 구현 중 audit (c) 위반(임의값 클래스 13개 파일) 발견 → 오케스트레이터가 전량 수정(표준 스케일 토큰 교체·주석 재작성) 후 registry 사본 재생성.
- 23종 명세와 핵심 판단은 각 파일 머리 주석(브리지 프리미티브·포팅 6조 준수).

### T-4 통합 (완료)
- `src/index.ts`: 23종 export 블록 추가(컴포넌트·variants·Props 타입 전량) — pkg tsc 0.
- `registry.json`: 33 items(utils + 컴포넌트 28종 + theme 4종). registryDependencies: toggle-group→["utils","toggle"], pagination→["utils","button"], field→["utils","label"], 나머지 ["utils"]. deps 7종 공통(cva 미사용 3종은 cva 제외).
- `scripts/audit-design.ts`: names 배열 5→28종.
- docs/components.md 23종 절 추가(4분류 카탈로그 표), docs/roadmap-components.md 신규(AC-2: 61종 = 완료 28 + 잔여 33[티어 2 오버레이 13·티어 3 입력 9·티어 4 데이터 11], 필요 브리지 기능·알려진 한계 포함), README 수치 갱신(28종·33 items).
- 쇼케이스 양쪽(apps/expo, apps/web)에 4개 섹션로 23종 전시(종당 1~2 대표 상태, 비제어 초기값 중심).

## 검증 원장 (V-1~V-8)

| # | 검증 | 결과 |
|---|---|---|
| V-1 | 문서 낡은 용어 grep·경로 실재 | PASS |
| V-2 | pkg tsc --noEmit | exit 0 (T-2·F-1·G3/G4 수정 후 재확인 포함) |
| V-3 | 루트 `bun run typecheck` 3패키지 | 전부 exit 0 (F-1·G3/G4 수정 후 재확인 포함) |
| V-4 | `bun run audit:design` | 8/8 PASS — (b) 원색 0건 36파일, (c) 임의값 클래스 0건 56파일, (d) 사본 29종 동일, (e) files 경로 실재. G3/G4 수정 후 재실행(사본 13종 재동기화·토큰 재생성 포함) 및 G5 프리셋 조정 후 재실행 모두 8/8 유지 |
| V-5 | apps/web `next build` | 성공 — 쇼케이스 페이지 정적 프리렌더(23종 렌더 포함). G3/G4 수정 후 재빌드 + 정적 HTML role 속성 grep(alert·progressbar·tablist·tabpanel·radiogroup·한국어 라벨 반영 확인) |
| V-6 | expo export --platform android | Hermes 번들 생성(1564 modules, 3.4MB hbc) — F-1·G3/G4 수정 후 재수출 포함 |
| V-7 | expo export --platform web + 스크린샷 | 라이트·다크 캡처(390×844) — 전 섹션 렌더, 접근성 트리에 [checked]/[checked=mixed]/[pressed]·radiogroup 노출 확인. 상호작용: 탭 전환(aria-selected 갱신·패널 전환) 확인. G4 대응 후에는 렌더된 색 실측(명암비 수치는 관문 기록 참조) |
| V-8 | 레지스트리 엔드포인트 curl(next start 프로덕션) | /r/<23종>.json 전부 200 + 유효 JSON, /r/registry.json 33 items. G3/G4 수정 후 재확인(대표 3종 200·33 items·pagination label prop 반영) |

## 관문 기록

- G0 요구·G1 설계: 30-requirements.md / 32-design-plan.md 참조(AC-1~AC-6, T-1~T-5, V-1~V-8).
- **G2 Task QA Validator — PASS(차단 결함 없음)**. T-3a~T-3d 4조 전부 PASS(byte 동일성·포팅 6조 grep·tsc·심층 샘플), T-4 부분 PASS — 경등 D-1 1건: registry.json의 progress·aspect-ratio 두 항목 `registryDependencies` 누락(cn을 실제 사용하므로 ["utils"] 필요). → **즉시 수정 후 재검증**(utils 누락 0건, audit 8/8 유지). collapsible의 `[]`는 cn 미사용으로 기능상 무해 판정 유지. 참고로 card.tsx의 bare `shadow-sm`은 기존 커밋(464c525) 분량으로 이번 diff 밖.
- **G3 Staff Code Reviewer — FAIL(차단 1) → 수정 후 재검증 완료**. 결함 목록과 처리:
  - **B-1(차단) CollapsibleTrigger 문자열 children 네이티브 크래시** — RN Pressable(View 기반)에 문자열이 직접 오면 "Text strings must be rendered within a &lt;Text&gt; component" 크래시. 쇼케이스 양쪽이 문자열을 직접 전달. → 컴포넌트를 AccordionTrigger와 동일 구조로 수정(children을 내부 Text로 래핑, 이중 지정 원칙 준수). expo-web 렌더에서 Text 래퍼 확인·양쪽 쇼케이스 정상화. 실기기 확인은 F-11 대기(웹·번들·타입 레벨 검증 완료).
  - **M-1(주요) web.tsx View/Text 접근성 치환 누락** — accessibilityRole·accessibilityLabel이 미지 prop으로 버려져 웹 DOM에서 role·라벨 전부 소실(tablist·alert·progressbar 등 8개 사용처). → Pressable과 동일한 치환(role=·aria-label=) 추가. next build 정적 HTML에서 `role="alert"`×2·`role="progressbar"`·`role="tablist"` 반영 확인(수정 전 0건).
  - **M-2(주요) `w-fit` 3곳 uniwind 미지원** — KbdGroup·ButtonGroup·ToggleGroup이 네이티브에서 전체 폭으로 늘어남. → tabs.tsx 선례대로 `self-start` 치환 3건.
  - **M-3(주요) `ref as any`** → `as unknown as Ref<PressableInstance>` 이중 단언으로 범위 명시.
  - 사소 7건 중 5건 수정(ElementRef 미사용 import 삭제, TabsContent `role="tabpanel"`+BridgeRole 추가, TableFooter font-medium을 context로 내부 Text에 이중 지정, Alert destructive `border-destructive/50` 복원, 쇼케이스 Progress accessibilityLabel 추가). **사소 3번(BridgeRole 비표준 역할)은 오탐으로 판명** — RN 0.88 ViewAccessibility.js에 heading·listitem·status·option·radiogroup·tabpanel 전부 존재(직접 확인). 같은 근거로 `radiogroup`(RadioGroup 컨테이너)·`tabpanel`을 계약·컴포넌트에 추가. 사소 7번(TableHead/TableCell·EmptyMedia Text 강제 래핑)은 로드맵 알려진 한계로 기록.
  - 재검증: pkg tsc 0 / 루트 typecheck 3패키지 0 / audit:design 8/8(사본 29종 재동기화 포함) / next build 성공·role 속성 grep / expo web·android 번들 재수출 성공 / 레지스트리 엔드포인트 200·33 items.
- **G4 UX/Design Auditor — 수정 권고(라이트 통과·다크 조건부) → 필수 2건 수정 후 수치 재검증 완료**. 감사 자체 재현(expo web 390×844 라이트·다크 직접 캡처, WCAG 명암비 실측; 제출 스크린샷 3장 동일 파일 문제를 자체 보완). 필수 반영 2건의 처리:
  - **다크 destructive 텍스트 1.99:1** → dark `--destructive`를 shadcn 원본 `0 62.8% 30.6%`에서 `0 72% 65%`(red-400 계)로 조정. 02-design.md §2.1 수정 이력 기록 → tokens.ts → `generate:design`으로 앱 CSS 2종·tokens.md·**기본 theme 항목**에 전파. 재실측 **6.08:1**. (당시 프리셋 3종은 재생성만 되고 값은 구값이 유지됐다 — G5 경등 지적 후 아래 G5 기록에서 조정 완료.)
  - **꺼짐 상태 비텍스트 3:1 미달 묶음(스위치 트랙·라디오 링·스켈레톤·진행 트랙)** → 스위치 off 트랙 `bg-input dark:bg-input/80`→`bg-foreground/50`, 라디오·체크박스 미선택 링 `border-input`→`border-foreground/50`, 진행 트랙 `bg-primary/20`→`bg-primary/50`, 스켈레톤 다크 `+dark:bg-muted-foreground/60`, 페이지네이션 활성 테두리 `+border-foreground/50`(isActive 조건). 재실측(라이트/다크): 스위치 3.74/5.11, 라디오 링 3.74/5.11, 진행 트랙 3.40/5.11, 스켈레톤 다크 3.38, 활성 페이지 테두리 3.74 — 전부 ≥3.
  - 즉시 수정 가능 지적: 페이지네이션 영어 하드코딩 라벨 → `label` prop 추가(기본값은 shadcn 원본 영문 유지) + 쇼케이스에 한국어 라벨·accessibilityLabel 지정.
  - 나머지 지적(표 role·aria-current·aria-valuenow·탭 화살표키·아바타 겹침 web 전용·표 균등 폭)은 브리지 계약/문서화 한계로 로드맵 "알려진 한계"에 반영.
  - 스크린샷 증거: 수정 후 앱에서 테마 전환하며 라이트·다크 캡처(390×844) — G5가 픽셀 히스토그램 분석으로 원장 수치와 일치함을 실증(#E66565·#818182·#DF3B3B 검출, 수정 전 어두운 값 미검출). 이미지 파일은 사용자 결정으로 저장소 보존하지 않음 — 측정 수치 기록(위 관문 기록)이 증거.
- **G5 Release Gatekeeper — PASS(완료 보고 가능)**. AC-1~AC-6 전부 독립 재검증 통과: 낡은 용어 grep 0건, 23종×7요건 전수 스크립트 검증(src·registry 사본 byte 동일·등록·export·문서·쇼케이스 실사용), tsc·typecheck·audit:design 8/8 재실행 exit 0, next 빌드 산출물 HTML에서 role·한국어 라벨 반영 확인, 증거 스크린샷 픽셀 히스토그램으로 #E66565(다크 destructive)·#818182(꺼짐 링 #fafafa/50)·#DF3B3B(라이트 red-600) 실증(수정 전 어두운 값은 미검출), next start 23종 전수 curl 200 + registry 33 items. G2~G4 차단·필수 항목은 전부 코드에서 직접 확인, 알려진 한계는 성실한 문서화로 판정.
  - **경등 1건 — 프리셋 3종 다크 destructive 구값 잔존 → 즉시 수정 완료**: theme-blue·theme-emerald·theme-amber의 dark `--destructive`가 shadcn 원본 `0 62.8% 30.6%`로 남아 프리셋 다크 배경 기준 약 2:1(원천 presets.ts가 이번 사이클 diff 밖이었고, audit a2가 라이트 대비만 검사해 미검출). → 22-design-plan §2.3에 수정 이력·값 표 갱신 → presets.ts 3종을 `0 72% 65%`로 조정 + 12행 주석 정합 → `generate:design` 재생성(프리셋 3종 registry 반영, 앱 CSS 2종은 불변 확인) → audit:design 8/8·pkg tsc 0·루트 typecheck 3패키지 0 재확인. 프리셋 다크 배경 기준 대비 blue(slate-950) 6.16·emerald(zinc-950) 6.08·amber(stone-950) 6.03 — 전부 ≥4.5.
  - **관찰 1건 — /tmp 스크린샷 휘발 우려 → 사용자 결정으로 이미지 미보존**: 이관 보존했다가 사용자가 불필요하다고 판단해 제거 — 픽셀 실증 결과는 본 원장의 수치 기록으로 대신함.

## 알려진 한계 (이번 사이클 기록분)

- **expo-web 정적 내보내기의 useId 재생성**: expo-router 하이드레이션 이후 첫 상호작용(탭 전환 등)에서 새로 마운트되는 패널의 `useId` 접두사가 트리거의 `aria-controls`와 어긋날 수 있음(초기 로드 시점에는 일치). Next.js(개발·프로덕션 프리렌더 모두)에서는 재현 없음 — 컴포넌트 논리가 아닌 expo-router/React 하이드레이션 특성. 완화책(사용자가 Tabs/TabsContent에 nativeID 명시)은 로드맵 참조.
- 표 시맨틱 role(table/row/cell) 미지원, TableHead/TableCell·EmptyMedia의 children Text 강제 래핑(문자열 권장), progress의 aria-valuenow, pagination의 aria-current, 네이티브 aria-pressed 미노출, alert destructive 테두리 /50의 비텍스트 3:1 미달(shadcn 원본 동일값), 웹 전용 애니메이션(web:animate-pulse) — docs/roadmap-components.md "알려진 한계" 절에 정리.

## 범위 밖 (후속)

- npm 재게시(@unikit-bridge/ui 현재 0.1.0 — 23종+G3/G4 수정 반영 버전 게시는 사용자 요청 시).
- 커밋·푸시(사용자 요청 시에만).
- 잔여 33종 이식(로드맵 티어 순서).
