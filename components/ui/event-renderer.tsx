import { CalendarEventType } from "@/lib/store";
import { cn } from "@/lib/utils";

interface EventRendererProps {
  event: CalendarEventType;
  variant?: "month" | "week" | "day";
  onClick?: (event: CalendarEventType) => void;
}

export function EventRenderer({
  event,
  variant = "month",
  onClick,
}: EventRendererProps) {
  return (
    <button
      onClick={() => onClick?.(event)}
      className={cn(
        "w-full truncate rounded px-1 text-left text-xs",
        "bg-orange-100 text-orange-700 hover:bg-orange-200",
        variant === "month" && "py-0",
        variant === "week" && "py-1",
        variant === "day" && "py-2",
      )}
    >
      {event.title}
    </button>
  );
}
