/**
 * UniKit on nsh 헤드리스 회귀 테스트 — nsh test 드라이버(id/testID·label·text
 * 셀렉터)가 데모 앱의 nsh(signal) 트리를 구동한다: 렌더 → press → 상태 갱신 →
 * 텍스트 갱신 → 조건부 마운트/언마운트 → 입력 → 셀렉트 커밋 → ui-sdk 커널
 * pending 게이팅. 에이전트가 이 킷을 구동하는 방식(접근성 라벨·텍스트 기반)과
 * 같은 경로다.
 */
import { expect, open, test } from "nsh/test";

test("unikit components drive on nsh", async () => {
  const app = await open(".");

  // 1) 초기 렌더 — 제목·카운터·뱃지
  const texts = app.texts();
  expect(texts).toContain("UniKit on nsh");
  expect(texts).toContain("Tapped 0 times");
  expect(texts).toContain("apple");

  // 2) press → 상태 갱신 → 텍스트 갱신(2회 — 반복 갱신이 텍스트를 안정적으로
  // 치환하는지)
  await app.press("id:increment-button");
  expect(app.texts()).toContain("Tapped 1 times");
  await app.press("id:increment-button");
  expect(app.texts()).toContain("Tapped 2 times");

  // 3) 입력 → onChange → 뱃지 조건부 마운트 + 조건부 텍스트 갱신(키마다 onChange)
  await app.type("id:name-input", "ns");
  expect(app.texts()).toContain("ns");
  expect(app.texts()).toContain("typed: ns");

  // 3-1) 조건부 텍스트 소거 — clear로 갱신 이력 있는 텍스트가 언마운트된다
  await app.clear("id:name-input");
  expect(app.texts()).not.toContain("ns");
  expect(app.texts()).not.toContain("typed: ns");

  // 4) 스위치 → 조건부 마운트/언마운트(airplane 뱃지)
  await app.press("id:airplane-switch");
  expect(app.texts()).toContain("airplane");
  await app.press("id:airplane-switch");
  expect(app.texts()).not.toContain("airplane");

  // 5) 셀렉트 — 트리거 → 옵션 press → 커밋(비제어 값 → 뱃지 갱신)
  await app.press("id:fruit-select");
  await app.press("text:Banana");
  expect(app.texts()).toContain("banana");

  // 6) ui-sdk 커널 — @ui-sdk/core button 프리미티브의 고유 계약(pending 게이팅):
  // 눌림 중(action이 Pending)에는 "…" 접미가 붙고, 완료 전 재눌림은 커널이
  // 차단한다(어댑터가 onPress를 직접 호출하는 우회로는 이 두 단계를 통과 못 한다)
  await app.press("id:sdk-button");
  expect(app.texts()).toContain("Sdk tapped 0 times…");
  await app.press("id:sdk-button");
  expect(app.texts()).toContain("Sdk tapped 0 times…");
  await app.press("id:sdk-release-button");
  expect(app.texts()).toContain("Sdk tapped 1 times");
  expect(app.texts()).not.toContain("Sdk tapped 1 times…");

  // 7) 색 스킴 — 라벨이 라이트↔다크로 바뀐다
  await app.press("id:scheme-button");
  expect(app.texts()).toContain("Switch to light");
});
