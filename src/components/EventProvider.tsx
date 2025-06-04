"use client";

import { useEffect, useState } from "react";
import { useEventStore } from "@/lib/store";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setError(null);
        console.log("Fetching events...");

        const response = await fetch("/api/events", {
          credentials: "include",
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const data = await response.json();
          console.error("Error response:", data);
          throw new Error(data.error || "Failed to load events");
        }

        const data = await response.json();
        console.log("Received events data:", data);

        if (!data.events) {
          throw new Error("No events data in response");
        }

        // Convert dates to dayjs objects and handle time zones
        const eventsWithDayjs = data.events.map((event: DBEvent) => ({
          ...event,
          date: dayjs(event.startTime).tz(localTimezone), // Convert UTC to local time
          endTime: dayjs(event.endTime).tz(localTimezone), // Convert UTC to local time
          repeatEndDate: event.repeatEndDate
            ? dayjs(event.repeatEndDate).tz(localTimezone)
            : undefined,
        }));

        console.log(
          "Processed events:",
          eventsWithDayjs.map(
            (event: ReturnType<(typeof eventsWithDayjs)[number]>) => ({
              ...event,
              startTimeLocal: event.date.format("YYYY-MM-DD HH:mm:ss"),
              endTimeLocal: event.endTime.format("YYYY-MM-DD HH:mm:ss"),
              repeatEndDateLocal: event.repeatEndDate?.format("YYYY-MM-DD"),
            }),
          ),
        );

        setEvents(eventsWithDayjs);
      } catch (error) {
        console.error("Error loading events:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load events",
        );
      }
    };

    loadEvents();
  }, [setEvents]);

  if (error) {
    console.error("Error in EventProvider:", error);
  }

  return <>{children}</>;
}
