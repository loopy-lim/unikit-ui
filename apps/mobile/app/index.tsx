import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Button,
  useUnikitTheme,
} from "@unikit-bridge/ui";
import { Pressable, ScrollView, Text, View } from "@unikit-bridge/ui/primitives";

import { deleteDoc, listDocs, nextDocName, type DocMeta } from "../lib/storage";

const formatMonthDay = (ms: number): string => {
  if (!ms) return "";
  // expo-file-system modificationTime은 이미 epoch 밀리초다.
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function DocumentList() {
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const { colorScheme, toggleColorScheme } = useUnikitTheme();
  // 엣지투엣지 창 — 상단 여백은 상태 표시줄 실측 insets(에디터 헤더와 같은 규칙).
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      setDocs(listDocs());
    }, []),
  );

  const openEditor = (name: string | null) => {
    if (name) {
      router.push({ pathname: "/editor", params: { file: name } });
    } else {
      router.push({ pathname: "/editor" });
    }
  };

  const confirmDelete = (doc: DocMeta) => {
    Alert.alert("문서 삭제", `"${doc.title}"을 지울까? 되돌릴 수 없어.`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          deleteDoc(doc.name);
          setDocs(listDocs());
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center gap-2 px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Text className="flex-1 text-2xl font-semibold text-foreground">문서</Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={toggleColorScheme}
        >
          {colorScheme === "dark" ? "라이트" : "다크"}
        </Button>
        <Button size="sm" onPress={() => openEditor(null)}>
          새 문서
        </Button>
      </View>

      {docs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Empty className="w-full max-w-sm flex-none rounded-lg border border-dashed border-border p-8">
            <EmptyHeader>
              <EmptyMedia>◻</EmptyMedia>
              <EmptyTitle>아직 문서가 없어</EmptyTitle>
              <EmptyDescription>새 문서를 만들어 마크다운으로 적어 봐.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </View>
      ) : (
        <ScrollView contentContainerClassName="pb-8">
          {docs.map((doc) => (
            <Pressable
              key={doc.name}
              onPress={() => openEditor(doc.name)}
              onLongPress={() => confirmDelete(doc)}
              className="border-b border-border px-4 py-4 web:hover:bg-accent active:bg-accent"
            >
              <Text className="text-base font-medium text-foreground">{doc.title}</Text>
              <Text className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {doc.preview || "(빈 문서)"}
              </Text>
              {formatMonthDay(doc.mtimeMs) ? (
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  {formatMonthDay(doc.mtimeMs)}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
