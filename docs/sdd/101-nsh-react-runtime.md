# 101 — nsh(Native Shell) 런타임 지원: React-on-nsh 사전 번들 진입점

사이클 2026-11(nsh 지원). 사용자 요청: «nsh도 이걸로 할 수 있게 구현해줘» +
후속 확정 «모두 진행 + 목표는 에이전트가 이 킷을 nsh에서도 잘 다룰 수 있게»
(단일 import·헤드리스 구동·접근성 라벨/텍스트 기반 press/type).

요구(AC)·조사·설계·증거를 한 문서로 묶었다(issue-*.md 단일 문서 선례 준용 —
규모가 한 플랫폼 진입점 추가에 해당).

## 1. 요구(AC)

- **AC-1 단일 import**: `@unikit-bridge/ui/nsh` 하나로 컴포넌트 62종 배럴 +
  브리지 프리미티브(View·Text·Pressable·TextInput 등) + 렌더 API(el·mountNsh·
  renderNsh) + React 훅(useState 등)을 수령한다.
- **AC-2 소스 단일**: `src/components/` 62종은 한 벌 그대로(nsh 분기 없음 —
  exports 조건 분기 원칙 준수). nsh 전용 코드는 src/bridge/nsh.tsx·src/nsh/*.
- **AC-3 헤드리스 구동**: nsh test 드라이버가 id(label·text 셀렉터)로
  press/type을 구동하고 렌더·상태 갱신·조건부 언마운트·입력·셀렉트 커밋·
  색 스킴 전환이 전부 재현된다(apps/nsh/App.test.tsx 7단계).
- **AC-4 경고 0**: 데모 앱 구동 중 nsh 런타임 경고(unsupported prop·unknown
  classes·문자열-View)가 없다.
- **AC-5 저장소 게이트 보존**: `bun run typecheck`(전체)·`audit:design` 10/10
  통과, 기존 3플랫폼(web·native·editor) 동작 불변.

## 2. 조사(실측 — 프로브 /tmp/nsh-probe, nsh 0.6.1 소스 대조)

- nsh는 Solid형 자체 런타임(시그널·컴포넌트)이지만 `nsh:rt`(element·text·
  append·insert·prop·component)가 앱 코드에 열려 있어 react-reconciler 호스트
  설정을 얹을 수 있다. React 19.3.1 + react-reconciler 0.34.0 조합이 QuickJS에서
  렌더·이벤트·상태 갱신까지 통과(프로브 App.test.tsx).
- nsh 번들러(esbuild 기반)는 package.json exports의 `default` 조건만 본다 →
  조건 분기 진입점 불가, **사전 번들 배포가 필수**. 또한 앱 JSX는 소문자 호스트
  태그를 거부한다 → 데모는 el(React.createElement)로 조립.
- `remove` 연산이 nsh:rt에 없다 — append의 이동 의미론(graveyard 뷰로 옮겨
  트리에서 떼기)으로 제거를 대체한다(dom.rs — 재삽입 안전 명시).
- 텍스트 노드는 내용 갱신이 없다(반응형 소관) → 노드 교체(insert 새 노드 +
  graveyard 이동)로 commitTextUpdate를 구현, 부모는 WeakMap으로 추적.
- **React 19.3 reconciler의 commitUpdate 계약은 `(instance, type, oldProps,
  newProps, finishedWork)` 5인자다** — legacy `(instance, updatePayload, type,
  old, new)`가 아니고 prepareUpdate는 호출되지 않는다(번들 호출부 실측).
  잘못 읽으면 finishedWork(fiber)가 props 자리에 들어와 fiber 내부 필드가
  호스트에 세팅되고(«unsupported prop stateNode» 등) input이 사라지는 오염이
  생긴다 — 이 사이클의 핵심 결함이었다(§5 결함 1).
- canvas의 `draw`는 rt.prop 채널이 못 내린다 — `nsh` 모듈 export의 Canvas
  컴포넌트(nsh/canvas 소스가 nsh로 병합)를 rt.component로 호출해 생성 시
  소비한다. Path2D는 전역이 아니라 `nsh` 모듈 export다.
- 텍스트 노드를 뷰로 옮기면 «a string in a <View>» 경고 — dom.rs `places`
  비트: `componentSlot` prop 표시로 슬롯 컨테이너임을 알린다(등록 컴포넌트를
  요구하지 않는다 — `component` prop은 등록 확인 경고가 난다).
- 클래스 토큰: `native:X`는 nsh가 모르는 접두(unknown classes 경고)지만 값 X는
  유효 → 접두 제거가 정합. `web:selection:*`은 파싱 불가 → 제거.

## 3. 설계 판단

| 판단 | 내용 |
|---|---|
| 진입점 | `@unikit-bridge/ui/nsh` = dist/nsh.mjs(Bun.build 사전 번들, react·reconciler·cva·clsx·tailwind-merge 인라인, nsh·nsh:rt external) + dist/nsh-types(방출 .d.ts 트리) |
| 렌더러 | src/nsh/renderer.ts — LegacyRoot·createContainer(8인자 실측 계약)·flushSyncWork. GRAVEYARD는 componentSlot 표시 뷰 |
| 아이콘 | lucide 런타임 의존 없이 경로 데이터 추출 생성물(32종 — generate:nsh-icons) → Canvas+Path2D로 그림, 색은 token() 해석(fallback foreground→black 키워드 — audit (b) 원색 리터럴 0 유지) |
| 타입 | 소비 앱은 사전 빌드 .d.ts(dist/nsh-types/nsh/entry.d.ts — triple-slash로 src/nsh/nsh-rt.d.ts 참조, 파일 전송된 src 기준 경로) 수령. 저장소 내 타입체크는 nsh-env.d.ts ambient(nsh·nsh:rt·react-reconciler 0.34 최소면) — ambient를 소비자에 끼우면 앱의 .nsh/types를 가려 mount 미발견 오류(실측)라 저장소 전용 |
| JSX | 앱은 소문자 호스트 태그를 못 쓰므로 el() 조립 — nsh-jsx.d.ts(IntrinsicElements 보강)는 저장소 내부 전용 |
| 브리지 | src/bridge/nsh.tsx — web.tsx와 같은 export 면. 치환표·로드맵은 파일 머리 주석(단일 진실) |

## 4. 구현 증거(2026-11-24 실측 — 2차 리뷰 반영 후 재실측)

- `bun run typecheck`(워크스페이스 전체 — apps/nsh 포함, `unikit-nsh-demo`
  스크립트로 참여) exit 0.
- `bun run audit:design` **10/10 PASS**(위반 0).
- `cd apps/nsh && nsh check` exit 0.
- `nsh test`: «unikit components drive on nsh» PASS — 렌더→press(카운터)→
  type(이름 Input→뱃지 조건부 마운트)→Switch 토글(조건부 언마운트)→
  NativeSelect 옵션 press→커밋(banana)→색 스킴 전환(«Switch to light») 7단계.
- **경고 0**(unsupported prop·unknown classes·string-in-View 전부 해소 — §5).
- 번들: dist/nsh.mjs ≈ 1.09MB(아이콘 경로 데이터 포함).

## 5. 결함 발견·수정(디버깅 로그 — 전부 실측 재현으로 확정)

1. **(P1) commitUpdate 5인자 오독** — legacy updatePayload 계약으로 읽어
   finishedWork가 newProps 자리에 들어감 → fiber 필드(tag·stateNode·child···)
   가 호스트 prop으로 세팅, input 노드 오염으로 press 이후 «no input matches».
   번들 내 호출부(`commitUpdate, finishedWork.stateNode, finishedWork.type,
   oldProps, newProps, finishedWork`) 확인 후 4+1인자 계약으로 수정 → 재실증.
2. **(P1) TextInput host 누락** — 브리지 TextInput이 testID·nativeID를 host
   객체에 담지 않음(치환 표 누락) → id 셀렉터 미매치. 추가로 해소.
3. **(P2) draw·Path2D 경로** — rt.prop("draw") unsupported → Canvas 컴포넌트
   생성으로 해소 중 Path2D 전역 부재 예외 → nsh 모듈 import로 수정.
4. **(P2) graveyard 문자열 경고** — 텍스트 교체 시 graveyard(뷰) 이동이
   «a string in a <View>» 유발 → componentSlot 표시로 해소(component prop은
   등록 경고가 남아 기각).
5. **(P3) 클래스 정규화** — web:selection:*·native:* unknown classes 경고 →
   nshClass(브리지 치환 단계)로 해소. 원시 태그에 className을 내린 잔여 2곳
   (Select 드롭다운·데모 badges 줄)은 View 컴포넌트로 교체.
6. **(P3) 타입 진입 래퍼** — entry.d.ts가 브리지 프리미티브 재수출 누락(View
   미수출 TS2305) → 빌드 스크립트 래퍼에 동일 목록 추가.

## 6. 로드맵(범위 밖 — 명시적 이월)

- chart·editor·behaviors 진입점의 nsh 포팅(editor는 WebView 경로 검토).
- ui-sdk(virtual DOM 파트 렌더러)의 nsh 지원.
- LoopRotate/LoopPulse의 nsh AnimatedValue 승급(현재 정적 렌더).
- 아이콘 캔버스 색 갱신 — draw는 생성 시 1회만 소비되므로 색 스킴 전환 후
  아이콘은 마운트 시점 색에 머문다(draw 재소비 채널 부재 — 독립 리뷰 P2).
- ConcurrentRoot·전환 우선위(현재 LegacyRoot), 동기 measure API.
- 모달 백버튼(Android) — overlay onCancel의 fixed-포털 연동.

## 7. 게이트 이력

- G2(구현·검증): 오케스트레이터 수행 — §4 증거 전부 재실행 가능 명령으로 기록.
- G3(독립 코드 리뷰): independent reviewer 서브에이전트(클린 컨텍스트)
  2026-11-24 완료 — **OK with notes**. 핵심 계약 주장 3종(5인자 commitUpdate·
  prepareUpdate 미호출·Path2D 모듈 export)을 번들에서 실증 확인, 치환표·타입
  진입 계약 일치 확인. 지적 반영: P1 — apps/nsh에 typecheck 스크립트가 없어
  루트 게이트가 이 앱을 건너뛰었음(추가로 해소 — 이제 전체 게이트에 포함);
  P2 — 같은 텍스트 fiber의 반복 갱신이 분리된 노드를 before로 넘기는
  미정의 동작(LIVE WeakMap으로 해소 + 회귀 2회 press 단계 추가);
  P2 — 아이콘 색 스킴 미갱신(draw 1회 소비 — §6 로드맵에 기록);
  P3 6건(생성 스크립트 33→32종·nsh-jsx.d.ts 중복 블록·docblock 중복·
  nsh-env.d.ts 문장 결·build-nsh.ts .d.mts 표기·pointerEvents 경로 nshClass
  누락) 전부 반영. 리뷰 세션은 셸 실행 불능(정적 검증)이었으므로 실행 게이트는
  본문 세션에서 재실행으로 마감했다(§4 — 반영 후 전부 재실측).
- G3-2(2차 후속 리뷰 — 수정본만 재검): **OK with notes, 회귀 0**. 9건 수정
  전부 정확(LIVE 추적 로직은 react-reconciler 0.34 실소스 대조로 확정 —
  12933–12970 삭제 재귀·13449–13468 stateNode 불변). 지적 반영: P2 —
  removeChild가 live 노드를 회수하지 않는 잔류 가능성(같은 seam의 선행 결함) →
  appendChild·insertBefore·removeChild(+컨테이너 변형)를 liveOf 라우팅으로
  경유시켜 방어(단, 데모에 회귀 단계(갱신 이력 있는 텍스트 인스턴스 언마운트
  — 3-1)를 추가해 원복 번들로 실증을 시도했으나 **잔류가 재현되지 않았다**
  — nsh text 요소의 콘텐츠 의미론이 흡수하는 것으로 추정. 정확한 발화
  조건은 미확정, 수정은 올바름-구성 방어로 유지); P2 — 루트 게이트가
  생성물(.nsh·dist)에 의존 → AGENTS.md 검증 절차에 선행(scaffold·build:nsh)
  명시; P2 — §4 날짜 스탬프 갱신(2026-11-24).
