// 사이클 40 신규(엑스포) — 명령·탐색·선택 티어: Command(필터 있음/빈 결과
// 전환)·Combobox(단일 선택)·Menubar·NavigationMenu·Select(선택 전/선택됨)·
// NativeSelect. 카탈로그 재구성: 컴포넌트별 CatalogEntry로 분리.
import { useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { cn } from "@unikit-bridge/ui";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NativeSelect,
  NativeSelectOption,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@unikit-bridge/ui";

import type { CatalogEntry } from "./catalog";
import { Hint, outlineTriggerClass } from "./section";

/** 슬라이드 본문 공통 세로 간격 래퍼 */
function Stack({ children }: { children: ReactNode }) {
  return <View className="flex flex-col gap-4">{children}</View>;
}

/** Command — 검색 필터: 결과 있음 ↔ CommandEmpty 전환 */
function CommandDemo() {
  return (
    <View className="gap-2">
      <View className="rounded-md border">
        <Command>
          <CommandInput placeholder="명령을 검색해 보세요 (예: 색)" />
          <CommandList>
            <CommandEmpty>결과가 없어요 — 다른 검색어를 써 보세요.</CommandEmpty>
            <CommandGroup heading="제안">
              <CommandItem>색상 전환</CommandItem>
              <CommandItem>
                저장 <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
              <CommandItem disabled>관리자 콘솔 (비활성)</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="설정">
              <CommandItem>프로필 편집</CommandItem>
              <CommandItem>바로가기 보기</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </View>
      <Hint>
        매칭이 하나도 없으면 목록이 &quot;결과가 없어요&quot;(CommandEmpty)로
        바뀌어요.
      </Hint>
    </View>
  );
}

/** Combobox — 단일 선택(값 + 라벨 조회) */
function ComboboxDemo() {
  const [fruit, setFruit] = useState("");
  return (
    <View className="flex flex-row flex-wrap items-center gap-3">
      <Combobox value={fruit} onValueChange={setFruit}>
        <ComboboxTrigger className={cn(outlineTriggerClass, "h-9 w-44 justify-between")}>
          <ComboboxValue placeholder="과일 선택" />
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="과일 검색" />
          <ComboboxList>
            <ComboboxEmpty>결과가 없어요</ComboboxEmpty>
            <ComboboxGroup>
              <ComboboxLabel>과일</ComboboxLabel>
              <ComboboxItem value="apple">사과</ComboboxItem>
              <ComboboxItem value="banana">바나나</ComboboxItem>
              <ComboboxItem value="cherry">체리</ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Text className="font-sans text-xs text-muted-foreground">
        선택됨: {fruit || "없음"}
      </Text>
    </View>
  );
}

/** Menubar — 상단 메뉴바(서브메뉴 + 비활성 항목) */
function MenubarDemo() {
  return (
    <Menubar>
      <MenubarMenu value="file">
        <MenubarTrigger>
          <Text>파일</Text>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            새 문서 <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>가져오기 (비활성)</MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>
              <Text>내보내기</Text>
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>PDF</MenubarItem>
              <MenubarItem>이미지</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger>
          <Text>편집</Text>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>되돌리기</MenubarItem>
          <MenubarItem>다시 실행</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

/** NavigationMenu — 트리거 콘텐츠 팝업 + 링크 항목 */
function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem value="components">
          <NavigationMenuTrigger>
            <Text>컴포넌트</Text>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <View className="flex w-56 flex-col gap-1">
              <NavigationMenuLink active onPress={() => {}}>
                쇼케이스
              </NavigationMenuLink>
              <NavigationMenuLink onPress={() => {}}>레지스트리</NavigationMenuLink>
              <NavigationMenuLink disabled onPress={() => {}}>
                변경 이력 (준비 중)
              </NavigationMenuLink>
            </View>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="guide">
          <NavigationMenuLink onPress={() => {}}>
            시작하기
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

/** Select — 선택 전(placeholder) ↔ 선택됨 */
function SelectDemo() {
  const [language, setLanguage] = useState("");
  return (
    <Stack>
      <View className="flex flex-row flex-wrap gap-6">
        <View className="flex flex-col gap-2">
          <Text className="font-sans text-xs text-muted-foreground">
            선택 전 — placeholder
          </Text>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="언어 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="en">영어</SelectItem>
              <SelectItem value="ja">일본어</SelectItem>
              <SelectItem value="etc" disabled>
                기타 (준비 중)
              </SelectItem>
            </SelectContent>
          </Select>
        </View>
        <View className="flex flex-col gap-2">
          <Text className="font-sans text-xs text-muted-foreground">
            선택됨 — 기본값 지정
          </Text>
          <Select defaultValue="ko">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="en">영어</SelectItem>
              <SelectItem value="ja">일본어</SelectItem>
            </SelectContent>
          </Select>
        </View>
      </View>
      <Hint>
        선택 전 셀렉트를 고르면 값이 &quot;{language || "없음"}&quot;으로
        바뀌어요.
      </Hint>
    </Stack>
  );
}

/** NativeSelect — 플랫폼 기본 선택 + 비활성(옵션·전체) */
function NativeSelectDemo() {
  return (
    <View className="flex flex-row flex-wrap gap-6">
      <View className="flex w-40 flex-col gap-2">
        <Text className="font-sans text-xs text-muted-foreground">
          NativeSelect
        </Text>
        <NativeSelect defaultValue="seoul">
          <NativeSelectOption value="seoul">서울</NativeSelectOption>
          <NativeSelectOption value="busan">부산</NativeSelectOption>
          <NativeSelectOption value="jeju" disabled>
            제주 (준비 중)
          </NativeSelectOption>
        </NativeSelect>
      </View>
      <View className="flex w-40 flex-col gap-2">
        <Text className="font-sans text-xs text-muted-foreground">
          비활성 (전체)
        </Text>
        <NativeSelect disabled defaultValue="lock">
          <NativeSelectOption value="lock">잠긴 선택</NativeSelectOption>
        </NativeSelect>
      </View>
    </View>
  );
}

/** 명령·탐색·선택 엔트리 */
export const COMMAND_ENTRIES: CatalogEntry[] = [
  {
    slug: "command",
    title: "Command",
    subtitle: "명령 팔레트",
    category: "명령·탐색",
    description: "검색으로 명령을 찾아요.",
    slides: [{ name: "검색 필터", element: <CommandDemo /> }],
  },
  {
    slug: "combobox",
    title: "Combobox",
    subtitle: "콤보박스",
    category: "명령·탐색",
    description: "검색 가능한 선택 상자예요.",
    slides: [{ name: "단일 선택", element: <ComboboxDemo /> }],
  },
  {
    slug: "menubar",
    title: "Menubar",
    subtitle: "메뉴바",
    category: "명령·탐색",
    description: "화면 상단 메뉴 모음이에요.",
    slides: [{ name: "서브메뉴 포함", element: <MenubarDemo /> }],
  },
  {
    slug: "navigation-menu",
    title: "NavigationMenu",
    subtitle: "네비게이션 메뉴",
    category: "명령·탐색",
    description: "탐색 링크와 팝업 콘텐츠를 담아요.",
    slides: [{ name: "링크 + 팝업", element: <NavigationMenuDemo /> }],
  },
  {
    slug: "select",
    title: "Select",
    subtitle: "셀렉트",
    category: "선택",
    description: "목록에서 하나를 골라요.",
    slides: [{ name: "선택 전 · 선택됨", element: <SelectDemo /> }],
  },
  {
    slug: "native-select",
    title: "NativeSelect",
    subtitle: "플랫폼 기본 선택",
    category: "선택",
    description: "운영체제 기본 모양의 선택 상자예요.",
    slides: [{ name: "기본 · 비활성", element: <NativeSelectDemo /> }],
  },
];
