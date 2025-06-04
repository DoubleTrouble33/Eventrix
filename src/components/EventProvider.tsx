"use client";

import { useEffect } from "react";
import { useEventStore } from "@/lib/store";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

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

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch("/api/events", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        const data = await response.json();

        // Convert dates to dayjs objects and handle time zones
        const eventsWithDayjs = data.events.map((event: DBEvent) => ({
          ...event,
          date: dayjs(event.startTime).local(), // Convert UTC to local time
          endTime: dayjs(event.endTime).local(), // Convert UTC to local time
        }));

        console.log(
          "Loaded events:",
          eventsWithDayjs.map(
            (event: ReturnType<(typeof eventsWithDayjs)[number]>) => ({
              ...event,
              startTimeLocal: event.date.format("YYYY-MM-DD HH:mm:ss"),
              endTimeLocal: event.endTime.format("YYYY-MM-DD HH:mm:ss"),
            }),
          ),
        ); // Debug log

        setEvents(eventsWithDayjs);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    loadEvents();
  }, [setEvents]);

  return <>{children}</>;
}
