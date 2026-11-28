import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  A2UI_DEMO_MESSAGES,
  UnikitA2uiSurface,
  createA2uiProcessor,
  useA2uiSurfaces,
} from "@unikit-bridge/ui/a2ui";
import { createUnikitCatalogWithExtras } from "@unikit-bridge/ui/a2ui/optional";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unikit-bridge/ui";
import { ScrollView, Text, View } from "@unikit-bridge/ui/primitives";

type ActionEvent = {
  name: string;
  sourceComponentId: string;
  at: number;
};

export default function A2uiDemoScreen() {
  const [actions, setActions] = useState<ActionEvent[]>([]);
  const [simulated, setSimulated] = useState(0);
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

  useEffect(() => {
    processor.process(A2UI_DEMO_MESSAGES);
    return () => processor.dispose();
  }, [processor]);

  const roster = useMemo(() => {
    const collected: string[] = [];
    for (const catalog of processor.processor.catalogs) {
      for (const component of catalog.components.values()) {
        if (component.unikit) {
          collected.push(component.name);
        }
      }
    }
    return collected.sort((a, b) => a.localeCompare(b));
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
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        className="w-full flex-1 bg-background"
        contentContainerClassName="w-full max-w-2xl mx-auto px-4 pb-12 gap-6"
      >
        <View className="gap-2 pt-4">
          <Text className="font-sans text-xs text-muted-foreground">A2UI v1.0</Text>
          <Text className="font-sans text-2xl font-bold tracking-tight text-foreground">
            A2UI 렌더러 데모
          </Text>
          <Text className="font-sans text-sm leading-relaxed text-muted-foreground">
            에이전트가 보낸 A2UI 메시지를 UniKit UI 62종 컴포넌트로 렌더링해요. 웹
            데모(apps/web /a2ui)와 같은 메시지를 써요.
          </Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">데모 서피스</CardTitle>
            <CardDescription className="text-xs">
              버튼 액션은 로그에, 에이전트 업데이트는 formatString 바인딩으로 흘러요.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {surfaces.map((surface) => (
              <UnikitA2uiSurface key={surface.id} surface={surface} />
            ))}
            <Button variant="outline" onPress={simulateAgentUpdate}>
              에이전트 업데이트 시뮬레이션
            </Button>
            <View className="gap-1.5 rounded-lg border border-border bg-muted/40 p-3">
              <Text className="font-sans text-xs font-medium text-muted-foreground">
                액션 로그
              </Text>
              {actions.length === 0 ? (
                <Text className="font-sans text-xs text-muted-foreground">
                  아직 발화한 액션이 없어요.
                </Text>
              ) : (
                actions.map((action) => (
                  <Text
                    key={`${action.at}-${action.name}`}
                    className="font-sans font-mono text-xs text-foreground"
                  >
                    {action.name} ← {action.sourceComponentId}
                  </Text>
                ))
              )}
            </View>
          </CardContent>
        </Card>

        <View className="gap-3">
          <Text className="font-sans text-base font-semibold text-foreground">
            카탈로그 {roster.length}종
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {roster.map((name) => (
              <Badge key={name} variant="outline">
                {name}
              </Badge>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
