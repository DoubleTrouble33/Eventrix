"use client";

import { useEffect } from "react";
import { useCalendarStore } from "@/lib/store";

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { setCalendars } = useCalendarStore();

  useEffect(() => {
    // Fetch calendars from the database when the component mounts
    fetch("/api/user/calendars", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.calendars) {
          setCalendars(data.calendars);
        }
      })
      .catch((error) => {
        console.error("Error fetching calendars:", error);
      });
  }, [setCalendars]);

  return <>{children}</>;
}
