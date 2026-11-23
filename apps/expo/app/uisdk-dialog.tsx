// M2-⑥ modality 유형 참조 화면(에픽 #35 «다 go» 로드맵). layers.js는
// `doc.defaultView`가 없으면 듣지 않았어요(no-op 반환) — 창·문서가 실 이벤트
// 대상(installSdkEventGlobals)이 되면서 M2-②가 남긴 «바깥누름·ESC 벽»이
// 내려와요. 모달 다이얼로그의 전 계약을 화면에서 구동해요:
//
//   - 개방(터치) — 문서 pointerdown이 modality에 마지막 포인터를 기록 →
//     trigger click → 초점 계획 «popup» → 콘텐츠 자신에 포커스
//   - 스크롤 잠금 — documentElement.style overflow hidden(+ --scrollbar-width
//     0px). 해제는 콘텐츠 «언마운트»에 묶여 있어요(웹의 exit 수명과 같음)
//   - Tab 트랩 — tabbable이 없으면 콘텐츠에 유지·preventDefault
//   - Escape — close 요소 keydown → 문서 리스너 → 레이어 onEscape →
//     닫힘(escape-key)
//   - 바깥누름(터치) — 창 pointerdown(대기) → click(10px 이내)에서 닫힘
//   - 안쪽 누름 — composedHops(parentElement 체인)의 contains로 «안» 판정
//
// 좌표 참고: bridge Pressable의 onPress는 이벤트를 주지 않아요 — 발송의
// 좌표는 고정값을 써요. 창 이벤트의 좌표는 «pointerdown·click의 10px 근접»과
// 스크롤바 브랜드 판정에만 쓰여요(안/밖은 target의 요소 연결로 정해짐 —
// 프로브 (13) 실측).
//
// 기기 실증(2026-11-23, 에뮬레이터 390×844dp, 클린 재시작): 터치 개방 →
// open·trigger-press·초점 «콘텐츠»·잠금 overflow hidden ✓, Tab 트랩 → 콘텐츠
// 유지 ✓, Escape → 닫힘(escape-key)·언마운트 후 잠금 해제·returnFocus ✓,
// 바깥누름(뒷면 press) → outside-press ✓, close press → close-press ✓,
// Metro·logcat 무오류.
//
// 계약(실측): ① 오버레이(inset-0)는 «남은 높이를 차지하는 컨테이너» 직속이어야
// 전체 화면을 덮어요 — auto 높이 스택 안의 flex-1은 0으로 붕괴하고 inset-0도
// 카드 영역만 덮어요(바깥누름 실종). ② 포커스·잠금 판독은 마이크로태스크/rAF
// 흐름 뒤에 정착해요 — 표시 직전 값이 아니라 폴링 판독으로 검증해요.
import * as React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@unikit-bridge/ui/primitives";

import { dialog } from "@ui-sdk/core/dialog";
import {
  SdkDocument,
  dispatchSdkDocumentEvent,
  dispatchSdkWindowEvent,
  fireSdkEvent,
  installSdkEventGlobals,
  setSdkElementFocusMode,
  setSdkElementPopupMode,
  setSdkRect,
  useSdkPart,
  useSdkPrimitive,
  type SdkPrimitiveInstance,
} from "@unikit-bridge/ui/behaviors/ui-sdk-renderer";

installSdkEventGlobals();

/** 콘텐츠 서브트리 — 열림 동안만 마운트돼요(웹의 마운트/언마운트 수명).
 *  안쪽 슬롯(title·description·close)의 요소를 콘텐츠 요소에 연결하면
 *  composedHops → contains로 «안» 판정이 성립해요. */
function ContentTree({
  instance,
  onAction,
}: {
  instance: SdkPrimitiveInstance;
  onAction: () => void;
}) {
  const content = useSdkPart(instance, "content");
  const title = useSdkPart(instance, "title");
  const description = useSdkPart(instance, "description");
  const close = useSdkPart(instance, "close");
  const backdrop = useSdkPart(instance, "backdrop");

  const viewRef = React.useRef<{ measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void } | null>(null);

  React.useLayoutEffect(() => {
    const contentEl = content.sdkElement;
    if (!contentEl) return;
    // 가상 트리 연결 — 안쪽 누름 판정(composedHops)의 고리.
    for (const part of [title, description, close]) {
      const el = part.sdkElement;
      if (el) el.parentElement = contentEl;
    }
    viewRef.current?.measureInWindow((x, y, w, h) => {
      if (w > 0) setSdkRect(contentEl, x, y, w, h);
    });
  }, [content.sdkElement, title.sdkElement, description.sdkElement, close.sdkElement]);

  const overflowAt = () => SdkDocument.documentElement.style.getPropertyValue("overflow");
  const [readout, setReadout] = React.useState("측정 중");
  // 포커스·잠금은 마이크로태스크/rAF 흐름 뒤에 도착해요 — 표시 직전 값이 아니라
  // 짧은 폴링으로 «정착 후» 값을 판독해요(검증 화면의 계측).
  React.useEffect(() => {
    const read = () => {
      const active = SdkDocument.activeElement;
      const label =
        active === content.sdkElement
          ? "콘텐츠"
          : active === close.sdkElement
            ? "닫기"
            : active
              ? "(다른 요소)"
              : "(없음)";
      setReadout(`포커스: ${label} · 잠금 overflow «${overflowAt()}»`);
    };
    read();
    const timer = setInterval(read, 400);
    return () => clearInterval(timer);
  }, [content.sdkElement, close.sdkElement]);

  const closePress = () => {
    const el = close.sdkElement;
    if (!el) return;
    // 안쪽 누름(마우스 경로) — 창 pointerdown/up을 거치고 click으로 닫아요
    // (close-press). 프로브 (13)의 안쪽 누름과 같은 순서.
    dispatchSdkWindowEvent("pointerdown", {
      pointerType: "mouse",
      pointerId: 3,
      button: 0,
      buttons: 1,
      clientX: 100,
      clientY: 100,
      target: el,
    });
    dispatchSdkWindowEvent("pointerup", {
      pointerType: "mouse",
      pointerId: 3,
      button: 0,
      buttons: 0,
      clientX: 100,
      clientY: 100,
      target: el,
    });
    fireSdkEvent(el, "click", { detail: 1 });
    onAction();
  };

  return (
    <View className="absolute inset-0 items-center justify-center">
      {backdrop.showing ? (
        <Pressable
          accessibilityLabel="다이얼로그 뒷면(바깥누름)"
          className="absolute inset-0 bg-black/50"
          onPress={() => {
            // 바깥누름(터치) — 창 pointerdown은 대기, click(10px 이내)에서
            // 닫아요(outside-press). target null = 콘텐츠 밖.
            dispatchSdkWindowEvent("pointerdown", {
              pointerType: "touch",
              pointerId: 2,
              button: 0,
              isPrimary: true,
              clientX: 10,
              clientY: 10,
              target: null,
            });
            dispatchSdkWindowEvent("click", {
              pointerType: "touch",
              detail: 1,
              button: 0,
              clientX: 12,
              clientY: 12,
              target: null,
            });
            onAction();
          }}
        />
      ) : null}
      <View
        ref={viewRef}
        accessibilityLabel="다이얼로그 콘텐츠"
        className="w-80 gap-3 rounded-2xl border border-border bg-background p-5"
      >
        <Text className="font-sans text-base font-bold text-foreground">모달 제목(title 슬롯)</Text>
        <Text className="font-sans text-xs leading-4 text-muted-foreground">
          열림 동안 스크롤이 잠기고 Tab·Escape가 레이어에 갇혀요. {readout}
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityLabel="Tab 키 보내기"
            className="h-9 flex-1 items-center justify-center rounded-lg border border-border active:bg-muted/50"
            onPress={() => {
              const el = content.sdkElement;
              if (el) fireSdkEvent(el, "keydown", { key: "Tab" });
              onAction();
            }}
          >
            <Text className="font-sans text-xs font-semibold text-foreground">Tab</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Escape 키 보내기"
            className="h-9 flex-1 items-center justify-center rounded-lg border border-border active:bg-muted/50"
            onPress={() => {
              const el = close.sdkElement;
              if (el) fireSdkEvent(el, "keydown", { key: "Escape" });
              onAction();
            }}
          >
            <Text className="font-sans text-xs font-semibold text-foreground">Escape</Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel="다이얼로그 닫기"
          className="h-10 items-center justify-center rounded-lg bg-primary active:opacity-85"
          onPress={closePress}
        >
          <Text className="font-sans text-xs font-semibold text-primary-foreground">닫기(close 슬롯 press)</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DialogDemo() {
  const [log, setLog] = React.useState<string[]>([]);
  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 5));
  }, []);
  const [open, setOpen] = React.useState(false);
  const [, bump] = React.useReducer((c: number) => c + 1, 0);

  const instance = useSdkPrimitive(dialog, {
    onOpenChange: (next: boolean, details?: { reason: string }) => {
      setOpen(next);
      pushLog(`onOpenChange(${String(next)})${details ? ` 이유:${details.reason}` : ""}`);
    },
  });
  const trigger = useSdkPart(instance, "trigger");

  // 개방(터치) — 문서 pointerdown이 modality에 «터치»를 기록하고 click의
  // 초점 계획이 «popup»이 돼요(콘텐츠 자신에 포커스). 프로브 (13)과 같은 순서.
  const openPress = () => {
    const el = trigger.sdkElement;
    if (!el) return;
    dispatchSdkDocumentEvent("pointerdown", {
      pointerType: "touch",
      pointerId: 1,
      button: 0,
      isPrimary: true,
      clientX: 20,
      clientY: 20,
    });
    fireSdkEvent(el, "click", { detail: 1 });
    // 초점 계획은 콘텐츠 마운트와 맞물려 흘러요 — 판독 갱신.
    setTimeout(bump, 150);
  };

  const overlay = open ? <ContentTree instance={instance} onAction={() => setTimeout(bump, 150)} /> : null;

  return (
    <View className="flex-1">
      <View className="gap-2">
        <Text className="font-sans text-base font-bold text-foreground">DIALOG — modality 레이어</Text>
        <Pressable
          accessibilityLabel="다이얼로그 열기"
          className="h-11 items-center justify-center rounded-xl bg-primary active:opacity-85"
          onPress={openPress}
        >
          <Text className="font-sans text-sm font-semibold text-primary-foreground">
            {open ? "열림(트리거)" : "다이얼로그 열기(터치 개방)"}
          </Text>
        </Pressable>
        <Text className="font-sans text-xs leading-4 text-muted-foreground">
          open {String(open)} · 잠금 overflow «{SdkDocument.documentElement.style.getPropertyValue("overflow")}» · 포커스{" "}
          {SdkDocument.activeElement ? "있음" : "(없음)"}
        </Text>
        {log.map((line, i) => (
          <Text key={`${line}-${i}`} className="font-sans text-xs leading-4 text-muted-foreground">
            {line}
          </Text>
        ))}
      </View>
      {/* 오버레이는 화면 루트(flex-1) 직속 — 절대 위치 inset-0가 「카드가 아닌
          전체 화면」을 덮어야 바깥누름 뒷면이 성립해요(auto 높이 스택 안에
          두면 카드 영역만 덮어요 — 실측). */}
      {overlay}
    </View>
  );
}

export default function UisdkDialog() {
  const insets = useSafeAreaInsets();

  // 팝업+포커스 모드 — 레이어 요소 조회·초점 계획이 연결을 읽어요.
  React.useEffect(() => {
    setSdkElementPopupMode(true);
    setSdkElementFocusMode(true);
    return () => {
      setSdkElementPopupMode(false);
      setSdkElementFocusMode(false);
    };
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View style={{ height: insets.top + 20 }} />
      <View className="flex-1 px-6">
        <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
          modality — dialog RN 구동
        </Text>
        <Text className="mt-1 font-sans text-xs leading-4 text-muted-foreground">
          창·문서가 실 이벤트 대상이 되면서 바깥누름·Escape·Tab 트랩·스크롤 잠금이
          커널 레이어에서 돌아요.
        </Text>
        {/* mt-6 flex-1 — 오버레이(inset-0)의 절대 좌표 기준이 화면 전체가
            되도록 이 컨테이너가 남은 높이를 차지해요(flex-1은 auto 높이 부모에선
            0으로 붕괴 — 실측). */}
        <View className="mt-6 flex-1">
          <DialogDemo />
        </View>
      </View>
    </View>
  );
}
