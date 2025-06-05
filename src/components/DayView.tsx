import { getHours, isCurrentDay } from "@/lib/getTime";
import {
  useDateStore,
  useEventStore,
  getEventsForDay,
  useCalendarStore,
} from "@/lib/store";
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
  const { selectedCalendars } = useCalendarStore();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [showEventPopover, setShowEventPopover] = useState(false);
  const [selectedHour, setSelectedHour] = useState<dayjs.Dayjs | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
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
      <div className="grid grid-cols-[auto_1fr] place-items-center px-4 py-2">
        <div className="w-16 border-r border-gray-300">
          <div className="relative h-16">
            <div className="absolute top-2 text-xs text-gray-600">GMT +2</div>
          </div>
        </div>

        {/* Day View Header */}
        <div className="flex flex-col items-center">
          <div className={cn("text-xs", isToday && "text-blue-600")}>
            {userSelectedDate.format("ddd")}
          </div>
          <div
            className={cn(
              "h-12 w-12 rounded-full p-2 text-2xl",
              isToday && "bg-blue-600 text-white",
            )}
          >
            {userSelectedDate.format("DD")}
          </div>
        </div>
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

          <div className="relative border-r border-gray-300">
            {getHours.map((hour, i) => {
              const dayEvents = getEventsForDay(
                events,
                userSelectedDate,
              ).filter((event) => {
                const eventHour = dayjs(event.startTime).hour();
                const hourMatch = eventHour === hour.hour();
                const calendarMatch =
                  selectedCalendars.length > 0 &&
                  selectedCalendars.includes(event.categoryId);
                const isGuest =
                  currentUser &&
                  event.guests?.some((guest) => guest.id === currentUser.id);
                return hourMatch && (calendarMatch || isGuest);
              });

              return (
                <div
                  key={i}
                  className="group relative flex h-16 cursor-pointer flex-col items-center gap-y-2 border-b border-gray-300 hover:bg-gray-100"
                  onClick={() => {
                    if (dayEvents.length === 0) {
                      handleAddEvent(hour);
                    }
                  }}
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

                  {dayEvents.map((event) => (
                    <EventRenderer
                      key={event.id}
                      event={event}
                      onClick={handleEventClick}
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
