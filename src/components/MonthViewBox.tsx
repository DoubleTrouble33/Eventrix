import { cn } from "@/lib/utils";
import {
  getEventsForDay,
  useEventStore,
  useCalendarStore,
  usePublicPrivateToggleStore,
} from "@/lib/store";
import dayjs from "dayjs";
import React, { useState } from "react";
import { EventPopover } from "./ui/event-popover";
import { EventRenderer } from "./ui/event-renderer";
import { PlusCircle } from "lucide-react";
import { CalendarEventType } from "@/lib/store";

export default function MonthViewBox({
  day,
  rowIndex,
}: {
  day: dayjs.Dayjs | null;
  rowIndex: number;
}) {
  const [showEventPopover, setShowEventPopover] = useState(false);
  const { events, setSelectedEvent, setIsEventSummaryOpen } = useEventStore();

  const { selectedCalendars, calendars } = useCalendarStore();
  const { isPublicView } = usePublicPrivateToggleStore();

  if (!day) {
    return (
      <div className="h-12 w-full border md:h-28 md:w-full lg:h-full"></div>
    );
  }

  const isFirstDayOfMonth = day?.date() === 1;
  const isToday = day.format("DD-MM-YY") === dayjs().format("DD-MM-YY");

  // Filter events for this day based on public/private view and selected calendars
  const dayEvents = getEventsForDay(events, day).filter((event) => {
    // In PUBLIC view: Show public events + selected calendar events
    if (isPublicView) {
      // Show public events regardless of calendar selection
      if (event.isPublic) {
        return true;
      }
      // Also show user's selected calendar events
      return selectedCalendars.includes(event.calendarId);
    }

    // In PRIVATE view: Only show selected calendar events
    if (selectedCalendars.length === 0) {
      return false; // No calendars selected, show nothing
    }

    // Always show events with deleted calendars (orphaned events)
    const calendarExists = calendars.some((cal) => cal.id === event.calendarId);
    if (!calendarExists) {
      return true; // Show orphaned events
    }

    // Only show events from selected calendars
    return selectedCalendars.includes(event.calendarId);
  });

  const handleEventClick = (event: CalendarEventType) => {
    setSelectedEvent(event);
    setIsEventSummaryOpen(true);
  };

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col gap-y-2 border p-1",
        "transition-all hover:bg-violet-50",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col items-start">
          {rowIndex === 0 && (
            <span className="text-xs text-gray-500">
              {day.format("ddd").toUpperCase()}
            </span>
          )}
          <span
            className={cn(
              "text-sm",
              isToday &&
                "flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white",
            )}
          >
            {isFirstDayOfMonth ? day.format("MMM D") : day.format("D")}
          </span>
        </div>
      </div>

      {/* Center Plus Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={() => setShowEventPopover(true)}
          className="invisible rounded-full p-2 transition-all duration-200 ease-in-out group-hover:visible hover:scale-110"
        >
          <PlusCircle className="h-6 w-6 text-emerald-500 transition-colors hover:text-emerald-600" />
        </button>
      </div>

      <div className="relative z-10 mt-auto flex flex-col gap-1 overflow-y-auto">
        {dayEvents.map((event) => (
          <EventRenderer
            key={event.id}
            event={event}
            onClick={handleEventClick}
          />
        ))}
      </div>

      {showEventPopover && (
        <EventPopover
          selectedDate={day}
          onClose={() => setShowEventPopover(false)}
        />
      )}
    </div>
  );
}
