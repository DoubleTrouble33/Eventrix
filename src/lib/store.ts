import dayjs, { Dayjs } from "dayjs";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { getMonth } from "./getTime";

interface ViewStoreType {
  selectedView: string;
  setView: (value: string) => void;
}

interface DateStoreType {
  userSelectedDate: Dayjs;
  setDate: (value: Dayjs) => void;
  twoDMonthArray: dayjs.Dayjs[][];
  selectedMonthIndex: number;
  setMonth: (index: number) => void;
}

export type GuestType = {
  id?: string;
  name: string;
  email: string;
};

export type EventCategory = {
  id: string;
  name: string;
  color: string;
};

export type CalendarEventType = {
  id: string;
  title: string;
  description: string;
  date: dayjs.Dayjs;
  endTime?: dayjs.Dayjs;
  isRepeating?: boolean;
  repeatDays?: number[]; // 0-6 (Sunday-Saturday)
  repeatUntil?: dayjs.Dayjs; // Optional end date for repeats
  guests?: GuestType[];
  isPublic: boolean;
  categoryId: string; // Reference to EventCategory
};

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

interface ToggleSideBarType {
  isSideBarOpen: boolean;
  setSideBarOpen: () => void;
}

// Default categories
const defaultCategories: EventCategory[] = [
  { id: "personal", name: "Personal", color: "#3B82F6" }, // blue-500
  { id: "work", name: "Work", color: "#10B981" }, // emerald-500
  { id: "fitness", name: "Fitness", color: "#EF4444" }, // red-500
];

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

export function getEventsForDay(events: CalendarEventType[], day: dayjs.Dayjs) {
  return events.filter((event) => {
    // Check if event matches the exact day
    if (event.date.isSame(day, "day")) return true;

    // Check for repeating events
    if (event.isRepeating && event.repeatDays) {
      const eventDayOfWeek = event.date.day();
      const currentDayOfWeek = day.day();

      // Check if today is one of the repeat days
      const isRepeatDay = event.repeatDays.includes(currentDayOfWeek);

      // Check if the current day is after the original event date
      const isAfterOriginalDate = day.isAfter(event.date, "day");

      // Optional: Check if before repeatUntil date if specified
      const isBeforeRepeatEnd = event.repeatUntil
        ? day.isBefore(event.repeatUntil, "day") ||
          day.isSame(event.repeatUntil, "day")
        : true;

      return isRepeatDay && isAfterOriginalDate && isBeforeRepeatEnd;
    }

    return false;
  });
}

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

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  isPopoverOpen: false,
  isEventSummaryOpen: false,
  selectedEvent: null,
  setEvents: (events) => set({ events }),
  openPopover: () => set({ isPopoverOpen: true }),
  closePopover: () => set({ isPopoverOpen: false }),
  openEventSummary: (event) =>
    set({ isEventSummaryOpen: true, selectedEvent: event }),
  closeEventSummary: () =>
    set({ isEventSummaryOpen: false, selectedEvent: null }),
}));

export const useToggleSideBarStore = create<ToggleSideBarType>()(
  (set, get) => ({
    isSideBarOpen: true,
    setSideBarOpen: () => {
      set({ isSideBarOpen: !get().isSideBarOpen });
    },
  }),
);
