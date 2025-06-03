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
  name: text("name").notNull(),
  password: text("password").notNull(), // Will be hashed
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
