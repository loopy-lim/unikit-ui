"use client";
// 사이클 40 신규 섹션 — 폼 티어(3): InputOTP(부분 입력→완성)·InputGroup·Slider·
// Calendar(월 이동·선택일)·Form(react-hook-form — 초기·오류(FormMessage+
// aria-invalid)·제출 중 spinner). 상태 시나리오(설계 §8) 폼 항목 전체.
import { useState } from "react";
import { toast } from "@unikit-bridge/ui";
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Calendar,
  Slider,
  Spinner,
} from "@unikit-bridge/ui";
import { Text, View } from "@unikit-bridge/ui/primitives";
import { useForm } from "react-hook-form";

import { DemoLabel, Hint, Section } from "./section";

/** 가입 폼 값 — react-hook-form 제네릭에 쓰인다 */
type SignupFormValues = {
  nickname: string;
};

/** Section: 폼 확장 — InputOTP · InputGroup · Slider · Calendar · Form */
export function FormInputsSection() {
  // InputOTP — 부분 입력 → 완성 전환 관찰용 상태
  const [otp, setOtp] = useState("");
  // Slider — 값 표시용 상태
  const [volume, setVolume] = useState(40);
  // Calendar — 선택일 상태
  const [date, setDate] = useState<Date | undefined>(undefined);

  // Form — react-hook-form 연동(제출 중 spinner·오류 메시지)
  const form = useForm<SignupFormValues>({
    defaultValues: { nickname: "" },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    // 제출 중 상태 관찰을 위해 인위적으로 1.2초 기다린다.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    toast.success(`가입 완료 — 닉네임: ${values.nickname}`);
    form.reset();
  });

  return (
    <Section
      title="폼 확장 — InputOTP · InputGroup · Slider · Calendar · Form"
      description="값을 입력하고 고르는 컨트롤이에요. 상태에 따라 모습이 바뀌어요."
    >
      {/* InputOTP — 부분 입력 → 완성(6자리) */}
      <DemoLabel>InputOTP — 부분 입력 → 완성</DemoLabel>
      <View className="flex flex-col gap-2">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          accessibilityLabel="인증 번호 6자리"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <Hint>
          {otp.length === 6
            ? "완성 — 6자리가 모두 찼어요."
            : `${otp.length}/6 입력됨 — 다 채우면 완성 상태로 바뀌어요.`}
        </Hint>
      </View>

      {/* InputGroup — 좌측 안내어 · 우측 버튼 애드온 */}
      <DemoLabel>InputGroup</DemoLabel>
      <View className="flex flex-col gap-3">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="unikit.dev" />
        </InputGroup>
        <InputGroup>
          <InputGroupInput placeholder="example@unikit.dev" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="sm">중복 확인</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </View>

      {/* Slider — 값 추적 + 비활성 */}
      <DemoLabel>Slider</DemoLabel>
      <View className="flex flex-col gap-2">
        <Slider
          value={[volume]}
          onValueChange={(next) => setVolume(next[0] ?? 0)}
          accessibilityLabel="음량"
        />
        <Text className="font-sans text-xs text-muted-foreground">
          음량: {volume}
        </Text>
        <Slider defaultValue={[70]} disabled accessibilityLabel="비활성 슬라이더" />
      </View>

      {/* Calendar — 월 이동(‹ ›)·선택일 */}
      <DemoLabel>Calendar — 월 이동 · 선택일</DemoLabel>
      <View className="flex flex-row flex-wrap items-start gap-4">
        <Calendar selected={date} onSelect={setDate} />
        <Text className="font-sans text-xs text-muted-foreground">
          선택일:{" "}
          {date
            ? `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
            : "없음 — 날짜를 눌러 보세요"}
        </Text>
      </View>

      {/* Form — 초기·오류(FormMessage + aria-invalid)·제출 중 spinner */}
      <DemoLabel>Form — react-hook-form</DemoLabel>
      <Form {...form}>
        <View className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="nickname"
            rules={{
              required: "닉네임을 입력해 주세요.",
              minLength: { value: 2, message: "두 글자 이상 입력해 주세요." },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>닉네임</FormLabel>
                <FormControl>
                  <Input
                    placeholder="예: 루피"
                    value={field.value}
                    onChangeText={field.onChange}
                  />
                </FormControl>
                <FormDescription>다른 사람에게 보이는 이름이에요.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <View className="flex flex-row items-center gap-3">
            <Button onPress={onSubmit} disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Spinner className="size-4 border-primary-foreground border-t-transparent" />
              ) : null}
              {form.formState.isSubmitting ? "가입 중…" : "가입하기"}
            </Button>
            <Hint>
              빈 값 제출 → 오류 메시지(FormMessage)와 붉은 라벨, 입력창
              aria-invalid. 정상 제출 → 1.2초 spinner 후 완료 토스트.
            </Hint>
          </View>
        </View>
      </Form>
    </Section>
  );
}
