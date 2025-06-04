import { useState, useEffect } from "react";
import { useEventStore, GuestType, useCategoryStore } from "@/lib/store";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";
import { Button } from "./button";
import {
  X,
  Repeat,
  ChevronDown,
  UserPlus,
  Search,
  XCircle,
  Globe2,
  Lock,
} from "lucide-react";
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
  const [repeatDuration, setRepeatDuration] = useState<
    "week" | "2weeks" | "month" | "3months" | "6months"
  >("month");
  const [guests, setGuests] = useState<GuestType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGuestSearch, setShowGuestSearch] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>("personal");
  const [currentUser, setCurrentUser] = useState<{
    firstName: string;
    lastName: string;
    id: string;
  } | null>(null);

  const { events, setEvents } = useEventStore();
  const { categories = [] } = useCategoryStore();

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

  // Ensure we have a valid category ID
  useEffect(() => {
    if (
      categories.length > 0 &&
      !categories.find((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
  ];

  // Mock search results - this will be replaced with actual DB search later
  const mockSearchResults = searchTerm
    ? [
        { id: "1", name: "John Doe", email: "john@example.com" },
        { id: "2", name: "Jane Smith", email: "jane@example.com" },
        { id: "3", name: "Bob Wilson", email: "bob@example.com" },
      ].filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const addGuest = (guest: GuestType) => {
    if (!guests.find((g) => g.email === guest.email)) {
      setGuests([...guests, guest]);
    }
    setSearchTerm("");
    setShowGuestSearch(false);
  };

  const removeGuest = (email: string) => {
    setGuests(guests.filter((g) => g.email !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      console.error("No user data available");
      return;
    }

    const newEvent = {
      id: nanoid(),
      title,
      description,
      date: selectedDate
        .set("hour", parseInt(startTime.split(":")[0]))
        .set("minute", parseInt(startTime.split(":")[1])),
      endTime: selectedDate
        .set("hour", parseInt(endTime.split(":")[0]))
        .set("minute", parseInt(endTime.split(":")[1])),
      isRepeating,
      repeatDays: isRepeating ? repeatDays : undefined,
      repeatDuration: isRepeating ? repeatDuration : undefined,
      guests,
      isPublic,
      categoryId: selectedCategoryId,
      userId: currentUser.id,
    };

    // TODO: Save to database
    setEvents([...events, newEvent]);
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
            <label className="mb-2 block text-sm font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedCategoryId === category.id
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.id}
                    checked={selectedCategoryId === category.id}
                    onChange={() => setSelectedCategoryId(category.id)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2`}
                      style={{ borderColor: category.color }}
                    >
                      {selectedCategoryId === category.id && (
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                    </div>
                    {category.name}
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
            <label className="mb-2 block text-sm font-medium">Guests</label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setShowGuestSearch(!showGuestSearch)}
                >
                  <UserPlus className="h-4 w-4" />
                  Add Guests
                </Button>
                {guests.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {guests.length} guest{guests.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {showGuestSearch && (
                <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-300 bg-white p-2 shadow-lg">
                  <div className="relative mb-2">
                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or email"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <ScrollArea className="max-h-48">
                    <div className="space-y-1">
                      {mockSearchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => addGuest(result)}
                          className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-gray-100"
                        >
                          <div>
                            <div className="font-medium">{result.name}</div>
                            <div className="text-sm text-gray-500">
                              {result.email}
                            </div>
                          </div>
                          <UserPlus className="h-4 w-4 text-gray-400" />
                        </button>
                      ))}
                      {searchTerm && mockSearchResults.length === 0 && (
                        <div className="p-2 text-sm text-gray-500">
                          No results found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {guests.length > 0 && (
              <ScrollArea className="mt-2 max-h-32 rounded-md border p-2">
                <div className="space-y-1">
                  {guests.map((guest) => (
                    <div
                      key={guest.email}
                      className="flex items-center justify-between rounded-md bg-gray-50 p-2"
                    >
                      <div>
                        <div className="font-medium">{guest.name}</div>
                        <div className="text-sm text-gray-500">
                          {guest.email}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGuest(guest.email)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
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
