"use client";

import { useEventStore, useCalendarStore } from "@/lib/store";
import { CalendarEvent } from "./CalendarEvent";
import { EventPopover } from "../ui/event-popover";
import { useState } from "react";
import dayjs from "dayjs";

interface CalendarProps {
  currentDate: dayjs.Dayjs;
}

export function Calendar({ currentDate }: CalendarProps) {
  const { events } = useEventStore();
  const { selectedCalendars, calendars } = useCalendarStore();
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);

  // Filter events based on selected calendars
  const filteredEvents = events.filter((event) => {
    // Always show events with deleted calendars (orphaned events)
    const calendarExists = calendars.some((cal) => cal.id === event.calendarId);
    if (!calendarExists) {
      return true; // Show orphaned events
    }
    // For existing calendars, check if they're selected
    return selectedCalendars.includes(event.calendarId);
  });

  // Generate calendar grid
  const firstDayOfMonth = currentDate.startOf("month");
  const lastDayOfMonth = currentDate.endOf("month");
  const daysInMonth = lastDayOfMonth.date();
  const firstDayOfWeek = firstDayOfMonth.day();

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = currentDate.date(day);
    days.push(date);
  }

  // Group events by date
  const eventsByDate = filteredEvents.reduce(
    (acc, event) => {
      const date = dayjs(event.startTime).format("YYYY-MM-DD");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    },
    {} as Record<string, typeof filteredEvents>,
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid h-full grid-cols-7 grid-rows-[auto_1fr]">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="border-r border-b p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {/* Calendar grid */}
        {days.map((date, index) => (
          <div
            key={index}
            className={`relative border-r border-b p-2 ${
              date?.isSame(currentDate, "month") ? "bg-white" : "bg-gray-50"
            }`}
            onClick={() => date && setSelectedDate(date)}
          >
            {date && (
              <>
                <span
                  className={`text-sm ${
                    date.isSame(dayjs(), "day")
                      ? "rounded-full bg-blue-500 px-2 py-1 text-white"
                      : ""
                  }`}
                >
                  {date.date()}
                </span>
                <div className="mt-1 space-y-1">
                  {eventsByDate[date.format("YYYY-MM-DD")]?.map((event) => (
                    <CalendarEvent key={event.id} event={event} />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {selectedDate && (
        <EventPopover
          selectedDate={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
