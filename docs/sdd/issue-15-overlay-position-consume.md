# Issue #15: UniKit overlay/popover의 position() 배치 엔진 소비

- **관련 이슈**: [#15](https://github.com/loopy-lim/unikit-ui/issues/15) (상위 에픽 [#11](https://github.com/loopy-lim/unikit-ui/issues/11))
- **기준일**: 2026-11-18
- **판정**: 구현 — **병행 옵션(엔진 주입 모델)**. 제품 오버레이가 `@ui-sdk/core` `position()` 배치 엔진을 소비하되, 미설치·미호출 소비자의 기존 내장 경로는 그대로예요.

## 1. 설계 결정 — 치환이 아니라 병행(주입)인 이유

이슈 scope (1)은 «치환 또는 병행 옵션» 둘 다 허용했어요. 완전 치환(overlay.tsx가 항상 `position()` 경로)을 기각하고 병행을 택한 근거:

1. **`@ui-sdk/core`는 선택 peer**(`peerDependenciesMeta` optional). overlay.tsx가 정적 import하면 미설치 소비자의 Metro·번들 해석이 그 지점에서 실패해요 — 이슈 #14가 확립한 «npm 전용 진입점» 패턴(선택 peer를 쓰는 코드는 소비자가 opt-in하는 진입점에만 둔다)과 정합하게, `position()` import는 신규 npm 전용 진입점 `@unikit-bridge/ui/overlay-position`에만 있어요.
2. **AC «기존 쇼케이스 회귀 없음»의 구조적 보장** — 기본값은 엔진 미등록(내장 `computeOverlayPositionWithPlacement` 경로, 본문 그대로). 설치한 앱만 교체돼요. 의존 방향은 `overlay-position → overlay` 단방향이라 overlay.tsx는 새 진입점을 import하지 않고, registry 사본(`registry/lib/overlay.tsx`, byte 동일 규칙) 소비자에게 새 의존이 생기지 않아요.
3. **브리지 분기 원칙 준수** — 플랫폼 차이(웹: 실제 DOM 구동 / 네이티브: `behaviors/ui-sdk-dom` 어댑터 경유)는 컴포넌트·lib 본문이 아니라 package.json exports 조건(`react-native` → native.ts, `default` → web.ts)이 담당해요.

## 2. 구현 내역

| 파일 | 내용 |
|---|---|
| `packages/unikit/src/lib/overlay.tsx` (+ `registry/lib/overlay.tsx` byte 동일) | 배치 엔진 계약(`OverlayPositionEngine`·`OverlayPositionSession`·`OverlayPositionState`)과 모듈 레지스트리(`set/getOverlayPositionEngine`, 기본 null=내장) export. `AnchoredOverlay`에 엔진 경로 추가 — 등록 시 `attach`(앵커 측정 완료 `ready` 후 실행, 옵션은 getter로 열린 채 전환) → `onPlace`로 `placed` 상태, 첫 통보 전 `opacity 0`(내장의 contentSize 미측정 숨김과 같은 시맨틱). `maxWidth/maxHeight`는 ui-sdk `--available-*` 계약의 시각 max로만 style에 적용. 미등록 시 기존 코드 경로·공개 계약(`computeOverlayPosition*`·`useOverlayPlacement` 등) 불변. |
| `packages/unikit/src/lib/overlay-position/web.ts` (신규, npm 전용) | `installUiSdkOverlayPosition()` — 실제 DOM 요소로 `position()` 상시 구동(position 내부 watchMoves가 앵커 이동을 스스로 추적). React state와의 경합을 피하려 쓰기를 rAF 폴링으로 다시 읽어 `onPlace` 보고(쓴 값과 같은 값을 React가 확정하는 수렴 구조 — 웹·네이티브가 같은 계약으로 닿게 하는 선택). |
| `packages/unikit/src/lib/overlay-position/native.ts` (신규, npm 전용) | `installUiSdkOverlayPosition({ followIntervalMs? })` — `installDomStubs`(멱등) + `behaviors/ui-sdk-dom` 어댑터로 구동: 앵커는 VirtualAnchor getter(getBoundingClientRect 형태 — unwatched 경로로 rAF 상시), 콘텐츠는 FakeElement(rect는 개방 시 고유 크기 유지 — §7 P3 되먹임 함정 방어), 계산 결과는 observer 훅 → rAF 스냅샷 → `onPlace`. 스크롤 추종은 앵커 재측정 폴링(기본 200ms, 설계값 — §5 한계 참조). |
| `packages/unikit/package.json` | exports `./overlay-position`(`react-native`/`default` 조건) 추가. |
| `apps/web` | `@ui-sdk/core@^0.1.0-beta.6` 의존 + `components/site/overlay-position-engine.tsx`("use client" 마커 — lib/overlay가 `createContext`를 써 RSC 경계 밖에서 직접 import 불가)를 layout에 마운트. 웹 데모 전체의 popover·tooltip·dropdown·select 등이 position() 엔진으로 구동돼요. |
| `apps/expo` | `_layout.tsx` 부트에 `installUiSdkOverlayPosition()`(react-native 조건 → native.ts, tsconfig paths도 primitives 선례대로 명시). |
| 문서 | `docs/install.md`(npm 전용 진입점 3종으로 갱신 + 항목 추가)·`llms.txt`(진입점 8개로 갱신) — llms.txt는 포털 저장소 `bun run sync:data` 재생성 대상. |

소비 전파: `AnchoredOverlay` 계열 9종(popover·tooltip·dropdown-menu·context-menu·select·combobox·hover-card·navigation-menu·menubar)이 소스 변경 없이 설치만으로 전환돼요(모듈 레지스트리 주입). tooltip 화살표는 `useOverlayPlacement()`(엔진의 `data-side` 확정 면 전달)로 플립을 따라가요 — 앵커 쪽 along 오프셋(ui-sdk `computeArrow`·`--arrow-offset` 계약)은 v1 미연동, 현행과 동일한 «면 전환 화살표» 수준이에요.

## 3. 기계 검증 (2026-11-18 실측)

| 명령 | 결과 |
|---|---|
| `bun run typecheck`(워크스페이스 전체) | exit 0(7패키지) |
| `bun run audit:design` | 10/10 통과(exit 0) — registry 사본 byte 동일·files 경로 검사 포함 |
| `cd apps/web && bun run build` | exit 0 — `/components/*` 63경로 SSG·`public/r` 재생성(첫 빌드에서 RSC 경계 위반 `createContext` 잡힘 → 클라이언트 마커 컴포넌트로 수정 후 통과) |
| `cd apps/expo && bun x tsc --noEmit`(워크스페이스 typecheck 내) | exit 0 — native.ts paths 매핑으로 react-native 조건 해석 검증 |

registry.json은 변경 없어요(overlay 항목 `files`는 기존 1파일 그대로 — 본문 내부 변경만 있고, overlay.tsx는 새 진입점을 import하지 않아 소비자 복사 그래프에 새 의존이 생기지 않음).

## 4. AC 대응

- **(1) 치환/병행** — 병행 옵션(§1). 설치 API·진입점은 §2 표.
- **(2) 웹·네이티브 동일 계약** — 양쪽 `installUiSdkOverlayPosition()`이 같은 `OverlayPositionEngine` 계약(lib/overlay 정의)을 구현하고 exports 조건이 갈라요. 컴포넌트·lib 본문에 플랫폼 분기 없음.
- **(3) 쇼케이스 회귀** — 기본 경로(미설치)는 코드 불변, 웹 데모(설치 상태) 빌드 성공. 브라우저·기기 화면 실측은 §5 한계.
- **(4) 스크롤 추종·플립·arrow** — 플립: `position()`이 매 체크 재판정(네이티브 unwatched rAF 상시·웹 watchMoves). 스크롤 추종: 웹은 position 내부 추적, 네이티브는 재측정 폴링(근사 — §5). arrow: tooltip 화살표가 확정 면(`data-side`)을 따라감(along 오프셋 미연동).

## 5. 실측 한계 (정직 기록)

- **네이티브 제품 경로(AnchoredOverlay×native.ts) 기기 미실측** — 에뮬레이터 미부착(부팅·editor 번들·gradle·Metro 셋업 비용)으로 정적 검증으로 갈음했어요. 어댑터 본체(FakeElement·VirtualAnchor·installDomStubs)와 position()의 조합은 P3에서 기기 실증된 것(`apps/expo/app/uisdk-popup.tsx`, docs/sdd/100 §7 — 수치 대조 포함)이고, 이번 구현은 그 패턴의 제품화지만 «attach 타이밍·Portal 마운트 연계·200ms 폴링 체감»은 기기에서 확인 안 됐어요.
- **followIntervalMs=200은 설계값**(기기 실측 아님). RN에 전역 스크롤 이벤트가 없어(기존 useReposition 네이티브 no-op) 주기 재측정으로 근사했고, 매 프레임 measureInWindow(브리지 왕복)는 비용상 피했어요. 옵션으로 0 이하 설정 시 추종 폴링 끔.
- **웹 데모 화면 렌더 미목격** — 정적 빌드(SSG 63경로) 성공까지 확인. popover/tooltip/dropdown의 실제 열림·플립·추종 화면은 브라우저 관찰로 확인하지 않았어요.
- **position()은 @experimental 표기**(@ui-sdk/core 0.1.0-beta.6 배포본 타입 선언 기준 — §7의 «VirtualAnchor·PositionProps @stable»과 대비되는 점). 버전 고정 peer 범위(^0.1.0-beta.6) 안에서 추적.
- **사이드 이펙트**: `installDomStubs`의 `getComputedStyle` 덮어쓰기는 웹에서 호출되지 않도록 웹 엔진이 installDomStubs를 호출하지 않는 구조(웹은 실제 DOM을 그대로 씀).
