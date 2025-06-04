"use client";

import React, { useState } from "react";
import { useDateStore } from "@/lib/store";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { EventPopover } from "../ui/event-popover";
import dayjs from "dayjs";

export function RightSide() {
  const [showEventPopover, setShowEventPopover] = useState(false);
  const { userSelectedDate } = useDateStore();

  // Mini calendar data
  const currentDate = dayjs();
  const daysInMonth = Array.from(
    { length: currentDate.daysInMonth() },
    (_, i) => i + 1,
  );
  const firstDayOfMonth = currentDate.startOf("month").day(); // 0 = Sunday
  const blanks = Array(firstDayOfMonth).fill(null);

  const weeks = [];
  const allDays = [...blanks, ...daysInMonth];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return (
    <div className="flex-1 space-y-4 p-4">
      <div className="mb-6">
        <Button
          onClick={() => setShowEventPopover(true)}
          className="flex w-full items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </div>

      {/* Mini Calendar */}
      <div className="mb-6">
        <div className="mb-2 text-sm font-medium">
          {currentDate.format("MMMM YYYY")}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div key={`day-header-${index}`} className="text-gray-500">
              {day}
            </div>
          ))}
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((day, dayIndex) => {
                if (day === null) return <div key={dayIndex} />;
                const isToday = currentDate.date() === day;
                return (
                  <div
                    key={dayIndex}
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      isToday ? "bg-blue-600 text-white" : ""
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {showEventPopover && (
        <EventPopover
          selectedDate={userSelectedDate}
          onClose={() => setShowEventPopover(false)}
        />
      )}
    </div>
  );
}
