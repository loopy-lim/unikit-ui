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

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const WEEK_COUNT = 6;

type DayCell = {
  date: Date;

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

  month?: Date;

  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;

  showOutsideDays?: boolean;

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

    const [internalMonth, setInternalMonth] = useState<Date>(() =>
      startOfMonth(defaultMonth ?? initialAnchor ?? new Date()),
    );
    const currentMonth = month !== undefined ? startOfMonth(month) : internalMonth;
    const baseId = useId();
    const captionId = `${baseId}-calendar-caption`;

    const dir = useDirection();

    const [reducedMotion, setReducedMotion] = useState(false);
    useEffect(() => {
      if (Platform.OS !== "web") return;
      if (typeof window.matchMedia !== "function") return;
      setReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    }, []);

    const today = useMemo(() => new Date(), []);
    const weeks = useMemo(() => buildMonthWeeks(currentMonth), [currentMonth]);

    const goToMonth = (next: Date) => {
      const normalized = startOfMonth(next);
      if (month === undefined) setInternalMonth(normalized);
      onMonthChange?.(normalized);
    };

    const handleSelect = (cell: DayCell) => {

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

        <View className="flex-row items-center justify-between gap-1">
          <Button
            variant="ghost"
            className="size-8 p-0"
            accessibilityLabel="이전 달"
            onPress={() => goToMonth(addMonths(currentMonth, -1))}
          >

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

            <ChevronRightIcon
              className={cn("size-4", dir === "rtl" && "rotate-180")}
            />
          </Button>
        </View>

        <View accessibilityRole="row" className="mt-4 flex-row">
          {WEEKDAY_LABELS.map((label) => (
            <View
              key={label}
              accessibilityRole="columnheader"
              className="flex-1 items-center rounded-md"
            >

              <Text className="font-sans text-xs font-normal text-muted-foreground web:select-none">
                {label}
              </Text>
            </View>
          ))}
        </View>

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

                        "relative size-8 flex-row items-center justify-center rounded-md active:bg-accent web:select-none web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
                        isInRange ? "bg-accent" : "web:hover:bg-accent",
                        !isSelected && !isInRange && isToday && "bg-accent",
                        isDisabled && "opacity-50",
                      )}
                    >
                      {

                                                       }
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
                      {

                                                          }
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
