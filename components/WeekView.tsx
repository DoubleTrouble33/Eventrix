import { getHours, getWeekDays } from "@/lib/getTime";
import { useDateStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";

export default function WeekView() {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate } = useDateStore();
  const days = getWeekDays(userSelectedDate);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);

    return () => clearInterval(interval);
  });
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

      {/* Time column and boxes of time  */}

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
            return (
              <div key={index} className="relative border-r border-gray-300">
                {getHours.map((hour, i) => (
                  <div
                    key={i}
                    className="relative flex h-16 cursor-pointer flex-col items-center gap-y-2 border-b border-gray-300 hover:bg-gray-100"
                  ></div>
                ))}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}
