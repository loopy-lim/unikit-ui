"use client";
/**
 * 로그인 블록(웹) — /blocks/login 전체 화면.
 * shadcn login-03(흐린 배경 위 중앙 카드) 구성을 UniKit 컴포넌트로 조립.
 * - 브랜드 마크 + Card(제목·폼·소셜 버튼) + 하단 안내 3단 구성.
 * - 제출·소셜 버튼은 실제 로그인이 없는 데모 — Toaster로 안내한다(거짓 동작 금지).
 * - 좌상단 ← Blocks 알약 + 우상단 테마 토글은 block-chrome의 공용 장치
 *   (Provider 기본이 라이트라 화면 안에서 자체 전환).
 */
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Input,
  Separator,
  toast,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";

import { BackToBlocks, BlockThemeToggle, BrandMark } from "./block-chrome";

export function LoginBlock() {
  return (
    <View className="relative flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <BackToBlocks />
        <BlockThemeToggle />

        {/** 브랜드 — 공용 BrandMark(어시스턴트 셸·대시보드와 같은 마크) */}
        <BrandMark label="UniKit" />

        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>이메일로 계속하세요</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {/** 이메일 */}
            <Field>
              <FieldContent>
                <FieldLabel nativeID="login-email">이메일</FieldLabel>
                <Input
                  accessibilityLabelledBy="login-email"
                  inputMode="email"
                  placeholder="you@unikit.dev"
                />
              </FieldContent>
            </Field>

            {/** 비밀번호 — secureTextEntry는 웹에서 type="password"로 렌더 */}
            <Field>
              <FieldContent>
                <FieldLabel nativeID="login-password">비밀번호</FieldLabel>
                <Input
                  accessibilityLabelledBy="login-password"
                  placeholder="••••••••"
                  secureTextEntry
                />
                <FieldDescription>8자 이상이어야 해요.</FieldDescription>
              </FieldContent>
            </Field>

            {/** 보조 행 — 로그인 유지 + 비밀번호 찾기 */}
            <View className="flex flex-row items-center justify-between gap-2">
              <View className="flex flex-row items-center gap-2">
                <Checkbox
                  defaultChecked
                  accessibilityLabel="로그인 상태 유지"
                />
                <Text className="font-sans text-sm text-foreground">
                  로그인 상태 유지
                </Text>
              </View>
              <Button
                variant="link"
                size="sm"
                onPress={() =>
                  toast.info("데모 화면이에요 — 비밀번호 찾기는 없어요")
                }
              >
                비밀번호 찾기
              </Button>
            </View>

            <Button
              className="w-full"
              onPress={() =>
                toast.info("데모 폼이에요 — 실제 로그인은 일어나지 않아요")
              }
            >
              로그인
            </Button>

            {/** 구분선 — 라벨을 품은 shadcn "또는" 패턴 */}
            <View className="flex flex-row items-center gap-3">
              <Separator className="flex-1" />
              <Text className="font-sans text-xs text-muted-foreground">
                또는
              </Text>
              <Separator className="flex-1" />
            </View>

            <Button
              variant="outline"
              className="w-full"
              onPress={() =>
                toast.info("데모 화면이에요 — GitHub 연동은 없어요")
              }
            >
              GitHub로 계속
            </Button>

            <Text className="text-center font-sans text-xs text-muted-foreground">
              계정이 없나요?{" "}
              <Button
                variant="link"
                size="sm"
                className="px-1"
                onPress={() =>
                  toast.info("데모 화면이에요 — 회원가입은 없어요")
                }
              >
                회원가입
              </Button>
            </Text>
          </CardContent>
        </Card>

      <Text className="font-sans text-xs text-muted-foreground">
        이 화면의 모든 요소는 @unikit-bridge/ui 컴포넌트예요.
      </Text>
    </View>
  );
}
