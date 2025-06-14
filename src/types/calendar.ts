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

export interface ContactType {
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  status: "active" | "pending" | "declined";
  addedAt: string;
}

export interface ContactGroupType {
  name: string;
  color: string;
  memberIds: string[];
}

export interface UserContactsType {
  organized: {
    [groupId: string]: ContactGroupType;
  };
  unorganized: {
    [contactId: string]: ContactType;
  };
}
