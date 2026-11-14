// Calendar — shadcn/ui（new-york-v4） calendar.tsx 유니버설 포팅 （사이클 40, T-2c）.
// 원본: shadcn-ref/ui/calendar.tsx — react-day-picker（DayPicker） 엔진을 제거하고
// 달력（월 이동 + 6주 날짜 격자）을 직접 구현한다.
//
// 포팅 판단（원본 대비 차이이유）:
// - react-day-picker 의존 제거 — 월 표시 상태（기본 오늘, selected 우선）와
//   6행 7열（42칸） 날짜 격자를 직접 렌더한다. mode="single"만 지원하며
//   다중 선택범위 선택（range_*）은 미지원 — 로드맵 기록. 원본의 matcher 기반
//   disabled（matchers 체계）는 판정 함수 disabled?（date） 하나로 단순화했다.
// - 로케일은 한국어 고정（요일 "일월화수목금토", 캡션 "2026년 11월"） — i18n
//   prop은 로드맵. 원본의 RTL 화살표 회전 규칙（rtl:）은 제거（SVG 아이콘 고정）.
// - 접근성: 루트 role="grid", 요일 헤더 role="columnheader", 주 role="row",
//   날짜 칸 role="gridcell" — 전부 bridge role 계약（types.ts）에 포함돼 있다.
//   날짜의 aria-selectedaria-current="date"는 원본과 같이 gridcell이 아니라
//   내부 Pressable（날짜 버튼）에 부여한다（ViewProps 계약에 두 속성이 없고
//   react-day-picker도 버튼에 둔다）. 그리드 이름은 캡션 nativeID ↔ 루트
//   aria-labelledby로 연결한다.
// - 원본 셀 크기 CSS 변수 ［--cell-size:--spacing（8）］（2rem）은 표준 계단
//   size-8（32px）로 고정（임의값변수 금지）. 요일 텍스트 text-［0.8rem］은
//   text-xs에 근사. dark: 변형 토큰은 관행대로 제거.
// - 이전/다음 월 버튼은 ./button의 Button（variant="ghost"） 재사용 — 원본이
//   buttonVariants를 쓴 것과 동일한 관계（방향 아이콘은 브리지 SVG
//   ChevronLeftIcon/ChevronRightIcon 프리미티브）. 날짜 셀은 상태별 전경색을 내부 Text에
//   줘야 해서（이중 지정 원칙） Button을 못 쓰고 Pressable에 ghost 토큰의 실질
//   （hover/active/focus-visible정렬）을 인라인 재현했다 — buttonVariants의
//   size 기본값（h-10 px-4 py-2）이 셀 형태（aspect-square w-full）와 경합해서
//   합성이 불가하다.
// - 원본 showOutsideDays 기본값（true） 유지 — 42칸에 앞뒤 달 날짜가 함께
//   렌더되고（muted）, 누르면 그 달로 이동하며 선택한다（원본 동작）.
// - 키보드 방향키 탐색captionLayout 드롭다운주 번호（showWeekNumber）
//   선택 애니메이션은 미지원 — 로드맵.
// - RN 한계: gridrowgridcell 등 role은 RN이 무시한다（웹 스크린리더만
//   이득 — types.ts 계약 주석）, aria-current도 웹 전용 계약이다. 오늘/선택
//   강조는 시각（bg-accentbg-primary）으로도 표현된다.
import { forwardRef, useId, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Pressable,
  Text,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "@/lib/utils";
import { Button } from "./button";

// 요일 라벨 — 일요일 시작（한국어 고정）
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const WEEK_COUNT = 6;

type DayCell = {
  date: Date;
  /** 표시 중인 달이 아닌 날（앞뒤 달 — 원본 outside） */
  outside: boolean;
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// 6행 7열 격자 — 첫 칸은 1일이 속한 주의 일요일（42칸이면 달 끝까지 빈칸이 없다）
function buildMonthWeeks(month: Date): DayCell[][] {
  const first = startOfMonth(month);
  const start = new Date(
    first.getFullYear(),
    first.getMonth(),
    1 - first.getDay(),
  );
  return Array.from({ length: WEEK_COUNT }, (_, weekIndex) =>
    Array.from({ length: WEEKDAY_LABELS.length }, (_, dayIndex) => {
      const date = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + weekIndex * 7 + dayIndex,
      );
      return { date, outside: date.getMonth() !== first.getMonth() };
    }),
  );
}

function formatMonthLabel(month: Date): string {
  return `${month.getFullYear()}년 ${month.getMonth() + 1}월`;
}

export type CalendarProps = Omit<ViewProps, "children"> & {
  /** 선택된 날짜（mode="single"） */
  selected?: Date;
  /** 날짜 선택 콜백 — 원본 onSelect（date, ） 신호에서 단일 인자로 단순화 */
  onSelect?: (date: Date) => void;
  /** 표시 월 제어（각 달의 1일로 정규화） */
  month?: Date;
  /** 초기 표시 월 — 없으면 selected, 그것도 없으면 오늘 */
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** 비활성 판정 함수 — 원본의 DayPicker matcher 체계 대신 predicate */
  disabled?: (date: Date) => boolean;
};

const Calendar = forwardRef<BridgeViewRef, CalendarProps>(
  (
    {
      selected,
      onSelect,
      month,
      defaultMonth,
      onMonthChange,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    // 비제어 월 상태 — 제어（month 지정）면 무시된다.
    const [internalMonth, setInternalMonth] = useState<Date>(() =>
      startOfMonth(defaultMonth ?? selected ?? new Date()),
    );
    const currentMonth = month !== undefined ? startOfMonth(month) : internalMonth;
    const baseId = useId();
    const captionId = `${baseId}-calendar-caption`;
    // 오늘 판정 기준 — 마운트 시점 하루로 고정（불필요한 리렌더 판정 방지 관행）
    const today = useMemo(() => new Date(), []);
    const weeks = useMemo(() => buildMonthWeeks(currentMonth), [currentMonth]);

    const goToMonth = (next: Date) => {
      const normalized = startOfMonth(next);
      if (month === undefined) setInternalMonth(normalized);
      onMonthChange?.(normalized);
    };

    const handleSelect = (cell: DayCell) => {
      // 앞뒤 달 날짜는 월을 넘겨가며 선택（원본 outside day 동작）
      if (cell.outside) goToMonth(cell.date);
      onSelect?.(cell.date);
    };

    return (
      <View
        ref={ref}
        accessibilityRole="grid"
        aria-labelledby={captionId}
        className={cn("native:self-start bg-background p-3 web:w-fit", className)}
        {...props}
      >
        {/* 상단 — 이전 월  캡션  다음 월（원본 nav absolute 구조는 평면화） */}
        <View className="flex-row items-center justify-between gap-1">
          <Button
            variant="ghost"
            className="size-8 p-0"
            accessibilityLabel="이전 달"
            onPress={() => goToMonth(addMonths(currentMonth, -1))}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Text
            nativeID={captionId}
            className="font-sans text-sm font-medium text-foreground web:select-none"
          >
            {formatMonthLabel(currentMonth)}
          </Text>
          <Button
            variant="ghost"
            className="size-8 p-0"
            accessibilityLabel="다음 달"
            onPress={() => goToMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </View>

        {/* 요일 헤더 행 */}
        <View accessibilityRole="row" className="mt-4 flex-row">
          {WEEKDAY_LABELS.map((label) => (
            <View
              key={label}
              accessibilityRole="columnheader"
              className="flex-1 items-center rounded-md"
            >
              {/* 원본 text-［0.8rem］ → text-xs 근사（임의값 금지） */}
              <Text className="font-sans text-xs font-normal text-muted-foreground web:select-none">
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* 6주 날짜 격자 */}
        <View>
          {weeks.map((week, weekIndex) => (
            <View
              key={weekIndex}
              accessibilityRole="row"
              className="mt-2 flex-row"
            >
              {week.map((cell) => {
                const isSelected =
                  selected !== undefined && isSameDay(cell.date, selected);
                const isToday = isSameDay(cell.date, today);
                const isDisabled = disabled?.(cell.date) ?? false;
                return (
                  <View
                    key={cell.date.toISOString()}
                    accessibilityRole="gridcell"
                    className="flex-1 items-center justify-center"
                  >
                    <Pressable
                      accessibilityRole="button"
                      aria-selected={isSelected}
                      aria-current={isToday ? "date" : undefined}
                      disabled={isDisabled}
                      onPress={() => handleSelect(cell)}
                      className={cn(
                        // 원본 Button（ghost） 토큰의 실질 인라인（머리주석 판단）.
                        // 원본 day 셀은 aspect-square·day_button size-8 — 셀을
                        // size-8로 고정해 격자 높이가 콘텐츠로 수축하지 않게 한다.
                        // focus 링은 button 원본 규격（ring-3 무오프셋, 사이클 72）.
                        "size-8 flex-row items-center justify-center rounded-md active:bg-accent web:select-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
                        isSelected
                          ? "bg-primary web:hover:bg-primary/90 active:bg-primary/90"
                          : "web:hover:bg-accent",
                        !isSelected && isToday && "bg-accent",
                        isDisabled && "opacity-50",
                      )}
                    >
                      {/* 이중 지정: 전경색은 상태별로 내부 Text에 */}
                      <Text
                        className={cn(
                          "font-sans text-sm leading-none",
                          isSelected
                            ? "text-primary-foreground"
                            : isToday
                              ? "text-accent-foreground"
                              : cell.outside || isDisabled
                                ? "text-muted-foreground"
                                : "text-foreground",
                        )}
                      >
                        {cell.date.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  },
);
Calendar.displayName = "Calendar";

export { Calendar };
