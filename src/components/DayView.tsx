import {
  getEventsForDay,
  useDateStore,
  useEventStore,
  useCategoryStore,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { getHours, isCurrentDay } from "@/lib/getTime";
import { EventRenderer } from "./ui/event-renderer";
import { PlusCircle } from "lucide-react";
import { EventPopover } from "./ui/event-popover";

export default function DayView() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [showEventPopover, setShowEventPopover] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const { events, setEvents, openEventSummary } = useEventStore();
  const { userSelectedDate, setDate } = useDateStore();
  const { selectedCategory } = useCategoryStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isToday =
    userSelectedDate.format("DD-MM-YY") === dayjs().format("DD-MM-YY");

  // Filter events by day and selected category
  const dayEvents = getEventsForDay(events, userSelectedDate).filter(
    (event) => !selectedCategory || event.categoryId === selectedCategory,
  );

  const handleAddEvent = (hour: number) => {
    setSelectedHour(hour);
    setShowEventPopover(true);
  };

  return (
    <>
      <div className="grid grid-cols-[auto_auto_1fr] px-4">
        <div className="w-16 border-r border-gray-300 text-xs">GMT +2</div>
        <div className="flex w-16 flex-col items-center">
          <div className={cn("text-xs", isToday && "text-blue-600")}>
            {userSelectedDate.format("ddd")}{" "}
          </div>{" "}
          <div
            className={cn(
              "h-12 w-12 rounded-full p-2 text-2xl",
              isToday && "bg-blue-600 text-white",
            )}
          >
            {userSelectedDate.format("DD")}{" "}
          </div>
        </div>
        <div></div>
      </div>

      <ScrollArea className="h-[70vh]">
        <div className="grid grid-cols-[auto_1fr] p-4">
          {/* Time Column */}
          <div className="w-16 border-r border-gray-300">
            {getHours.map((hour, index) => (
              <div key={index} className="relative h-16">
                <div className="absolute -top-2 text-xs text-gray-600">
                  {hour.format("HH:mm")}
                </div>
              </div>
            ))}
          </div>

          {/* Day/Boxes Column */}
          <div className="relative">
            {getHours.map((hour, i) => {
              const hourEvents = dayEvents.filter(
                (event) => event.date.hour() === hour.hour(),
              );

              return (
                <div
                  key={i}
                  className="group relative flex h-16 cursor-pointer flex-col items-center gap-y-2 border-b border-gray-300 hover:bg-gray-100"
                  onClick={() => handleAddEvent(hour.hour())}
                >
                  {/* Centered Plus Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      className="invisible rounded-full p-1 transition-all duration-200 ease-in-out group-hover:visible hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddEvent(hour.hour());
                      }}
                    >
                      <PlusCircle className="h-5 w-5 text-emerald-500 transition-colors hover:text-emerald-600" />
                    </button>
                  </div>

                  {/* Events */}
                  {hourEvents.map((event) => (
                    <EventRenderer
                      key={event.id}
                      event={event}
                      onClick={openEventSummary}
                      onEdit={(event) => {
                        // Implement edit functionality
                        console.log("Edit event:", event);
                      }}
                      onDelete={(event) => {
                        const updatedEvents = events.filter(
                          (e) => e.id !== event.id,
                        );
                        setEvents(updatedEvents);
                      }}
                      variant="day"
                    />
                  ))}
                </div>
              );
            })}

            {/* Current time indicator */}
            {isCurrentDay(userSelectedDate) && (
              <div
                className={cn("absolute h-0.5 w-full bg-red-500")}
                style={{
                  top: `${(currentTime.hour() / 24) * 100}%`,
                }}
              />
            )}
          </div>
        </div>
      </ScrollArea>

      {showEventPopover && selectedHour !== null && (
        <EventPopover
          selectedDate={userSelectedDate.hour(selectedHour)}
          onClose={() => {
            setShowEventPopover(false);
            setSelectedHour(null);
          }}
        />
      )}
    </>
  );
}
