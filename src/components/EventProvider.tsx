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

// Set the timezone to local
const localTimezone = dayjs.tz.guess();
dayjs.tz.setDefault(localTimezone);

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

        // Filter events based on selected calendars
        const filteredEvents = allEvents.filter((event: Event) => {
          // Debug logging
          console.log(
            "Event:",
            event.title,
            "calendarId:",
            event.calendarId,
            "categoryId:",
            (event as Event & { categoryId?: string }).categoryId,
          );

          // Always show events with deleted calendars (orphaned events)
          const calendarExists = calendars.some(
            (cal) => cal.id === event.calendarId,
          );
          if (!calendarExists) {
            console.log("Event has deleted calendar, showing:", event.title);
            return true; // Show orphaned events
          }

          // In PUBLIC view: Show events from selected calendars (both public and private)
          if (isPublicView) {
            const shouldShow = selectedCalendars.includes(event.calendarId);
            if (event.isPublic) {
              console.log(
                "Public event, shouldShow:",
                shouldShow,
                "for:",
                event.title,
              );
            } else {
              console.log(
                "Private event in public view, shouldShow:",
                shouldShow,
                "for:",
                event.title,
              );
            }
            return shouldShow;
          }

          // In PRIVATE view: Only show selected calendar events
          const shouldShow = selectedCalendars.includes(event.calendarId);
          console.log(
            "Private view:",
            event.title,
            "shouldShow:",
            shouldShow,
            "selectedCalendars:",
            selectedCalendars,
          );
          return shouldShow;
        });

        console.log(
          "Filtered events count:",
          filteredEvents.length,
          "from",
          allEvents.length,
          "total events",
        );
        console.log("Selected calendars:", selectedCalendars);
        console.log(
          "Available calendars:",
          calendars.map((c) => ({ id: c.id, name: c.name })),
        );

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
