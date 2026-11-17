# Issue #18: 층 3 완성 컴포넌트 51종 RN — 범위 재정의

- **관련 이슈**: [#18](https://github.com/loopy-lim/unikit-ui/issues/18) (상위 에픽 [#11](https://github.com/loopy-lim/unikit-ui/issues/11))
- **기준일**: 2026-11-18
- **판정**: **A — «모두 되도록»의 제품 정의를 층 1 순수 헬퍼 + `position()` 계열로 확정. 층 3 완성 컴포넌트 51종은 웹 전용·비이식 제외로 고정하고, 층 2는 이슈 #17로 추적.**

## 1. 조사 범위와 기준

이 문서는 이슈 #18의 체크박스(제품 정의 재합의·A/B 선택 시 대상 목록과 제외 사유의 로드맵 고정)를 수행한 기록이에요. 코드 변경은 없고(범위 고정이 산물), 판정 근거는 아래 실측·기록에 두어요.

- **층 3 판정 원문**: [docs/sdd/100-vercel-ui-sdk-research.md](100-vercel-ui-sdk-research.md) §7 — 층 3 «완성 컴포넌트 51종의 RN 구동: 업스트림 지원 전엔 불가»(127-128행), 3벽(명령형 변경·동기 레이아웃 읽기·키 이벤트 — 85-88행), DOM API 26종·약 1,200 호출 지점 실측(94-96행), «남은 진짜 벽» 키보드 이벤트(104행), 층 2 비공개 renderer API 선언(123-125행). PR #30(2026-11-18)의 FakeStyle 계측·서열 정정이 반영된 판독본이에요.
- **createPopup 경계 선례(이슈 #16, PR #25)**: [docs/sdd/issue-16-createpopup-rn-boundary.md](issue-16-createpopup-rn-boundary.md) — 비도입 확정(wontfix)의 3근거: ① `createPopup`은 DOM 표면이 아니라 커널 아키텍처(`PrimitiveContext`)에 결합 — 채우려면 층 2 전체를 먼저 지어야 하고 내부(포커스 사슬·모달리티·탑 레이어)가 3벽과 정면충돌(56행), ② 업스트림 `renderer.ts`가 조립면을 «비공개·릴리스마다 변경 가능»으로 선언(28행·57행), ③ 제품 범위는 이미 충족하고 남은 갭은 기존 로드맵 항목이거나 수요 미관찰(58행).
- **현행 산물 범위 실측**: `packages/unikit/src/behaviors/ui-sdk.ts`(층 1 순수 헬퍼 11종 재수출 + `toSdkKeyEvent` 래퍼 — 머리 주석에 선정·제외 기준), `packages/unikit/src/behaviors/ui-sdk-dom.ts`(`position()` 계열 DOM 계약 어댑터 — 요소 10멤버 + 전역 스텁, 머리 주석 1-21행). 어댑터의 전역 패치(`document`·`MutationObserver`·`getComputedStyle`)는 부작용이 프로세스 전역이라 «실험·스파이크 범위» 권고가 PR #27 사후 리뷰 F-3로 기록돼 있어요(202-204행) — 좁은 표면 유지가 의도된 경계예요.
- **«51종» 재검증(2026-11-18)**: sdd/100 §8 스냅샷 `/tmp/uisdk-ref/ui`(얕은 클론 `cf6c86f`, 2026-11-17)의 `packages/core/src/components/` 디렉터리 수 재확인 = **51**. 이름은 §3 제외 목록에 전량 기재해요.
- **형제 작업(사실 언급)**: 이슈 #17(층 2 `definePrimitive` RN 어댑터 조사·스파이크)이 병행 진행 중이에요(2026-11-18 기준 미머지). 이 판정은 제품 정의의 고정이지 #17의 결과 예측이 아니며, #17의 성립은 §5 재평가 트리거 중 하나예요.

## 2. 근거 — 왜 A인가

1. **벽의 정체가 두께가 아니라 계약**: 51종은 `definePrimitive` 안에서 DOM 행동(`ElementInternals`·keydown 기반 roving focus·top layer·visual viewport)을 직접 조립해요(sdd/100 §7 127-128행). 3벽 중 키 이벤트는 래퍼로 빚을 수 없는 종류(네이티브 RN View에 키 이벤트 자체가 없음 — 우리 menu-nav 실측과 동일 벽)이고, 명령형 변경(코어 50파일의 `setAttribute`·`.style.`·`getBoundingClientRect` — RN은 `setNativeProps`가 Fabric에서 제거돼 재렌더로 흘려야 함)은 래퍼가 아니라 역방향 react-native-web급 아키텍처를 요구해요(85-88행).
2. **표면의 크기**: 전량 이식은 DOM API 26종·약 1,200 호출 지점을 채우는 일로 «얇은 래퍼»가 아니라 작은 브라우저 DOM 런타임 구축(개월 단위)으로 판정됐어요(94-96행). 같은 구조(커널 결합)의 `createPopup`은 이슈 #16에서 같은 근거로 비도입 확정됐고, 51종은 그 커널 위의 완성품 — 같은 경계의 더 바깥이에요.
3. **A의 내용은 이미 달성·제품화된 상태**: 층 1 헬퍼 11종 + `toSdkKeyEvent`(P1, PR #26)와 `position()` 계열 어댑터(P2·P3, 제품화 PR #27, 정정 #29·#30)는 구현·기기 실증·패키지 진입점화가 끝났어요. A는 새 개발이 아니라 현행 산물을 제품 정의로 확정하는 판정이에요.
4. **카탈로그 중복 — 이식의 한계 이익(2026-11-18 실측)**: 51종 중 UniKit 카탈로그(`packages/unikit/src/components/` 62종)와 **동명 대응 29종**(accordion·avatar·button·calendar·carousel·checkbox·collapsible·combobox·command·dialog·drawer·field·hover-card·input·label·menubar·navigation-menu·pagination·popover·progress·resizable·scroll-area·select·separator·slider·switch·tabs·toggle·tooltip), **이름은 다르지만 기능 대응 5종**(menu→dropdown-menu·context-menu, radio→radio-group, toast→sonner, otp-input→input-otp, toolbar→editor-toolbar). 34/51이 이미 UniKit의 웹+RN 단일 소스 카탈로그로 커버돼요. 층 3 이식의 신규 가치는 나머지 **17종**(autocomplete·color-picker·date-input·date-picker·file-input·image-cropper·listbox·meter·number-input·password-input·rating·segmented-control·timeline·token-input·tree·trigger-menu·waterfall)에 한정되는데, 이들은 ui-sdk RN 이식 경로가 아니라 (수요 확인 시) UniKit 자체 컴포넌트 로드맵(이식 9조 관례)의 후보로 보는 편이 토큰 스타일·소비자 복사 모델과 맞아요. 수요 판단은 이 이슈 밖의 문제예요.
5. **업스트림 상태**: RN 어댑터 부재(react·vue·svelte·solid·web 5종 — sdd/100 §1), 렌더러 추가 논의 자체가 미결정(#495 — 메인테이너 공식 답변 없음), 주간 단위 베타(공개 4일차 446커밋). 비공개 renderer API를 이 시점에 추적하는 어댑터 유지는 #16 근거 ②와 같은 리스크예요.

## 3. 결정 — 대상 목록과 제외 사유 (로드맵 고정본)

**제품 정의 «모두 되도록» = 층 1 순수 헬퍼 + `position()` 계열.**

대상(유지·운영):

| 진입점 | 내용 | 상태 |
|---|---|---|
| `@unikit-bridge/ui/behaviors/ui-sdk` | 순수 헬퍼 11종(isTypeaheadKey·createTypeahead·fuzzyScore·matchRanges·matchSegments·treeFromPaths·treeDataNodes·visibleTreeRows·createTreeCollection·toggleTreeChecked·treeCheckedStates) + `toSdkKeyEvent` 래퍼 | npm 전용·실험(관측창) — `@ui-sdk/core` 선택 peer |
| `@unikit-bridge/ui/behaviors/ui-sdk-dom` | `position()` DOM 계약 어댑터(FakeElement·FakeStyle·installDomStubs·rectFrom·updateRect·pxToNumber) | npm 전용·네이티브 전용 |

제외(사유와 함께):

1. **층 3 완성 컴포넌트 51종 전량 — 웹 전용·비이식.** 사유: §2의 1·2·4(3벽·DOM 런타임 규모·카탈로그 중복). 목록(스냅샷 재검증): accordion·autocomplete·avatar·button·calendar·carousel·checkbox·collapsible·color-picker·combobox·command·date-input·date-picker·dialog·drawer·field·file-input·hover-card·image-cropper·input·label·listbox·menu·menubar·meter·navigation-menu·number-input·otp-input·pagination·password-input·popover·progress·radio·rating·resizable·scroll-area·segmented-control·select·separator·slider·switch·tabs·timeline·toast·toggle·token-input·toolbar·tooltip·tree·trigger-menu·waterfall.
2. **층 2(definePrimitive RN 어댑터) — 이 이슈의 범위 밖, 이슈 #17로 추적.** 사유: 조립면의 비공개 renderer API 추적 리스크(sdd/100 §7 123-125행). 성립 시 §5 트리거로 층 3·createPopup(#16)과 함께 재평가해요.
3. **createPopup — 이슈 #16에서 이미 비도입 확정(wontfix).** 이 판정과 독립적으로 유지돼요.

## 4. B·C 기각 사유

- **B(층 2 소수 primitive) 기각**: ① 층 2의 조립면은 업스트림이 «비공개·릴리스마다 변경 가능»으로 선언한 영역 — 주간 베타 기간 추적 유지 비용이 이익을 초과해요(#16 근거 ② 동일). ② 소수 primitive를 세워도 그 위의 51종은 3벽(키 이벤트·top layer·`ElementInternals`)에 그대로 막혀 «모두 되도록»의 정의를 실제로 바꾸지 못해요 — B는 A의 상위 집합이 아니라 같은 벽 앞의 다른 단계예요. ③ UniKit 자체 카탈로그(62종·웹+RN 단일 소스)가 같은 역할을 이미 제품 수준으로 제공해요(§2의 4). ④ #17이 구조적 가능성을 확인하면 §5 트리거로 언제든 확장 가능 — 지금 먼저 정할 이유가 없어요.
- **C(업스트림 대기) 기각**: ① A의 범위는 이미 구현·기기 실증·제품화 완료(PR #26·#27) — C로 이슈를 blocked/upstream에 두면 달성된 범위의 제품 정의가 문서로 남지 않아요. ② 이 이슈의 임무는 «모두 되도록» 정의의 합의 자체예요. 층 3의 업스트림 의존성은 A 정의 안의 제외 항목(트리거로 관리)이지 이슈 전체를 멈출 블록이 아니에요.

## 5. 재평가 트리거 (Unblock / Re-evaluate Triggers)

다음 중 하나가 충족되면 이 결정을 다시 검토해요.

1. `@ui-sdk/core`가 RN(비DOM) 어댑터를 공식 출시하거나 렌더러 계약(`PrimitiveContext` 조립면)을 공개·안정화할 때 — #16 §2의 #495 채널과 함께 검토
2. 층 2(이슈 #17 `definePrimitive` RN 어댑터)가 성립할 때 — 층 3와 createPopup(#16 재평가 조건 2)을 함께 평가
3. UniKit 소비자에게 카탈로그 밖 17종(autocomplete·tree·token-input 등)의 실제 수요가 생길 때 — 그때도 층 3 RN 이식 대신 UniKit 자체 구현(이식 9조 관례)과의 비교가 먼저예요

## 6. README·llms.txt 확인 — 정정 대상 없음

«모두 되도록» 약조 문구는 README.md·README.ko.md·llms.txt·packages/unikit/README.md에 등장하지 않아요(2026-11-18 grep 실측 — 문구는 sdd/100 §7의 요청 인용에만 있음). llms.txt의 진입점 기술(9행 — «순수 헬퍼 재수출과 position() DOM 계약 어댑터»·«연동 실험»)은 이 판정 후에도 정합해요: 두 진입점은 여전히 실험(관측창) 지위고, 이 판정은 그 관측창의 바깥 경계(층 3 비이식)를 고정한 것이므로 소비자 안내 문구는 그대로 둬요.
