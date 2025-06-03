import { getHours, getWeekDays } from "@/lib/getTime";
import { getEventsForDay, useDateStore, useEventStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { PlusCircle } from "lucide-react";
import { EventPopover } from "./ui/event-popover";
import { EventRenderer } from "./ui/event-renderer";

export default function WeekView() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const { events, setEvents, openEventSummary } = useEventStore(); // Added setEvents here
  const [showEventPopover, setShowEventPopover] = useState(false);
  const [selectedDay, setSelectedDay] = useState<dayjs.Dayjs | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const days = getWeekDays(userSelectedDate);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleAddEvent = (day: dayjs.Dayjs, hour: number) => {
    setSelectedDay(day);
    setSelectedHour(hour);
    setShowEventPopover(true);
  };

  return (
    <>
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] place-items-center px-4 py-2">
        <div className="w-16 border-r border-gray-300">
          <div className="relative h-16">
            <div className="absolute top-2 text-xs text-gray-600">GMT +2</div>
          </div>
        </div>
        {/* Week view header  */}
        {days.map(({ currentDate, today }, index) => (
          <div className="flex flex-col items-center" key={index}>
            <div className={cn("text-xs", today && "text-blue-600")}>
              {currentDate.format("ddd")}
            </div>
            <div
              className={cn(
                "h-12 w-12 rounded-full p-2 text-2xl",
                today && "bg-blue-600 text-white",
              )}
            >
              {currentDate.format("DD")}{" "}
            </div>
          </div>
        ))}
      </div>

      <ScrollArea className="h-[70vh]">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] px-4 py-2">
          <div className="w-16 border-r border-gray-300">
            {getHours.map((hour, index) => (
              <div className="relative h-16" key={index}>
                <div className="absolute -top-2 text-xs text-gray-600">
                  {hour.format("HH:mm")}
                </div>
              </div>
            ))}
          </div>

          {/* Week day boxes  */}
          {days.map(({ currentDate, today }, index) => {
            const dayDate = userSelectedDate.startOf("week").add(index, "day");
            const dayEvents = getEventsForDay(events, dayDate);

            return (
              <div key={index} className="relative border-r border-gray-300">
                {getHours.map((hour, i) => {
                  const hourEvents = dayEvents.filter(
                    (event) => event.date.hour() === hour.hour(),
                  );

                  return (
                    <div
                      key={i}
                      className="group relative flex h-16 cursor-pointer flex-col items-center gap-y-2 border-b border-gray-300 hover:bg-gray-100"
                      onClick={() => handleAddEvent(dayDate, hour.hour())}
                    >
                      {/* Centered Plus Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          className="invisible rounded-full p-1 transition-all duration-200 ease-in-out group-hover:visible hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddEvent(dayDate, hour.hour());
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
                          view="week" // Fixed to "week"
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {showEventPopover && selectedDay && (
        <EventPopover
          selectedDate={selectedDay.hour(selectedHour || 0)}
          onClose={() => {
            setShowEventPopover(false);
            setSelectedDay(null);
            setSelectedHour(null);
          }}
        />
      )}
    </>
  );
}
