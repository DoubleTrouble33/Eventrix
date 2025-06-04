"use client";

import { useEffect } from "react";
import { useEventStore } from "@/lib/store";
import dayjs from "dayjs";

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

        // Convert dates to dayjs objects
        const eventsWithDayjs = data.events.map((event: DBEvent) => ({
          ...event,
          date: dayjs(event.startTime),
          endTime: dayjs(event.endTime),
        }));

        setEvents(eventsWithDayjs);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    loadEvents();
  }, [setEvents]);

  return <>{children}</>;
}
