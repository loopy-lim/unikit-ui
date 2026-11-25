/**
 * UniKit on nsh 헤드리스 회귀 테스트 — nsh test 드라이버(id/testID·label·text
 * 셀렉터)가 데모 앱의 nsh(signal) 트리를 구동한다: 렌더 → press → 상태 갱신 →
 * 텍스트 갱신 → 조건부 마운트/언마운트 → 입력 → 셀렉트 커밋 → ui-sdk 커널
 * pending 게이팅 → 체크박스·라디오·textarea → Dialog/Sheet 열기·닫기 →
 * 색 스킴. 에이전트가 이 킷을 구동하는 방식(접근성 라벨·텍스트 기반)과
 * 같은 경로다.
 *
 * 사이클 103: 8)~12) 단계가 더해져 총 13단계가 되었다 — 0.5.0 검증에서 결함이
 * 있던 부분(문자열 라벨·비제어 Dialog/Sheet·다크 모드 전경색·체크 표시)의 회귀 방지.
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

  // 4) 스위치(문자열 라벨) → 조건부 마운트/언마운트(airplane 뱃지)
  expect(app.texts()).toContain("Flight mode");
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

  // 7) 색 스킴 — 라벨이 라이트↔다크로 바뀐다 + 전경색이 토큰을 따른다
  //    (title: 명시 text-foreground, echo: 클래스 없는 Text가 루트의 text-foreground
  //    를 상속 — 클래스 없는 Text만 두면 검정으로 고정되는 102 결함의 회귀)
  await app.type("id:name-input", "fg");
  expect(app.spanStyle("text:UniKit on nsh").color).toBe("#09090bff");
  expect(app.spanStyle("text:typed: fg").color).toBe("#09090bff");
  await app.press("id:scheme-button");
  expect(app.texts()).toContain("Switch to light");
  expect(app.spanStyle("text:UniKit on nsh").color).toBe("#fafafaff");
  expect(app.spanStyle("text:typed: fg").color).toBe("#fafafaff");
  await app.clear("id:name-input");

  // 8) 체크박스 — 문자열 라벨 + onCheckedChange → 조건부 뱃지(체크 표시는
  //    체크일 때만 그려진다 — 미선택 상자에 표시가 보이던 102 결함의 회귀)
  expect(app.texts()).toContain("Accept terms");
  expect(app.texts()).not.toContain("terms");
  await app.press("id:terms-checkbox");
  expect(app.texts()).toContain("terms");
  await app.press("id:terms-checkbox");
  expect(app.texts()).not.toContain("terms");

  // 9) 라디오 그룹 — 항목 press → 커밋(뱃지). 비활성 항목은 드라이버가 거절한다
  expect(app.enabled("id:size-huge")).toBe(false);
  await expect(app.press("id:size-huge")).rejects.toMatchObject({ code: "ERR_NSH_TEST_DISABLED" });
  await app.press("id:size-large");
  expect(app.texts()).toContain("large");

  // 10) textarea — 입력 → echo, clear → 소거
  await app.type("id:notes-textarea", "hello");
  expect(app.texts()).toContain("notes: hello");
  await app.clear("id:notes-textarea");
  expect(app.texts()).not.toContain("notes: hello");

  // 11) 대화상자(비제어) — 트리거 → 열림 → DialogClose → 닫힘 → 재개 →
  //     밖 누름(백드롭 여백) → 닫힘. 0.5.0은 열려도 닫히지 않았다(102 결함)
  expect(app.shows("id:demo-dialog")).toBe(false);
  await app.press("id:open-dialog");
  expect(app.shows("id:demo-dialog")).toBe(true);
  expect(app.texts()).toContain("Dialog title");
  await app.press("id:dialog-done");
  expect(app.shows("id:demo-dialog")).toBe(false);
  await app.press("id:open-dialog");
  expect(app.shows("id:demo-dialog")).toBe(true);
  await app.press("id:demo-dialog-backdrop", { position: { x: 4, y: 4 } });
  expect(app.shows("id:demo-dialog")).toBe(false);

  // 12) 시트(비제어) — 트리거 → 열림 → SheetClose → 닫힘
  expect(app.shows("id:demo-sheet")).toBe(false);
  await app.press("id:open-sheet");
  expect(app.shows("id:demo-sheet")).toBe(true);
  expect(app.texts()).toContain("Sheet title");
  await app.press("id:sheet-done");
  expect(app.shows("id:demo-sheet")).toBe(false);
});
