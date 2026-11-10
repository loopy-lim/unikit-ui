"use client";
// 사이클 40 신규 섹션 — 명령·탐색 티어(2): Command(필터 있음/빈 결과 전환)·
// Combobox(단일 선택)·Menubar·NavigationMenu·Select(선택 전/선택됨)·NativeSelect.
// 상태 시나리오(설계 §8): command 필터 결과 있음·CommandEmpty, select·
// native-select 선택 전·선택됨, 비활성(메뉴·옵션 disabled).
import { useState } from "react";
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
import { Text, View } from "@unikit-bridge/ui/primitives";

import { DemoLabel, Hint, Section, outlineTriggerClass } from "./section";

/** Section: 명령·탐색 — Command · Combobox · Menubar · NavigationMenu */
export function CommandNavigationSection() {
  // Combobox 단일 선택 상태(선택 전 "" ↔ 선택됨 값)
  const [fruit, setFruit] = useState("");

  return (
    <Section
      title="명령·탐색 — Command · Combobox · Menubar · NavigationMenu"
      description="검색으로 명령을 찾고 항목을 골라요."
    >
      {/* Command — 검색 필터: 결과 있음 ↔ CommandEmpty 전환 */}
      <DemoLabel>Command</DemoLabel>
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

      {/* Combobox — 단일 선택(값 + 라벨 조회) */}
      <DemoLabel>Combobox (단일 선택)</DemoLabel>
      <View className="flex flex-row flex-wrap items-center gap-3">
        <Combobox value={fruit} onValueChange={setFruit}>
          <ComboboxTrigger className={cn(outlineTriggerClass, "w-44 justify-between")}>
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

      {/* Menubar — 상단 메뉴바(서브메뉴 + 비활성 항목) */}
      <DemoLabel>Menubar</DemoLabel>
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>파일</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              새 문서 <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled>가져오기 (비활성)</MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>내보내기</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>PDF</MenubarItem>
                <MenubarItem>이미지</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger>편집</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>되돌리기</MenubarItem>
            <MenubarItem>다시 실행</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* NavigationMenu — 트리거 콘텐츠 팝업 + 링크 항목 */}
      <DemoLabel>NavigationMenu</DemoLabel>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem value="components">
            <NavigationMenuTrigger>컴포넌트</NavigationMenuTrigger>
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
    </Section>
  );
}

/** Section: 선택 상자 — Select(선택 전/선택됨) · NativeSelect */
export function SelectSection() {
  const [language, setLanguage] = useState("");

  return (
    <Section
      title="선택 상자 — Select · NativeSelect"
      description="목록에서 하나를 골라요. 선택 전(placeholder)과 선택됨을 나란히 둬요."
    >
      <View className="flex flex-row flex-wrap gap-6">
        {/* Select — 선택 전(placeholder) */}
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
        {/* Select — 선택됨(defaultValue, ✓ 표시자) */}
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

      {/* NativeSelect — 플랫폼 기본 선택 + 비활성(옵션·전체) */}
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
    </Section>
  );
}
