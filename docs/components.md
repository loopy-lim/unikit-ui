# UniKit 컴포넌트 사용법

UniKit v0.1의 컴포넌트 5종(Button·Card·Input·Label·Badge)과 테마를 다루는 법을 정리했어요. 모든 내용은 실제 소스(`packages/unikit/src/`)와 쇼케이스(`apps/expo/app/index.tsx`) 기준이에요.

## import 방법

**UniKit 모노레포 안에서** (Expo·Next 데모 앱 모두 동일):

```tsx
import { Button, Card, Input, Label, Badge } from "@unikit/core";
```

**shadcn CLI로 복사한 내 프로젝트에서** (복사 절차는 [README](../README.md) 참고):

```tsx
import { Button } from "@/components/unikit/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/unikit/card";
import { Input } from "@/components/unikit/input";
import { Label } from "@/components/unikit/label";
import { Badge } from "@/components/unikit/badge";
```

## 공통 규칙 (5종 모두 해당)

- **`className` 병합** — 모든 컴포넌트는 `className` prop을 받아 내부 스타일과 병합해요(`cn` = clsx + tailwind-merge). 같은 속성을 덮어쓰면 내가 준 클래스가 이겨요.
- **cva 변형** — 색·크기 같은 변형은 `class-variance-authority`(cva)로 정의돼 있어요. 변형 함수 자체도 export돼서(`buttonVariants` 등) 다른 요소에 재활용할 수 있어요.
- **이중 지정(중요)** — 컴포넌트는 React Native 프리미티브로 만들어져서, **배경·테두리는 컨테이너(View/Pressable)에, 글자 색은 내부 Text에 각각 지정**돼요. react-native-web 0.21.4에서는 부모의 글자색 클래스가 자식 Text에 상속되지 않기 때문이에요. 그래서 글자가 든 컴포넌트(Button·Badge)는 children을 내부 `Text`로 감싸 렌더링해요. children에는 문자열을 넣어 주세요.
- **플랫폼 분기 없음** — 어느 쪽 import든 같은 소스가 React(웹)와 React Native 양쪽에서 같은 모습으로 렌더링돼요.

---

## Button

`Pressable` + 내부 `Text` 기반이에요. 변형 6종 × 크기 4종이에요.

```tsx
import { Button } from "@unikit/core";        // 모노레포
import { Button } from "@/components/unikit/button";  // 복사본
```

### Props

`ButtonProps` = `Pressable`의 모든 props + 아래 추가 항목이에요.

| Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `variant` | `"default" \| "secondary" \| "destructive" \| "outline" \| "ghost" \| "link"` | `"default"` | 버튼 스타일 6종 |
| `size` | `"default" \| "sm" \| "lg" \| "icon"` | `"default"` | 크기 4종 |
| `disabled` | `boolean` | — | 비활성(반투명 + press 무반응 + `aria-disabled`) |
| `className` | `string` | — | 컨테이너(Pressable) 클래스 병합 |
| `children` | `ReactNode` | — | 버튼 라벨. 내부 `Text`로 감싸 렌더링(문자열 권장) |
| `hitSlop` | `number \| {top,…}` | 크기별 자동 | 터치 타깃 확장 값(아래 참고). 직접 지정하면 덮어써요 |
| 그 외 | — | — | `onPress`, `accessibilityLabel` 등 Pressable props 그대로 사용 |

### 변형(variant) 6종

| 값 | 모습 |
|---|---|
| `default` | 진한 배경(primary)에 밝은 글자 — 주된 행동용 |
| `secondary` | 연한 회색 배경에 진한 글자 |
| `destructive` | 빨간 배경(red-600 계)에 밝은 글자 — 삭제·위험 행동용 |
| `outline` | 흰 배경 + 테두리, 누르면 배경이 accent로 |
| `ghost` | 배경 없음, 누르면 배경이 accent로 |
| `link` | 배경 없음 + 밑줄 친 primary 색 글자 |

### 크기(size) 4종

| 값 | 크기 | 터치 타깃 보정(hitSlop) |
|---|---|---|
| `sm` | 높이 36px, 좌우 여백 12px | 각 방향 4px |
| `default` | 높이 40px, 좌우 여백 16px | 각 방향 2px |
| `lg` | 높이 44px, 좌우 여백 32px | 0px(이미 44px) |
| `icon` | 40×40 정사각(아이콘·"+" 넣는 용) | 각 방향 2px |

시각 크기와 무관하게 실제 터치 영역이 최소 44px가 되도록 `hitSlop`이 자동 지정돼요.

### 상태·접근성 동작

- **눌림(press)**: 변형별로 배경이 살짝 옅어지거나(`active:bg-primary/90` 등) accent 배경으로 전환돼요. 웹에서 마우스를 누르고 있을 때도 보여요.
- **키보드 포커스(웹)**: Tab 키로 이동하면 2px 포커스 링(`--ring`, 오프셋 2px)이 떠요.
- **비활성**: `disabled`를 주면 반투명(50%)이 되고 `role="button"` + `aria-disabled="true"`로 렌더링돼요.
- `accessibilityRole="button"`이 항상 지정돼 있어요. 라벨이 필요하면 `accessibilityLabel`을 넘겨 주세요.

### 사용 예 (apps/expo/app/index.tsx 발췌)

```tsx
<View className="flex flex-wrap gap-3">
  <Button variant="default" size="default">기본</Button>
  <Button variant="secondary" size="default">보조</Button>
  <Button variant="destructive" size="default">삭제</Button>
  <Button variant="outline" size="default">외곽선</Button>
  <Button variant="ghost" size="default">고스트</Button>
  <Button variant="link" size="default">링크</Button>
</View>
<View className="flex flex-wrap items-center gap-3">
  <Button variant="default" size="sm">작게</Button>
  <Button variant="default" size="default">보통</Button>
  <Button variant="default" size="lg">크게</Button>
  <Button variant="default" size="icon">+</Button>
</View>
<View className="flex flex-wrap gap-3">
  <Button variant="default" size="default" disabled>비활성</Button>
</View>
```

테마 토글 버튼처럼 `onPress`·`accessibilityLabel`을 함께 쓰는 예:

```tsx
<Button
  variant="outline"
  size="sm"
  onPress={toggleColorScheme}
  accessibilityLabel="색 테마 전환"
>
  {colorScheme === "light" ? "🌙 다크" : "☀️ 라이트"}
</Button>
```

---

## Card

`View` + `Text` 기반이에요. 카드를 이루는 하위 컴포넌트 6종을 조합해 써요.

```tsx
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@unikit/core";  // 복사본이면 "@/components/unikit/card"
```

### 구성 요소와 Props

`Card`·`CardHeader`·`CardContent`·`CardFooter`는 `View`의 모든 props를, `CardTitle`·`CardDescription`은 `Text`의 모든 props를 받아요. 전부 `className` 병합을 지원해요. 별도 변형은 없어요.

| 컴포넌트 | 역할 | 기본 스타일 |
|---|---|---|
| `Card` | 카드 껍데기 | 라운드 12px + 테두리 + 카드 배경색 + 그림자 |
| `CardHeader` | 머리 영역(제목+설명) | 세로 스택, 안쪽 여백 24px |
| `CardTitle` | 카드 제목 | 큰 글씨(24px)·굵게 |
| `CardDescription` | 카드 설명 | 작은 글씨(14px)·흐린 색 |
| `CardContent` | 본문 영역 | 안쪽 여백 24px(위쪽 제외) |
| `CardFooter` | 바닥 영역 | 가로 행 정렬, 안쪽 여백 24px(위쪽 제외) |

> 본문 텍스트는 색이 자동으로 안 정해져요(상속이 막혀서요). `CardContent` 안에 넣는 글에는 `font-sans text-sm text-foreground`처럼 색·폰트를 명시해 주세요.

### 사용 예 (apps/expo/app/index.tsx 발췌)

```tsx
<Card>
  <CardHeader>
    <CardTitle>안녕, UniKit!</CardTitle>
    <CardDescription>복사해서 쓰는 유니버설 컴포넌트</CardDescription>
  </CardHeader>
  <CardContent>
    <Text className="font-sans text-sm text-foreground">
      이 카드 하나가 React(웹)와 React Native 모두에서 똑같이 렌더링돼요.
      소스를 내 프로젝트로 가져와 자유롭게 고칠 수 있어요.
    </Text>
  </CardContent>
  <CardFooter>
    <Text className="font-sans text-sm text-muted-foreground">v0.1</Text>
    <Button variant="outline" size="sm">자세히</Button>
  </CardFooter>
</Card>
```

---

## Input

`TextInput` 기반 입력창이에요. `forwardRef`로 참조(ref)를 넘겨 `focus()`·`blur()`를 부를 수 있어요(Label 연결에 써요).

```tsx
import { Input } from "@unikit/core";        // 복사본이면 "@/components/unikit/input"
```

### Props

`InputProps` = `TextInput`의 모든 props에서 표의 항목을 추가·조정한 것이에요.

| Prop | 타입 | 설명 |
|---|---|---|
| `disabled` | `boolean` | 웹 관용 비활성 prop. 내부에서 `editable={false}`(입력 차단) + `aria-disabled`로 치환돼요. RN `TextInput`에는 원래 이 prop이 없어요 |
| `className` | `string` | 클래스 병합 |
| `ref` | `TextInputInstance` | `focus()`·`blur()` 호출용 |
| 그 외 | — | `placeholder`, `keyboardType`, `accessibilityLabel` 등 TextInput props |

모양은 고정이에요(높이 40px·텍스트 16px·라운드 6px·테두리 1px). 변형은 없고 `className`으로 덮어 쓰세요.

### 상태 동작

- **포커스**: 테두리가 `--ring` 색으로 바뀌고 2px 링이 떠요(Tab 이동으로도 동일).
- **placeholder**: 흐린 색(`--muted-foreground`)으로 표시돼요.
- **비활성**: `disabled` 시 반투명(50%), `aria-disabled="true"`.

### 사용 예 (apps/expo/app/index.tsx 발췌)

```tsx
<View className="flex flex-col gap-2">
  <Label nativeID="unikit-label-email">이메일</Label>
  <Input
    ref={emailInputRef}
    accessibilityLabelledBy="unikit-label-email"
    placeholder="example@unikit.dev"
  />
</View>
<View className="flex flex-col gap-2">
  <Label nativeID="unikit-label-disabled">비활성 입력창</Label>
  <Input
    accessibilityLabelledBy="unikit-label-disabled"
    placeholder="비활성 상태예요"
    disabled
  />
</View>
```

---

## Label

`Text` 기반 라벨이에요. 단독으로도 쓰지만, **입력창(Input)과 연결해 쓰는 게 기본 패턴**이에요.

```tsx
import { Label } from "@unikit/core";        // 복사본이면 "@/components/unikit/label"
```

### Props

`LabelProps` = `Text`의 모든 props(변형 없음, `className` 병합 지원). 연결에 쓰는 건 이 두 개예요:

| Prop | 타입 | 설명 |
|---|---|---|
| `nativeID` | `string` | 라벨의 고유 ID. 웹 DOM에서 `id`로 렌더돼요. `unikit-label-<이름>` 규칙 권장 |
| `onPress` | 함수 | 라벨을 눌렀을 때 실행. 입력창 ref의 `focus()`와 연결해 쓰세요 |

### 입력창 연결 패턴 (2가지)

React Native 프리미티브만으로는 HTML의 `<label for>`을 만들 수 없어서(react-native-web 0.21.4의 `Text`는 `htmlFor`를 DOM에 전달하지 않아요), 다음 2가지로 연결해요.

1. **스크린리더·DOM 연결(필수)** — Label의 `nativeID` ↔ Input의 `accessibilityLabelledBy`에 같은 값을 넣어요. 웹에서 `id` ↔ `aria-labelledby`로 연결돼요.
2. **눌러서 포커스(권장)** — Label의 `onPress`에서 입력창 ref의 `focus()`를 불러요. 라벨을 탭하면 입력창에 포커스 링이 떠요.

```tsx
const nameInputRef = useRef<TextInputInstance>(null);

<Label
  nativeID="unikit-label-name"
  onPress={() => nameInputRef.current?.focus()}
>
  이름
</Label>
<Input
  ref={nameInputRef}
  accessibilityLabelledBy="unikit-label-name"
  placeholder="홍길동"
/>
```

---

## Badge

`View` + 내부 `Text` 기반 배지예요. 상태·레이블 표시용이고 눌리지 않아요.

```tsx
import { Badge } from "@unikit/core";        // 복사본이면 "@/components/unikit/badge"
```

### Props

`BadgeProps` = `View`의 모든 props + 변형이에요.

| Prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `variant` | `"default" \| "secondary" \| "destructive" \| "outline"` | `"default"` | 배지 스타일 4종 |
| `className` | `string` | — | 컨테이너(View) 클래스 병합 |
| `children` | `ReactNode` | — | 배지 글자. 내부 `Text`(12px·굵게)로 감싸 렌더링 |

### 변형 4종

| 값 | 모습 |
|---|---|
| `default` | 진한 배경(primary)에 밝은 글자 |
| `secondary` | 연한 회색 배경에 진한 글자 |
| `destructive` | 빨간 배경에 밝은 글자 |
| `outline` | 투명 배경 + 테두리만 |

모든 색 조합은 WCAG AA 텍스트 대비 기준(4.5:1)을 통과해요.

### 사용 예 (apps/expo/app/index.tsx 발췌)

```tsx
<View className="flex flex-wrap gap-2">
  <Badge variant="default">기본</Badge>
  <Badge variant="secondary">보조</Badge>
  <Badge variant="destructive">삭제</Badge>
  <Badge variant="outline">외곽선</Badge>
</View>
```

---

## 테마 — 라이트/다크 토큰

UniKit의 모든 색은 CSS 변수 토큰이에요. 값의 단일 출처는 `packages/unikit/src/theme/tokens.ts`이고, 소비자 프로젝트에서는 [README 4-(d)](../README.md)의 `theme` 항목 추가 한 줄로 같은 토큰을 받아요.

### 모노레포 안에서: `UnikitThemeProvider`

앱 최상위에서 감싸면 토큰이 주입되고, `useUnikitTheme` 훅으로 상태를 다뤄요(기본값 라이트, 즉시 전환).

```tsx
import { UnikitThemeProvider, useUnikitTheme } from "@unikit/core";

// 앱 루트
<UnikitThemeProvider>
  <App />
</UnikitThemeProvider>

// 컴포넌트 안에서
const { colorScheme, toggleColorScheme, setColorScheme } = useUnikitTheme();
```

전환 방식은 웹·네이티브 공통으로 NativeWind `vars()` 주입이에요(웹에서는 인라인 CSS 변수). 이 패키지는 레지스트리에 포함되지 않아서, 복사본 사용자는 토큰 CSS 변수 + `.dark` 클래스로 테마를 다뤄요.

### 토큰 목록 (색 19종 + radius)

토큰 20종의 라이트/다크 **값 전체는 생성 카탈로그 [packages/unikit/docs/tokens.md](../packages/unikit/docs/tokens.md)를 보세요.** 이 문서에는 역할 구조만 요약해요 — 값 사본이 여러 곳에 있으면 어느 순간 어긋나는(드리프트) 위험이 생겨서, 기계 검사되는 카탈로그 한 곳에만 값을 둬요.

- 색 토큰은 **표면/전경 쌍** 구조예요. 기본 `--background`·`--foreground`, 표면 `--card`·`--popover`(v0.1 컴포넌트 미사용, 확장 예약), 행동 `--primary`·`--secondary`·`--muted`·`--accent`·`--destructive`가 각각 `-foreground` 짝을 가져요. 테두리는 `--border`(일반)·`--input`(입력창), 키보드 포커스 링은 `--ring`이에요. 색 계열은 zinc예요.
- `--destructive` 라이트값은 WCAG AA 대비 확보를 위해 shadcn 기본 대신 한 단계 진한 red-600 계로 조정했어요(정확한 값은 카탈로그 참조).
- `--radius`는 모서리 반경 기준값이에요. `rounded-md`는 기준값 − 2px, `rounded-lg`는 기준값, Card의 `rounded-xl`은 기준값 + 4px로 파생돼요.

---

## 접근성 공통 (RN → 웹 DOM 매핑)

UniKit 컴포넌트에 지정한 React Native 접근성 prop이 웹(react-native-web)에서 어떻게 나오는지 정리한 표예요. 네이티브에서도 같은 prop을 쓰면 돼요.

| 컴포넌트에 지정하는 prop | 웹 DOM 렌더 | 비고 |
|---|---|---|
| `accessibilityRole="button"` | `role="button"` | Button이 항상 지정 |
| `aria-disabled={true}` | `aria-disabled="true"` | Button·Input의 `disabled`가 자동 지정 |
| `accessibilityLabel="…"` | `aria-label="…"` | 스크린리더 라벨 |
| `nativeID`(Label) | `id="…"` | Label↔Input 연결에 사용 |
| `accessibilityLabelledBy`(Input) | `aria-labelledby="…"` | Label의 `nativeID` 값과 연결 |
| `focus:`/`focus-visible:` 클래스 | Tab 이동 시 포커스 링 | Input·Button에 기본 적용 |

> `accessibilityState={{ disabled: true }}` 객체는 react-native-web 0.21.4에서 DOM으로 전달되지 않아서 UniKit에서는 쓰지 않아요. 비활성 표시는 `disabled` prop(→ `aria-disabled`)으로 해요.

터치 타깃: 상호작용 요소는 44×44px 최소를 지켜요. Button은 크기별 `hitSlop`으로 보정하고(위 표), 시각 크기는 그대로예요.
