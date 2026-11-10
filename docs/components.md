# UniKit 컴포넌트 사용법

UniKit의 컴포넌트 61종(기초 5종 Button·Card·Input·Label·Badge + shadcn 카탈로그 1차 23종 + 2차 33종)과 테마를 다루는 법을 정리했어요. 모든 내용은 실제 소스(`packages/unikit/src/`)와 쇼케이스(`apps/expo/app/index.tsx`) 기준이에요. 기초 5종과 1차 23종은 아래에 상세(Props 표·변형)를 적었고, 2차 33종(2026-11-10 완료)은 계열별 표로 각 1줄 요점만 적어요 — 상세 포팅 판단(원본 대비 차이·미지원 항목)은 각 소스 파일의 머리 주석에 있어요.

## import 방법

**UniKit 모노레포 안에서** (Expo·Next 데모 앱 모두 동일):

```tsx
import { Button, Card, Input, Label, Badge } from "@unikit-bridge/ui";
```

**shadcn CLI로 복사한 내 프로젝트에서** (복사 절차는 [README](../README.md) 참고):

```tsx
import { Button } from "@/components/unikit/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/unikit/card";
import { Input } from "@/components/unikit/input";
import { Label } from "@/components/unikit/label";
import { Badge } from "@/components/unikit/badge";
```

## 공통 규칙 (61종 모두 해당)

- **`className` 병합** — 모든 컴포넌트는 `className` prop을 받아 내부 스타일과 병합해요(`cn` = clsx + tailwind-merge). 같은 속성을 덮어쓰면 내가 준 클래스가 이겨요.
- **cva 변형** — 색·크기 같은 변형은 `class-variance-authority`(cva)로 정의돼 있어요. 변형 함수 자체도 export돼서(`buttonVariants` 등) 다른 요소에 재활용할 수 있어요.
- **이중 지정(중요)** — 컴포넌트는 브리지 프리미티브로 만들어져서, **배경·테두리는 컨테이너(View/Pressable)에, 글자 색은 내부 Text에 각각 지정**돼요. 네이티브(React Native)에서는 컨테이너에 준 글자색이 자식 Text로 상속되지 않기 때문이에요(웹 DOM은 상속되지만, 한 벌 소스가 양쪽에서 같은 모습을 내려면 전경색을 명시해야 해요). 그래서 글자가 든 컴포넌트(Button·Badge)는 children을 내부 `Text`로 감싸 렌더링해요. children에는 문자열을 넣어 주세요.
- **플랫폼 분기 없음** — 어느 쪽 import든 같은 소스가 React(웹)와 React Native 양쪽에서 같은 모습으로 렌더링돼요.

---

## Button

`Pressable` + 내부 `Text` 기반이에요. 변형 6종 × 크기 4종이에요.

```tsx
import { Button } from "@unikit-bridge/ui";   // 모노레포
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
} from "@unikit-bridge/ui";  // 복사본이면 "@/components/unikit/card"
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

> 본문 텍스트는 색이 자동으로 안 정해져요(네이티브에서는 컨테이너의 글자색이 본문 Text로 상속되지 않아요 — 위 공통 규칙의 이중 지정 참고). `CardContent` 안에 넣는 글에는 `font-sans text-sm text-foreground`처럼 색·폰트를 명시해 주세요.

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
import { Input } from "@unikit-bridge/ui";   // 복사본이면 "@/components/unikit/input"
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
import { Label } from "@unikit-bridge/ui";   // 복사본이면 "@/components/unikit/label"
```

### Props

`LabelProps` = `Text`의 모든 props(변형 없음, `className` 병합 지원). 연결에 쓰는 건 이 두 개예요:

| Prop | 타입 | 설명 |
|---|---|---|
| `nativeID` | `string` | 라벨의 고유 ID. 웹 DOM에서 `id`로 렌더돼요. `unikit-label-<이름>` 규칙 권장 |
| `onPress` | 함수 | 라벨을 눌렀을 때 실행. 입력창 ref의 `focus()`와 연결해 쓰세요 |

### 입력창 연결 패턴 (2가지)

브리지 프리미티브의 공통 계약에는 HTML `<label for>`에 해당하는 기능이 없어서(네이티브에는 이 개념 자체가 없어요), 다음 2가지로 연결해요.

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
import { Badge } from "@unikit-bridge/ui";   // 복사본이면 "@/components/unikit/badge"
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

## shadcn 카탈로그 1차 — 23종 추가 컴포넌트

shadcn/ui(new-york-v4)의 컴포넌트를 UniKit 유니버설(한 벌 소스 → 웹·네이티브 동일 렌더)로 이식한 첫 배치예요. 전부 npm 패키지(`@unikit-bridge/ui`)와 레지스트리(shadcn CLI `add`) 양쪽에서 동일하게 제공돼요. 각 컴포넌트의 상세 포팅 판단은 소스 파일 머리 주석에 적혀 있어요.

공통 사항(아래 표의 컴포넌트 전부):

- **API는 shadcn 원본을 따라요.** 단, Radix UI 엔진이 하던 열림·선택 상태 관리는 내부 React state·context로 옮겨졌어요. 그래서 `defaultChecked`·`onCheckedChange`·`defaultValue` 같은 shadcn prop 이름은 그대로 쓰면서도 별도 패키지 의존이 없어요.
- **아이콘은 글리프 문자로 대체돼요.** 화살표 ⌄⌃‹›·구분자 ›·생략 ⋯·안내 ⓘ·경고 ⚠ 등이에요(lucide 아이콘 의존 없음).
- **웹 전용 효과는 `web:` 접두가 붙은 클래스로만** 들어가요(호버·전환 애니메이션·펄스 등). 네이티브에서는 정적으로 보여요.
- 파일 단위 import는 모노레포면 `@unikit-bridge/ui`, 복사본이면 `@/components/unikit/<이름>`이에요(아래 표의 "이름" 열 참고).

### 폼 입력 6종

| 이름 | 컴포넌트 | 요점 |
|---|---|---|
| `checkbox` | `Checkbox` | `checked`·`defaultChecked`·`onCheckedChange`. 중간 상태 `indeterminate`(− 글리프 + `aria-checked="mixed"`). `role="checkbox"`, 터치 타깃 44px 보정 |
| `radio-group` | `RadioGroup`·`RadioGroupItem` | 그룹 `value`/`onValueChange` 단일 선택, 항목 `role="radio"`, 선택 점은 원형 View |
| `switch` | `Switch` | `checked`·`onCheckedChange`, `role="switch"`. 크기 `default`/`sm`, 썸 이동은 트랙 정렬 전환으로 재현 |
| `toggle` | `Toggle` | 눌림 유지 버튼. `pressed`·`onPressedChange` + `aria-pressed`. 변형 `default`/`outline` × 크기 3종 |
| `toggle-group` | `ToggleGroup`·`ToggleGroupItem` | `type="single"|"multiple"`(shadcn API 준수), 내부에서 `Toggle` 재사용 |
| `textarea` | `Textarea` | 여러 줄 입력창. `invalid` prop(붉은 테두리·링), 브리지 `TextInput`의 `multiline`(웹은 `<textarea>`) |

### 내비게이션·표시 7종

| 이름 | 컴포넌트 | 요점 |
|---|---|---|
| `tabs` | `Tabs`·`TabsList`·`TabsTrigger`·`TabsContent` | `defaultValue`·`value`·`onValueChange`. `TabsList` 변형 `default`/`line`(하단 인디케이터 바). 내용은 선택된 탭만 마운트 |
| `accordion` | `Accordion`·`AccordionItem`·`AccordionTrigger`·`AccordionContent` | `type="single"|"multiple"`. ⌄/⌃ 글리프 전환, `aria-expanded` |
| `collapsible` | `Collapsible`·`CollapsibleTrigger`·`CollapsibleContent` | `open`·`onOpenChange`. Trigger는 문자열 라벨을 내부 Text로 감싸 렌더(네이티브 안전) |
| `breadcrumb` | `Breadcrumb` 외 6종 | 경로 표시. `BreadcrumbLink`(눌림)·`BreadcrumbPage`(현재)·`BreadcrumbSeparator`(›)·`BreadcrumbEllipsis`(⋯) |
| `pagination` | `Pagination` 외 6종 | 페이지 매김. `‹`·`›` 글리프, `isActive` 현재 페이지 강조, Button 변형 재사용. `Previous`/`Next`의 라벨은 `label` prop으로 교체(기본 영문) |
| `progress` | `Progress` | `value`(0~100)·`max`. `role="progressbar"`, 인디케이터 폭은 동적 style로(임의값 클래스 금지 규칙) |
| `separator` | `Separator` | `orientation="horizontal"|"vertical"`. `decorative`(기본 true·장식)와 의미 구분 선 |

### 피드백·데이터 5종

| 이름 | 컴포넌트 | 요점 |
|---|---|---|
| `alert` | `Alert`·`AlertTitle`·`AlertDescription` | 변형 `default`/`destructive`, 글리프 ⓘ/⚠, `role="alert"` |
| `avatar` | `Avatar`·`AvatarImage`·`AvatarFallback`·`AvatarBadge`·`AvatarGroup`·`AvatarGroupCount` | 이미지 로드 실패 시 `onError`로 Fallback 자동 전환. 크기 `sm`/`default`/`lg` |
| `empty` | `Empty`·`EmptyHeader`·`EmptyTitle`·`EmptyDescription`·`EmptyContent`·`EmptyMedia` | 빈 상태 안내 레이아웃. `EmptyMedia`에 큰 글리프 문자 |
| `skeleton` | `Skeleton` | 로딩 자리표시. `web:animate-pulse`(웹 전용 펄스) |
| `table` | `Table` 외 7종 | 표 레이아웃(View+flex 이식 — 표 시맨틱 role은 브리지 계약상 아직 없어요). `TableCaption` 포함 |

### 레이아웃·조립 5종

| 이름 | 컴포넌트 | 요점 |
|---|---|---|
| `aspect-ratio` | `AspectRatio` | `ratio`(기본 1) 비율 컨테이너. 동적 style 계약 |
| `kbd` | `Kbd`·`KbdGroup` | 키보드 키 표시(⌘ K 등) |
| `field` | `Field` 외 9종 | 폼 묶음(라벨·설명·오류·set·제목). `invalid`·`disabled` 상태가 context로 하위 전파, `Label` 재사용 |
| `item` | `Item` 외 9종 | 리스트 아이템 카드. 변형 `default`/`outline`/`muted` × 크기 2종 |
| `button-group` | `ButtonGroup`·`ButtonGroupSeparator`·`ButtonGroupText` | 버튼 무리(가로/세로). 자식 버튼 모서리 연접을 자동 주입 |

### 사용 예 (일부)

```tsx
import { Checkbox, Switch, Tabs, Accordion, Progress, Alert } from "@unikit-bridge/ui";

<Checkbox checked={ok} onCheckedChange={setOk}>동의합니다</Checkbox>
<Switch checked={on} onCheckedChange={setOn} />
<Tabs defaultValue="account">
  <TabsList><TabsTrigger value="account">계정</TabsTrigger><TabsTrigger value="profile">프로필</TabsTrigger></TabsList>
  <TabsContent value="account">계정 내용</TabsContent>
  <TabsContent value="profile">프로필 내용</TabsContent>
</Tabs>
<Progress value={72} />
<Alert variant="destructive"><AlertTitle>주의</AlertTitle><AlertDescription>작업이 실패했어요.</AlertDescription></Alert>
```

> 탭·아코디언처럼 열림 상태를 스스로 들고 있는 컴포넌트는 React state를 써서 `"use client"`가 필요한 클라이언트 컴포넌트예요(Next.js).

---

## shadcn 카탈로그 2차 — 33종 추가 컴포넌트 (사이클 40, 2026-11-10 완료)

shadcn 카탈로그 잔여 33종을 전량 이식해 UniKit은 61종 전부를 갖추게 됐어요(61/61). 1차와 같은 규칙(shadcn API 유지·Radix 제거 후 React state+context·글리프 아이콘)에 더해, 이번 배치의 공통 사항:

- **오버레이 계열은 `src/lib/overlay.tsx`가 떠받쳐요.** 포털(웹 createPortal / 네이티브 Modal), 백드롭, 바깥 눌림·ESC 닫기, 포커스 이동·트랩·복귀, 앵커 위치 계산(measure 기반 side/align 배치 + 뷰포트 클램프)을 통합 오버레이 훈이 담당해요. dialog 계열(중앙 모달)은 포털+백드롭만, popover 계열은 앵커 위치 계산까지 소비해요.
- **등장/퇴장 애니메이션은 마운트/언마운트 즉시 전환**이에요(`data-[state]` 셀렉터가 없는 네이티브에서 재현 불가 — 로드맵). 웹 전용 효과는 역시 `web:` 접두 클래스예요.
- **브리지 프리미티브가 확장됐어요.** Select(웹 진짜 `<select>`)·ScrollView(웹 overflow div)·useDrag(웹 PointerEvent / 네이티브 PanResponder)·measure 계약이 추가됐고, BridgeRole에 table·grid·listbox·dialog 등이 포함됐어요.
- **`chart`는 npm 배럴에서 제외**되고 `@unikit-bridge/ui/chart` 단독 진입점이에요(react-native-svg 선택 peer — 웹 번들 오염 방지). 선언형 컴포넌트(ChartContainer 등)는 레지스트리 복사로 써요.
- **`form`은 react-hook-form 선택 peer**예요(설치 시 연동, 미설치 시 타입만 노출).

### 오버레이·모달 7종

| 이름 | 컴포넌트 | 요점 |
|---|---|---|
| `dialog` | `Dialog` 외 7종 | 중앙 모달. 열림 상태는 React state+context, 포털·백드롭·포커스 트랩/복귀·ESC 닫기·배경 스크롤 잠금은 오버레이 훈 담당. role=dialog·aria-modal |
| `alert-dialog` | `AlertDialog` 외 9종 | 확인 모달(Action/Cancel). 원본 grid 레이아웃은 flex 스택으로 근사, Media·Title 배치 일부 소실 |
| `sheet` | `Sheet` 외 7종 | 측면 슬라이드 패널(side top/bottom/left/right). ModalOverlay 방향별 배치 |
| `drawer` | `Drawer` 외 7종 | 바닥 슬라이드 패널. useDrag로 아래 드래그 닫기(다른 방향 드래그는 미지원) |
| `popover` | `Popover` 외 6종 | 앵커 팝오버(비모달). 앵커 위치 계산(side/align/offset), 열림 중 스크롤·리사이즈 시 재계산(웹) |
| `hover-card` | `HoverCard` 외 2종 | 호버 카드. 웹 지연 개방(setTimeout), 네이티브는 탭 토글(hover 없음) |
| `tooltip` | `Tooltip` 외 3종 | 짧은 힌트. 트리거 aria-describedby 연결, delayDuration 지연 |

### 메뉴·명령 6종

| 이름 | 컴포넌트 | 요점 |
|---|---|---|
| `dropdown-menu` | `DropdownMenu` 외 14종 | 드롭다운 메뉴. 하위 메뉴 1단계 캐스케이드, 체크·라디오·구분 항목 포함 |
| `context-menu` | `ContextMenu` 외 14종 | 우클릭 메뉴 — 웹 onContextMenu / 네이티브 길게 누르기(onLongPress) 매핑 |
| `command` | `Command` 외 7종 | 명령 팔레트. 자체 필터 + 키보드 탐색(웹 방향키·엔터, 네이티브 onKeyPress 래핑) |
| `combobox` | `Combobox` 외 14종+훅 | 검색 셀렉트. popover + command 조립(원본도 조립형), ▾ 트리거 개방 |
| `menubar` | `Menubar` 외 15종 | 수평 메뉴 바. dropdown-menu 소비, 인접 트리거 hover 전환은 미지원(눌림 전환) |
| `navigation-menu` | `NavigationMenu` 외 7종 | 내비게이션 메뉴. 링크+전개 패널, hover 지연 개방은 미지원 |

### 입력 확장 9종

| 이름 | 컴포넌트 | 요점 |
|---|---|---|
| `native-select` | `NativeSelect` 외 2종 | 브리지 Select 프리미티브(옵션·옵션 그룹 포함) — 웹은 진짜 `<select>`, 네이티브는 폴백 목록 |
| `select` | `Select` 외 9종 | 커스텀 셀렉트. popover 기반 목록, role=combobox/listbox/option |
| `input-otp` | `InputOTP` 외 3종 | OTP 입력. 숨은 TextInput 하나로 값 분배·자동 포커스 이동·붙여넣기 분배 |
| `input-group` | `InputGroup` 외 5종 | 입력 묶음(애드온·버튼·텍스트 조립). 기존 input·field 재사용 |
| `form` | `Form` 외 6종+훅 | react-hook-form 연동(선택 peer). FormField·FormItem 등 shadcn API 유지, 오류 메시지 aria 연결 |
| `slider` | `Slider` | 브리지 useDrag 기반 슬라이더. 웹 방향키 값 조정, 트랙 전체 드래그 조작(수평 전용) |
| `resizable` | `ResizablePanelGroup` 외 2종 | 크기 조절 패널. useDrag 드래그 리사이즈(키보드 리사이즈는 미지원) |
| `scroll-area` | `ScrollArea`·`ScrollBar` | 스크롤 영역. 브리지 ScrollView 프리미티브(웹 overflow div), 커스텀 스크롤바는 미지원 셸 |
| `calendar` | `Calendar` | 달력. 월 이동 + 6주 날짜 격자 직접 구현(role=grid/gridcell), 단일 선택(다중·범위는 미지원) |

### 데이터 시각화·복합 5종

| 이름 | 컴포넌트 | 요점 |
|---|---|---|
| `chart` | `ChartContainer` 외 12종 | 선언형 차트(막대·선·영역 시리즈 + 축·그리드·툴팁·범례). recharts 제거, 렌더러는 `@unikit-bridge/ui/chart` 진입점, 시리즈 색은 `--chart-1..5` 토큰(소비자 소유) |
| `carousel` | `Carousel` 외 4종 | 캐러셀. 네이티브 ScrollView paging / 웹 scroll-snap, ←/→ 글리프 버튼 |
| `sidebar` | `Sidebar` 외 22종 | 사이드바 블록. sheet+collapsible 조립, 원본의 쿠키·컨테이너 쿼리는 제거 |
| `sonner` | `Toaster`·`toast()` | 토스트. 모듈 저장소 큐 + 전역 `toast()` 함수, Portal + role=status 라이브 영역 |
| `spinner` | `Spinner` | 로딩 스피너. View 원호 조형, 웹 `web:animate-spin`(네이티브는 정적) |

### 메시지 계열 5종

| 이름 | 컴포넌트 | 요점 |
|---|---|---|
| `message` | `Message` 외 5종 | 채팅 메시지 레이아웃(아바타·내용·머리/바닥·그룹) |
| `message-scroller` | `MessageScroller` 외 5종+훅 3종 | 메시지 스크롤. 하단 고정·자동 스크롤, 가시성 훅 노출 |
| `bubble` | `Bubble` 외 3종 | 말풍선. 배경 View + 전경 Text 이중 지정, 반응(리액션) 표시 |
| `attachment` | `Attachment` 외 8종 | 첨부 표시(미디어·내용·행동·그룹·트리거) |
| `marker` | `Marker` 외 2종 | 마커(하이라이트). 기본 텍스트 / 구분 변형 |

### 방향 1종

| 이름 | 컴포넌트 | 요점 |
|---|---|---|
| `direction` | `DirectionProvider`·`useDirection` | RTL/LTR 방향 컨텍스트 제공(원본 useDirection 재노출) |

사용 예(오버레이):

```tsx
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@unikit-bridge/ui";

<Dialog>
  <DialogTrigger>열기</DialogTrigger>
  <DialogContent>
    <DialogTitle>제목</DialogTitle>
    <Text className="font-sans text-sm text-muted-foreground">내용</Text>
  </DialogContent>
</Dialog>
```

> 2차 컴포넌트도 전부 `"use client"`가 필요한 클라이언트 컴포넌트예요(열림·드래그 상태를 React state로 들고 있어요).

---

## 테마 — 라이트/다크 토큰

UniKit의 모든 색은 CSS 변수 토큰이에요. 값의 단일 출처는 `packages/unikit/src/theme/tokens.ts`이고, 소비자 프로젝트에서는 [README](../README.md)의 "토큰 받기" 절(`theme` 항목 add 한 줄)로 같은 토큰을 받아요.

### 모노레포 안에서: `UnikitThemeProvider`

앱 최상위에서 감싸면 토큰이 주입되고, `useUnikitTheme` 훅으로 상태를 다뤄요(기본값 라이트, 즉시 전환).

```tsx
import { UnikitThemeProvider, useUnikitTheme } from "@unikit-bridge/ui";

// 앱 루트
<UnikitThemeProvider>
  <App />
</UnikitThemeProvider>

// 컴포넌트 안에서
const { colorScheme, toggleColorScheme, setColorScheme } = useUnikitTheme();
```

전환은 각 플랫폼의 스타일링 엔진에 바인딩돼요 — 웹은 `<html>` 요소의 `.dark` 클래스 토글(표준 Tailwind dark 변형), 네이티브는 uniwind `Uniwind.setTheme()`(시스템 다이얼로그까지 앱 테마를 따르게 해요). 이 패키지(Provider)는 레지스트리에 포함되지 않아서, 복사본 사용자는 토큰 CSS 변수 + `.dark` 클래스로 테마를 다뤄요.

### 토큰 목록 (색 19종 + radius)

토큰 20종의 라이트/다크 **값 전체는 생성 카탈로그 [packages/unikit/docs/tokens.md](../packages/unikit/docs/tokens.md)를 보세요.** 이 문서에는 역할 구조만 요약해요 — 값 사본이 여러 곳에 있으면 어느 순간 어긋나는(드리프트) 위험이 생겨서, 기계 검사되는 카탈로그 한 곳에만 값을 둬요.

- 색 토큰은 **표면/전경 쌍** 구조예요. 기본 `--background`·`--foreground`, 표면 `--card`·`--popover`(popover·dropdown-menu 등 2차 오버레이 계열의 카드 표면), 행동 `--primary`·`--secondary`·`--muted`·`--accent`·`--destructive`가 각각 `-foreground` 짝을 가져요. 테두리는 `--border`(일반)·`--input`(입력창), 키보드 포커스 링은 `--ring`이에요. 색 계열은 zinc예요. 차트 시리즈 색 `--chart-1..5`는 UniKit 토큰이 아니라 소비자 앱이 정의하는 토큰이에요(shadcn 차트 표준 — chart 컴포넌트가 참조해요).
- `--destructive` 라이트값은 WCAG AA 대비 확보를 위해 shadcn 기본 대신 한 단계 진한 red-600 계로 조정했어요(정확한 값은 카탈로그 참조).
- `--radius`는 모서리 반경 기준값이에요. `rounded-md`는 기준값 − 2px, `rounded-lg`는 기준값, Card의 `rounded-xl`은 기준값 + 4px로 파생돼요.

---

## 접근성 공통 (브리지 계약)

UniKit 컴포넌트에 지정하는 접근성 prop이 브리지를 거쳐 각 플랫폼의 표준으로 나가는 방식을 정리한 표예요. **같은 prop을 웹·네이티브 양쪽에서 그대로 써요.**

| 컴포넌트에 지정하는 prop | 웹 DOM 렌더 | 네이티브(React Native) | 비고 |
|---|---|---|---|
| `accessibilityRole="button"` | `role="button"` | `accessibilityRole="button"` | Button이 항상 지정 |
| `accessibilityLabel="…"` | `aria-label="…"` | `accessibilityLabel="…"` | 스크린리더 라벨 |
| `aria-checked`·`aria-selected`·`aria-expanded` | 같은 이름의 ARIA 속성 | `accessibilityState` 객체로 자동 매핑 | 체크·선택·전개 상태(체크박스·탭·아코디언 등) |
| `aria-hidden` | `aria-hidden` | `accessibilityElementsHidden` | 장식용 요소 표시 |
| `nativeID`(Label) | `id="…"` | `nativeID` | Label↔Input 연결에 사용 |
| `accessibilityLabelledBy`(Input) | `aria-labelledby="…"` | `accessibilityLabelledBy` | Label의 `nativeID` 값과 연결 |
| `disabled` | `disabled` 속성 | `disabled`(Pressable)·`editable={false}`(TextInput 치환) | Button·Input이 자동 지정 |
| `hitSlop` | 무시(포인터 정밀도가 높아 불필요) | 터치 타깃 확장 | 44px 최소 보정용 |
| `focus:`/`focus-visible:` 클래스 | Tab 이동 시 포커스 링 | 해당 없음(웹 전용 변형) | Input·Button에 기본 적용 |

지정할 수 있는 역할(`accessibilityRole` 값)은 브리지 타입 `BridgeRole`로 정의돼 있어요 — `button`·`link`·`checkbox`·`radio`·`switch`·`tab`·`tablist`·`separator`·`progressbar`·`alert` 등 두 플랫폼이 공통으로 이해하는 역할이에요. 사이클 40 확장으로 `table`·`row`·`cell`·`columnheader`·`grid`·`gridcell`·`listbox`·`option`·`dialog`·`menu` 계열도 포함됐어요(table·calendar·select·오버레이 계열이 사용). RN이 모르는 역할은 네이티브에서 무시되고 웹에서만 ARIA로 나가요.

터치 타깃: 상호작용 요소는 44×44px 최소를 지켜요. Button은 크기별 `hitSlop`으로 보정하고(위 Button 절의 표), 시각 크기는 그대로예요.
