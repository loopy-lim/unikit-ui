// 엑스포 앱 공용 원형 테마 토글 — 쇼케이스 카탈로그(app/index)와 데모 홈
// (app/demo/index)이 같은 버튼을 쓴다. 색은 lib/token-colors 헬퍼가 테마
// 토큰에서 유도한다(재타이핑 금지, 사이클 74).
import { Moon, Sun } from "lucide-react-native";
import { Button, useUnikitTheme } from "@unikit-bridge/ui";

import { useIconColors } from "../lib/token-colors";

export function ThemeToggleButton() {
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  const icons = useIconColors();
  return (
    <Button
      variant="ghost"
      size="icon"
      onPress={toggleColorScheme}
      accessibilityLabel="색 테마 전환"
      className="h-9 w-9 rounded-full border border-border/60 bg-card active:bg-muted/50"
    >
      {colorScheme === "light" ? (
        <Moon size={16} color={icons.fg} />
      ) : (
        <Sun size={16} color={icons.fg} />
      )}
    </Button>
  );
}
