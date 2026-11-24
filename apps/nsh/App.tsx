/**
 * UniKit on nsh 데모 — `@unikit-bridge/ui/nsh` 사전 번들로 컴포넌트를
 * nsh(Native Shell)에서 구동하는 진입 앱. React 트리는 el(...)(번들이
 * 재수출하는 React.createElement)로 조립한다(App 소스는 nsh JSX라 소문자
 * 호스트 태그를 못 쓴다 — 실측). mountNsh가 트리를 nsh 화면에 올리고,
 * App.test.tsx의 헤드리스 드라이버(id/testID·label·text 셀렉터의 press/type)가
 * 컴포넌트를 구동한다 — 에이전트 친화성(단일 import·헤드리스 구동)의 실증.
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
  NativeSelect,
  NativeSelectOption,
  Separator,
  Switch,
  Text,
  UnikitThemeProvider,
  View,
  el,
  mountNsh,
  useUnikitTheme,
  useState,
} from "@unikit-bridge/ui/nsh";

function Demo() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");
  const [airplane, setAirplane] = useState(false);
  const [fruit, setFruit] = useState("apple");
  const { colorScheme, setColorScheme } = useUnikitTheme();

  return el(
    Card,
    { className: "m-4 max-w-md self-center", testID: "demo-card" },
    el(
      CardHeader,
      null,
      el(CardTitle, { testID: "demo-title" }, "UniKit on nsh"),
      el(CardDescription, null, "62 components, one React tree on the native shell"),
    ),
    el(
      CardContent,
      { className: "gap-3" },
      el(
        Button,
        {
          onPress: () => setCount((c) => c + 1),
          testID: "increment-button",
        },
        `Tapped ${count} times`,
      ),
      el(Input, {
        value: name,
        onChangeText: setName,
        placeholder: "Your name",
        accessibilityLabel: "Name",
        testID: "name-input",
      }),
      el(Switch, {
        checked: airplane,
        onCheckedChange: setAirplane,
        accessibilityLabel: "Airplane mode",
        testID: "airplane-switch",
      }),
      el(
        NativeSelect,
        {
          value: fruit,
          onValueChange: setFruit,
          accessibilityLabel: "Fruit",
          testID: "fruit-select",
        },
        el(NativeSelectOption, { value: "apple" }, "Apple"),
        el(NativeSelectOption, { value: "banana" }, "Banana"),
        el(NativeSelectOption, { value: "cherry" }, "Cherry"),
      ),
      el(Separator, { className: "my-1" }),
      // 조건부 문자열 자식 — Text 호스트는 유지되고 내부 텍스트 인스턴스만
      // 마운트·갱신·언마운트한다(노드 교체 렌더러의 회수 경로 회귀 — §3-1).
      el(Text, { testID: "echo-text" }, name ? `typed: ${name}` : null),
      el(
        View,
        { className: "flex-row items-center gap-2" },
        el(Badge, { testID: "fruit-badge" }, fruit),
        airplane ? el(Badge, { testID: "airplane-badge" }, "airplane") : null,
        name ? el(Badge, { testID: "name-badge" }, name) : null,
      ),
      el(
        Button,
        {
          variant: "outline",
          onPress: () => setColorScheme(colorScheme === "dark" ? "light" : "dark"),
          testID: "scheme-button",
        },
        colorScheme === "dark" ? "Switch to light" : "Switch to dark",
      ),
    ),
  );
}

mountNsh(() =>
  el(UnikitThemeProvider, {
    defaultColorScheme: "light",
    children: el(Demo),
  }),
);
