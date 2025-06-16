import { getHours, isCurrentDay } from "@/lib/getTime";
import { useDateStore, useEventStore, getEventsForDay } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { EventRenderer } from "./ui/event-renderer";
import { CalendarEventType } from "@/lib/store";
import { PlusCircle } from "lucide-react";
import { EventPopover } from "./ui/event-popover";

export default function DayView() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { events, setSelectedEvent, setIsEventSummaryOpen } = useEventStore();
  const { userSelectedDate } = useDateStore();
  const [showEventPopover, setShowEventPopover] = useState(false);
  const [selectedHour, setSelectedHour] = useState<dayjs.Dayjs | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const isToday =
    userSelectedDate.format("DD-MM-YY") === dayjs().format("DD-MM-YY");

  const handleEventClick = (event: CalendarEventType) => {
    setSelectedEvent(event);
    setIsEventSummaryOpen(true);
  };

  const handleAddEvent = (hour: dayjs.Dayjs) => {
    setSelectedHour(hour);
    setShowEventPopover(true);
  };

  return (
    <>
      <div className="grid grid-cols-[auto_1fr] place-items-center bg-white px-4 py-2 dark:bg-gray-800">
        <div className="w-16 border-r border-gray-300 dark:border-gray-600">
          <div className="relative h-16">
            <div className="absolute top-2 text-xs text-gray-600 dark:text-gray-400">
              GMT +2
            </div>
          </div>
        </div>

        {/* Day View Header */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "text-xs text-gray-900 dark:text-white",
              isToday && "text-blue-600",
            )}
          >
            {userSelectedDate.format("ddd")}
          </div>
          <div
            className={cn(
              "h-12 w-12 rounded-full p-2 text-2xl text-gray-900 dark:text-white",
              isToday && "bg-blue-600 text-white",
            )}
          >
            {userSelectedDate.format("DD")}
          </div>
        </div>
      </div>

      <ScrollArea className="h-[70vh]">
        <div className="grid grid-cols-[auto_1fr] bg-white p-4 dark:bg-gray-800">
          {/* Time Column */}
          <div className="w-16 border-r border-gray-300 dark:border-gray-600">
            {getHours.map((hour, index) => (
              <div key={index} className="relative h-16">
                <div className="absolute -top-2 text-xs text-gray-600 dark:text-gray-400">
                  {hour.format("HH:mm")}
                </div>
              </div>
            ))}
          </div>

          <div className="relative border-r border-gray-300 dark:border-gray-600">
            {/* Get all events for this day */}
            {(() => {
              const dayEvents = getEventsForDay(events, userSelectedDate);

              return (
                <>
                  {/* Hour grid slots */}
                  {getHours.map((hour, i) => (
                    <div
                      key={i}
                      className="group relative flex h-16 cursor-pointer border-b border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                      onClick={() => handleAddEvent(hour)}
                    >
                      {/* Center Plus Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddEvent(hour);
                          }}
                          className="invisible rounded-full p-2 transition-all duration-200 ease-in-out group-hover:visible hover:scale-110"
                        >
                          <PlusCircle className="h-6 w-6 text-emerald-500 transition-colors hover:text-emerald-600" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Render all events for this day with absolute positioning */}
                  {dayEvents.map((event) => (
                    <EventRenderer
                      key={event.id}
                      event={event}
                      onClick={handleEventClick}
                      variant="day"
                      isSpanned={true}
                    />
                  ))}

                  {/* Current time indicator */}
                  {isCurrentDay(userSelectedDate) && (
                    <div
                      className={cn("absolute h-0.5 w-full bg-red-500")}
                      style={{
                        top: `${currentTime.hour() * 64 + (currentTime.minute() * 64) / 60}px`,
                        zIndex: 20,
                      }}
                    />
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </ScrollArea>

      {showEventPopover && selectedHour && (
        <EventPopover
          selectedDate={userSelectedDate.hour(selectedHour.hour())}
          onClose={() => {
            setShowEventPopover(false);
            setSelectedHour(null);
          }}
        />
      )}
    </>
  );
}
