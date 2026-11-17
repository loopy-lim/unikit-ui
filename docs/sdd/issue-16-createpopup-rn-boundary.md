# Issue #16: `createPopup` RN 경로 — 업스트림 협력 또는 대체 경계 결정

- **관련 이슈**: [#16](https://github.com/loopy-lim/unikit-ui/issues/16) (상위 에픽 [#11](https://github.com/loopy-lim/unikit-ui/issues/11))
- **기준일**: 2026-11-18
- **판정**: **UniKit 경계 — `createPopup` 비도입 확정(wontfix): `position()` + 자체 포털(`src/lib/overlay.tsx`) 경계 채택. 업스트림 제기 — 보류(사용자 승인 대기).**

> **병합 안내**: 이 기록은 `docs/sdd/100-vercel-ui-sdk-research.md`가 `main`에 커밋되면 해당 문서 §7의 후속 관문 기록으로 병합한다(문서 보존 원칙). 100번 문서가 아직 다른 세션의 진행 중 작업(untracked)이라 이슈 #16의 산출물은 별도 파일로 남긴다.

## 1. 조사 범위와 기준

이 문서는 이슈 #16의 세 체크박스(업스트림 조사·대체 범위 명시·결정 기록)를 수행한 기록이에요. 코드 변경은 없고, 판정 근거는 아래 실측에 두어요.

- **`createPopup` 계약 실측**: 업스트림 얕은 클론 스냅샷 `/tmp/uisdk-ref/ui`(커밋 `cf6c86f`, 2026-11-17 — docs/sdd/100 §8와 같은 스냅샷)의 `packages/core/src/foundation/popups/create-popup.ts` · `foundation/kernel/primitive-types.ts`(PrimitiveContext 정의) · `src/renderer.ts` · `foundation/popups/popup-slots.ts`.
- **업스트림 이슈 검색**: 2026-11-18, GitHub 검색(`gh search issues` · REST API). 키워드와 결과는 §2에.
- **UniKit 쪽 사실**: `main`(3956d1d)의 `packages/unikit/src/lib/overlay.tsx` · `src/components/`(오버레이 골격 소비 컴포넌트 실측). 사이클 101의 `position()` 기기 실증 결과는 docs/sdd/100 §7 P2·P3(메인 체크아웃의 미커밋 문서 — 읽기 전용 참조).

## 2. 업스트림 조사 — RN/헤드리스 렌더러 논의 (체크박스 1)

**조사만 수행(외부 활동 금지 — 이슈 본문 «사용자 승인 후»)**. 결과(2026-11-18 기준):

- **디스커션 기능 비활성**(`has_discussions: false`, REST API 실측) — 이슈가 유일한 논의 채널이에요.
- **RN/비DOM 렌더러 관련 이슈 0건**. 검색한 키워드: `react native` · `react-native` · `headless renderer` · `custom renderer` · `adapter contract` · `bring your own` · `native` · `mobile`. 히트한 이슈는 전부 무관해요(폼 리셋 의미론 · ESC 버블링 · 스핀버튼 role 등). README · `contributing/architecture.md` · AGENTS.md에도 RN 언급이 없고, 어댑터는 react · vue · svelte · solid · web 5종이 전부예요.
- **가장 근접한 선례 — [#495](https://github.com/vercel-labs/ui/issues/495) «Angular: what a sixth renderer needs, and why the contract can carry it»**(2026-11-14 개시, open):
  - 여섯 번째 렌더러를 «포트가 아니라 설계 결정»으로 다루고, 필요 표면을 측정해 제시(51 컴포넌트 · 파트 398종 · 어댑터 약 67파일 · 스펙 365종 등).
  - 핵심 질문 1이 «여섯 번째 렌더러가 라이브러리 범위인지, 아니면 `@ui-sdk/web`(웹 컴포넌트)이 승인된 답인지»예요 — 즉 렌더러 추가 자체가 아직 미결정이에요.
  - 댓글 2건은 모두 커뮤니티 참여(제3자 Angular 어댑터 [`efuturetoday/ui-sdk-angular`](https://github.com/efuturetoday/ui-sdk-angular) 공개 — 업스트림 Playwright 스펙 4,340종을 변경 없이 통과했다는 검증 포함)이고, 메인테이너의 공식 답변은 아직 없어요.
  - 단 Angular는 **DOM을 렌더링하는** 렌더러라 RN과는 성격이 달라요. UniKit 실측의 3벽(명령형 변이 · 동기 레이아웃 읽기 · 키 이벤트 — docs/sdd/100 §7)이 Angular에는 없어서, 이 선례는 «렌더러 추가 논의 채널의 형식» 참고일 뿐 RN 실현 경로의 근거는 못 돼요.
- **비공개 API 선언**: 업스트림 `src/renderer.ts` 머리 주석이 «프레임워크 렌더러 전용… 문서화되지 않고 릴리스마다 바뀔 수 있으며 여기엔 공개 API가 없다»고 명시해요. `createPopup` 본체도 `@experimental`, 내부 `PopupRules`는 `@internal`이에요.

**제기 필요성 — 사용자 승인 대기**. 승인되면 #495의 «렌더러 추가는 설계 결정» 프레임으로, Angular 선례(스펙 무변경 재사용)와 함께 RN 특유의 3벽이 Angular에는 없다는 차이를 밝히는 초안이 돼요. 승인 전까지 어떤 외부 활동(이슈·PR·코멘트)도 하지 않아요.

## 3. `createPopup` 없이 충족 가능한 제품 범위 (체크박스 2)

`createPopup`이 제공하는 것(원본 JSDoc·`PopupCore` 코드 기반): 탑 레이어 · presence(퇴장 애니메이션 중 마운트 유지) · ESC/외부 눌림 해제 · 포커스 이동/복귀 사슬 · 모달리티(페이지 inert) · 팝업 중첩 · 멀티 트리거 payload 인계 · 프리셋 행동(WAI-ARIA 패턴) · SSR. 이 중 UniKit 제품 범위와의 대조:

### 충족 가능 — `position()` + 자체 포털로 이미 성립

- **팝업 배치 전부**: `computeOverlayPositionWithPlacement`(overlay.tsx — 4방향 × 3정렬 · 충돌 플립 · 뷰포트 클램프)에 더해, 사이클 101 P3가 `position()` 계열(«팝업 배치의 전부» — docs/sdd/100 §7 판정)을 기기로 확보했어요: 열린 채 side/align 전환 · 충돌 플립 재판정 · 화살표 배치(`--arrow-offset` · `data-arrow-clamped`) · `--available-width/height` 메인축 수축 계약 · rAF 상시 스크롤 추종(VirtualAnchor + rect 캐시 제자리 갱신).
- **오버레이 골격(자체 포털)**: `ModalOverlay`(백드롭 · `useOverlayFocus` 포커스 트랩/복귀 · `useDismiss` ESC · `useScrollLock`)과 `AnchoredOverlay`(앵커 측정 · 배치 위임)이 브리지 `Portal` 위에서 웹·네이티브 같은 계약으로 동작해요. 소비 컴포넌트 실측(2026-11-18, `src/components/` grep): `AnchoredOverlay` 9종(combobox · context-menu · dropdown-menu · hover-card · menubar · navigation-menu · popover · select · tooltip), `ModalOverlay` 6종(alert-dialog · command · dialog · drawer · sheet · sonner).
- **열림/닫힘 상태**: 각 컴포넌트가 React state + context로 직접 관리(브리지 분기 원칙) — `createPopup`의 상태기계 없이 이미 전 컴포넌트가 동작 중이에요.

### 충족 불가 — 현재 UniKit에 없는 영역과 그 성격

1. **등장/퇴장 애니메이션 presence**: docs/sdd/100 §3 Motion 갭과 같은 지점으로, roadmap-components «오버레이 등장/퇴장 애니메이션 — `web:` 클래스 도입 검토»에 이미 별도 항목으로 있어요. `createPopup` 없이도 접근 가능한 과제예요.
2. **네이티브 스크롤 추종의 `AnchoredOverlay` 통합**: overlay.tsx 머리 주석대로 네이티브 `useReposition`은 no-op이에요(웹 전용). 다만 P3가 `position()` 기반 추종의 실현 가능성을 기기로 증명했으므로, 필요해지면 overlay.tsx 쪽 계약 확장이 경로예요 — `createPopup`이 필요한 지점이 아니에요.
3. **시트 프레젠테이션·스냅포인트**(ui-sdk `sheet` 계열): 소비 수요 미관찰(관찰 유지).
4. **모달 팝업**(페이지 inert · persistent 요소): 소비 수요 미관찰. UniKit의 모달은 `ModalOverlay`가 담당하고 있어요.
5. **멀티 트리거 payload 인계**: 소비 수요 미관찰(issue #22 재평가와 같은 기준).

즉 충족 불가 영역은 «`createPopup`이 있어야만 되는» 것이 하나도 없어요 — (a) 기존 로드맵 항목이거나 (b) 수요 미관찰 항목이에요.

## 4. 결정 (체크박스 3)

**판정: `createPopup` 도입 wontfix(UniKit 경계 확정 — `position()` + 자체 포털 경계 채택) + 업스트림 제기 보류(사용자 승인 대기).** 근거:

1. **계약 경계**: `createPopup(primitiveContext, config)`의 첫 인수 `PrimitiveContext`는 커널 렌더러 API예요(실측: `foundation/kernel/primitive-types.ts` — `store` · `element(slot, key)` → `HTMLElement | undefined` · `props()` · `parts()` · `onDestroy`). 이 맥락의 `element()`·`parts()`가 실제 DOM을 돌려주는 건 프레임워크 렌더러(`use-primitive`)가 파트를 바인딩할 때뿐이고, popup-slots가 만드는 파트(trigger·content 등)도 같은 렌더러 계약 위에서만 실제 요소가 돼요. `position()`은 요소 10멤버·전역 스텁이라는 **DOM 표면**을 FakeElement·installDomStubs로 채우면 됐지만(§7 P2·P3 실증), `createPopup`은 DOM 표면이 아니라 **커널 아키텍처 자체**에 결합해요. 채우려면 층 2(#17 `definePrimitive` RN 어댑터) 전체를 먼저 지어야 하고, 그 내부(createPopupLayer의 포커스 사슬 · 모달리티 · 탑 레이어)가 3벽(명령형 변이 · 동기 레이아웃 · 키 이벤트)과 정면충돌해요.
2. **API 안정성**: 업스트림이 렌더러 조립면을 «비공개·릴리스마다 변경 가능»으로 선언(renderer.ts)하고 `createPopup`이 `@experimental`이에요. 공개 초반 베타(공개 4일차 446커밋 — docs/sdd/100 §7 실측)인 지금 내부 API를 추적하는 포크·어댑터 유지 부담이 커요.
3. **수요 부재**: §3 대로 제품 범위는 이미 충족하고, 남은 갭은 전부 기존 로드맵 항목이거나 수요 미관찰이에요. `createPopup`을 도입할 사유가 없어요.

## 5. 재평가 조건 (Unblock / Re-evaluate Triggers)

다음 중 하나가 충족되면 이 결정을 다시 검토해요.

1. `@ui-sdk/core`가 프레임워크 렌더러 계약(`PrimitiveContext` 조립면)을 공개·안정화하거나 RN(비DOM) 어댑터를 공식 출시할 때 — 이때는 §2의 #495 채널을 통한 협력 재검토
2. 층 2(#17 `definePrimitive` RN 어댑터) 추진이 확정될 때 — `createPopup`은 그 하위 항목으로 함께 평가
3. UniKit 소비자에게 §3의 충족 불가 영역(스냅포인트 시트 · 모달 팝업 · 멀티 트리거 payload)에 실제 수요가 생길 때 — 그때도 `createPopup` 도입 대 자체 구현 비교부터
