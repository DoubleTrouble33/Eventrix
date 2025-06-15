"use client";

import { useEventStore, useCalendarStore, useThemeStore } from "@/lib/store";
import { ScrollArea } from "./scroll-area";
import { Button } from "./button";
import {
  X,
  Trash,
  Users,
  Globe2,
  Lock,
  Tag,
  UserPlus,
  Search,
  Plus,
  Edit,
} from "lucide-react";
import { ParticipantHoverCard } from "./participant-hover-card";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { Input } from "./input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDebounce } from "@/lib/hooks";
import { EditEventDialog } from "./edit-event-dialog";

export function EventSummary() {
  const { selectedEvent, closeEventSummary, events, setEvents } =
    useEventStore();
  const { calendars } = useCalendarStore();
  const { isDarkMode } = useThemeStore();
  const [creator, setCreator] = useState<{
    firstName: string;
    lastName: string;
    avatar: string;
    email: string;
  } | null>(null);
  const [participants, setParticipants] = useState<
    Array<{
      name: string;
      email: string;
      isAccepted: boolean;
    }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      email: string;
      name: string;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
    email: string;
  } | null>(null);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!selectedEvent) return;

      try {
        // If the event creator is the current user, use their data
        if (currentUser && selectedEvent.userId === currentUser.id) {
          setCreator({
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            avatar: currentUser.avatar,
            email: currentUser.email,
          });
        } else {
          // Only fetch creator data if it's a different user
          const creatorResponse = await fetch(
            `/api/users/${selectedEvent.userId}`,
            {
              credentials: "include",
            },
          );
          if (creatorResponse.ok) {
            const creatorData = await creatorResponse.json();
            setCreator(creatorData.user);
          }
        }

        // Fetch participants
        const participantsResponse = await fetch(
          `/api/events/${selectedEvent.id}/guests`,
          {
            credentials: "include",
          },
        );
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          setParticipants(participantsData.guests);
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    };

    fetchEventDetails();
  }, [selectedEvent, currentUser]);

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
          // Filter out already selected participants
          // The API returns the array directly, not wrapped in a users property
          const users = Array.isArray(data) ? data : [];
          setSearchResults(
            users
              .map(
                (user: {
                  id: string;
                  email: string;
                  firstName: string;
                  lastName: string;
                }) => ({
                  id: user.id,
                  email: user.email,
                  name: `${user.firstName} ${user.lastName}`,
                }),
              )
              .filter(
                (user: { id: string; email: string; name: string }) =>
                  !participants.some(
                    (participant) => participant.email === user.email,
                  ),
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
  }, [debouncedSearch, participants]);

  const handleJoinEvent = async () => {
    if (!selectedEvent || !currentUser) return;

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/guests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser.email,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join event");
      }

      await response.json();

      // Update participants list
      setParticipants([
        ...participants,
        {
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          email: currentUser.email,
          isAccepted: true, // Auto-accept when joining
        },
      ]);
    } catch (error) {
      console.error("Error joining event:", error);
      alert(error instanceof Error ? error.message : "Failed to join event");
    }
  };

  const handleAddParticipant = async (user: {
    id: string;
    email: string;
    name: string;
  }) => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/guests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: user.name,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(
          `Failed to add participant: ${errorData.error || "Unknown error"}`,
        );
      }

      const data = await response.json();
      setParticipants([...participants, data.guest]);
      setSearchQuery("");
      setIsAddingParticipant(false);
    } catch (error) {
      console.error("Error adding participant:", error);
    }
  };

  const handleToggleVisibility = async () => {
    if (!selectedEvent) return;

    try {
      setIsUpdatingVisibility(true);
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          isPublic: !selectedEvent.isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update event visibility");
      }

      // Update local state
      const updatedEvents = events.map((event) =>
        event.id === selectedEvent.id
          ? { ...event, isPublic: !event.isPublic }
          : event,
      );
      setEvents(updatedEvents);

      // Update selectedEvent in the store
      useEventStore.setState({
        selectedEvent: {
          ...selectedEvent,
          isPublic: !selectedEvent.isPublic,
        },
      });
    } catch (error) {
      console.error("Error updating event visibility:", error);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!selectedEvent || !currentUser) return;

    try {
      const response = await fetch(
        `/api/users/${currentUser.id}/invitations/decline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId: selectedEvent.id }),
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to leave event");
      }

      // Remove the current user from participants list
      setParticipants(
        participants.filter((p) => p.email !== currentUser.email),
      );

      // Update the events list to remove this event for the current user
      const updatedEvents = events.filter((e) => e.id !== selectedEvent.id);
      setEvents(updatedEvents);

      // Close the event summary since user is no longer part of the event
      closeEventSummary();
    } catch (error) {
      console.error("Error leaving event:", error);
      alert(error instanceof Error ? error.message : "Failed to leave event");
    }
  };

  if (!selectedEvent) return null;

  const calendar = calendars.find((c) => c.id === selectedEvent.calendarId);

  // Fallback for events with deleted calendars
  const fallbackCalendar = {
    id: selectedEvent.calendarId,
    name: "Deleted Calendar",
    color: "#6B7280",
  };
  const displayCalendar = calendar || fallbackCalendar;

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/events?id=${selectedEvent.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      // Update local state
      const updatedEvents = events.filter((e) => e.id !== selectedEvent.id);
      setEvents(updatedEvents);
      closeEventSummary();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <button
            onClick={closeEventSummary}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="space-y-4">
            <div>
              <div className="flex items-start justify-between pt-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedEvent.title}
                  </h2>
                  {/* Show event type badge for events user didn't create */}
                  {currentUser && selectedEvent.userId !== currentUser.id && (
                    <div
                      className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                        selectedEvent.isPublic
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
                          : "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {selectedEvent.isPublic ? (
                        <>
                          <Globe2 className="h-3 w-3" />
                          Public Event
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Private Event
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Only show visibility toggle for event owners */}
                  {currentUser && selectedEvent.userId === currentUser.id && (
                    <button
                      onClick={handleToggleVisibility}
                      disabled={isUpdatingVisibility}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${
                        selectedEvent.isPublic
                          ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                          : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                      }`}
                    >
                      {selectedEvent.isPublic ? (
                        <>
                          <Globe2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                          <span className="text-sm text-green-600 dark:text-green-300">
                            Public
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-sm text-blue-600 dark:text-blue-300">
                            Private
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Creator Information */}
              {creator && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 overflow-hidden rounded-full">
                      <img
                        src={creator.avatar || "/default-avatar.png"}
                        alt={`${creator.firstName} ${creator.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <ParticipantHoverCard
                      participant={{
                        name: `${creator.firstName} ${creator.lastName}`,
                        email: creator.email,
                        isAccepted: true,
                      }}
                      currentUserEmail={currentUser?.email}
                    >
                      <span className="cursor-pointer text-sm text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300">
                        Created by {creator.firstName} {creator.lastName}
                      </span>
                    </ParticipantHoverCard>
                  </div>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    •
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {dayjs(selectedEvent.createdAt).format("MMM D, YYYY HH:mm")}
                  </span>
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <div
                  className="flex items-center gap-2 rounded-full px-2 py-0.5 text-sm"
                  style={{ backgroundColor: `${displayCalendar.color}20` }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: displayCalendar.color }}
                  />
                  <span style={{ color: displayCalendar.color }}>
                    {displayCalendar.name}
                    {!calendar && " (Deleted)"}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {selectedEvent.isRepeating ? (
                  <>
                    {dayjs(selectedEvent.startTime).format("MMMM D")} -{" "}
                    {dayjs(selectedEvent.repeatEndDate).format("MMMM D, YYYY")}
                    <br />
                    {dayjs(selectedEvent.startTime).format("HH:mm")} -{" "}
                    {dayjs(selectedEvent.endTime).format("HH:mm")}
                  </>
                ) : (
                  <>
                    {dayjs(selectedEvent.startTime).format("MMMM D, YYYY")}
                    <br />
                    {dayjs(selectedEvent.startTime).format("HH:mm")} -{" "}
                    {dayjs(selectedEvent.endTime).format("HH:mm")}
                  </>
                )}
              </p>
            </div>

            <ScrollArea className="h-32 w-full rounded-md border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-700">
              <p className="text-gray-700 dark:text-gray-300">
                {selectedEvent.description || "No description provided."}
              </p>
            </ScrollArea>

            {/* Participants Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Participants ({participants.length})
                  </h3>
                </div>
                {/* Show JOIN button for public events user didn't create and isn't already participating in */}
                {selectedEvent.isPublic &&
                currentUser &&
                selectedEvent.userId !== currentUser.id
                  ? (() => {
                      const isParticipant = participants.some(
                        (p) =>
                          p.email?.toLowerCase() ===
                          currentUser.email?.toLowerCase(),
                      );

                      return !isParticipant ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                          onClick={handleJoinEvent}
                        >
                          <UserPlus className="h-4 w-4" />
                          JOIN
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 rounded-md bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                          <Users className="h-4 w-4" />
                          JOINED
                        </div>
                      );
                    })()
                  : /* Show Add Participant dialog for event owners */
                    currentUser &&
                    selectedEvent.userId === currentUser.id && (
                      <Dialog
                        open={isAddingParticipant}
                        onOpenChange={setIsAddingParticipant}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            Add Participant
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Participant</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="relative">
                              <div className="flex items-center gap-2">
                                <Search className="absolute left-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <Input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                  placeholder="Search by name or email"
                                  className="pl-9"
                                />
                              </div>
                              {searchQuery &&
                                (isSearching ? (
                                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                    Searching...
                                  </div>
                                ) : (
                                  searchResults.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                                      <ScrollArea className="max-h-48">
                                        {searchResults.map((user) => (
                                          <button
                                            key={user.id}
                                            type="button"
                                            onClick={() =>
                                              handleAddParticipant(user)
                                            }
                                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-600"
                                          >
                                            <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            <div>
                                              <div className="font-medium text-gray-900 dark:text-white">
                                                {user.name}
                                              </div>
                                              <div className="text-sm text-gray-500 dark:text-gray-400">
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
                    )}
              </div>
              <ScrollArea className="h-32 w-full rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
                <div className="space-y-2">
                  {participants.length > 0 ? (
                    participants.map((participant) => (
                      <div
                        key={participant.email}
                        className="flex items-center justify-between rounded-md bg-white p-2 shadow-sm dark:bg-gray-600"
                      >
                        <ParticipantHoverCard
                          participant={participant}
                          currentUserEmail={currentUser?.email}
                        >
                          <div>
                            <div className="font-medium transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                              {participant.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {participant.email}
                            </div>
                          </div>
                        </ParticipantHoverCard>
                        <div className="flex items-center gap-2">
                          <div
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              participant.isAccepted
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                            }`}
                          >
                            {participant.isAccepted ? "Accepted" : "Pending"}
                          </div>
                          {/* Show Leave Event button if this is the current user and they're not the creator */}
                          {currentUser &&
                            participant.email === currentUser.email &&
                            selectedEvent.userId !== currentUser.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLeaveEvent}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                              >
                                Leave event
                              </Button>
                            )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      No participants yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-end space-x-2">
              {currentUser && selectedEvent.userId === currentUser.id && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(true);
                      // Only hide the event summary UI, don't clear selectedEvent yet
                      useEventStore.setState({ isEventSummaryOpen: false });
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Event
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash className="h-4 w-4" />
                    Delete Event
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={closeEventSummary}>
                Close
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Event Dialog */}
        {selectedEvent && (
          <EditEventDialog
            event={selectedEvent}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />
        )}
      </div>
    </div>
  );
}
