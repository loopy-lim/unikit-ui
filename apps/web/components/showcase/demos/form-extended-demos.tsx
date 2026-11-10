"use client";

import { useState } from "react";
import {
  Button,
  Calendar,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Slider,
  Spinner,
} from "@unikit-bridge/ui";
import { View } from "@unikit-bridge/ui/primitives";
import { useForm } from "react-hook-form";

import type { ShowcaseDemo } from "./types";

export const inputOtpDemo: ShowcaseDemo = {
  Demo: function InputOtpDemo() {
    const [otp, setOtp] = useState("");
    return (
      <InputOTP
        maxLength={4}
        value={otp}
        onChange={setOtp}
        accessibilityLabel="인증번호"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    );
  },
  code: `import { InputOTP, InputOTPGroup, InputOTPSlot } from "@unikit-bridge/ui";

<InputOTP maxLength={6}><InputOTPGroup><InputOTPSlot index={0} /></InputOTPGroup></InputOTP>`,
};

export const inputGroupDemo: ShowcaseDemo = {
  Demo: function InputGroupDemo() {
    return (
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="unikit.dev" />
      </InputGroup>
    );
  },
  code: `import { InputGroup, InputGroupInput, InputGroupText } from "@unikit-bridge/ui";

<InputGroup><InputGroupText>https://</InputGroupText><InputGroupInput /></InputGroup>`,
};

export const sliderDemo: ShowcaseDemo = {
  Demo: function SliderDemo() {
    const [volume, setVolume] = useState(40);
    return (
      <Slider
        value={[volume]}
        onValueChange={(n) => setVolume(n[0] ?? 0)}
        accessibilityLabel="음량"
      />
    );
  },
  code: `import { Slider } from "@unikit-bridge/ui";

<Slider defaultValue={[50]} accessibilityLabel="값" />`,
};

export const calendarDemo: ShowcaseDemo = {
  Demo: function CalendarDemo() {
    const [date, setDate] = useState<Date | undefined>();
    return <Calendar selected={date} onSelect={setDate} />;
  },
  code: `import { Calendar } from "@unikit-bridge/ui";

<Calendar selected={date} onSelect={setDate} />`,
};

type NicknameForm = { nickname: string };

export const formDemo: ShowcaseDemo = {
  Demo: function FormDemo() {
    const form = useForm<NicknameForm>({ defaultValues: { nickname: "" } });
    const onSubmit = form.handleSubmit(() => form.reset());
    return (
      <Form {...form}>
        <View className="gap-3">
          <FormField
            control={form.control}
            name="nickname"
            rules={{ required: "필수예요." }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>닉네임</FormLabel>
                <FormControl>
                  <Input
                    placeholder="루피"
                    value={field.value}
                    onChangeText={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button onPress={onSubmit} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Spinner className="size-4" /> : null}
            제출
          </Button>
        </View>
      </Form>
    );
  },
  code: `import { Form, FormField, FormItem, FormLabel } from "@unikit-bridge/ui";

<Form {...form}><FormField control={form.control} name="x" render={...} /></Form>`,
};
