import { useState } from "react";
import { useEventStore } from "@/lib/store";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";
import { Button } from "./button";
import { X, Repeat, ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

interface EventPopoverProps {
  selectedDate: dayjs.Dayjs;
  onClose: () => void;
}

export function EventPopover({ selectedDate, onClose }: EventPopoverProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(selectedDate.format("HH:mm"));
  const [endTime, setEndTime] = useState(
    selectedDate.add(1, "hour").format("HH:mm"),
  );
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);

  const { events, setEvents, closePopover } = useEventStore();

  const daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    // Parse time and create date objects
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startDate = selectedDate
      .hour(startHour)
      .minute(startMinute)
      .second(0);

    const endDate = selectedDate.hour(endHour).minute(endMinute).second(0);

    const newEvent = {
      id: nanoid(),
      title: title.trim(),
      description: description.trim(),
      date: startDate,
      endTime: endDate,
      isRepeating,
      repeatDays: isRepeating ? repeatDays : undefined,
    };

    setEvents([...events, newEvent]);
    closePopover();
    onClose();
  };

  const toggleDay = (dayId: number) => {
    if (repeatDays.includes(dayId)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayId));
    } else {
      setRepeatDays([...repeatDays, dayId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-lg font-semibold">
          Create Event: {selectedDate.format("MMMM D, YYYY")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium">
              Event Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              className="w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start-time"
                className="mb-2 block text-sm font-medium"
              >
                Start Time
              </label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div>
              <label
                htmlFor="end-time"
                className="mb-2 block text-sm font-medium"
              >
                End Time
              </label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
            >
              Description
            </label>
            <ScrollArea className="h-32 w-full rounded-md border">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter event description"
                className="min-h-[8rem] w-full resize-none border-0 p-4 focus:outline-none"
              />
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="repeat-event"
                checked={isRepeating}
                onChange={() => setIsRepeating(!isRepeating)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="repeat-event"
                className="ml-2 flex items-center text-sm text-gray-700"
              >
                <Repeat className="mr-1 h-4 w-4" />
                Repeat Event
              </label>
            </div>

            {isRepeating && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRepeatOptions(!showRepeatOptions)}
                  className="flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-left text-sm"
                >
                  <span>
                    {repeatDays.length === 0
                      ? "Select days"
                      : daysOfWeek
                          .filter((day) => repeatDays.includes(day.id))
                          .map((day) => day.name.substring(0, 3))
                          .join(", ")}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showRepeatOptions ? "rotate-180" : ""}`}
                  />
                </button>

                {showRepeatOptions && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white p-2 shadow-lg">
                    <div className="grid grid-cols-3 gap-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`day-${day.id}`}
                            checked={repeatDays.includes(day.id)}
                            onChange={() => toggleDay(day.id)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor={`day-${day.id}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            {day.name.substring(0, 3)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
