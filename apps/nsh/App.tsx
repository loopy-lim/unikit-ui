/**
 * UniKit on nsh 데모 — `@unikit-bridge/ui/nsh`(TSX 소스)로 컴포넌트를
 * nsh(Native Shell) 자체 런타임에서 구동하는 진입 앱. React 없이 nsh의
 * signal로 상태를 잡고, App.test.tsx의 헤드리스 드라이버(id/testID·label·
 * text 셀렉터의 press/type/clear)가 컴포넌트를 구동한다 — 에이전트 친화성
 * (단일 import·헤드리스 구동)의 실증.
 *
 * 루트(사이클 103): nsh의 클래스 없는 Text는 검정이므로 루트 View에
 * bg-background·text-foreground를 둔다 — 전경 클래스 없는 Text(echo)도 색 스킴을
 * 따른다(nsh는 뷰의 글자색이 자식 Text에 상속된다).
 */
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Switch,
  Text,
  Textarea,
  View,
  XIcon,
} from "@unikit-bridge/ui/nsh";
import type { SelectOption } from "@unikit-bridge/ui/nsh";
import { SdkButton } from "@unikit-bridge/ui/behaviors/ui-sdk-nsh";
import { colorScheme, mount, setColorScheme, signal } from "nsh";

// 수리 라운드 1 회귀용 — 셀렉트 options 시그널 교체(같은 참조 둘을 토글한다).
const FRUIT_OPTIONS_BASIC: SelectOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];
const FRUIT_OPTIONS_EXOTIC: SelectOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "durian", label: "Durian" },
  { value: "melon", label: "Melon" },
];
function Demo() {
  const count = signal(0);
  const name = signal("");
  const airplane = signal(false);
  const fruit = signal("apple");
  const sdkCount = signal(0);
  // 커널 pending 계약 실증용: SdkButton의 action은 release 버튼을 누를 때까지
  // 완료되지 않는다 — pending 중 재눌림은 커널이 차단한다(@ui-sdk/core button).
  const sdkRelease = signal<(() => void) | null>(null);
  // 사이클 103 회귀용 상태 — 체크박스·라디오·textarea
  const terms = signal(false);
  const size = signal("small");
  const notes = signal("");
  // 수리 라운드 1 회귀용 — 셀렉트 options 교체·아이콘 size prop 동적 변경
  const fruitOptions = signal<SelectOption[]>(FRUIT_OPTIONS_BASIC);
  const iconSize = signal(16);

  return (
    <View className="flex-1 flex-col bg-background p-4 text-foreground" testID="demo-root">
      <Card className="w-full max-w-md self-center" testID="demo-card">
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
          >
            Flight mode
          </Switch>
          <Checkbox
            checked={terms()}
            onCheckedChange={(checked) => terms.set(checked)}
            testID="terms-checkbox"
          >
            Accept terms
          </Checkbox>
          <RadioGroup
            value={size()}
            onValueChange={size.set}
            testID="size-radio"
          >
            <RadioGroupItem testID="size-small" value="small">
              Small
            </RadioGroupItem>
            <RadioGroupItem testID="size-large" value="large">
              Large
            </RadioGroupItem>
            <RadioGroupItem testID="size-huge" value="huge" disabled>
              Huge
            </RadioGroupItem>
          </RadioGroup>
          <View className="flex-row flex-wrap items-center gap-2">
            <Select
              value={fruit()}
              onValueChange={fruit.set}
              placeholder="Fruit"
              testID="fruit-select"
              options={fruitOptions()}
            />
            <Button
              variant="secondary"
              onPress={() =>
                fruitOptions.set(
                  fruitOptions() === FRUIT_OPTIONS_BASIC
                    ? FRUIT_OPTIONS_EXOTIC
                    : FRUIT_OPTIONS_BASIC,
                )
              }
              testID="swap-options-button"
            >
              Swap fruit options
            </Button>
          </View>
          <Textarea
            value={notes()}
            onChangeText={notes.set}
            placeholder="Notes"
            testID="notes-textarea"
          />
          <Separator className="my-1" />
          <Text testID="echo-text">{name() ? `typed: ${name()}` : null}</Text>
          <Text testID="notes-echo">{notes() ? `notes: ${notes()}` : null}</Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge testID="fruit-badge">{fruit()}</Badge>
            {airplane() ? <Badge testID="airplane-badge">airplane</Badge> : null}
            {terms() ? <Badge testID="terms-badge">terms</Badge> : null}
            <Badge testID="size-badge">{size()}</Badge>
            {name() ? <Badge testID="name-badge">{name()}</Badge> : null}
          </View>
          <View className="flex-row items-center gap-2">
            <XIcon
              size={iconSize()}
              testID="size-icon"
              className="hover:text-muted-foreground text-primary"
            />
            <Button
              variant="outline"
              onPress={() => iconSize.set(iconSize() === 16 ? 32 : 16)}
              testID="toggle-icon-size"
            >
              Toggle icon size
            </Button>
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
          <Separator className="my-1" />
          <View className="flex-row gap-2">
            <Dialog>
              <DialogTrigger testID="open-dialog">Open dialog</DialogTrigger>
              <DialogContent
                testID="demo-dialog"
                backdropTestID="demo-dialog-backdrop"
                accessibilityLabel="Demo dialog"
              >
                <DialogHeader>
                  <DialogTitle>Dialog title</DialogTitle>
                  <DialogDescription>
                    A centered card over a dimmed backdrop
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter showCloseButton>
                  <DialogClose testID="dialog-done">Done</DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger testID="open-sheet">Open sheet</SheetTrigger>
              <SheetContent testID="demo-sheet" accessibilityLabel="Demo sheet">
                <SheetHeader>
                  <SheetTitle>Sheet title</SheetTitle>
                  <SheetDescription>A panel from the right edge</SheetDescription>
                </SheetHeader>
                <SheetFooter>
                  <SheetClose testID="sheet-done">Done</SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

mount(Demo);
