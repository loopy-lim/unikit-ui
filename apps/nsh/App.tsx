/**
 * UniKit on nsh 데모 — `@unikit-bridge/ui/nsh`(TSX 소스)로 컴포넌트를
 * nsh(Native Shell) 자체 런타임에서 구동하는 진입 앱. React 없이 nsh의
 * signal로 상태를 잡고, App.test.tsx의 헤드리스 드라이버(id/testID·label·
 * text 셀렉터의 press/type/clear)가 컴포넌트를 구동한다 — 에이전트 친화성
 * (단일 import·헤드리스 구동)의 실증.
 */
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Separator,
  Switch,
  Text,
  View,
} from "@unikit-bridge/ui/nsh";
import { SdkButton } from "@unikit-bridge/ui/behaviors/ui-sdk-nsh";
import { colorScheme, mount, setColorScheme, signal } from "nsh";
function Demo() {
  const count = signal(0);
  const name = signal("");
  const airplane = signal(false);
  const fruit = signal("apple");
  const sdkCount = signal(0);
  // 커널 pending 계약 실증용: SdkButton의 action은 release 버튼을 누를 때까지
  // 완료되지 않는다 — pending 중 재눌림은 커널이 차단한다(@ui-sdk/core button).
  const sdkRelease = signal<(() => void) | null>(null);

  return (
    <Card className="m-4 max-w-md self-center" testID="demo-card">
      <CardHeader>
        <CardTitle testID="demo-title">UniKit on nsh</CardTitle>
        <CardDescription>
          native kit on the shell runtime, no React
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-3">
        <Button onPress={() => count.set(count() + 1)} testID="increment-button">
          {`Tapped ${count()} times`}
        </Button>
        <Input
          value={name()}
          onChangeText={name.set}
          placeholder="Your name"
          testID="name-input"
        />
        <Switch
          checked={airplane()}
          onCheckedChange={(checked) => airplane.set(checked)}
          testID="airplane-switch"
        />
        <Select
          value={fruit()}
          onValueChange={fruit.set}
          placeholder="Fruit"
          testID="fruit-select"
          options={[
            { value: "apple", label: "Apple" },
            { value: "banana", label: "Banana" },
            { value: "cherry", label: "Cherry" },
          ]}
        />
        <Separator className="my-1" />
        <Text testID="echo-text">{name() ? `typed: ${name()}` : null}</Text>
        <View className="flex-row items-center gap-2">
          <Badge testID="fruit-badge">{fruit()}</Badge>
          {airplane() ? <Badge testID="airplane-badge">airplane</Badge> : null}
          {name() ? <Badge testID="name-badge">{name()}</Badge> : null}
        </View>
        <SdkButton
          onPress={() =>
            new Promise<void>((resolve) => sdkRelease.set(() => resolve()))
          }
          testID="sdk-button"
        >
          {`Sdk tapped ${sdkCount()} times`}
        </SdkButton>
        <Button
          variant="secondary"
          onPress={() => {
            sdkRelease()?.();
            sdkRelease.set(null);
            sdkCount.set(sdkCount() + 1);
          }}
          testID="sdk-release-button"
        >
          Release sdk action
        </Button>
        <Button
          variant="outline"
          onPress={() =>
            setColorScheme(colorScheme() === "dark" ? "light" : "dark")
          }
          testID="scheme-button"
        >
          {colorScheme() === "dark" ? "Switch to light" : "Switch to dark"}
        </Button>
      </CardContent>
    </Card>
  );
}



mount(Demo);
