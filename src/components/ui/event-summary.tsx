"use client";

import { useEventStore, useCategoryStore } from "@/lib/store";
import { ScrollArea } from "./scroll-area";
import { Button } from "./button";
import { X, Trash, Users, Globe2, Lock, Tag } from "lucide-react";

export function EventSummary() {
  const { selectedEvent, closeEventSummary, events, setEvents } =
    useEventStore();
  const { categories } = useCategoryStore();

  if (!selectedEvent) return null;

  const category = categories.find((c) => c.id === selectedEvent.categoryId);

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
            <div className="flex items-start justify-between pt-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedEvent.title}
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  {selectedEvent.isPublic ? (
                    <>
                      <Globe2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Private</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {category && (
              <div className="mt-2 flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <div
                  className="flex items-center gap-2 rounded-full px-2 py-0.5 text-sm"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span style={{ color: category.color }}>{category.name}</span>
                </div>
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              {selectedEvent.date.format("MMMM D, YYYY")}
              <br />
              {selectedEvent.date.format("h:mm A")} -{" "}
              {selectedEvent.endTime?.format("h:mm A")}
            </p>
          </div>

          <ScrollArea className="h-32 w-full rounded-md border p-4">
            <p className="text-gray-700">
              {selectedEvent.description || "No description provided."}
            </p>
          </ScrollArea>

          {selectedEvent.guests && selectedEvent.guests.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium">
                  Guests ({selectedEvent.guests.length})
                </h3>
              </div>
              <ScrollArea className="h-32 w-full rounded-md border bg-gray-50 p-2">
                <div className="space-y-2">
                  {selectedEvent.guests.map((guest) => (
                    <div
                      key={guest.email}
                      className="rounded-md bg-white p-2 shadow-sm"
                    >
                      <div className="font-medium">{guest.name}</div>
                      <div className="text-sm text-gray-500">{guest.email}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

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
