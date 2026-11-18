// 스파이크 화면 — 키보드·모달리티 벽 재실측(이슈 #19). 검증 후 제거해도 좋아요.
//
// 시험하는 것(Android 하드웨어 키보드·DPAD — 에뮬레이터 keyevent 주입):
// 1. 브리지 View onKeyDown의 Android 연결 — RN 0.88 코어 JSKeyDispatcher가
//    「포커스된 focusable 뷰」에 W3C 규격 topKeyDown을 발화하고, React
//    버블링으로 조상 카드 핸들러가 수신하는가(메뉴 카드 roving 패턴).
// 2. 이벤트 모양 — key(DPAD→Arrow*)·수정자 4종이 네이티브 실측값으로
//    BridgeKeyEvent을 채우는가(TextInput onKeyPress의 시프트 근사와 다른 점).
// 3. toSdkKeyEvent → isTypeaheadKey — 실측 이벤트가 ui-sdk 헬퍼를 통과하는가.
// 4. 포커스 roving — BridgePressableRef.focus() 이동과 DPAD 네이티브 포커스
//    이동의 상호작용(스파이크 채점 대상 — 이중 이동 여부).
//
// 경계(문서화 — docs/sdd/issue-19-keyboard-modality-wall.md):
// - iOS는 RN 코어에 일반 View 키 계약이 없다(브리지 폐기 유지).
// - 전역(document) 수준 수신은 양 플랫폼 다 없다 — ui-sdk modality.ts는
//   웹 전용 유지(#18 판정과 정합).
// - 소프트 키보드에 방향키는 없다 — 터치가 1차 UX.
import { useCallback, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Pressable,
  Text,
  View,
  type BridgeKeyEvent,
  type BridgePressableRef,
} from "@unikit-bridge/ui/primitives";
import { isTypeaheadKey, toSdkKeyEvent } from "@unikit-bridge/ui/behaviors/ui-sdk";

const ITEMS = ["첫 항목 — alpha", "둘째 항목 — beta", "셋째 항목 — gamma"];

export default function UisdkKeys() {
  const insets = useSafeAreaInsets();
  const itemRefs = useRef<Array<BridgePressableRef | null>>([]);
  const focusedRef = useRef<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const focusItem = useCallback((index: number) => {
    // 콜백 ref로 등록한 node 자체가 BridgePressableRef(인스턴스)다 —
    // focus는 선택 계약이므로 가드로 호출한다.
    itemRefs.current[index]?.focus?.();
  }, []);

  const handleKeyDown = useCallback((event: BridgeKeyEvent) => {
    // 실측 이벤트 모양과 ui-sdk 헬퍼 통과 판정을 로그로 남긴다.
    const flags = [
      event.ctrlKey ? "c1" : "c0",
      event.altKey ? "a1" : "a0",
      event.metaKey ? "m1" : "m0",
      event.shiftKey ? "s1" : "s0",
    ].join(" ");
    setLog((prev) =>
      [
        `key="${event.key}" ${flags} typeahead=${String(
          isTypeaheadKey(toSdkKeyEvent(event)),
        )}`,
        ...prev,
      ].slice(0, 6),
    );

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation?.();
      const dir = event.key === "ArrowDown" ? 1 : -1;
      const current = focusedRef.current;
      // 포커스 없는 첫 입력은 웹 관례를 따른다 — Down은 첫 항목, Up은
      // 마지막 항목에 착지(센티널 산술로 둘째 항목에 빠지지 않게).
      const next =
        current === null
          ? event.key === "ArrowDown"
            ? 0
            : ITEMS.length - 1
          : (current + dir + ITEMS.length) % ITEMS.length;
      focusItem(next);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const current = focusedRef.current;
      if (current !== null) setSelected(ITEMS[current]!);
    }
  }, [focusItem]);

  return (
    <View
      className="flex-1 bg-background px-6 gap-4"
      style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}
    >
      <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
        키보드 벽 스파이크 — View onKeyDown(Android)
      </Text>
      <Text className="font-sans text-sm leading-5 text-foreground">
        첫 항목에 포커스를 준 뒤 하드웨어 키(DPAD·방향키·문자)를 누르면 조상
        카드 핸들러가 버블링으로 수신해요. 방향키는 포커스 roving, Enter는
        선택으로 채점합니다.
      </Text>

      <Pressable
        onPress={() => focusItem(0)}
        className="rounded-xl border border-border bg-card px-4 py-3 active:bg-muted/50"
        accessibilityLabel="첫 항목에 포커스"
      >
        <Text className="font-sans text-sm font-semibold text-foreground">
          첫 항목에 포커스(하드웨어 키 시험 시작)
        </Text>
      </Pressable>

      {/* 메뉴 카드 패턴 — 조상 View onKeyDown이 자손 포커스 시 키를 받는다 */}
      <View
        onKeyDown={handleKeyDown}
        className="rounded-2xl border border-border bg-card p-2 gap-1"
      >
        {ITEMS.map((label, index) => (
          <Pressable
            key={label}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            focusable
            onKeyDown={
              (event) => {
                // 대상(포커스된 뷰 자신) 레벨 수신 대조 — 조상 버블링과 구분한다.
                setLog((prev) =>
                  [`[item] key="${event.key}" (대상 레벨)`, ...prev].slice(0, 6),
                );
              }
            }
            onFocus={() => {
              focusedRef.current = index;
              setFocusedIndex(index);
            }}
            onBlur={() => {
              if (focusedRef.current === index) focusedRef.current = null;
              setFocusedIndex((cur) => (cur === index ? null : cur));
            }}
            onPress={() => setSelected(label)}
            className={
              focusedIndex === index
                ? "rounded-xl border border-primary bg-muted px-4 py-3"
                : "rounded-xl border border-transparent px-4 py-3"
            }
            accessibilityLabel={label}
          >
            <Text className="font-sans text-sm text-foreground">{label}</Text>
            <Text className="font-sans text-xs text-muted-foreground">
              {focusedIndex === index ? "포커스 — 방향키·Enter 반응" : "focusable 항목"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="font-sans text-sm text-foreground">
        마지막 선택: {selected ?? "(없음)"}
      </Text>

      <View className="gap-1">
        <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          이벤트 로그(최근 6)
        </Text>
        {log.length === 0 ? (
          <Text className="font-sans text-xs text-muted-foreground">
            아직 이벤트가 없어요 — 포커스 버튼을 누르고 하드웨어 키를 입력하세요.
          </Text>
        ) : (
          log.map((line, index) => (
            <Text
              key={`${line}-${index}`}
              className="font-sans text-xs leading-5 text-muted-foreground"
            >
              {line}
            </Text>
          ))
        )}
      </View>

      <Text className="font-sans text-xs leading-5 text-muted-foreground">
        경계: iOS는 RN 코어에 일반 View 키 계약이 없어 폐기 유지 · 전역(document)
        수준 수신은 양 플랫폼 다 없음(ui-sdk modality는 웹 전용) · 소프트 키보드엔
        방향키가 없어 터치가 1차 UX — docs/sdd/issue-19-keyboard-modality-wall.md
      </Text>
    </View>
  );
}
