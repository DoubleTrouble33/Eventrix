"use client";

import { useEventStore } from "@/lib/store";
import { ScrollArea } from "./scroll-area";
import { Button } from "./button";
import { X, Trash, Repeat } from "lucide-react";

export function EventSummary() {
  const { selectedEvent, closeEventSummary, events, setEvents } =
    useEventStore();

  if (!selectedEvent) return null;

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const handleDelete = () => {
    const updatedEvents = events.filter((e) => e.id !== selectedEvent.id);
    setEvents(updatedEvents);
    closeEventSummary();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={closeEventSummary}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedEvent.title}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedEvent.date.format("MMMM D, YYYY")}
              {selectedEvent.endTime && (
                <>
                  <br />
                  {selectedEvent.date.format("h:mm A")} -{" "}
                  {selectedEvent.endTime.format("h:mm A")}
                </>
              )}
            </p>
            {selectedEvent.isRepeating && selectedEvent.repeatDays && (
              <div className="mt-1 flex items-center text-sm text-indigo-600">
                <Repeat className="mr-1 h-4 w-4" />
                Repeats every:{" "}
                {selectedEvent.repeatDays
                  .map((day) => daysOfWeek[day].substring(0, 3))
                  .join(", ")}
              </div>
            )}
          </div>

          <ScrollArea className="h-32 w-full rounded-md border p-4">
            <p className="text-gray-700">
              {selectedEvent.description || "No description provided."}
            </p>
          </ScrollArea>

          <div className="flex justify-end space-x-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              Delete Event
            </Button>
            <Button variant="outline" onClick={closeEventSummary}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
