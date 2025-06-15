import dayjs, { Dayjs } from "dayjs";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { getMonth } from "./getTime";

//Store in simple terms is a way to handle state in a next.js app using zustand,
// very similar to useState/useContext in react.

// Store for managing calendar view state (month, week, day)
interface ViewStoreType {
  selectedView: string;
  setView: (value: string) => void;
}

// Store for managing date-related state and month view data
interface DateStoreType {
  userSelectedDate: Dayjs;
  setDate: (value: Dayjs) => void;
  twoDMonthArray: dayjs.Dayjs[][]; // 2D array representing the month view
  selectedMonthIndex: number;
  setMonth: (index: number) => void;
  currentDate: dayjs.Dayjs;
  setCurrentDate: (date: dayjs.Dayjs) => void;
  selectedDate: dayjs.Dayjs;
  setSelectedDate: (date: dayjs.Dayjs) => void;
}

// Type for calendar event guests
export type GuestType = {
  id?: string;
  name: string;
  email: string;
};

// Type for event categories with color coding
export type EventCategory = {
  id: string;
  name: string;
  color: string;
};

// Type for calendar events with all their properties
export interface CalendarEventType {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  userId: string;
  isPublic: boolean;
  isRepeating: boolean;
  repeatDays: number[] | null;
  repeatEndDate?: string;
  repeatDuration?: "week" | "2weeks" | "month" | "3months" | "6months";
  calendarId: string; // The ID of the calendar this event belongs to
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

// Store for managing events and event-related UI state
interface EventStore {
  events: CalendarEventType[];
  setEvents: (events: CalendarEventType[]) => void;
  addEvent: (event: CalendarEventType) => void;
  updateEvent: (event: CalendarEventType) => void;
  deleteEvent: (eventId: string) => void;
  selectedEvent: CalendarEventType | null;
  setSelectedEvent: (event: CalendarEventType | null) => void;
  isEventSummaryOpen: boolean;
  setIsEventSummaryOpen: (isOpen: boolean) => void;
  closeEventSummary: () => void;
}

// Store for managing sidebar visibility
interface ToggleSideBarType {
  isSideBarOpen: boolean;
  setSideBarOpen: () => void;
}

// Type for calendar categories with color coding
export type CalendarType = {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
};

// Store for managing calendars
interface CalendarStore {
  calendars: CalendarType[];
  setCalendars: (calendars: CalendarType[]) => void;
  selectedCalendars: string[];
  setSelectedCalendars: (calendarIds: string[]) => void;
  toggleCalendar: (calendarId: string) => void;
  addCalendar: (calendar: { name: string; color: string }) => void;
  deleteCalendar: (calendarId: string) => void;
  updateCalendar: (
    calendarId: string,
    updates: { name?: string; color?: string },
  ) => void;
}

// Default categories that come pre-loaded with the app
const defaultCategories: EventCategory[] = [
  { id: "personal", name: "Personal", color: "#3B82F6" }, // blue-500
  { id: "work", name: "Work", color: "#10B981" }, // emerald-500
];

// Default calendars that come pre-loaded with the app
const defaultCalendars: CalendarType[] = [
  { id: "personal", name: "Personal", color: "#3B82F6", isDefault: true },
  { id: "work", name: "Work", color: "#10B981", isDefault: true },
];

// Store for managing event categories
interface CategoryStore {
  categories: EventCategory[];
  setCategories: (categories: EventCategory[]) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  toggleCategory: (categoryId: string) => void;
  addCategory: (category: { name: string; color: string }) => void;
  deleteCategory: (categoryId: string) => void;
  updateCategory: (
    categoryId: string,
    updates: { name?: string; color?: string },
  ) => void;
}

// Category store implementation with CRUD operations
export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set) => ({
      categories: defaultCategories,
      setCategories: (categories) => set({ categories }),
      selectedCategories: [], // Initialize with empty array
      setSelectedCategories: (categories) =>
        set({ selectedCategories: categories }),
      toggleCategory: (categoryId) =>
        set((state) => {
          const isSelected = state.selectedCategories.includes(categoryId);
          const newSelectedCategories = isSelected
            ? state.selectedCategories.filter((id) => id !== categoryId)
            : [...state.selectedCategories, categoryId];
          return { selectedCategories: newSelectedCategories };
        }),
      addCategory: (category) =>
        set((state) => ({
          categories: [
            ...state.categories,
            {
              id: Math.random().toString(36).substr(2, 9),
              name: category.name,
              color: category.color,
            },
          ],
        })),
      deleteCategory: (categoryId) =>
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== categoryId),
          selectedCategories: state.selectedCategories.filter(
            (id) => id !== categoryId,
          ),
        })),
      updateCategory: (categoryId, updates) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === categoryId ? { ...cat, ...updates } : cat,
          ),
        })),
    }),
    {
      name: "category-storage",
      skipHydration: true,
    },
  ),
);

// View store implementation with persistence
export const useViewStore = create<ViewStoreType>()(
  devtools(
    persist(
      (set) => ({
        selectedView: "month",
        setView: (value: string) => {
          set({ selectedView: value });
        },
      }),
      { name: "calendar_view", skipHydration: true },
    ),
  ),
);

// Helper function to get events for a specific day, handling both one-time and recurring events
export const getEventsForDay = (
  events: CalendarEventType[],
  date: dayjs.Dayjs,
) => {
  return events.filter((event) => {
    // For non-repeating events, just check if the date matches
    if (!event.isRepeating) {
      return (
        dayjs(event.startTime).format("YYYY-MM-DD") ===
        date.format("YYYY-MM-DD")
      );
    }

    // For repeating events, check if the date matches any of the repeat days
    // and is within the repeat duration
    const eventDate = dayjs(event.startTime);
    const repeatDays = event.repeatDays || [];
    const endDate = event.repeatEndDate ? dayjs(event.repeatEndDate) : null;

    // If no end date is set, don't show the event
    if (!endDate) {
      return false;
    }

    // Check if the current date is within the repeat duration
    // Exclude the end date
    if (
      date.isBefore(eventDate.startOf("day")) ||
      date.isAfter(endDate.endOf("day"))
    ) {
      return false;
    }

    // Check if the day of week matches any of the repeat days
    return repeatDays.includes(date.day());
  });
};

// Date store implementation with persistence
export const useDateStore = create<DateStoreType>()(
  devtools(
    persist(
      (set) => ({
        userSelectedDate: dayjs(),
        twoDMonthArray: getMonth(),
        selectedMonthIndex: dayjs().month(),
        setDate: (value: Dayjs) => {
          set({ userSelectedDate: value });
        },
        setMonth: (index) => {
          set({ twoDMonthArray: getMonth(index), selectedMonthIndex: index });
        },
        currentDate: dayjs(),
        setCurrentDate: (date) => set({ currentDate: date }),
        selectedDate: dayjs(),
        setSelectedDate: (date) => set({ selectedDate: date }),
      }),
      { name: "date_data", skipHydration: true },
    ),
  ),
);

// Event store implementation
export const useEventStore = create<EventStore>((set) => ({
  events: [],
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateEvent: (event) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === event.id ? event : e)),
    })),
  deleteEvent: (eventId) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    })),
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  isEventSummaryOpen: false,
  setIsEventSummaryOpen: (isOpen) => set({ isEventSummaryOpen: isOpen }),
  closeEventSummary: () =>
    set({ isEventSummaryOpen: false, selectedEvent: null }),
}));

// Sidebar toggle store implementation
export const useToggleSideBarStore = create<ToggleSideBarType>()(
  (set, get) => ({
    isSideBarOpen: true,
    setSideBarOpen: () => {
      set({ isSideBarOpen: !get().isSideBarOpen });
    },
  }),
);

// Public/Private view toggle store
interface PublicPrivateToggleType {
  isPublicView: boolean;
  setPublicView: (isPublic: boolean) => void;
  toggleView: () => void;
}

export const usePublicPrivateToggleStore = create<PublicPrivateToggleType>()(
  persist(
    (set, get) => ({
      isPublicView: true, // Default to public view
      setPublicView: (isPublic: boolean) => set({ isPublicView: isPublic }),
      toggleView: () => set({ isPublicView: !get().isPublicView }),
    }),
    {
      name: "public-private-toggle",
      skipHydration: false,
    },
  ),
);

// Calendar store implementation with CRUD operations
export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      calendars: defaultCalendars, // Initialize with default calendars
      setCalendars: (calendars) => {
        // Clean up any old "public" calendar references
        const cleanedCalendars = calendars.filter((cal) => cal.id !== "public");
        set({ calendars: cleanedCalendars });

        // Also remove "public" from selected calendars if it exists
        const currentState = useCalendarStore.getState();
        if (currentState.selectedCalendars.includes("public")) {
          const cleanedSelected = currentState.selectedCalendars.filter(
            (id) => id !== "public",
          );
          set({ selectedCalendars: cleanedSelected });
        }
      },
      selectedCalendars: defaultCalendars.map((cal) => cal.id), // Initialize with all default calendars selected
      setSelectedCalendars: (calendarIds) => {
        // Ensure we don't include the "public" calendar ID
        const cleanedIds = calendarIds.filter((id) => id !== "public");
        set({ selectedCalendars: cleanedIds });
      },
      toggleCalendar: (calendarId) =>
        set((state) => {
          // Don't allow toggling the "public" calendar
          if (calendarId === "public") return state;

          const isSelected = state.selectedCalendars.includes(calendarId);
          const newSelectedCalendars = isSelected
            ? state.selectedCalendars.filter((id) => id !== calendarId)
            : [...state.selectedCalendars, calendarId];

          // Ensure we always have at least one calendar selected
          if (newSelectedCalendars.length === 0) {
            return state;
          }

          return { selectedCalendars: newSelectedCalendars };
        }),
      addCalendar: async (calendar) => {
        // Generate a meaningful ID based on the calendar name
        const baseId = calendar.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric characters
          .substring(0, 20); // Limit length

        // Check if this ID already exists and add a suffix if needed
        const existingCalendars = useCalendarStore.getState().calendars;
        let finalId = baseId;
        let counter = 1;

        while (existingCalendars.some((cal) => cal.id === finalId)) {
          finalId = `${baseId}${counter}`;
          counter++;
        }

        const newCalendar = {
          id: finalId,
          name: calendar.name,
          color: calendar.color,
        };

        // Optimistically update the UI
        set((state) => ({
          calendars: [...state.calendars, newCalendar],
          // Automatically select the new calendar
          selectedCalendars: [...state.selectedCalendars, finalId],
        }));

        try {
          const currentCalendars = useCalendarStore.getState().calendars;
          const response = await fetch("/api/user/calendars", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ calendars: currentCalendars }),
            credentials: "include",
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.details || "Failed to update calendars");
          }

          set({ calendars: data.calendars });
        } catch (error) {
          console.error("Error updating calendars:", error);
          // Revert the state if the API call fails
          set((state) => ({
            calendars: state.calendars.filter((c) => c.id !== newCalendar.id),
            selectedCalendars: state.selectedCalendars.filter(
              (id) => id !== newCalendar.id,
            ),
          }));
          throw error; // Re-throw to handle in the UI
        }
      },
      deleteCalendar: (calendarId) =>
        set((state) => {
          // Don't allow deleting default calendars
          const calendar = state.calendars.find((c) => c.id === calendarId);
          if (calendar?.isDefault) return state;

          // Remove from calendars and selected calendars
          const newCalendars = state.calendars.filter(
            (c) => c.id !== calendarId,
          );
          const newSelectedCalendars = state.selectedCalendars.filter(
            (id) => id !== calendarId,
          );

          // Ensure we always have at least one calendar selected
          if (newSelectedCalendars.length === 0) {
            return state;
          }

          return {
            calendars: newCalendars,
            selectedCalendars: newSelectedCalendars,
          };
        }),
      updateCalendar: (calendarId, updates) =>
        set((state) => {
          // Don't allow updating default calendars
          const calendar = state.calendars.find((c) => c.id === calendarId);
          if (calendar?.isDefault) return state;

          return {
            calendars: state.calendars.map((cal) =>
              cal.id === calendarId ? { ...cal, ...updates } : cal,
            ),
          };
        }),
    }),
    {
      name: "calendar-storage",
      skipHydration: true,
    },
  ),
);
