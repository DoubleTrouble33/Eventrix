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

interface DBEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  userId: string;
  isPublic: boolean;
  isRepeating: boolean;
  repeatDays: number[] | null;
  repeatEndDate: string | null;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  guests?: {
    id: string;
    name: string;
    email: string;
    eventId: string;
    createdAt: string;
  }[];
}

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { setEvents } = useEventStore();
  const { selectedCalendars } = useCalendarStore();
  const { isPublicView } = usePublicPrivateToggleStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setError(null);

        // Simple cache for development to reduce API calls
        const cacheKey = `events-${isPublicView}-${Date.now() - (Date.now() % 30000)}`; // 30 second cache
        const cached = sessionStorage.getItem(cacheKey);

        if (cached && process.env.NODE_ENV === "development") {
          const cachedData = JSON.parse(cached);
          setEvents(cachedData);
          return;
        }

        // Always fetch user's personal events (both public and private)
        const response = await fetch("/api/events", {
          credentials: "include",
        });

        if (!response.ok) {
          const data = await response.json();
          console.error("Error response:", data);
          throw new Error(data.error || "Failed to load events");
        }

        const data = await response.json();

        if (!data.events) {
          throw new Error("No events data in response");
        }

        let allEvents = [...data.events];

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
                const userEventIds = new Set(
                  data.events.map((e: DBEvent) => e.id),
                );
                const newPublicEvents = publicData.events.filter(
                  (event: DBEvent) => !userEventIds.has(event.id),
                );
                allEvents = [...allEvents, ...newPublicEvents];
              }
            }
          } catch (publicError) {
            console.error("Error fetching public events:", publicError);
            // Don't fail the entire load if public events fail
          }
        }

        // Cache the result for development
        if (process.env.NODE_ENV === "development") {
          sessionStorage.setItem(cacheKey, JSON.stringify(allEvents));
        }

        // Store events in their original format (the store handles date conversion)
        setEvents(allEvents);
      } catch (error) {
        console.error("Error loading events:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load events",
        );
      }
    };

    loadEvents();
  }, [setEvents, selectedCalendars, isPublicView]);

  if (error) {
    console.error("Error in EventProvider:", error);
  }

  return <>{children}</>;
}
