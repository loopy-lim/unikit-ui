"use client";

import { useState } from "react";
import { cn } from "@unikit-bridge/ui";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NativeSelect,
  NativeSelectOption,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { outlineTriggerClass } from "../section";
import type { ShowcaseDemo } from "./types";

export const commandDemo: ShowcaseDemo = {
  Demo: function CommandDemo() {
    return (
      <View className="w-full max-w-sm rounded-md border">
        <Command>
          <CommandInput placeholder="검색…" />
          <CommandList>
            <CommandEmpty>결과 없음</CommandEmpty>
            <CommandGroup heading="명령">
              <CommandItem>저장</CommandItem>
              <CommandItem>프로필</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </View>
    );
  },
  code: `import { Command, CommandInput, CommandList, CommandItem } from "@unikit-bridge/ui";

<Command><CommandInput /><CommandList><CommandItem>항목</CommandItem></CommandList></Command>`,
};

export const comboboxDemo: ShowcaseDemo = {
  Demo: function ComboboxDemo() {
    const [value, setValue] = useState("");
    return (
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxTrigger className={cn(outlineTriggerClass, "h-9 w-40 justify-between")}>
          <ComboboxValue placeholder="과일" />
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>없음</ComboboxEmpty>
            <ComboboxGroup>
              <ComboboxItem value="apple">사과</ComboboxItem>
              <ComboboxItem value="banana">바나나</ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
  code: `import { Combobox, ComboboxTrigger, ComboboxContent, ComboboxItem } from "@unikit-bridge/ui";

<Combobox value={v} onValueChange={setV}><ComboboxTrigger /></Combobox>`,
};

export const menubarDemo: ShowcaseDemo = {
  Demo: function MenubarDemo() {
    return (
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>파일</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>새 문서</MenubarItem>
            <MenubarItem>저장</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );
  },
  code: `import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@unikit-bridge/ui";

<Menubar><MenubarMenu value="f"><MenubarTrigger>파일</MenubarTrigger></MenubarMenu></Menubar>`,
};

export const navigationMenuDemo: ShowcaseDemo = {
  Demo: function NavigationMenuDemo() {
    return (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem value="home">
            <NavigationMenuLink active onPress={() => {}}>
              쇼케이스
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="docs">
            <NavigationMenuLink onPress={() => {}}>
              문서
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  },
  code: `import { NavigationMenu, NavigationMenuList, NavigationMenuLink } from "@unikit-bridge/ui";

<NavigationMenu><NavigationMenuList><NavigationMenuLink>링크</NavigationMenuLink></NavigationMenuList></NavigationMenu>`,
};

export const selectDemo: ShowcaseDemo = {
  Demo: function SelectDemo() {
    const [lang, setLang] = useState("");
    return (
      <Select value={lang} onValueChange={setLang}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="언어" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ko">한국어</SelectItem>
          <SelectItem value="en">영어</SelectItem>
        </SelectContent>
      </Select>
    );
  },
  code: `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@unikit-bridge/ui";

<Select><SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger></Select>`,
};

export const nativeSelectDemo: ShowcaseDemo = {
  Demo: function NativeSelectDemo() {
    return (
      <NativeSelect defaultValue="seoul" className="w-40">
        <NativeSelectOption value="seoul">서울</NativeSelectOption>
        <NativeSelectOption value="busan">부산</NativeSelectOption>
      </NativeSelect>
    );
  },
  code: `import { NativeSelect, NativeSelectOption } from "@unikit-bridge/ui";

<NativeSelect defaultValue="a"><NativeSelectOption value="a">A</NativeSelectOption></NativeSelect>`,
};
