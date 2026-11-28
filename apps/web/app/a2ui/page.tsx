"use client";

import { useEffect, useMemo, useState } from "react";
import {
  A2UI_DEMO_MESSAGES,
  createA2uiProcessor,
  UnikitA2uiSurface,
  useA2uiSurfaces,
} from "@unikit-bridge/ui/a2ui";
import { createUnikitCatalogWithExtras } from "@unikit-bridge/ui/a2ui/optional";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

type ActionEvent = {
  name: string;
  sourceComponentId: string;
  at: number;
};

export default function A2uiPage() {
  const [actions, setActions] = useState<ActionEvent[]>([]);
  const processor = useMemo(
    () =>
      createA2uiProcessor([createUnikitCatalogWithExtras({ extras: ["chart"] })], {
        onAction: (action) => {
          setActions((prev) =>
            [
              {
                name: action.name,
                sourceComponentId: action.sourceComponentId,
                at: Date.now(),
              },
              ...prev,
            ].slice(0, 8),
          );
        },
      }),
    [],
  );
  const surfaces = useA2uiSurfaces(processor);
  const [simulated, setSimulated] = useState(0);

  useEffect(() => {
    processor.process(A2UI_DEMO_MESSAGES);
    return () => processor.dispose();
  }, [processor]);

  function simulateAgentUpdate() {
    const next = simulated + 1;
    setSimulated(next);
    processor.process([
      {
        version: "1.0",
        updateDataModel: {
          surfaceId: "demo",
          path: "/counter/value",
          value: next,
        },
      },
    ]);
  }

  return (
    <View className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <View className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          A2UI v1.0
        </Badge>
        <Text className="text-3xl font-semibold text-foreground">
          Agent-to-User Interface 렌더러
        </Text>
        <Text className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          에이전트가 보낸 A2UI 메시지(createSurface·updateComponents·updateDataModel)를
          UniKit UI 62종 컴포넌트로 웹과 React Native에서 같게 렌더링해요. 아래 서피스는
          @unikit-bridge/ui/a2ui/demo 메시지를 처리한 결과예요.
        </Text>
      </View>

      <Card>
        <CardHeader>
          <CardTitle>데모 서피스</CardTitle>
          <CardDescription>
            버튼 액션은 오른쪽 로그에, 에이전트 업데이트는 formatString 바인딩으로 흘러요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <View className="min-w-0 flex-1">
            {surfaces.map((surface) => (
              <UnikitA2uiSurface key={surface.id} surface={surface} />
            ))}
          </View>
          <View className="flex w-full flex-col gap-3 md:w-64">
            <Button variant="outline" onPress={simulateAgentUpdate}>
              에이전트 업데이트 시뮬레이션
            </Button>
            <View className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-3">
              <Text className="text-xs font-medium text-muted-foreground">액션 로그</Text>
              {actions.length === 0 ? (
                <Text className="text-xs text-muted-foreground">아직 발화한 액션이 없어요.</Text>
              ) : (
                actions.map((action) => (
                  <Text key={`${action.at}-${action.name}`} className="font-mono text-xs text-foreground">
                    {action.name} ← {action.sourceComponentId}
                  </Text>
                ))
              )}
            </View>
          </View>
        </CardContent>
      </Card>

      <View className="flex flex-col gap-3">
        <Text className="text-lg font-semibold text-foreground">카탈로그 62종</Text>
        <RosterGrid processor={processor} />
      </View>
    </View>
  );
}

function RosterGrid({
  processor,
}: {
  processor: ReturnType<typeof createA2uiProcessor>;
}) {
  const names = useMemo(() => {
    const collected: string[] = [];
    for (const catalog of processor.processor.catalogs.values()) {
      for (const component of catalog.components.values()) {
        if ("unikit" in component && component.unikit) {
          collected.push(component.name);
        }
      }
    }
    return collected.sort((a, b) => a.localeCompare(b));
  }, [processor]);
  return (
    <View className="flex flex-row flex-wrap gap-1.5">
      {names.map((name) => (
        <Badge key={name} variant="outline">
          {name}
        </Badge>
      ))}
    </View>
  );
}
