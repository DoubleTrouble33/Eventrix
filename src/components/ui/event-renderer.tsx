import { CalendarEventType } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import dayjs from "dayjs";

interface EventRendererProps {
  event: CalendarEventType;
  variant?: "month" | "week" | "day";
  onClick?: (event: CalendarEventType) => void;
  onEdit?: (event: CalendarEventType) => void;
  onDelete?: (event: CalendarEventType) => void;
}

export function EventRenderer({
  event,
  variant = "month",
  onClick,
  onEdit,
  onDelete,
}: EventRendererProps) {
  const [showOptions, setShowOptions] = useState(false);
  const timeFormat = variant === "month" ? "HH:mm" : "h:mm A";

  const eventColorClasses = event.isPublic
    ? "bg-green-100 text-green-700 hover:bg-green-200"
    : "bg-blue-100 text-blue-700 hover:bg-blue-200";

  return (
    <div className="relative">
      <button
        onClick={() => onClick?.(event)}
        className={cn(
          "group w-full truncate rounded px-1 text-left text-xs",
          eventColorClasses,
          variant === "month" && "py-0",
          variant === "week" && "py-1",
          variant === "day" && "py-2",
        )}
      >
        <div className="flex items-center">
          {variant !== "month" && (
            <span className="mr-1 font-medium">
              {dayjs(event.startTime).format(timeFormat)}
              {event.endTime && `-${dayjs(event.endTime).format(timeFormat)}`}
            </span>
          )}
          <span>{event.title}</span>
        </div>
        {event.isRepeating && variant !== "month" && (
          <div
            className={`text-[0.6rem] ${event.isPublic ? "text-green-500" : "text-blue-500"}`}
          >
            (Repeating)
          </div>
        )}
      </button>

      {/* Options dropdown */}
      {variant !== "month" && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
            className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>

          {showOptions && (
            <div
              className="ring-opacity-5 absolute right-0 z-10 mt-1 w-32 rounded-md bg-white shadow-lg ring-1 ring-black"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    onEdit?.(event);
                    setShowOptions(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete?.(event);
                    setShowOptions(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
