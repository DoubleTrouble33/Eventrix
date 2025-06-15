import { Button } from "@/components/ui/button";
import { useEventStore, useCalendarStore } from "@/lib/store";
import {
  Globe2,
  Lock,
  Loader2,
  Repeat,
  X,
  ChevronDown,
  Search,
  Plus,
  UserPlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import dayjs from "dayjs";
import { useDebounce } from "@/lib/hooks";

interface EventPopoverProps {
  selectedDate: dayjs.Dayjs;
  onClose: () => void;
}

export function EventPopover({ selectedDate, onClose }: EventPopoverProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("00:00"); // Default to 12:00 AM
  const [endTime, setEndTime] = useState("01:00"); // Default to 1:00 AM
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [repeatDuration, setRepeatDuration] = useState<
    "week" | "2weeks" | "month" | "3months" | "6months"
  >("month");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedCalendarId, setSelectedCalendarId] =
    useState<string>("public");
  const [currentUser, setCurrentUser] = useState<{
    firstName: string;
    lastName: string;
    id: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      email: string;
      name: string;
    }>
  >([]);
  const [selectedGuests, setSelectedGuests] = useState<
    Array<{
      id: string;
      email: string;
      name: string;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { events, setEvents } = useEventStore();
  const { calendars } = useCalendarStore();

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

  // Search users effect
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearch) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(debouncedSearch)}`,
          {
            credentials: "include",
          },
        );
        if (response.ok) {
          const data = await response.json();
          // The API returns the array directly, not wrapped in a users property
          const users = Array.isArray(data) ? data : [];
          // Filter out already selected guests
          setSearchResults(
            users.filter(
              (user: { id: string }) =>
                !selectedGuests.some((guest) => guest.id === user.id),
            ),
          );
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearch, selectedGuests]);

  const daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Add validation logging
    console.log("Form validation:", {
      title: title.trim(),
      description,
      startTime,
      endTime,
      isRepeating,
      repeatDays,
      repeatDuration,
      isPublic,
      selectedCalendarId,
      currentUser: !!currentUser,
      selectedGuests,
    });

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

    if (isRepeating && repeatDays.length === 0) {
      setError("Please select at least one day for repeating events");
      return;
    }

    try {
      setIsSubmitting(true);

      // Parse hours and minutes
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);

      // Create start and end time by combining the selected date with the time
      const startDateTime = selectedDate
        .hour(startHours)
        .minute(startMinutes)
        .second(0)
        .millisecond(0);

      const endDateTime = selectedDate
        .hour(endHours)
        .minute(endMinutes)
        .second(0)
        .millisecond(0);

      // Calculate the end date based on repeat duration
      let repeatEndDate: dayjs.Dayjs | undefined;
      if (isRepeating) {
        // First calculate the base end date based on duration
        let baseEndDate: dayjs.Dayjs;
        switch (repeatDuration) {
          case "week":
            baseEndDate = startDateTime.add(1, "week").subtract(1, "day");
            break;
          case "2weeks":
            baseEndDate = startDateTime.add(2, "week").subtract(1, "day");
            break;
          case "month":
            baseEndDate = startDateTime.add(1, "month").subtract(1, "day");
            break;
          case "3months":
            baseEndDate = startDateTime.add(3, "month").subtract(1, "day");
            break;
          case "6months":
            baseEndDate = startDateTime.add(6, "month").subtract(1, "day");
            break;
          default:
            baseEndDate = startDateTime.add(1, "month").subtract(1, "day");
        }

        // Find the last occurrence of the event based on selected days
        let currentDate = baseEndDate;
        while (
          !repeatDays.includes(currentDate.day()) &&
          currentDate.isAfter(startDateTime)
        ) {
          currentDate = currentDate.subtract(1, "day");
        }
        repeatEndDate = currentDate;
      }

      // Convert to UTC before sending to the server
      const eventData = {
        title,
        description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isRepeating,
        repeatDays: isRepeating ? repeatDays : undefined,
        repeatEndDate:
          isRepeating && repeatEndDate
            ? repeatEndDate.toISOString()
            : undefined,
        isPublic,
        calendarId: selectedCalendarId,
        guests: selectedGuests.map((guest) => ({
          name: guest.name,
          email: guest.email,
        })),
      };

      console.log("Sending event data:", {
        ...eventData,
        startTimeLocal: startDateTime.format("YYYY-MM-DD HH:mm:ss"),
        endTimeLocal: endDateTime.format("YYYY-MM-DD HH:mm:ss"),
        repeatEndDateLocal:
          isRepeating && repeatEndDate
            ? repeatEndDate.format("YYYY-MM-DD")
            : undefined,
      }); // Debug log

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      // Update local state with the new event
      setEvents([
        ...events,
        {
          ...data.event,
          date: dayjs(data.event.startTime),
          endTime: dayjs(data.event.endTime),
          repeatEndDate:
            isRepeating && data.event.repeatEndDate
              ? dayjs(data.event.repeatEndDate)
              : undefined,
        },
      ]);

      onClose();
    } catch (error) {
      console.error("Error creating event:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create event",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (dayId: number) => {
    if (repeatDays.includes(dayId)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayId));
    } else {
      setRepeatDays([...repeatDays, dayId]);
    }
  };

  const handleAddGuest = (user: {
    id: string;
    email: string;
    name: string;
  }) => {
    setSelectedGuests([...selectedGuests, user]);
    setSearchQuery("");
    setIsAddingGuest(false);
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

          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium">Calendar</label>
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
                <Lock className="h-5 w-5 text-gray-500" />
              )}
              <div>
                <div className="font-medium">
                  {isPublic ? "Public Event" : "Private Event"}
                </div>
                <div className="text-sm text-gray-500">
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
              <>
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

                <div className="mt-4">
                  <label
                    htmlFor="repeat-duration"
                    className="mb-2 block text-sm font-medium"
                  >
                    Repeat for
                  </label>
                  <select
                    id="repeat-duration"
                    value={repeatDuration}
                    onChange={(e) =>
                      setRepeatDuration(
                        e.target.value as
                          | "week"
                          | "2weeks"
                          | "month"
                          | "3months"
                          | "6months",
                      )
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="week">1 Week</option>
                    <option value="2weeks">2 Weeks</option>
                    <option value="month">1 Month</option>
                    <option value="3months">3 Months</option>
                    <option value="6months">6 Months</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Guest Invitation Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">
                  Guests ({selectedGuests.length})
                </h3>
              </div>
              <Dialog open={isAddingGuest} onOpenChange={setIsAddingGuest}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Guest
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Guest</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name or email"
                          className="pl-9"
                        />
                      </div>
                      {searchQuery &&
                        (isSearching ? (
                          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
                            Searching...
                          </div>
                        ) : (
                          searchResults.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                              <ScrollArea className="max-h-48">
                                {searchResults.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleAddGuest(user)}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
                                  >
                                    <Plus className="h-4 w-4" />
                                    <div>
                                      <div className="font-medium">
                                        {user.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {user.email}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </ScrollArea>
                            </div>
                          )
                        ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="h-32 w-full rounded-md border bg-gray-50 p-2">
              <div className="space-y-2">
                {selectedGuests.length > 0 ? (
                  selectedGuests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between rounded-md bg-white p-2 shadow-sm"
                    >
                      <div>
                        <div className="font-medium">{guest.name}</div>
                        <div className="text-sm text-gray-500">
                          {guest.email}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedGuests(
                            selectedGuests.filter((g) => g.id !== guest.id),
                          )
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    No guests added yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
