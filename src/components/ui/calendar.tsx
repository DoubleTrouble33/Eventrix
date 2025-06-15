"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  mode = "single",
  selected,
  onSelect,
  defaultMonth,
  ...props
}: CalendarProps) {
  const today = new Date();
  const [month, setMonth] = React.useState<Date>(defaultMonth || today);

  // Handle going to today
  const handleToday = () => {
    setMonth(today);
    if (onSelect) {
      onSelect(today);
    }
  };

  return (
    <DayPicker
      mode={mode}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      month={month}
      onMonthChange={setMonth}
      selected={selected}
      onSelect={onSelect}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-3",
        caption: "flex justify-between pt-1 relative items-center px-1",
        caption_label: "text-sm font-medium text-gray-900 dark:text-white",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full",
        head_cell:
          "flex-1 text-[0.8rem] font-normal text-muted-foreground text-center",
        row: "flex w-full mt-2",
        cell: "flex-1 relative text-center text-sm p-0 [&:has([aria-selected])]:bg-indigo-50",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-full p-0 font-normal text-[0.8rem] aria-selected:opacity-100 hover:bg-gray-100 rounded-full",
        ),
        day_selected:
          "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white rounded-full",
        day_today: "bg-indigo-50 text-indigo-600 font-semibold",
        day_outside:
          "text-gray-400 opacity-50 hover:bg-transparent hover:text-gray-400",
        day_disabled: "text-gray-400 opacity-50 hover:bg-transparent",
        day_hidden: "invisible",
        ...classNames,
      }}
      formatters={{
        formatWeekdayName: (date) => {
          const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
          return days[date.getDay()];
        },
      }}
      footer={
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleToday}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-7 px-2 py-1 text-xs",
            )}
          >
            Today
          </button>
        </div>
      }
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
