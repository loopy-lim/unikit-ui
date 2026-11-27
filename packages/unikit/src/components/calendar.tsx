// Calendar — shadcn/ui（new-york-v4） calendar.tsx 유니버설 포팅 （사이클 40, T-2c）.
// 원본: shadcn-ref/ui/calendar.tsx — react-day-picker（DayPicker） 엔진을 제거하고
// 달력（월 이동 + 6주 날짜 격자）을 직접 구현한다.
//
// 포팅 판단（원본 대비 차이이유）:
// - react-day-picker 의존 제거 — 월 표시 상태（기본 오늘, selected 우선）와
//   6행 7열（42칸） 날짜 격자를 직접 렌더한다. mode="single" | "multiple" |
//   "range"를 지원하고 disabled는 CalendarDateMatcher（Date[]·{ from, to }·
//   { before, after }·{ dayOfWeek }·술어）로 받는다（본체 구현 확인 — 이전
//   주석의 "single만 지원·판정 함수 하나로 단순화" 기술은 부실 기록이었다）.
// - 로케일은 한국어 고정（요일 "일월화수목금토", 캡션 "2026년 11월"） — i18n
//   prop은 로드맵. 원본의 RTL 화살표 회전 규칙（rtl:）은 useDirection（direction.tsx
//   컨텍스트 — 원본 radix Direction과 동일 시맨틱）으로 재현했다: rtl에서 이전/다음
//   화살표에 rotate-180을 전개한다.
// - 선택 전환 애니메이션（사이클 40 로드맵 해소）: 선택 셀 배경을 별도 장식 레이어
//   （absolute, aria-hidden）가 담당하며 스케일 0.75→1 · 투명도 0→1 로 팝 전이한다.
//   웹은 transition-all 클래스의 CSS 전이, 네이티브는 같은 클래스가 MotionView
//   （RN Animated）로 구동한다 — 원본의 active:bg-primary/90 프레스 피드백은 이
//   팝 전이로 대체됐다. 웹 prefers-reduced-motion은 전이 클래스를 뺀다.
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
// - 키보드 방향키 탐색captionLayout 드롭다운주 번호（showWeekNumber）은
//   미지원 — 로드맵. 선택 전환 애니메이션은 해소（아래 선택 팝 레이어 판단）.
// - RN 한계: gridrowgridcell 등 role은 RN이 무시한다（웹 스크린리더만
//   이득 — types.ts 계약 주석）, aria-current도 웹 전용 계약이다. 오늘/선택
//   강조는 시각（bg-accentbg-primary）으로도 표현된다.
import { forwardRef, useEffect, useId, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Platform,
  Pressable,
  Text,
  View,
  type BridgePressableRef,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";

import { cn } from "../lib/utils";
import { Button } from "./button";
import { useDirection } from "./direction";

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

function dayKey(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

export type DateRange = {
  from?: Date;
  to?: Date;
};

export type CalendarDateMatcher =
  | Date
  | Date[]
  | { before: Date }
  | { after: Date }
  | { from: Date; to?: Date }
  | ((date: Date) => boolean);

/** 단일·배열·범위(before/after/from~to)·함수 matcher로 날짜 일치 여부를 판정한다. */
export function matchesCalendarDate(
  date: Date,
  matcher?: CalendarDateMatcher | CalendarDateMatcher[],
): boolean {
  if (!matcher) return false;
  if (typeof matcher === "function") return matcher(date);
  if (matcher instanceof Date) return isSameDay(date, matcher);
  if (Array.isArray(matcher)) {
    return matcher.some((item) => matchesCalendarDate(date, item));
  }
  const t = dayKey(date);
  if ("before" in matcher) return t < dayKey(matcher.before);
  if ("after" in matcher) return t > dayKey(matcher.after);
  if ("from" in matcher) {
    const start = dayKey(matcher.from);
    if (matcher.to === undefined) return t === start;
    const end = dayKey(matcher.to);
    return t >= Math.min(start, end) && t <= Math.max(start, end);
  }
  return false;
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

type CalendarBaseProps = Omit<ViewProps, "children"> & {
  /** 표시 월 제어（각 달의 1일로 정규화） */
  month?: Date;
  /** 초기 표시 월 — 없으면 selected, 그것도 없으면 오늘 */
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** 앞뒤 달 날짜 표시 여부（기본 true） */
  showOutsideDays?: boolean;
  /** 비활성 판정 — 함수·단일 Date·배열·{ before | after | from/to } matcher 모두 지원 */
  disabled?: CalendarDateMatcher | CalendarDateMatcher[];
};

export type CalendarProps = CalendarBaseProps &
  (
    | {
        mode?: "single";
        selected?: Date;
        onSelect?: (date: Date) => void;
      }
    | {
        mode: "multiple";
        selected?: Date[];
        onSelect?: (dates: Date[]) => void;
      }
    | {
        mode: "range";
        selected?: DateRange;
        onSelect?: (range: DateRange | undefined) => void;
      }
  );

function resolveInitialSelectedDate(props: CalendarProps): Date | undefined {
  if (props.mode === "multiple") return props.selected?.[0];
  if (props.mode === "range") return props.selected?.from ?? props.selected?.to;
  return props.selected;
}

const Calendar = forwardRef<BridgeViewRef, CalendarProps>(
  (allProps, ref) => {
    const {
      mode = "single",
      selected,
      onSelect,
      month,
      defaultMonth,
      onMonthChange,
      showOutsideDays = true,
      disabled,
      className,
      ...props
    } = allProps;
    const initialAnchor = resolveInitialSelectedDate(allProps);
    // 비제어 월 상태 — 제어（month 지정）면 무시된다.
    const [internalMonth, setInternalMonth] = useState<Date>(() =>
      startOfMonth(defaultMonth ?? initialAnchor ?? new Date()),
    );
    const currentMonth = month !== undefined ? startOfMonth(month) : internalMonth;
    const baseId = useId();
    const captionId = `${baseId}-calendar-caption`;
    // 원본 rtl: 회전 규칙의 재현 근거 — direction.tsx 컨텍스트（radix 시맨틱）.
    const dir = useDirection();
    // 웹 prefers-reduced-motion — 마운트 후 판정（SSR 하이드레이션 불일치 방지）.
    // 네이티브는 MotionView가 AccessibilityInfo.isReduceMotionEnabled으로 준수한다.
    const [reducedMotion, setReducedMotion] = useState(false);
    useEffect(() => {
      if (Platform.OS !== "web") return;
      if (typeof window.matchMedia !== "function") return;
      setReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    }, []);
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
      if (mode === "multiple") {
        const current = Array.isArray(selected) ? selected : [];
        const exists = current.some((d) => isSameDay(d, cell.date));
        const next = exists
          ? current.filter((d) => !isSameDay(d, cell.date))
          : [...current, cell.date];
        (onSelect as ((dates: Date[]) => void) | undefined)?.(next);
        return;
      }
      if (mode === "range") {
        const current = (selected as DateRange | undefined) ?? undefined;
        let next: DateRange;
        if (!current?.from || (current.from && current.to)) {
          next = { from: cell.date, to: undefined };
        } else if (dayKey(cell.date) < dayKey(current.from)) {
          next = { from: cell.date, to: current.from };
        } else {
          next = { from: current.from, to: cell.date };
        }
        (onSelect as ((range: DateRange | undefined) => void) | undefined)?.(next);
        return;
      }
      (onSelect as ((date: Date) => void) | undefined)?.(cell.date);
    };

    const rangeSelected = mode === "range" ? (selected as DateRange | undefined) : undefined;
    const rangeStartKey =
      rangeSelected?.from !== undefined ? dayKey(rangeSelected.from) : null;
    const rangeEndKey =
      rangeSelected?.to !== undefined ? dayKey(rangeSelected.to) : null;
    const multipleSelected =
      mode === "multiple" && Array.isArray(selected) ? selected : null;
    const singleSelected =
      mode === "single" ? (selected as Date | undefined) : undefined;

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
            {/* rtl에서 회전 — 원본 rtl:**:[.rdp-button_previous>svg]:rotate-180 전개 */}
            <ChevronLeftIcon
              className={cn("size-4", dir === "rtl" && "rotate-180")}
            />
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
            {/* rtl에서 회전 — 원본 rtl:**:[.rdp-button_next>svg]:rotate-180 전개 */}
            <ChevronRightIcon
              className={cn("size-4", dir === "rtl" && "rotate-180")}
            />
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
                if (!showOutsideDays && cell.outside) {
                  return (
                    <View
                      key={cell.date.toISOString()}
                      className="flex-1"
                    />
                  );
                }
                const cellKey = dayKey(cell.date);
                const isRangeStart =
                  rangeStartKey !== null && cellKey === rangeStartKey;
                const isRangeEnd =
                  rangeEndKey !== null && cellKey === rangeEndKey;
                const isInRange =
                  rangeStartKey !== null &&
                  rangeEndKey !== null &&
                  cellKey > rangeStartKey &&
                  cellKey < rangeEndKey;
                const isSelected =
                  mode === "range"
                    ? isRangeStart || isRangeEnd
                    : mode === "multiple"
                      ? Boolean(
                          multipleSelected?.some((d) => isSameDay(d, cell.date)),
                        )
                      : singleSelected !== undefined &&
                        isSameDay(cell.date, singleSelected);
                const isToday = isSameDay(cell.date, today);
                const isDisabled = matchesCalendarDate(cell.date, disabled);
                return (
                  <View
                    key={cell.date.toISOString()}
                    accessibilityRole="gridcell"
                    className={cn(
                      "flex-1 items-center justify-center",
                      isInRange && "bg-accent",
                      isRangeStart &&
                        rangeEndKey !== null &&
                        rangeEndKey !== rangeStartKey &&
                        "rounded-l-md bg-accent",
                      isRangeEnd &&
                        rangeStartKey !== null &&
                        rangeEndKey !== rangeStartKey &&
                        "rounded-r-md bg-accent",
                    )}
                  >
                    <Pressable
                      accessibilityRole="button"
                      aria-selected={isSelected || isInRange}
                      aria-current={isToday ? "date" : undefined}
                      disabled={isDisabled}
                      onPress={() => handleSelect(cell)}
                      className={cn(
                        // 원본 Button（ghost） 토큰의 실질 인라인（머리주석 판단）.
                        // 원본 day 셀은 aspect-square·day_button size-8 — 셀을
                        // size-8로 고정해 격자 높이가 콘텐츠로 수축하지 않게 한다.
                        // focus 링은 button 원본 규격（ring-3 무오프셋, 사이클 72）.
                        // relative는 선택 팝 레이어（absolute）의 위치 기준이고,
                        // 선택 배경은 레이어가 담당해 Pressable 배경에서는 뺀다.
                        "relative size-8 flex-row items-center justify-center rounded-md active:bg-accent web:select-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
                        isInRange ? "bg-accent" : "web:hover:bg-accent",
                        !isSelected && !isInRange && isToday && "bg-accent",
                        isDisabled && "opacity-50",
                      )}
                    >
                      {/* 선택 전환 팝 레이어（장식 — aria-hidden）: 선택 배경을 스케일
                          ·투명도 전이로 전개. 웹은 CSS 전이（transition-all）,
                          네이티브는 MotionView（RN Animated）가 style 스케일·투명도를
                          구동한다. 웹 축소 모션은 전이 클래스를 뺀다. */}
                      <View
                        aria-hidden
                        pointerEvents="none"
                        className={cn(
                          "absolute inset-0 rounded-md bg-primary",
                          isSelected && "web:hover:bg-primary/90",
                          !reducedMotion && "transition-all duration-150",
                        )}
                        style={{
                          scale: isSelected ? 1 : 0.75,
                          opacity: isSelected ? 1 : 0,
                        }}
                      />
                      {/* 이중 지정: 전경색은 상태별로 내부 Text에. relative는 웹
                          페인팅 순서용 — 정적 Text는 position:absolute 장식 레이어
                          밑에 묻히므로 위치 요소로 승격해 DOM 순서대로 위에 그린다
                          （네이티브는 후행 형제 우선이라 불필요하지만 무해）. */}
                      <Text
                        className={cn(
                          "relative font-sans text-sm leading-none",
                          isSelected
                            ? "text-primary-foreground"
                            : isInRange
                              ? "text-accent-foreground"
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
