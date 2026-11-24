/**
 * UniKit on nsh 헤드리스 회귀 테스트 — nsh test 드라이버(id/testID·label·text
 * 셀렉터)가 데모 앱의 React 트리를 구동한다: 렌더 → press → 상태 갱신 → 텍스트
 * 갱신 → 조건부 언마운트 → 입력 → 셀렉트 커밋. 에이전트가 이 킷을 구동하는
 * 방식(접근성 라벨·텍스트 기반)과 같은 경로다.
 */
import { expect, open, test } from "nsh/test";

test("unikit components drive on nsh", async () => {
  const app = await open(".");

  // 1) 초기 렌더 — 제목·카운터·뱃지
  const texts = app.texts();
  expect(texts).toContain("UniKit on nsh");
  expect(texts).toContain("Tapped 0 times");
  expect(texts).toContain("apple");

  // 2) press → 상태 갱신 → 텍스트 갱신(2회 — 같은 텍스트 fiber의 반복 갱신은
  // 노드 교체 경로(LIVE 추적)를 발화시킨다)
  await app.press("id:increment-button");
  expect(app.texts()).toContain("Tapped 1 times");
  await app.press("id:increment-button");
  expect(app.texts()).toContain("Tapped 2 times");

  // 3) 입력 → onChange → 뱃지 조건부 마운트 + 조건부 텍스트 갱신(키마다 onChange —
  // 살아있는 Text 호스트 안의 텍스트 인스턴스가 마운트·갱신된다)
  await app.type("id:name-input", "ns");
  expect(app.texts()).toContain("ns");
  expect(app.texts()).toContain("typed: ns");

  // 3-1) 갱신 이력 있는 텍스트 인스턴스의 언마운트 — live 노드까지 graveyard로
  // 회수되는지(liveOf 라우팅 — retired 원본만 옮기면 "typed: ns"가 화면에 남는다)
  await app.clear("id:name-input");
  expect(app.texts()).not.toContain("ns");
  expect(app.texts()).not.toContain("typed: ns");

  // 4) 스위치 → 조건부 언마운트(airplane 뱃지)
  await app.press("id:airplane-switch");
  expect(app.texts()).toContain("airplane");
  await app.press("id:airplane-switch");
  expect(app.texts()).not.toContain("airplane");

  // 5) 셀렉트 — 트리거 → 옵션 press → 커밋(비제어 값 → 뱃지 갱신)
  await app.press("id:fruit-select");
  await app.press("text:Banana");
  expect(app.texts()).toContain("banana");

  // 6) 색 스킴 — 라벨이 라이트↔다크로 바뀐다
  await app.press("id:scheme-button");
  expect(app.texts()).toContain("Switch to light");
});
