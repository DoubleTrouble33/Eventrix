"use client";

import { useEffect, useState } from "react";
import {
  useEventStore,
  useCalendarStore,
  usePublicPrivateToggleStore,
} from "@/lib/store";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Don't set default timezone - let each conversion be explicit
// const localTimezone = dayjs.tz.guess();
// dayjs.tz.setDefault(localTimezone);

interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  calendarId: string;
  userId: string;
  isPublic: boolean;
}

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { setEvents } = useEventStore();
  const { selectedCalendars, setCalendars, calendars } = useCalendarStore();
  const { isPublicView } = usePublicPrivateToggleStore();
  const [error, setError] = useState<string | null>(null);

  // Load user's calendars on mount
  useEffect(() => {
    const loadCalendars = async () => {
      try {
        const response = await fetch("/api/user/calendars", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load calendars");
        }

        const data = await response.json();
        if (data.calendars) {
          setCalendars(data.calendars);
        }
      } catch (error) {
        console.error("Error loading calendars:", error);
      }
    };

    loadCalendars();
  }, [setCalendars]);

  // Load events when selectedCalendars or isPublicView changes
  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Clear any existing error
        setError(null);

        // Always fetch user's own events first
        const response = await fetch("/api/events", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        const data = await response.json();
        let allEvents = data.events || [];

        // If in public view, also fetch ALL public events from other users
        if (isPublicView) {
          try {
            const publicResponse = await fetch("/api/events/public", {
              credentials: "include",
            });

            if (publicResponse.ok) {
              const publicData = await publicResponse.json();

              if (publicData.events) {
                // Filter out public events that the user already has (to avoid duplicates)
                const userEventIds = new Set(allEvents.map((e: Event) => e.id));
                const newPublicEvents = publicData.events.filter(
                  (event: Event) => !userEventIds.has(event.id),
                );
                allEvents = [...allEvents, ...newPublicEvents];
              }
            }
          } catch (publicError) {
            console.error("Error fetching public events:", publicError);
            // Don't fail the entire load if public events fail
          }
        }

        // Filter events based on selected calendars and public/private mode
        const filteredEvents = allEvents.filter((event: Event) => {
          // Always show events with deleted calendars (orphaned events)
          const calendarExists = calendars.some(
            (cal) => cal.id === event.calendarId,
          );
          if (!calendarExists) {
            return true; // Show orphaned events
          }

          // In PUBLIC view: Show events from selected calendars + public events you're participating in
          if (isPublicView) {
            // Show events from selected calendars (your own calendars)
            const isFromSelectedCalendar = selectedCalendars.includes(
              event.calendarId,
            );
            if (isFromSelectedCalendar) {
              return true; // Show all events from your selected calendars
            }

            // Also show public events from other users that you're participating in
            // (These would be events where you're a guest, fetched from /api/events/public)
            return event.isPublic === true;
          }

          // In PRIVATE view: Only show events from YOUR selected calendars
          return selectedCalendars.includes(event.calendarId);
        });

        setEvents(filteredEvents);
      } catch (error) {
        console.error("Error loading events:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load events",
        );
      }
    };

    loadEvents();
  }, [setEvents, selectedCalendars, isPublicView, calendars]);

  if (error) {
    console.error("Error in EventProvider:", error);
  }

  return <>{children}</>;
}
