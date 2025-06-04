"use client";

import { CalendarEventType } from "@/lib/store";
import { useCalendarStore } from "@/lib/store";
import { useEventStore } from "@/lib/store";
import dayjs from "dayjs";

interface CalendarEventProps {
  event: CalendarEventType;
}

export function CalendarEvent({ event }: CalendarEventProps) {
  const { calendars } = useCalendarStore();
  const { setSelectedEvent, setIsEventSummaryOpen } = useEventStore();

  const calendar = calendars.find((c) => c.id === event.categoryId);

  const handleClick = () => {
    setSelectedEvent(event);
    setIsEventSummaryOpen(true);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full truncate rounded px-1 py-0.5 text-left text-xs hover:bg-gray-100"
      style={{
        backgroundColor: calendar?.color + "20", // Add 20% opacity
        borderLeft: `3px solid ${calendar?.color}`,
      }}
    >
      <div className="truncate font-medium">{event.title}</div>
      <div className="truncate text-gray-600">
        {dayjs(event.startTime).format("h:mm A")} -{" "}
        {dayjs(event.endTime).format("h:mm A")}
      </div>
    </button>
  );
}
