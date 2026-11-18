// P3 확장 화면 — position()을 «1회 계산»이 아니라 본래 설계인 «계속 따라가는
// 배치 엔진»으로 RN에서 구동해요. docs/sdd/100 §7 증거(uisdk-position의 다음 단계).
//
// P2와 달라진 것(전부 ui-sdk의 공식 @stable 계약):
// - VirtualAnchor: 노드가 아닌 {x,y}·{getBoundingClientRect} 앵커. position()이
//   rAF 루프를 닫지 않고(unwatched 경로) 매 프레임 앵커를 다시 읽어요.
// - options도 getter로 전달 → 열린 채로 side/align을 바꾸면 다음 프레임에 재배치.
// - arrow 옵션 → 화살표 요소에 offset·data-side 기록(tooltip·popover 핵심).
// - ScrollView onScroll → measureInWindow로 rect 캐시를 제자리 갱신(updateRect)
//   → 스크롤하는 동안 팝업이 앵커를 따라감. 충돌 플립도 매 프레임 재판정.
//
// 이슈 #12 수정(2026-11-18 재실증 후):
// - 팝업의 세계를 visualViewport로 헤더(제목·side/align/닫기 컨트롤) 아래
//   대역으로 알려줘요(bindVisualViewport). 웹에서 키보드가 열려 visualViewport가
//   줄어들면 팝업이 플립되는 것과 같은 계약 — 플립·클램프·available 전부
//   코어가 이 대역 기준으로 판정해 side=top·align=end가 컨트롤을 덮지 않아요.
// - 레이어 분리: 헤더 zIndex 20 > 팝업 zIndex 10. 전환 직후 1프레임 배치
//   지연에 팝업이 대역을 넘어도 컨트롤 hit 영역이 살아 있어요(RN 형제
//   zIndex는 그리기·터치 순서 모두에 적용).
//
// 흐름: 앵커 눌림 → 팝업 투명 렌더(크기 측정) → measureInWindow → position()에
// 앵커 getter·옵션 getter 전달 → rAF 루프 상시 가동 → style/attr 쓰기가
// observer 훅으로 화면 상태에 반영. stop()은 닫을 때만(루프·인터벌 정리).
//
// 보는 포인트:
// - side 버튼 순환: 요청 side대로 붙고, 대역(헤더 아래~화면 끝)이 부족하면
//   ui-sdk가 스스로 플립. 스크롤 앵커는 헤더 바로 아래(위 공간 12dp)라
//   side=top이 즉시 bottom으로 플립돼요(data-side로 확인). 정적 앵커는
//   위 공간이 187dp라 플립 없이 대역 안에 올라가요.
// - align 버튼 순환: start/center/end 정렬이 열린 채로 이동.
// - 화살표: 매 배치마다 앵커 쪽 가장자리에 정렬(computeArrow · --arrow-offset).
// - 스크롤 앵커로 열고 리스트를 스크롤: 팝업이 실시간 추종(쓰기 횟수 증가).
// - 메인 축 공간 부족: SDK는 클램프 대신 --available-width/height를 알려와요.
//   팝업이 그 값을 max 크기로 취하면(웹의 max-width 계약) 화면 안에 온전히 들어와요.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from "react";
import { Dimensions, View as RNView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@unikit-bridge/ui/primitives";

import {
  bindVisualViewport,
  FakeElement,
  installDomStubs,
  pxToNumber,
  rectFrom,
  updateRect,
  type FakeRect,
  type FakeStyle,
} from "@unikit-bridge/ui/behaviors/ui-sdk-dom";
import { position } from "@ui-sdk/core";

installDomStubs();

const POPUP_WIDTH = 224;
const POPUP_HEIGHT = 132;
const SIDE_OFFSET = 8;
const ARROW_SIZE = 12;

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";
type AnchorMode = "static" | "scroll";

const SIDES: Side[] = ["bottom", "top", "right", "left"];
const ALIGNS: Align[] = ["start", "center", "end"];

type Placed = {
  left: number;
  top: number;
  side: string;
  align: string;
  arrowSide: string;
  arrowAlong: number | null;
  availableWidth: number | null;
  availableHeight: number | null;
  writeCount: number;
  anchorRect: FakeRect;
};

type HostView = ComponentRef<typeof RNView>;
type StopHandle = ReturnType<typeof position>;

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

// 스파이크 화면 전용 계측(sdd/100 «디버그 텔레메트리 경계») — 제품 FakeStyle에서
// 쓰기 카운터가 제거됐으므로(PR #27 사후 리뷰 F-1), 화면이 style의 setProperty를
// 감싸 총 쓰기 횟수를 로컬로 세요(추종 중 갱신 빈도 증거).
function countStyleWrites(style: FakeStyle) {
  const log = { writeCount: 0 };
  const setProperty = style.setProperty.bind(style);
  style.setProperty = (key: string, value: string) => {
    log.writeCount += 1;
    setProperty(key, value);
  };
  return log;
}

export default function UisdkPopup() {
  const insets = useSafeAreaInsets();
  const containerRef = useRef<HostView>(null);
  const headerRef = useRef<HostView>(null);
  const staticAnchorRef = useRef<HostView>(null);
  const scrollAnchorRef = useRef<HostView>(null);
  const popupRef = useRef<HostView>(null);

  const [side, setSide] = useState<Side>("bottom");
  const [align, setAlign] = useState<Align>("start");
  const sideRef = useRef<Side>("bottom");
  const alignRef = useRef<Align>("start");

  const [mode, setMode] = useState<AnchorMode | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [error, setError] = useState<string | null>(null);

  // position()이 계속 읽는 살아있는 상자들 — 닫을 때만 해제.
  const anchorRectRef = useRef<FakeRect | null>(null);
  const popupElRef = useRef<FakeElement | null>(null);
  const arrowElRef = useRef<FakeElement | null>(null);
  // 스파이크 화면 전용 쓰기 카운터(위 countStyleWrites) — popupEl과 생명주기 동일.
  const writeCountRef = useRef<{ writeCount: number } | null>(null);
  const stopRef = useRef<StopHandle | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const modeRef = useRef<AnchorMode | null>(null);
  const syncQueued = useRef(false);
  // 팝업 세계의 위 경계(헤더 하단의 창 좌표) — visualViewport getter가 읽어요.
  const contentTopRef = useRef(0);

  // style·attr 쓰기 → (배치 예약) → placed 스냅샷. rAF로 묶어 프레임당 1회.
  const scheduleSync = useCallback(() => {
    if (syncQueued.current) return;
    syncQueued.current = true;
    requestAnimationFrame(() => {
      syncQueued.current = false;
      const popupEl = popupElRef.current;
      const arrowEl = arrowElRef.current;
      const anchorRect = anchorRectRef.current;
      if (!popupEl || !arrowEl || !anchorRect) return;
      const left = pxToNumber(popupEl.style.left);
      const top = pxToNumber(popupEl.style.top);
      if (left === null || top === null) return;
      setPlaced({
        left: left - originRef.current.x,
        top: top - originRef.current.y,
        side: popupEl.attrs["data-side"] ?? "?",
        align: popupEl.attrs["data-align"] ?? "?",
        arrowSide: arrowEl.attrs["data-side"] ?? "?",
        arrowAlong:
          pxToNumber(arrowEl.style.left) ?? pxToNumber(arrowEl.style.top),
        availableWidth: pxToNumber(
          popupEl.style.getPropertyValue("--available-width"),
        ),
        availableHeight: pxToNumber(
          popupEl.style.getPropertyValue("--available-height"),
        ),
        writeCount: writeCountRef.current?.writeCount ?? 0,
        anchorRect,
      });
    });
  }, []);

  const close = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    popupElRef.current = null;
    arrowElRef.current = null;
    anchorRectRef.current = null;
    writeCountRef.current = null;
    modeRef.current = null;
    setMode(null);
    setPlaced(null);
    setError(null);
  }, []);

  // 언마운트(Fast Refresh 포함)에서 rAF 루프·500ms 인터벌이 새어 나가지 않게.
  useEffect(() => close, [close]);

  // 팝업의 세계 = 헤더 아래 대역. position()의 플립·클램프·available가 이
  // 뷰포트 기준으로 판정해요(이슈 #12). 언마운트 시 null(전체 창)로 복구.
  useEffect(
    () =>
      bindVisualViewport(() => {
        const { width, height } = Dimensions.get("window");
        const top = Math.min(Math.max(contentTopRef.current, 0), height);
        return { offsetLeft: 0, offsetTop: top, width, height: height - top };
      }),
    [],
  );

  // 헤더(제목·컨트롤)의 화면상 하단 = 팝업 세계의 위 경계. onLayout마다 갱신.
  // 단 onLayout은 1회성이라 마운트 직후 인셋 레이아웃 과도기(측정이 일찍
  // 와서 헤더가 아직 접혀 있던 순간)의 값을 영원히 붙들 수 있어요(기기
  // 실측: 재마운트 후 대역이 31dp로 잡혀 side=top 팝업이 헤더를 덮음).
  // 그래서 열릴 때마다(openAt) 다시 측정해 값을 교정해요.
  const measureHeader = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const el = headerRef.current;
        if (!el) {
          resolve();
          return;
        }
        el.measureInWindow((_x, y, _width, height) => {
          contentTopRef.current = (y ?? 0) + (height ?? 0);
          resolve();
        });
      }),
    [],
  );

  const openAt = useCallback(
    (nextMode: AnchorMode) => {
      stopRef.current?.();
      stopRef.current = null;
      setPlaced(null);
      setError(null);
      setMode(nextMode);
      modeRef.current = nextMode;
      requestAnimationFrame(() => {
        const anchorRef =
          nextMode === "static" ? staticAnchorRef : scrollAnchorRef;
        Promise.all([
          measure(anchorRef),
          measure(popupRef),
          measure(containerRef),
          measureHeader(),
        ]).then(([anchor, popup, container]) => {
          // 닫기·재개방 사이에 측정이 늦게 오면 과거 요청이 루프를 되살려요.
          if (modeRef.current !== nextMode) return;
          try {
            anchorRectRef.current = anchor;
            originRef.current = { x: container.x, y: container.y };
            const popupEl = new FakeElement("popup", popup);
            const arrowEl = new FakeElement("arrow", rectFrom(0, 0, ARROW_SIZE, ARROW_SIZE));
            popupElRef.current = popupEl;
            arrowElRef.current = arrowEl;
            writeCountRef.current = countStyleWrites(popupEl.style);
            popupEl.style.observer = () => scheduleSync();
            popupEl.attrObserver = () => scheduleSync();
            arrowEl.style.observer = () => scheduleSync();
            arrowEl.attrObserver = () => scheduleSync();
            stopRef.current = position(
              // VirtualAnchor getter — getBoundingClientRect 형태여야 unwatched
              // 경로로 rAF가 상시 유지돼요(plain {x,y}는 stillFrames 후 멈춤).
              () => ({
                getBoundingClientRect: () =>
                  anchorRectRef.current ?? rectFrom(0, 0, 0, 0),
              }),
              popupEl as unknown as HTMLElement,
              // 옵션 getter — 열린 채로 side/align 전환이 다음 프레임에 반영.
              () => ({
                side: sideRef.current,
                align: alignRef.current,
                sideOffset: SIDE_OFFSET,
                arrow: arrowElRef.current as unknown as HTMLElement,
              }),
            );
            scheduleSync();
          } catch (err) {
            console.error("uisdk-popup 실패:", err, (err as Error)?.stack);
            setError(String((err as Error)?.message ?? err));
            close();
          }
        });
      });
    },
    [close, measureHeader, scheduleSync],
  );

  // 스크롤 추종: onScroll마다 앵커 rect를 제자리 갱신. 깨우는 건 position()의
  // rAF 루프(unwatched)가 매 프레임 읽으므로 별도 이벤트 주입이 필요 없어요.
  const followScroll = useCallback(() => {
    if (modeRef.current !== "scroll") return;
    scrollAnchorRef.current?.measureInWindow((x, y, width, height) => {
      if (anchorRectRef.current) {
        updateRect(anchorRectRef.current, x ?? 0, y ?? 0, width ?? 0, height ?? 0);
      }
    });
  }, []);

  const cycleSide = () => {
    const next = SIDES[(SIDES.indexOf(side) + 1) % SIDES.length];
    setSide(next);
    sideRef.current = next;
    stopRef.current?.follow();
  };

  const cycleAlign = () => {
    const next = ALIGNS[(ALIGNS.indexOf(align) + 1) % ALIGNS.length];
    setAlign(next);
    alignRef.current = next;
    stopRef.current?.follow();
  };

  const open = mode !== null;

  // 화살표 위치 — popup의 data-side(실제 펼쳐진 면) 기준으로 앵커 쪽 가장자리.
  const arrowStyle = (() => {
    const along = placed?.arrowAlong ?? 6;
    const half = ARROW_SIZE / 2;
    switch (placed?.side) {
      case "bottom":
        return { left: along - half, top: -half };
      case "top":
        return { left: along - half, bottom: -half };
      case "right":
        return { left: -half, top: along - half };
      case "left":
        return { right: -half, top: along - half };
      default:
        return { left: along - half, top: -half };
    }
  })();

  return (
    <View ref={containerRef} className="flex-1 bg-background">
      {/* 헤더 레이어 — zIndex 20: 전환 1프레임 지연에 팝업이 대역을 넘어도
          side/align/닫기 hit 영역이 이김(그리기 순서도 같이 올라감). */}
      <View
        ref={headerRef}
        onLayout={measureHeader}
        className="gap-3 px-4"
        style={{ paddingTop: insets.top + 20, zIndex: 20 }}
      >
        <View className="gap-1">
          <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
            position() — 지속 추종 팝업
          </Text>
          <Text className="font-sans text-xs leading-5 text-muted-foreground">
            side·align을 열린 채로 바꾸고, 스크롤 앵커로 열면 리스트를 스크롤해
            보세요. 배치·플립·화살표 전부 ui-sdk 코어가 프레임마다 판정해요.
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            className="rounded-lg border border-border bg-muted px-3 py-2 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`side 순환 현재 ${side}`}
            onPress={cycleSide}
          >
            <Text className="font-sans text-xs font-semibold text-foreground">
              side · {side}
            </Text>
          </Pressable>
          <Pressable
            className="rounded-lg border border-border bg-muted px-3 py-2 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`align 순환 현재 ${align}`}
            onPress={cycleAlign}
          >
            <Text className="font-sans text-xs font-semibold text-foreground">
              align · {align}
            </Text>
          </Pressable>
          {open ? (
            <Pressable
              className="rounded-lg bg-primary px-3 py-2 active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="팝업 닫기"
              onPress={close}
            >
              <Text className="font-sans text-xs font-semibold text-primary-foreground">
                닫기
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* 몸통 레이어 — 앵커·리스트(팝업 아래). */}
      <View
        className="flex-1 gap-3 px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Pressable
          ref={staticAnchorRef}
          className="self-start rounded-xl bg-primary px-4 py-3 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="정적 앵커로 팝업 열기"
          onPress={() => openAt("static")}
        >
          <Text className="font-sans text-sm font-semibold text-primary-foreground">
            열기 — 정적 앵커(side 전환·플립 확인)
          </Text>
        </Pressable>

        <ScrollView
          className="flex-1 rounded-2xl border border-border"
          contentContainerClassName="gap-2 p-3"
          onScroll={followScroll}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Text
              key={`top-${i}`}
              className="font-sans text-sm leading-6 text-muted-foreground"
            >
              리스트 항목 {i + 1}
            </Text>
          ))}
          <Pressable
            ref={scrollAnchorRef}
            className="self-start rounded-xl bg-secondary px-4 py-3 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="스크롤 앵커로 팝업 열기"
            onPress={() => openAt("scroll")}
          >
            <Text className="font-sans text-sm font-semibold text-secondary-foreground">
              열기 — 스크롤 앵커(열고 스크롤)
            </Text>
          </Pressable>
          {Array.from({ length: 14 }, (_, i) => (
            <Text
              key={`bottom-${i}`}
              className="font-sans text-sm leading-6 text-muted-foreground"
            >
              리스트 항목 {i + 7}
            </Text>
          ))}
        </ScrollView>
      </View>

      {open ? (
        <View
          ref={popupRef}
          className="absolute rounded-2xl border border-border bg-card p-3"
          // ui-sdk의 리사이즈 계약: 메인 축은 클램프하지 않고 --available-width/height로
          // «콘텐츠가 스스로 줄어들라»고 알려와요(position.js 119-133 — 정렬 축만 클램프).
          // 웹에서는 CSS max-width가 이 일을 해요. RN에서는 시각 크기만 줄이고,
          // FakeElement.rect는 고유 크기(측정값)를 유지해요 — 줄어든 값을 rect에
          // 되먹이면 다음 프레임 available이 0으로 붕괴해 팝업이 사라져요(스크롤 추종 회귀).
          // zIndex 10 — 헤더(20) 아래·몸통 위(이슈 #12 hit 영역 분리).
          style={{
            zIndex: 10,
            left: placed ? placed.left : 0,
            top: placed ? placed.top : 0,
            // available ≤0 은 «공간 없음» 순간값이 아니라 붕괴로 취급 — 고유 크기 유지.
            width: placed
              ? Math.min(
                  POPUP_WIDTH,
                  placed.availableWidth && placed.availableWidth > 0
                    ? placed.availableWidth
                    : POPUP_WIDTH,
                )
              : POPUP_WIDTH,
            height: placed
              ? Math.min(
                  POPUP_HEIGHT,
                  placed.availableHeight && placed.availableHeight > 0
                    ? placed.availableHeight
                    : POPUP_HEIGHT,
                )
              : POPUP_HEIGHT,
            opacity: placed ? 1 : 0,
          }}
        >
          <View
            className="absolute h-3 w-3 rotate-45 border border-border bg-card"
            style={arrowStyle}
          />
          <Text className="font-sans text-sm font-semibold text-foreground">
            ui-sdk 추종 팝업
          </Text>
          {placed ? (
            <Text className="mt-1 font-sans text-[11px] leading-4 text-muted-foreground">
              side={placed.side} · align={placed.align} · 화살표 {placed.arrowSide}
              {"\n"}available w{Math.round(placed.availableWidth ?? 0)} · h{" "}
              {Math.round(placed.availableHeight ?? 0)} · 쓰기 {placed.writeCount}회
              {"\n"}앵커 y{Math.round(placed.anchorRect.top)} → top{" "}
              {Math.round(placed.top)}
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
      ) : null}
    </View>
  );
}
