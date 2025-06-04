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
export type CalendarEventType = {
  id: string;
  title: string;
  description: string;
  date: dayjs.Dayjs;
  endTime?: dayjs.Dayjs;
  isRepeating?: boolean;
  repeatDays?: number[]; // Array of days (0-6) when event repeats
  repeatDuration?: "week" | "2weeks" | "month" | "3months" | "6months";
  repeatEndDate?: dayjs.Dayjs; // End date for repeating events
  guests?: GuestType[];
  isPublic: boolean;
  categoryId: string;
};

// Store for managing events and event-related UI state
type EventStore = {
  events: CalendarEventType[];
  isPopoverOpen: boolean;
  isEventSummaryOpen: boolean;
  selectedEvent: CalendarEventType | null;
  setEvents: (events: CalendarEventType[]) => void;
  openPopover: () => void;
  closePopover: () => void;
  openEventSummary: (event: CalendarEventType) => void;
  closeEventSummary: () => void;
};

// Store for managing sidebar visibility
interface ToggleSideBarType {
  isSideBarOpen: boolean;
  setSideBarOpen: () => void;
}

// Default categories that come pre-loaded with the app
const defaultCategories: EventCategory[] = [
  { id: "personal", name: "Personal", color: "#3B82F6" }, // blue-500
  { id: "work", name: "Work", color: "#10B981" }, // emerald-500
  { id: "fitness", name: "Fitness", color: "#EF4444" }, // red-500
];

// Store for managing event categories
interface CategoryStoreType {
  initialized: boolean;
  categories: EventCategory[];
  selectedCategory: string | null;
  addCategory: (category: Omit<EventCategory, "id">) => void;
  removeCategory: (id: string) => void;
  selectCategory: (id: string | null) => void;
  setCategories: (categories: EventCategory[]) => void;
  initialize: () => void;
}

// Category store implementation with CRUD operations
export const useCategoryStore = create<CategoryStoreType>()((set) => ({
  initialized: false,
  categories: defaultCategories,
  selectedCategory: null,
  addCategory: (category) =>
    set((state) => ({
      categories: [
        ...state.categories,
        { ...category, id: crypto.randomUUID() },
      ],
    })),
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
      selectedCategory:
        state.selectedCategory === id ? null : state.selectedCategory,
    })),
  selectCategory: (id) => set({ selectedCategory: id }),
  setCategories: (categories) => set({ categories }),
  initialize: () =>
    set({
      initialized: true,
      categories: defaultCategories,
      selectedCategory: null,
    }),
}));

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
      return event.date.format("YYYY-MM-DD") === date.format("YYYY-MM-DD");
    }

    // For repeating events, check if the date matches any of the repeat days
    // and is within the repeat duration
    const eventDate = event.date;
    const repeatDays = event.repeatDays || [];
    const repeatDuration = event.repeatDuration || "month";

    // Calculate the end date based on repeat duration
    let endDate;
    switch (repeatDuration) {
      case "week":
        endDate = eventDate.add(1, "week").subtract(1, "day");
        break;
      case "2weeks":
        endDate = eventDate.add(2, "week").subtract(1, "day");
        break;
      case "month":
        endDate = eventDate.add(1, "month").subtract(1, "day");
        break;
      case "3months":
        endDate = eventDate.add(3, "month").subtract(1, "day");
        break;
      case "6months":
        endDate = eventDate.add(6, "month").subtract(1, "day");
        break;
      default:
        endDate = eventDate.add(1, "month").subtract(1, "day");
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
      }),
      { name: "date_data", skipHydration: true },
    ),
  ),
);

// Event store implementation
export const useEventStore = create<EventStore>((set) => ({
  events: [],
  isPopoverOpen: false,
  isEventSummaryOpen: false,
  selectedEvent: null,
  setEvents: (events) => set({ events }),
  openPopover: () => set({ isPopoverOpen: true }),
  closePopover: () => set({ isPopoverOpen: false }),
  openEventSummary: (event) =>
    set({ selectedEvent: event, isEventSummaryOpen: true }),
  closeEventSummary: () =>
    set({ selectedEvent: null, isEventSummaryOpen: false }),
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
