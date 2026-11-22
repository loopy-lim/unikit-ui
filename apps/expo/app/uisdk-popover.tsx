// M2-② 팝업 유형 첫 슬라이스 참조 화면(에픽 #35 «다 go» 로드맵, 이슈 #39).
// createPopup 비공개 커널 경로(popover 1종)를 파트 렌더러 진입점
// (@unikit-bridge/ui/behaviors/ui-sdk-renderer)으로 구동해요 — 개방은
// trigger press(pressOpening → createOpenSteps), 배치는 커널이 attach에서
// 스스로 position()을 호출하는 경로(P2/P3는 소비자가 직접 불렀다면 이번엔
// 커널 내부 호출), 닫힘은 close 슬롯 press와 공개 api(api.close — RN 바깥
// 누름은 문서 리스너가 없어 소비자가 호출).
//
// 측정 계약(렌더러 팝업 모드 — setSdkElementPopupMode):
//   - 바인딩된 요소(sdkElement)가 «연결됨»으로 보고 createPopup의 요소
//     조회(context.element·elements())와 layer bind 시작 조건이 성립해요.
//   - rect 캐시에 화면이 measureInWindow(비동기)로 주입하면 position()이
//     동기 읽기처럼 소비해요(FakeElement 패턴 — P2/P3 실증의 렌더러 이식).
//   - 계산 결과는 SdkStyle observer로 흘러와 RN 절대 좌표로 옮겨요.
//     «스타일이 곧 위치» 원점 계약(origin-drift 방어)도 렌더러가 지켜요.
// 전 슬롯 경성 검사는 packages/unikit/scripts/ui-sdk-contract-probe.ts (9)가
// 상시 재현해요(수치 포함 — left 48px·top 244px·data-side bottom·available).
// 기기 실증(2026-11-23 — 에뮬레이터 390×844dp): 개방 배치 left 84·top 203.5
// ·side bottom·available 583.5(스스로 검증 — 트리거 하단+오프셋·중심 정렬·
// 창 높이 클램프) · close-press·outside-press 2경로 로그 ✓.
//
// 알려진 경계(v1):
//   - 콘텐츠 첫 배치는 rect 주입 전 0치수로 한 번 계산돼요 — onLayout에서
//     rect를 주입한 뒤 popup.place()(커널 내부 재배치)로 즉시 교정하고,
//     교정 전(placement null)에는 콘텐츠를 투명하게 둬요.
//   - 바깥 누름 닫힘은 전면 Pressable이 api.close({reason:"outside-press"})를
//     호출하는 소비 계약이에요(문서 pointerdown 리스너가 RN에 없다 —
//     #19 modality 벽과 같은 구조). ESC·roving 키 이동도 같은 벽 뒤.
//   - documentElement 치수 스텁은 installDomStubs(ui-sdk-dom)가 깔지만,
//     에이전트 화면의 선행 설치(installSdkAgentDom — 0×0)와 공존할 때를
//     대비해 live getter로 교정해요(프로브 (9)가 발견한 경계).
import * as React from "react";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@unikit-bridge/ui/primitives";

import { popover } from "@ui-sdk/core/popover";
import {
  setSdkRect,
  setSdkElementPopupMode,
  useSdkPart,
  useSdkPrimitive,
  type SdkElement,
  type SdkPrimitiveInstance,
} from "@unikit-bridge/ui/behaviors/ui-sdk-renderer";
import {
  FakeElement,
  installDomStubs,
} from "@unikit-bridge/ui/behaviors/ui-sdk-dom";

/** position()의 뷰포트 판정이 읽는 documentElement 치수를 live getter로
 *  보장 — installDomStubs가 이미 설치했으면 그대로(같은 live 계약),
 *  에이전트 진입점의 0×0 스텁이 앞서 있으면 교정해요. */
function ensureViewportStubs() {
  installDomStubs();
  const doc = (globalThis as unknown as { document?: Record<string, unknown> }).document;
  if (doc?.documentElement instanceof FakeElement) return;
  const docEl = new FakeElement("documentElement", {
    x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0,
  });
  Object.defineProperty(docEl, "clientWidth", {
    get: () => Dimensions.get("window").width,
  });
  Object.defineProperty(docEl, "clientHeight", {
    get: () => Dimensions.get("window").height,
  });
  if (doc) doc.documentElement = docEl;
}

type MeasureInWindow = (cb: (x: number, y: number, w: number, h: number) => void) => void;

type Placement = {
  left: number;
  top: number;
  side: string;
  availableHeight: number | null;
};

export default function UisdkPopover() {
  const insets = useSafeAreaInsets();
  const [placement, setPlacement] = React.useState<Placement | null>(null);
  const [writes, setWrites] = React.useState(0);
  const [log, setLog] = React.useState<string[]>([]);
  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 5));
  }, []);

  const instance = useSdkPrimitive(popover, {
    onOpenChange: (open: boolean, closed?: { reason: string }) =>
      pushLog(`onOpenChange(${String(open)})${closed ? ` 이유:${closed.reason}` : ""}`),
  });

  // 팝업 모드 — 이 화면의 바인딩 요소가 «연결됨»으로 보고 rect 주입·
  // 배치 계약이 성립해요. 언마운트 시 원복(다른 모드 화면과의 전역 경계).
  React.useEffect(() => {
    ensureViewportStubs();
    setSdkElementPopupMode(true);
    return () => setSdkElementPopupMode(false);
  }, []);

  const triggerPart = useSdkPart(instance, "trigger");
  const contentPart = useSdkPart(instance, "content");
  const titlePart = useSdkPart(instance, "title");
  const descriptionPart = useSdkPart(instance, "description");
  const closePart = useSdkPart(instance, "close");
  const arrowPart = useSdkPart(instance, "arrow");

  // 바인딩 요소는 layout effect에서 만들어지므로 초회 렌더엔 없어요 —
  // 측정 콜백이 늦게 도착하는 시점에는 항상 존재해요(안정 참조 유지).
  const elements = React.useRef<{
    trigger?: SdkElement;
    content?: SdkElement;
    arrow?: SdkElement;
  }>({});
  elements.current.trigger = triggerPart.sdkElement;
  elements.current.content = contentPart.sdkElement;
  elements.current.arrow = arrowPart.sdkElement;

  // 커널 내부 재배치 — attach가 건 position()에 «지금 다시 계산»을
  // 청구해요(rect 주입 직후 호출). 비공개 경계는 렌더러 진입점이 이미
  // 문서화하는 영역이에요(renderer.d.ts «프레임워크 렌더러 전용»).
  const replace = React.useCallback(() => {
    const internal = (instance as SdkPrimitiveInstance & {
      api?: { internal?: { popup?: { place?: () => void } } };
    }).api?.internal;
    internal?.popup?.place?.();
  }, [instance]);

  /** RN 뷰 측정 →SdkElement rect 주입. measureInWindow는 비동기라
   *  rAF로 레이아웃 통과를 기다렸다가 잡아요(bridge onLayout 계약이
   *  {width,height}로 좁아 x·y가 없어요 — P2/P3와 같은 방식). */
  const contentRef = React.useRef<{ measureInWindow?: MeasureInWindow } | null>(null);
  const arrowRef = React.useRef<{ measureInWindow?: MeasureInWindow } | null>(null);

  const measureInto =
    (which: "content" | "arrow", done: () => void, retry: () => void) => () => {
      const host = which === "content" ? contentRef.current : arrowRef.current;
      host?.measureInWindow?.((x, y, width, height) => {
        const target = elements.current[which];
        if (target && width > 0) {
          setSdkRect(target, x, y, width, height);
          done();
        } else {
          retry();
        }
      });
    };

  const triggerRef = React.useRef<{
    measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
  } | null>(null);

  // trigger 눌림 — 최신 앵커 치수를 주입한 뒤 press(개방). measureInWindow는
  // 비동기 콜백이라 press를 콜백 안에서 실행해요(이 화면은 스크롤이 없어
  // 사실상 정적이지만, «열릴 때 재측정»이 P2/P3의 교훈인 지점이에요).
  const openFromTrigger = React.useCallback(() => {
    setPlacement(null);
    triggerRef.current?.measureInWindow?.((x, y, width, height) => {
      const target = elements.current.trigger;
      if (target && width > 0) setSdkRect(target, x, y, width, height);
      triggerPart.press();
    });
  }, [triggerPart]);

  const open = triggerPart.snapshot.open === true;
  const showingContent = contentPart.showing;

  // 콘텐츠·화살표 마운트 측정 — mount 직후 rect 주입 후 커널 place().
  // attach 시점엔 아직 치수가 없어(0×0 첫 계산) 주입이 끝나면 즉시
  // 재배치를 청구해요(늦어도 position()의 slowCheck(500ms) 폴이 교정).
  React.useLayoutEffect(() => {
    if (!showingContent) return;
    let cancelled = false;
    const retry = (next: () => void) => () => {
      if (!cancelled) requestAnimationFrame(next);
    };
    const measureArrow = measureInto("arrow", () => replace(), () => {});
    const measureContent = measureInto("content", measureArrow, () => retry(measureContent));
    requestAnimationFrame(measureContent);
    return () => {
      cancelled = true;
    };
  }, [showingContent, replace]);

  // content·arrow 배치 출력 — SdkStyle observer. data-side는 속성 저장소에서
  // 읽어요(style 쓰기 시점에는 이미 기록돼 있어요 — position() 쓰기 순서).
  React.useEffect(() => {
    const content = elements.current.content;
    if (!content) return;
    content.style.observer = (key: string, value: string) => {
      setWrites((count) => count + 1);
      if (key === "left") {
        setPlacement((prev) => ({
          left: parseFloat(value) || 0,
          top: prev?.top ?? 0,
          side: content.getAttribute("data-side") ?? "",
          availableHeight: prev?.availableHeight ?? null,
        }));
      } else if (key === "top") {
        setPlacement((prev) => ({
          left: prev?.left ?? 0,
          top: parseFloat(value) || 0,
          side: content.getAttribute("data-side") ?? "",
          availableHeight: prev?.availableHeight ?? null,
        }));
      } else if (key === "--available-height") {
        const height = parseFloat(value);
        setPlacement((prev) => ({
          left: prev?.left ?? 0,
          top: prev?.top ?? 0,
          side: content.getAttribute("data-side") ?? "",
          availableHeight: Number.isFinite(height) ? height : null,
        }));
      }
    };
    return () => {
      content.style.observer = undefined;
    };
  }, [contentPart.sdkElement]);

  const api = (instance as SdkPrimitiveInstance & {
    api?: {
      close?: (request?: { reason?: string }) => void;
      setOpen?: (open: boolean) => void;
    };
  }).api;

  return (
    <View className="flex-1 bg-background">
      <View style={{ height: insets.top + 20 }} />
      <View className="flex-1 px-6">
        <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
          팝업 유형 — createPopup 커널 경로
        </Text>
        <Text className="mt-2 font-sans text-sm leading-5 text-foreground">
          popover의 비공개 커널(createPopup)이 파트 렌더러에서 열고 닫고
          배치해요. trigger 눌림 → 커널 개방 → 콘텐츠 측정 주입 →
          position() 재계산(place) — 화살표·가용 높이 계약까지 같이 와요.
        </Text>

        <View className="mt-10 items-center">
          {triggerPart.showing && (
            <Pressable
              ref={triggerRef as never}
              accessibilityLabel="팝업 열기"
              className="h-12 min-w-40 flex-row items-center justify-center rounded-xl border border-border bg-background px-4 active:bg-muted/50"
              accessibilityRole={triggerPart.bridgeProps.accessibilityRole as "button" | undefined}
              aria-expanded={triggerPart.bridgeProps["aria-expanded"]}
              onPress={openFromTrigger}
            >
              <Text className="font-sans text-sm font-semibold text-foreground">
                {open ? "팝업 닫기(트리거)" : "팝업 열기(트리거)"}
              </Text>
            </Pressable>
          )}
        </View>

        <View className="mt-8 gap-1">
          <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            배치 판독(position() 계산 결과)
          </Text>
          <Text className="font-sans text-sm leading-5 text-foreground">
            {placement
              ? `left ${placement.left} · top ${placement.top} · side ${placement.side}${
                  placement.availableHeight !== null ? ` · available ${placement.availableHeight}` : ""
                } · style 쓰기 ${writes}회`
              : "(닫힘 — 트리거를 눌러요)"}
          </Text>
          {log.map((line, i) => (
            <Text key={`${line}-${i}`} className="font-sans text-xs leading-4 text-muted-foreground">
              {line}
            </Text>
          ))}
        </View>
      </View>

      {showingContent && (
        <>
          {/* 바깥 누름 — 문서 pointerdown 리스너가 RN에 없어 소비자가
              커널에 청구하는 계약(#19과 같은 벽의 팝업 판). */}
          <Pressable
            accessibilityLabel="팝업 바깥 영역 — 닫기"
            className="absolute inset-0 bg-black/20"
            onPress={() => api?.close?.({ reason: "outside-press" })}
          />
          {placement && (
            <View
              ref={contentRef as never}
              className="absolute w-56 rounded-2xl border border-border bg-popover p-4 shadow-lg"
              style={{ left: placement.left, top: placement.top, opacity: placement.left || placement.top ? 1 : 0 }}
              accessibilityRole={contentPart.bridgeProps.accessibilityRole as "dialog" | undefined}
            >
              {titlePart.showing && (
                <Text className="font-sans text-sm font-semibold text-popover-foreground">
                  팝업 제목(title 슬롯)
                </Text>
              )}
              {descriptionPart.showing && (
                <Text className="mt-1 font-sans text-xs leading-4 text-muted-foreground">
                  description 슬롯 — aria-describedby로 연결돼요.
                </Text>
              )}
              <Text className="mt-2 font-sans text-xs text-muted-foreground">
                side {placement.side} · available {placement.availableHeight ?? "?"}dp
              </Text>
              {closePart.showing && (
                <Pressable
                  accessibilityLabel="팝업 닫기"
                  className="mt-3 h-9 flex-row items-center justify-center rounded-lg bg-primary px-3 active:opacity-85"
                  accessibilityRole={closePart.bridgeProps.accessibilityRole as "button" | undefined}
                  onPress={() => closePart.press()}
                >
                  <Text className="font-sans text-xs font-semibold text-primary-foreground">
                    닫기(close 슬롯 press)
                  </Text>
                </Pressable>
              )}
              {arrowPart.showing && (
                <View
                  ref={arrowRef as never}
                  className="absolute h-3 w-3 rotate-45 border-border bg-popover"
                  style={{
                    left: parseFloat(String(arrowPart.sdkElement?.style.left ?? "")) || undefined,
                    top: -6,
                  }}
                  accessibilityLabel="팝업 화살표"
                />
              )}
            </View>
          )}
        </>
      )}
      <View style={{ height: insets.bottom + 24 }} />
    </View>
  );
}
