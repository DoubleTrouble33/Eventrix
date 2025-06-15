import { Button } from "@/components/ui/button";
import { useEventStore, useCalendarStore } from "@/lib/store";
import { Globe2, Lock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { TimeInput } from "@/components/ui/time-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dayjs from "dayjs";
import { CalendarEventType } from "@/lib/store";

interface EditEventDialogProps {
  event: CalendarEventType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventDialog({
  event,
  open,
  onOpenChange,
}: EditEventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("01:00");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<{
    firstName: string;
    lastName: string;
    id: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { events, setEvents, setSelectedEvent } = useEventStore();
  const { calendars } = useCalendarStore();

  // Initialize form with event data
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      // Format time as 24-hour format for display in the dialog
      setStartTime(dayjs(event.startTime).format("HH:mm"));
      setEndTime(dayjs(event.endTime).format("HH:mm"));
      setIsPublic(event.isPublic);
      setSelectedCalendarId(event.categoryId);
    }
  }, [event]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError("No user data available");
      return;
    }

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!selectedCalendarId) {
      setError("Please select a calendar");
      return;
    }

    if (!startTime || !endTime) {
      setError("Start time and end time are required");
      return;
    }

    try {
      setIsSubmitting(true);

      // Parse hours and minutes
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);

      // Get the original event date
      const eventDate = dayjs(event.startTime);

      // Create start and end time by combining the original date with the new time
      const startDateTime = eventDate
        .hour(startHours)
        .minute(startMinutes)
        .second(0)
        .millisecond(0);

      const endDateTime = eventDate
        .hour(endHours)
        .minute(endMinutes)
        .second(0)
        .millisecond(0);

      const eventData = {
        title,
        description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isPublic,
        categoryId: selectedCalendarId,
      };

      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update event");
      }

      // Update local state with the updated event
      setEvents(
        events.map((e) =>
          e.id === event.id
            ? {
                ...e,
                ...data.event,
                startTime: data.event.startTime,
                endTime: data.event.endTime,
              }
            : e,
        ),
      );

      handleDialogClose();
    } catch (error) {
      console.error("Error updating event:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update event",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    onOpenChange(false);
    // Clear selected event when dialog closes
    setSelectedEvent(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleDialogClose();
        } else {
          onOpenChange(isOpen);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>

        {currentUser && (
          <div className="mb-6 flex items-center gap-2 border-b pb-4 text-sm text-gray-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <span className="font-medium text-blue-700">
                {currentUser.firstName[0]}
                {currentUser.lastName[0]}
              </span>
            </div>
            <span className="font-medium">
              {currentUser.firstName} {currentUser.lastName}
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium dark:text-white"
            >
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

          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium dark:text-white">
              Calendar
            </label>
            <div className="flex flex-wrap gap-2">
              {calendars.map((calendar) => (
                <label
                  key={calendar.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedCalendarId === calendar.id
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="calendar"
                    value={calendar.id}
                    checked={selectedCalendarId === calendar.id}
                    onChange={() => setSelectedCalendarId(calendar.id)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2`}
                      style={{ borderColor: calendar.color }}
                    >
                      {selectedCalendarId === calendar.id && (
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        />
                      )}
                    </div>
                    {calendar.name}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe2 className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
              <div>
                <div className="font-medium">
                  {isPublic ? "Public Event" : "Private Event"}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isPublic
                    ? "Anyone can find this event"
                    : "Only you and guests can see this event"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? "bg-green-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isPublic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium dark:text-white">
                Start Time
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  (24-hour format)
                </span>
              </label>
              <TimeInput
                value={startTime}
                onChange={setStartTime}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium dark:text-white">
                End Time
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  (24-hour format)
                </span>
              </label>
              <TimeInput
                value={endTime}
                onChange={setEndTime}
                className="w-full"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium dark:text-white"
            >
              Description
            </label>
            <ScrollArea className="h-32 w-full rounded-md border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter event description"
                className="min-h-[8rem] w-full resize-none border-0 p-4 focus:outline-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </ScrollArea>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Event"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
