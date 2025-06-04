export interface CalendarEventType {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  categoryId: string;
  isPublic?: boolean;
  isRepeating?: boolean;
  repeatDays?: number[];
  repeatEndDate?: string;
  repeatDuration?: "week" | "2weeks" | "month" | "3months" | "6months";
  userId: string;
  guests?: Array<{
    name: string;
    email: string;
  }>;
}

export interface CategoryType {
  id: string;
  name: string;
  color: string;
}
