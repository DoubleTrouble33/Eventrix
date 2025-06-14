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

  // Fallback styling for events with deleted calendars
  const fallbackColor = "#6B7280"; // Gray color for orphaned events
  const eventColor = calendar?.color || fallbackColor;

  const handleClick = () => {
    setSelectedEvent(event);
    setIsEventSummaryOpen(true);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full truncate rounded px-1 py-0.5 text-left text-xs hover:bg-gray-100"
      style={{
        backgroundColor: eventColor + "20", // Add 20% opacity
        borderLeft: `3px solid ${eventColor}`,
      }}
    >
      <div className="truncate font-medium">{event.title}</div>
      <div className="truncate text-gray-600">
        {dayjs(event.startTime).format("h:mm A")} -{" "}
        {dayjs(event.endTime).format("h:mm A")}
      </div>
      {!calendar && (
        <div className="truncate text-xs text-gray-400 italic">
          (Deleted calendar)
        </div>
      )}
    </button>
  );
}
