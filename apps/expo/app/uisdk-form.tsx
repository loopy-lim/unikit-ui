// M2-③ 입력·폼 유형 첫 슬라이스 참조 화면(에픽 #35 «다 go» 로드맵, 이슈 #40).
// ③유형의 핵심은 ElementInternals 등가 표면이에요 — 실측하면 커널은
// 폼 인터널을 직접 요구하지 않고(WeakMap 조회 — 빈 값 = 일반 요소),
// ① HTML* 브랜드 글로벌(instanceof가 정확히 false), ② value 프로토타입
// 접근자(watchValue intercept·writeValue asUser), ③ 요소 이벤트 레지스트리
// (on(el,"input") → typed), ④ 폼 모드 연결(elements() bound 필터 —
// element("control") 조회)을 요구해요. 전부 렌더러 진입점이 채웠어요.
//
// 화면 구성:
//   - field 데모 — label·description·error·control 4슬롯 해부. 외부
//     invalid(options.invalid)가 에러 상태기계를 구동해요(DOM 발견 기반
//     validity는 가상 트리가 없어 항상 비어요 — 커널 계약 그대로).
//     label press → activate(커널 파트 레지스트리) → TextInput 포커스.
//   - input 데모 — 비제어 value 상태기계. 타이핑은 typeSdkValue(네이티브
//     입력 등가 — 프로토타입 setter + input 이벤트 → typed → change)로
//     주입하고, api.setValue/clear가 요소 값을 되동기해요.
//
// 경계(v1 — 이슈 #40 선언): label `for` 속성은 isLabelable 브랜드 경계로
// 생략(활성화는 press 경로). form 제출·reset 실물·DOM validity는 폼 요소가
// 없어 리스너 등록만 성립. 슬롯 실측·경성 검사는 프로브 (10)가 상시 재현.
//
// 기기 실증(2026-11-23, 에뮬레이터 390×844dp): field 5슬롯·label press →
// 커널 activate → TextInput 포커스 ✓, 외부 invalid 토글 켜/끔 → error
// revealed/소거·data-invalid 표시/없음 ✓, 타이핑 → onValueChange 이유
// input-change·state.value «rn»·filled true ✓, api.setValue → filled true·
// api.clear → «»/false(이유 imperative) ✓, Metro·logcat 무오류. 이 과정에서
// 두 소비자 계약이 드러났어요 — useSdkPart의 sdkElement는 바인딩 후 재렌더를
// 유발해야 보이고(렌더러에서 해결), input 값 미러는 onValueChange에서 들고
// must(partState 투영 textState는 value를 노출하지 않아요).
import * as React from "react";
import { TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@unikit-bridge/ui/primitives";

import { field } from "@ui-sdk/core/field";
import { input } from "@ui-sdk/core/input";
import {
  installSdkFormGlobals,
  setSdkElementFormMode,
  typeSdkValue,
  useSdkPart,
  useSdkPrimitive,
  type SdkPrimitiveInstance,
} from "@unikit-bridge/ui/behaviors/ui-sdk-renderer";

// 폼 글로벌은 바인딩보다 먼저 — 모듈 평가 시점에 설치해요. field의
// adopt()가 queueMicrotask에서 브랜드 검사(instanceof HTMLButtonElement)를
// 하는데, 마이크로태스크는 passive useEffect(마운트 시 설치)보다 먼저 흐를
// 수 있어요(기기 실측 — Render Error). 커널 문서의 «모듈 스코프에서 먼저»
// 권장과 같은 이유예요.
installSdkFormGlobals();

export default function UisdkForm() {
  const insets = useSafeAreaInsets();

  // 폼 모드 — 요소 조회(elements() bound 필터)가 성립하고 인스턴스 api가
  // 요소에 닿아요. 마운트에서 켜고 언마운트에서 끄는 경계(팝업 모드와 같은
  // 운영).
  React.useEffect(() => {
    setSdkElementFormMode(true);
    return () => setSdkElementFormMode(false);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View style={{ height: insets.top + 20 }} />
      <View className="flex-1 px-6">
        <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
          입력·폼 — field·input RN 구동
        </Text>
        <Text className="mt-2 font-sans text-sm leading-5 text-foreground">
          ElementInternals 등가 표면(브랜드 글로벌·value 접근자·요소 이벤트
          레지스트리)으로 폼 계열 커널을 구동해요. field는 해부 4슬롯과 외부
          invalid 에러 상태기계, input은 비제어 value 왕복까지.
        </Text>
        <FieldDemo />
        <InputDemo />
      </View>
      <View style={{ height: insets.bottom + 24 }} />
    </View>
  );
}

/** field — label·description·error·control 슬롯 해부 + 외부 invalid. */
function FieldDemo() {
  const [invalid, setInvalid] = React.useState(true);
  const textRef = React.useRef<{ focus?: () => void } | null>(null);

  const instance = useSdkPrimitive(field, { invalid });
  const rootPart = useSdkPart(instance, "root");
  const labelPart = useSdkPart(instance, "label");
  const descriptionPart = useSdkPart(instance, "description");
  const errorPart = useSdkPart(instance, "error");
  const controlPart = useSdkPart(instance, "control");

  const describedBy = controlPart.domAttrs["aria-describedby"] as string | undefined;

  return (
    <View className="mt-8 gap-2">
      <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        field — 5슬롯 해부
      </Text>
      <View className="gap-1.5 rounded-2xl border border-border/60 bg-card p-4">
        {labelPart.showing && (
          <Pressable
            accessibilityLabel="이름 라벨"
            onPress={() => {
              // 커널 activate 경로(파트 레지스트리 → control focus) + 시각
              // 포커스(RN ref) — 가상 focus는 no-op라 화면이 함께 치워요.
              labelPart.press();
              textRef.current?.focus?.();
            }}
          >
            <Text className="font-sans text-sm font-semibold text-foreground">
              이름(label 슬롯 — 눌러 입력에 포커스)
            </Text>
          </Pressable>
        )}
        {descriptionPart.showing && (
          <Text className="font-sans text-xs leading-4 text-muted-foreground">
            description 슬롯 — 등록 즉시 control의 aria-describedby로 조립돼요.
          </Text>
        )}
        <TextInput
          ref={textRef as never}
          accessibilityLabel="이름 입력"
          placeholder="probe-field-control"
          placeholderTextColor="#78716c"
          className="h-11 rounded-xl border border-border bg-background px-3 font-sans text-sm text-foreground"
        />
        {errorPart.showing && (
          <Text className="font-sans text-xs font-medium leading-4 text-destructive">
            error 슬롯 — 외부 invalid가 에러를 드러내요(revealed).
          </Text>
        )}
        <Pressable
          accessibilityLabel="외부 invalid 토글"
          className="mt-1 h-9 flex-row items-center justify-center rounded-lg border border-border bg-background active:bg-muted/50"
          onPress={() => setInvalid((prev) => !prev)}
        >
          <Text className="font-sans text-xs font-semibold text-foreground">
            외부 invalid 옵션 — {invalid ? "켜짐" : "꺼짐"}
          </Text>
        </Pressable>
        <Text className="font-sans text-xs leading-4 text-muted-foreground">
          control aria-describedby: {describedBy ?? "(없음)"}
        </Text>
        <Text className="font-sans text-xs leading-4 text-muted-foreground">
          root data-invalid: {(rootPart.snapshot as { invalid?: boolean }).invalid === true ? "표시" : "없음"}
        </Text>
      </View>
    </View>
  );
}

/** input — 비제어 value 상태기계 + api 왕복. */
function InputDemo() {
  const [log, setLog] = React.useState<string[]>([]);
  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 4));
  }, []);

  // 값 미러 — input root 슬롯의 partState 투영(textState)은 filled·disabled·
  // readOnly·required만 노출해요(value는 인스턴스 상태예요). 비제어 커널의
  // 소비자 계약대로 onValueChange에서 화면이 값을 들고 있어요(제어 prop은
  // 이 미러에서 파생). value를 snapshot에서 읽으면 항상 «»라 RN controlled
  // TextInput이 타이핑을 되돌려요(기기 실측).
  const [value, setValue] = React.useState("");
  const instance = useSdkPrimitive(input, {
    onValueChange: (next: string, details: { reason: string }) => {
      setValue(next);
      pushLog(`onValueChange("${next}") 이유:${details.reason}`);
    },
  });
  const rootPart = useSdkPart(instance, "root");
  const filled = rootPart.snapshot.filled === true;

  const api = (instance as SdkPrimitiveInstance & {
    api?: {
      getValue: () => string;
      setValue: (value: string) => boolean;
      clear: () => boolean;
    };
  }).api;

  return (
    <View className="mt-8 gap-2">
      <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        input — 비제어 value 상태기계
      </Text>
      <View className="gap-2 rounded-2xl border border-border/60 bg-card p-4">
        <TextInput
          accessibilityLabel="메모 입력"
          placeholder="타이핑하면 커널 change가 흘러요"
          placeholderTextColor="#78716c"
          value={value}
          className="h-11 rounded-xl border border-border bg-background px-3 font-sans text-sm text-foreground"
          onChangeText={(text) => {
            // 네이티브 입력 등가 주입 — 프로토타입 setter + input 이벤트 →
            // typed → change. 직접 value 쓰기는 intercept가 «스크립트 쓰기»로
            // 분류해 change가 오지 않아요(typeSdkValue 계약 주석). 렌더 중
            // ref 대입은 React Compiler가 소거할 수 있어 클로저에서 직접
            // 읽어요(기기 실측 — 대입 소거로 타이핑이 무시됐음).
            const element = rootPart.sdkElement;
            if (element) typeSdkValue(element, text);
          }}
        />
        <View className="flex-row gap-2">
          <Pressable
            accessibilityLabel="프로그램 값 쓰기"
            className="h-9 flex-1 flex-row items-center justify-center rounded-lg border border-border bg-background active:bg-muted/50"
            onPress={() => api?.setValue("프로그램 값")}
          >
            <Text className="font-sans text-xs font-semibold text-foreground">api.setValue</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="값 지우기"
            className="h-9 flex-1 flex-row items-center justify-center rounded-lg bg-primary active:opacity-85"
            onPress={() => api?.clear()}
          >
            <Text className="font-sans text-xs font-semibold text-primary-foreground">api.clear</Text>
          </Pressable>
        </View>
        <Text className="font-sans text-xs leading-4 text-muted-foreground">
          state.value «{value}» · filled {filled ? "true(data-filled '')" : "false"} · 값 길이 {value.length}
        </Text>
        {log.map((line, i) => (
          <Text key={`${line}-${i}`} className="font-sans text-xs leading-4 text-muted-foreground">
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}
