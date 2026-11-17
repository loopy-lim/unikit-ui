// @unikit-bridge/ui/behaviors/ui-sdk — Vercel UI SDK(@ui-sdk/core) 순수 로직
// 선택 재수출(사이클 101, 실험). npm 전용(배럴·registry 미등록).
//
// 목적: «ui-sdk를 쓰는데 RN도 되도록» 경로의 P1(docs/sdd/100 §7) — DOM 없이
// 성립하는 층 1 헬퍼만 골라 웹·네이티브 같은 계약으로 노출하고, 수요를
// 관찰하는 관측창이에요. @ui-sdk/core는 선택 peer 의존이에요(미설치 소비자는
// 이 진입점을 import하지 않는 한 영향이 없음).
//
// 선정 기준(2026-11-17 실측): 아래 전 항목을 DOM 없는 런타임(bun — document·
// window 부재)에서 실행해 계산을 확인했어요.
//   - 타입어헤드: isTypeaheadKey(이벤트 판정)·createTypeahead(타임아웃
//     상태기계 — 라벨 배열을 넣으면 다음 일치 항목 인덱스를 돌려줌)
//   - 텍스트 매칭(@ui-sdk/core/text-match): fuzzyScore·matchRanges·
//     matchSegments — match.js의 window 참조는 typeof 가드 안이라 안전
//   - 트리 데이터 엔진: treeFromPaths·treeDataNodes·visibleTreeRows·
//     createTreeCollection·toggleTreeChecked·treeCheckedStates
//     (체크 전략·indeterminate 판정 포함 — 전부 문자열 키만 다루는 순수 데이터)
//
// 제외(같은 실측에서 드러난 결함·결합):
//   - labelOf — document.createTreeWalker로 요소 텍스트를 걷는 DOM 결합.
//   - createSelection — 공개 계약이 커널 PrimitiveContext를 요구해 단독 소비 불가.
//   - position — 팝업 배치 엔진. 요소 계약이 DOM 모양(10멤버)이라 이 진입점이
//     아니라 P2 어댑터로 소비해요(실증: apps/expo/app/uisdk-position.tsx).
//
// toSdkKeyEvent: 브리지 BridgeKeyEvent(웹 DOM KeyboardEvent·네이티브 래핑의
// 공통 최소 형태 — bridge/types.ts)를 ui-sdk 헬퍼가 읽는 이벤트 모양으로
// 바꿔요. ui-sdk의 공개 타입은 DOM lib KeyboardEvent라 구조적 최소형을
// 캐스팅해 돌려줘요. shiftKey는 이슈 #13으로 BridgeKeyEvent 계약에 추가돼
// 시프트 계열 조합(선택 엔진의 범위 선택 등)이 이 래퍼 경로로 도달해요
// — 웹은 DOM 이벤트가 실측값을 주고, 네이티브 TextInput은 시프트된 글자
// 대문자 유도 근사(한계는 bridge/types.ts 참조).
import type { BridgeKeyEvent } from "../bridge/types";

// isTypeaheadKey의 매개변수 타입에서 ui-sdk가 기대하는 이벤트 형태를 도출
// (DOM lib 이름을 직접 쓰지 않아 이 파일은 DOM 없는 타입 환경에서도 읽혀요).
import { isTypeaheadKey } from "@ui-sdk/core";

export type SdkKeyEvent = Parameters<typeof isTypeaheadKey>[0];

export { createTypeahead, isTypeaheadKey } from "@ui-sdk/core";
export type { TreeCheckedState, TreeCheckStrategy } from "@ui-sdk/core";
export {
  createTreeCollection,
  treeCheckedStates,
  treeDataNodes,
  treeFromPaths,
  toggleTreeChecked,
  visibleTreeRows,
} from "@ui-sdk/core";
export type {
  TreeCollection,
  TreeCollectionNode,
  TreeItemData,
  TreeRow,
} from "@ui-sdk/core";
export { fuzzyScore, matchRanges, matchSegments } from "@ui-sdk/core/text-match";
export type { MatchRange, MatchSegment } from "@ui-sdk/core/text-match";

/** 브리지 키 이벤트 → ui-sdk 이벤트 모양 변환(층 1 래퍼 — §7 허들 ①). */
export function toSdkKeyEvent(event: BridgeKeyEvent): SdkKeyEvent {
  return {
    key: event.key,
    ctrlKey: event.ctrlKey ?? false,
    metaKey: event.metaKey ?? false,
    altKey: event.altKey ?? false,
    shiftKey: event.shiftKey ?? false,
    // 화살표로 감싸 원본 이벤트에 바인딩해 호출한다 — 메서드 참조를 그대로
    // 넘기면 this가 유실돼 DOM KeyboardEvent는 TypeError, React SyntheticEvent
    // 는 nativeEvent를 잃고 무음 실패한다(PR #26 리뷰 F-1).
    preventDefault: () => event.preventDefault(),
    stopPropagation: () => event.stopPropagation?.(),
  } as unknown as SdkKeyEvent;
}
