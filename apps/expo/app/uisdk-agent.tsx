// 에이전트 브리지 참조 화면(에픽 #35 «다 go» 로드맵 — 2026-11-22 «DOM을
// 얇게» 방향 제품화). @ui-sdk/core의 에이전트 계약(createAgent — 페이지의
// 프리미티브를 발견·라벨로 지정·act로 조작·subscribe로 관찰)을 RN에서
// 그대로 구동해요. 진입점 @unikit-bridge/ui/behaviors/ui-sdk-agent가 최소
// 가상 DOM(문서 스텁 + SdkElement 에이전트 모드)을 깔면, 이 화면의
// useSdkPrimitive 인스턴스가 커널 감시자에 자동 등록돼요.
//
// 핵심 실측 계약(probe (8) — packages/unikit/scripts/ui-sdk-contract-probe.ts):
//   - 인스턴스 생성·bind → agent.snapshot()에 ref·component·label·actions로
//     노출(라벨은 접근명 — useSdkPart가 커밋된 props의 aria-label/
//     accessibilityLabel을 심어요)
//   - act({steps:[{ref:"라벨", action, args}]}) — 라벨로 대상을 찾아 상태
//     변경(toggle은 setPressed, button은 press)
//   - subscribe — 변경 통지의 source가 "agent"로 구분돼요
// 기기 실증 완료(2026-11-23 — 에뮬레이터 390×844dp): 초기 snapshot 등록
// (toggle-2 «공지 알림»·button-1 «저장") → 2단계 act(tap → setPressed) →
// 사람 터치가 onPressedChange(false)로 source 구분 반영 — probe (8)과
// 기기 양측 통과(docs/sdd/issue-39 문서 §4 같은 세션 기록).
import * as React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "@unikit-bridge/ui/primitives";

import { button } from "@ui-sdk/core/button";
import { toggle } from "@ui-sdk/core/toggle";
import type { AgentComponent } from "@ui-sdk/core/agent";
import {
  useSdkPart,
  useSdkPrimitive,
} from "@unikit-bridge/ui/behaviors/ui-sdk-renderer";
import { createSdkAgent } from "@unikit-bridge/ui/behaviors/ui-sdk-agent";

// core 문서 계약 — «렌더 전에 만들라»: 모듈 스코프에서 한 번. 이후 이
// 화면에서 만들어지는 프리미티브 인스턴스가 자동 등록돼요.
const agent = createSdkAgent();

/** 에이전트가 보는 토글 — 접근명 «공지 알림»이 act의 ref 대상이 돼요 */
function AgentToggleRow({ onLog }: { onLog: (line: string) => void }) {
  const instance = useSdkPrimitive(toggle, {
    onPressedChange: (pressed) => {
      onLog(`사람 터치 onPressedChange(${String(pressed)})`);
    },
  });
  const root = useSdkPart(instance, "root");
  if (!root.showing) return null;
  const pressed = root.snapshot.pressed === true;
  return (
    <Pressable
      accessibilityLabel="공지 알림"
      className={`h-12 flex-row items-center justify-center rounded-xl border px-4 ${
        pressed ? "border-primary bg-primary/10" : "border-border bg-background"
      }`}
      accessibilityRole={root.bridgeProps.accessibilityRole as "button" | undefined}
      aria-pressed={root.bridgeProps["aria-pressed"]}
      onPress={root.press}
    >
      <Text className="font-sans text-sm font-semibold text-foreground">
        공지 알림 — {pressed ? "on" : "off"}(터치로도)
      </Text>
    </Pressable>
  );
}

/** 에이전트가 누르는 버튼 — act press가 action 상태기계(pending)를 돌려요 */
function AgentButtonRow() {
  const instance = useSdkPrimitive(button, {
    action: () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 600);
      }),
  });
  const root = useSdkPart(instance, "root");
  if (!root.showing) return null;
  const pending = root.snapshot.pending === true;
  return (
    <Pressable
      accessibilityLabel="저장"
      className={`h-12 flex-row items-center justify-center rounded-xl border px-4 ${
        pending ? "border-primary/60 bg-muted" : "border-border bg-background"
      }`}
      accessibilityRole={root.bridgeProps.accessibilityRole as "button" | undefined}
      disabled={root.bridgeProps.disabled}
      onPress={root.press}
    >
      <Text className="font-sans text-sm font-semibold text-foreground">
        {pending ? "저장 중…(agent가 눌렀어요)" : "저장(사람도 눌러요)"}
      </Text>
    </Pressable>
  );
}

export default function UisdkAgent() {
  const insets = useSafeAreaInsets();
  const [log, setLog] = React.useState<string[]>([]);
  const [snap, setSnap] = React.useState<AgentComponent[]>([]);
  const pushLog = React.useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 6));
  }, []);

  const refresh = React.useCallback(() => {
    setSnap(agent.snapshot());
  }, []);

  // 에이전트가 만든 변화를 사람 터치와 구분해 기록해요(source 계약).
  React.useEffect(
    () =>
      agent.subscribe((change) => {
        pushLog(
          `${String(change.source)} → ${String(change.component)}.${String(change.key)}=${JSON.stringify(change.value)}`,
        );
        refresh();
      }),
    [pushLog, refresh],
  );
  React.useEffect(refresh, [refresh]);

  const runAct = React.useCallback(async () => {
    const mine = agent.snapshot().find((row) => row.label === "공지 알림");
    const next = mine?.pressed !== true;
    const result = await agent.act({
      steps: [
        { ref: "공지 알림", action: "setPressed", args: [next] },
        { ref: "저장", action: "press" },
      ],
    });
    pushLog(result.ok ? "act 2단계 ok" : `act 실패: ${JSON.stringify(result.error)}`);
  }, [pushLog]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-6"
    >
      {/* 브리지 ScrollView는 contentContainerClassName만 받아요 — 안전 영역
          여백은 콘텐츠 양끝 스페이서 View로(uisdk 화면 관례). */}
      <View style={{ height: insets.top + 20 }} />
      <Text className="font-sans text-xl font-bold tracking-tight text-foreground">
        에이전트 브리지 — 가상 DOM으로 AI 계약 구동
      </Text>
      <Text className="font-sans text-sm leading-5 text-foreground">
        ui-sdk의 에이전트(createAgent)가 최소 가상 DOM 위에서 이 화면의
        프리미티브를 발견해요. act 단추는 «라벨로 대상을 찾아 상태를 바꾸는»
        흐름이에요 — 토글 전환 + 저장 press 2단계.
      </Text>
      <AgentToggleRow onLog={pushLog} />
      <AgentButtonRow />
      <View className="flex-row gap-2">
        <Pressable
          accessibilityLabel="agent act 2단계 실행"
          className="h-11 flex-1 flex-row items-center justify-center rounded-xl bg-primary px-4 active:opacity-85"
          onPress={runAct}
        >
          <Text className="font-sans text-sm font-semibold text-primary-foreground">
            agent.act — 알림 전환 + 저장 press
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="snapshot 다시 읽기"
          className="h-11 flex-row items-center justify-center rounded-xl border border-border px-4 active:bg-muted/50"
          onPress={refresh}
        >
          <Text className="font-sans text-sm font-semibold text-foreground">
            snapshot
          </Text>
        </Pressable>
      </View>
      <View className="gap-1">
        <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          agent.snapshot() — 등록된 프리미티브
        </Text>
        {snap.length === 0 ? (
          <Text className="font-sans text-sm text-muted-foreground">(비어 있음)</Text>
        ) : (
          snap.map((row) => (
            <Text key={row.ref} className="font-sans text-xs leading-4 text-muted-foreground">
              {row.ref} · {row.component}
              {row.label ? ` · «${row.label}»` : ""} · [{row.actions.join(", ")}]
            </Text>
          ))
        )}
      </View>
      <View className="gap-1">
        <Text className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          변화 기록(subscribe — 사람/agent 구분)
        </Text>
        {log.length === 0 ? (
          <Text className="font-sans text-sm text-muted-foreground">
            (아직 이벤트 없음)
          </Text>
        ) : (
          log.map((line, i) => (
            <Text key={`${line}-${i}`} className="font-sans text-sm leading-5 text-foreground">
              {line}
            </Text>
          ))
        )}
      </View>
      <View style={{ height: insets.bottom + 24 }} />
    </ScrollView>
  );
}
