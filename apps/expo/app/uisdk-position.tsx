// P2 수직 슬라이스 화면 — @ui-sdk/core의 position()(팝업 배치 엔진)을
// 실제 RN 화면에서 구동해요. docs/sdd/100 §7 증거(계약 프로브의 다음 단계 —
// 가짜 rect가 아니라 실측 rect로).
//
// 흐름: 버튼 눌림 → 팝업을 투명하게 렌더(크기 측정용) → 앵커·팝업·컨테이너를
// measureInWindow로 측정(비동기) → rect를 채운 FakeElement로 position() 호출
// (동기 계산) → 계산 결과(style 쓰기·data-side)를 RN style로 적용해 그 자리에
// 렌더. 개방 시 1회 계산이고 계산 뒤 stop()으로 추적 루프를 닫아요(v1 한계).
//
// 보는 포인트:
// - 위쪽 앵커: side=bottom 요청대로 팝업이 앵커 아래에 붙어요(data-side=bottom).
// - 아래쪽 앵커: 아래 공간이 부족해 position()이 스스로 위로 플립해요
//   (data-side=top) — 충돌 플립 판정도 ui-sdk 코어가 내려요.
// - 계산 근거(앵커 실측 rect·스타일 쓰기 기록)를 화면 아래에 그대로 보여요.
import {
  useCallback,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from "react";
import { View as RNView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@unikit-bridge/ui/primitives";

import {
  FakeElement,
  installDomStubs,
  pxToNumber,
  rectFrom,
  type FakeRect,
} from "../uisdk-adapter";
import { position } from "@ui-sdk/core";

// position()은 호출 시점에만 전역을 읽어요(모듈 평가는 DOM 없이 안전 — §7
// 실증). 화면 임포트 직후, 첫 호출 전에 스텁을 깔아요.
installDomStubs();

const POPUP_WIDTH = 232;
const POPUP_HEIGHT = 124;
const SIDE_OFFSET = 8;

type Placed = {
  left: number;
  top: number;
  side: string;
  align: string;
  anchorRect: FakeRect;
  writes: string[];
};

// 브리지 View·Pressable의 ref는 빈 마커(BridgeViewRef)라 RN 측정 메서드
// 타입이 안 붙어요 — RN View 인스턴스 계약으로 잡아요. 구조적 타이핑으로
// 마커 ref prop에도 그대로 전달돼요.
type HostView = ComponentRef<typeof RNView>;

const measure = (ref: RefObject<HostView | null>): Promise<FakeRect> =>
  new Promise((resolve) => {
    const el = ref.current;
    if (!el) {
      resolve(rectFrom(0, 0, 0, 0));
      return;
    }
    el.measureInWindow((x, y, width, height) => {
      resolve(rectFrom(x ?? 0, y ?? 0, width ?? 0, height ?? 0));
    });
  });

export default function UisdkPosition() {
  const insets = useSafeAreaInsets();
  const containerRef = useRef<HostView>(null);
  const topAnchorRef = useRef<HostView>(null);
  const bottomAnchorRef = useRef<HostView>(null);
  const popupRef = useRef<HostView>(null);
  // pending: 팝업이 떠 있으나 아직 배치 전(투명) 상태 — 크기 측정을 위해
  // 마운트만 시켜두는 단계예요.
  const [pending, setPending] = useState<"top" | "bottom" | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openAt = useCallback((which: "top" | "bottom") => {
    setPlaced(null);
    setError(null);
    setPending(which);
    requestAnimationFrame(() => {
      const anchorRef = which === "top" ? topAnchorRef : bottomAnchorRef;
      Promise.all([
        measure(anchorRef),
        measure(popupRef),
        measure(containerRef),
      ]).then(([anchor, popup, container]) => {
        try {
        const anchorEl = new FakeElement("anchor", anchor);
        const popupEl = new FakeElement("popup", popup);
        // position()의 공개 계약은 DOM HTMLElement 타입 — 어댑터 요소를
        // 구조적으로 캐스팅해 전달해요(프로브·스파이크와 같은 방식).
        const stop = position(
          anchorEl as unknown as HTMLElement,
          popupEl as unknown as HTMLElement,
          {
            side: "bottom",
            align: "start",
            sideOffset: SIDE_OFFSET,
          },
        );
        const left = pxToNumber(popupEl.style.left);
        const top = pxToNumber(popupEl.style.top);
        if (left === null || top === null) {
          setPending(null);
          return;
        }
        // position()은 window 좌표로 계산해요 — 팝업은 컨테이너 안 절대 배치라
        // 컨테이너 원점을 보정해요.
        setPlaced({
          left: left - container.x,
          top: top - container.y,
          side: popupEl.attrs["data-side"] ?? "?",
          align: popupEl.attrs["data-align"] ?? "?",
          anchorRect: anchor,
          writes: popupEl.style.writes,
        });
        setPending(null);
        stop();
        } catch (err) {
          // 계약 누락이 그대로 드러나야 증거가 돼요 — 화면에 표시.
          console.error("uisdk-position 실패:", err, (err as Error)?.stack);
          setError(String((err as Error)?.message ?? err));
          setPending(null);
        }
      });
    });
  }, []);

  const close = useCallback(() => {
    setPlaced(null);
    setPending(null);
    setError(null);
  }, []);

  const open = pending !== null || placed !== null;

  return (
    <View ref={containerRef} className="flex-1 bg-background">
      <View
        className="flex-1 justify-between px-4"
        style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 }}
      >
        <View className="gap-2">
          <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
            @ui-sdk/core position() — RN 구동
          </Text>
          <Text className="font-sans text-xs leading-5 text-muted-foreground">
            Vercel UI SDK가 좌표를 계산하고 RN View가 측정(measureInWindow)과
            렌더를 맡아요. 앵커를 눌러 보세요.
          </Text>
          <Pressable
            ref={topAnchorRef}
            className="mt-3 self-start rounded-xl bg-primary px-4 py-3 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="위쪽 앵커 팝업 열기"
            onPress={() => openAt("top")}
          >
            <Text className="font-sans text-sm font-semibold text-primary-foreground">
              팝업 열기 — 위쪽 앵커
            </Text>
          </Pressable>
        </View>

        <Pressable
          ref={bottomAnchorRef}
          className="self-start rounded-xl bg-primary px-4 py-3 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="아래쪽 앵커 팝업 열기"
          onPress={() => openAt("bottom")}
        >
          <Text className="font-sans text-sm font-semibold text-primary-foreground">
            팝업 열기 — 아래쪽 앵커(플립 예상)
          </Text>
        </Pressable>
      </View>

      {open ? (
        <View
          ref={popupRef}
          className="absolute rounded-2xl border border-border bg-card p-3"
          style={{
            left: placed ? placed.left : 0,
            top: placed ? placed.top : 0,
            width: POPUP_WIDTH,
            height: POPUP_HEIGHT,
            opacity: placed ? 1 : 0,
          }}
        >
          <Text className="font-sans text-sm font-semibold text-foreground">
            ui-sdk가 배치한 팝업
          </Text>
          {placed ? (
            <Text className="mt-1 font-sans text-xs leading-4 text-muted-foreground">
              data-side={placed.side} · data-align={placed.align}{"\n"}
              left {Math.round(placed.left)} · top {Math.round(placed.top)}
            </Text>
          ) : (
            <Text className="mt-1 font-sans text-xs text-muted-foreground">
              측정 중…
            </Text>
          )}
          <Pressable
            className="absolute right-2 top-2 rounded-md px-2 py-1 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="팝업 닫기"
            onPress={close}
          >
            <Text className="font-sans text-xs font-semibold text-muted-foreground">
              닫기
            </Text>
          </Pressable>
        </View>
      ) : null}

      {error ? (
        <View
          className="absolute inset-x-4 bottom-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3"
          style={{ marginBottom: insets.bottom + 4 }}
        >
          <Text className="font-sans text-xs font-semibold text-foreground">
            계약 어댑터 실패
          </Text>
          <Text className="mt-1 font-sans text-[11px] leading-4 text-muted-foreground">
            {error}
          </Text>
        </View>
      ) : placed ? (
        <View
          className="absolute inset-x-4 bottom-4 gap-1 rounded-2xl border border-border/60 bg-muted/40 p-3"
          style={{ marginBottom: insets.bottom + 4 }}
        >
          <Text className="font-sans text-xs font-semibold text-foreground">
            계산 근거(실측 → ui-sdk 계산)
          </Text>
          <Text className="font-sans text-[11px] leading-4 text-muted-foreground">
            앵커 rect x{Math.round(placed.anchorRect.left)} y
            {Math.round(placed.anchorRect.top)} ·{" "}
            {Math.round(placed.anchorRect.width)}×
            {Math.round(placed.anchorRect.height)} · sideOffset {SIDE_OFFSET}
          </Text>
          {placed.writes.slice(0, 6).map((line) => (
            <Text
              key={line}
              className="font-sans text-[11px] leading-4 text-muted-foreground"
            >
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
