import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  password: text("password").notNull(), // Will be hashed
  avatar: text("avatar").default("/img/avatar-demo.png"), // Base64 encoded image
  isAdmin: boolean("is_admin").default(false).notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  calendars: jsonb("calendars")
    .$type<
      {
        id: string;
        name: string;
        color: string;
        isDefault?: boolean;
      }[]
    >()
    .default([
      {
        id: "public",
        name: "Public Events",
        color: "#4CAF50",
        isDefault: true,
      },
      { id: "personal", name: "Personal", color: "#3B82F6" },
      { id: "work", name: "Work", color: "#10B981" },
      { id: "fitness", name: "Fitness", color: "#EF4444" },
    ]),
  contacts: jsonb("contacts")
    .$type<{
      organized: {
        [groupId: string]: {
          name: string;
          color: string;
          memberIds: string[];
        };
      };
      unorganized: {
        [contactId: string]: {
          email: string;
          firstName: string;
          lastName: string;
          avatar: string;
          status: "active" | "pending" | "declined";
          addedAt: string; // ISO string for JSON compatibility
        };
      };
    }>()
    .default({
      organized: {},
      unorganized: {},
    }),
  notifications: jsonb("notifications")
    .$type<
      {
        id: string;
        type: "contact_request" | "event_invitation";
        fromUserId?: string;
        fromUserName?: string;
        fromUserEmail?: string;
        fromUserAvatar?: string;
        eventId?: string;
        eventTitle?: string;
        hostName?: string;
        message: string;
        createdAt: string;
        viewed: boolean;
      }[]
    >()
    .default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  isRepeating: boolean("is_repeating").default(false).notNull(),
  repeatDays: jsonb("repeat_days").$type<number[]>(),
  repeatEndDate: timestamp("repeat_end_date"),
  categoryId: text("category_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Event guests table for managing event attendees
export const eventGuests = pgTable("event_guests", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .references(() => events.id)
    .notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  viewed: boolean("viewed").default(false).notNull(),
  isAccepted: boolean("is_accepted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
