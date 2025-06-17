# Next.js Architecture & SQL Guide for Eventrix

A complete beginner's guide to Next.js and SQL queries used in the Eventrix calendar app.

## Table of Contents

- [Overview](#overview)
- [App Router Structure](#app-router-structure)
- [Database & SQL Queries](#database--sql-queries)
- [State Management with Zustand](#state-management-with-zustand)
- [API Routes](#api-routes)
- [Authentication & Middleware](#authentication--middleware)
- [Layout System](#layout-system)
- [Client vs Server Components](#client-vs-server-components)
- [Utility Functions](#utility-functions)

## Overview

Eventrix is a full-stack calendar application built with Next.js 14 and PostgreSQL.

### Tech Stack:

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Zustand** - State management
- **Drizzle ORM** - Type-safe SQL queries
- **PostgreSQL** - Database
- **Tailwind CSS** - Styling

## App Router Structure

Next.js uses file-based routing where folders and files map to URL routes:

```
src/app/
├── layout.tsx          # Root layout (all pages)
├── page.tsx           # Home page (/)
├── dashboard/
│   └── page.tsx       # Dashboard (/dashboard)
├── login/
│   └── page.tsx       # Login (/login)
└── api/               # API endpoints
    ├── auth/
    │   └── user/
    │       └── route.ts   # GET /api/auth/user
    └── events/
        └── route.ts       # Event CRUD operations
```

### Key File Types:

- **`page.tsx`** - Creates a route and UI
- **`layout.tsx`** - Shared wrapper UI
- **`route.ts`** - API endpoints
- **`[param]`** - Dynamic routes

## Database & SQL Queries

### Database Schema

The app has 3 main tables with relationships:

```typescript
// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  isAdmin: boolean("is_admin").default(false),
  calendars: jsonb("calendars").$type<CalendarType[]>(),
  contacts: jsonb("contacts").$type<ContactsType>(),
  notifications: jsonb("notifications").$type<NotificationType[]>(),
  createdAt: timestamp("created_at").defaultNow(),
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
    .notNull(), // Foreign key
  isPublic: boolean("is_public").default(false),
  calendarId: text("calendar_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event guests table (many-to-many relationship)
export const eventGuests = pgTable("event_guests", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .references(() => events.id)
    .notNull(), // Foreign key
  email: text("email").notNull(),
  name: text("name").notNull(),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Database Connection

```typescript
// src/db/drizzle.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

### SQL Query Patterns with Drizzle ORM

#### 1. SELECT Queries

```typescript
import { eq, and, or, gte, lte, inArray } from "drizzle-orm";

// Basic SELECT - Get all user events
const userEvents = await db
  .select() // SELECT *
  .from(events) // FROM events
  .where(eq(events.userId, session.user.id)) // WHERE user_id = ?
  .limit(100) // LIMIT 100
  .orderBy(events.createdAt); // ORDER BY created_at

// SELECT specific columns
const users = await db
  .select({
    id: users.id,
    email: users.email,
    firstName: users.firstName,
  })
  .from(users)
  .where(eq(users.email, "user@example.com"));

// SELECT with JOIN
const guestEvents = await db
  .select()
  .from(events)
  .innerJoin(eventGuests, eq(events.id, eventGuests.eventId))
  .where(
    and(
      eq(eventGuests.email, session.user.email),
      eq(eventGuests.isAccepted, true),
    ),
  );

// Complex WHERE conditions
const filteredEvents = await db
  .select()
  .from(events)
  .where(
    and(
      eq(events.userId, userId),
      or(eq(events.isPublic, true), eq(events.calendarId, "personal")),
      gte(events.startTime, startDate), // >= start date
      lte(events.endTime, endDate), // <= end date
    ),
  );
```

#### 2. INSERT Queries

```typescript
// INSERT single record
const [newEvent] = await db
  .insert(events)
  .values({
    title: "Team Meeting",
    startTime: new Date("2024-01-15T10:00:00Z"),
    endTime: new Date("2024-01-15T11:00:00Z"),
    userId: session.user.id,
    calendarId: "work",
  })
  .returning(); // Returns the created record

// INSERT multiple records
await db.insert(eventGuests).values([
  { eventId: event.id, name: "John", email: "john@example.com" },
  { eventId: event.id, name: "Jane", email: "jane@example.com" },
]);
```

#### 3. UPDATE Queries

```typescript
// UPDATE with WHERE condition
await db
  .update(events)
  .set({
    title: "Updated Meeting Title",
    description: "New description",
    updatedAt: new Date(),
  })
  .where(eq(events.id, eventId));

// UPDATE JSON columns
await db
  .update(users)
  .set({
    notifications: updatedNotificationsArray,
    calendars: newCalendarsArray,
  })
  .where(eq(users.id, userId));
```

#### 4. DELETE Queries

```typescript
// DELETE with foreign key constraints (order matters!)
// Delete children first, then parent
await db.delete(eventGuests).where(eq(eventGuests.eventId, eventId));

await db.delete(events).where(eq(events.id, eventId));
```

### Real-World SQL Example: Complete Event Management

```typescript
// CREATE event with guests
export async function POST(request: Request) {
  const session = await auth();
  const data = await request.json();

  // 1. Create the event
  const [event] = await db
    .insert(events)
    .values({
      title: data.title,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      userId: session.user.id,
      calendarId: data.calendarId,
    })
    .returning();

  // 2. Add guests
  if (data.guests.length > 0) {
    await db.insert(eventGuests).values(
      data.guests.map((guest) => ({
        eventId: event.id,
        name: guest.name,
        email: guest.email,
      })),
    );
  }

  // 3. Update user notifications (JSON column)
  for (const guest of data.guests) {
    const [guestUser] = await db
      .select({ id: users.id, notifications: users.notifications })
      .from(users)
      .where(eq(users.email, guest.email));

    if (guestUser) {
      const newNotification = {
        id: `event_${Date.now()}`,
        type: "event_invitation",
        eventId: event.id,
        message: `You're invited to ${data.title}`,
        createdAt: new Date().toISOString(),
        viewed: false,
      };

      const updatedNotifications = [
        ...guestUser.notifications,
        newNotification,
      ];

      await db
        .update(users)
        .set({ notifications: updatedNotifications })
        .where(eq(users.id, guestUser.id));
    }
  }

  return NextResponse.json({ event });
}

// READ events with guests
export async function GET() {
  const session = await auth();

  // Get user's own events
  const userEvents = await db
    .select()
    .from(events)
    .where(eq(events.userId, session.user.id));

  // Get events where user is invited
  const invitedEvents = await db
    .select()
    .from(events)
    .innerJoin(eventGuests, eq(events.id, eventGuests.eventId))
    .where(
      and(
        eq(eventGuests.email, session.user.email),
        eq(eventGuests.isAccepted, true),
      ),
    );

  // Combine both event types
  const allEvents = [...userEvents, ...invitedEvents.map((e) => e.events)];
  const eventIds = allEvents.map((e) => e.id);

  // Get all guests for these events
  const guests = await db
    .select()
    .from(eventGuests)
    .where(inArray(eventGuests.eventId, eventIds));

  // Attach guests to events
  const eventsWithGuests = allEvents.map((event) => ({
    ...event,
    guests: guests.filter((guest) => guest.eventId === event.id),
  }));

  return NextResponse.json({ events: eventsWithGuests });
}
```

### Drizzle Query Operators

```typescript
// Import operators
import { eq, ne, gt, gte, lt, lte, like, and, or, inArray } from "drizzle-orm";

// Comparison operators
eq(column, value); // column = value
ne(column, value); // column != value
gt(column, value); // column > value
gte(column, value); // column >= value
lt(column, value); // column < value
lte(column, value); // column <= value
like(column, pattern); // column LIKE pattern

// Logical operators
and(condition1, condition2); // condition1 AND condition2
or(condition1, condition2); // condition1 OR condition2

// Array operators
inArray(column, [1, 2, 3]); // column IN (1, 2, 3)
notInArray(column, [1, 2, 3]); // column NOT IN (1, 2, 3)
```

### Working with JSON Columns

PostgreSQL's JSONB columns store complex data:

```typescript
// Reading JSON data
const [user] = await db.select().from(users).where(eq(users.id, userId));

const calendars = user.calendars; // Already parsed as JS object

// Updating JSON data
const newCalendar = {
  id: "meeting-cal",
  name: "Meetings",
  color: "#FF5733",
};

const updatedCalendars = [...user.calendars, newCalendar];

await db
  .update(users)
  .set({ calendars: updatedCalendars })
  .where(eq(users.id, userId));
```

## State Management with Zustand

Zustand provides lightweight global state management:

```typescript
// Store definition
interface EventStore {
  events: CalendarEventType[];
  setEvents: (events: CalendarEventType[]) => void;
  addEvent: (event: CalendarEventType) => void;
  selectedEvent: CalendarEventType | null;
  setSelectedEvent: (event: CalendarEventType | null) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({
    events: [...state.events, event]
  })),
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
}));

// Using in components
function EventList() {
  const { events, addEvent } = useEventStore();

  const handleAddEvent = (newEvent) => {
    addEvent(newEvent); // Updates global state
  };

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
}
```

## API Routes

API routes handle HTTP requests and database operations:

```typescript
// src/app/api/events/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { events } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, session.user.id));

    return NextResponse.json({ events: userEvents });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const [newEvent] = await db
      .insert(events)
      .values({
        title: body.title,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        userId: session.user.id,
      })
      .returning();

    return NextResponse.json({ event: newEvent });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
```

## Authentication & Middleware

### Middleware

Protects routes and handles redirects:

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has("token");
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  // Redirect to login if accessing protected route without token
  if (isDashboard && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if logged in and on auth page
  if (isAuthPage && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
```

### Authentication Function

```typescript
// src/lib/auth.ts
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function auth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));

    return user ? { user } : null;
  } catch {
    return null;
  }
}
```

## Layout System

### Root Layout

```typescript
// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CalendarProvider>
          {children}
          <Toaster />
        </CalendarProvider>
      </body>
    </html>
  );
}
```

## Client vs Server Components

### Server Components (Default)

```typescript
// Runs on server, can access database directly
export default async function EventsPage() {
  const events = await db.select().from(events);

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
}
```

### Client Components

```typescript
"use client"; // Required directive

import { useState } from "react";
import { useEventStore } from "@/lib/store";

export default function InteractiveCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { events } = useEventStore();

  return (
    <div onClick={() => setSelectedDate(new Date())}>
      Interactive calendar
    </div>
  );
}
```

## Utility Functions

### Date Manipulation

```typescript
// src/lib/getTime.ts
import dayjs from "dayjs";

// Generate 5x7 calendar grid
export const getMonth = (month = dayjs().month()) => {
  const year = dayjs().year();
  const firstDayOfMonth = dayjs().set("month", month).startOf("month").day();
  let dayCounter = -firstDayOfMonth;

  // Create 5 weeks × 7 days
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 7 }, () => dayjs(new Date(year, month, ++dayCounter))),
  );
};

// Calculate event position on calendar
export const calculateEventTop = (startTime: string): number => {
  const start = dayjs(startTime);
  const hour = start.hour();
  const minutes = start.minute();

  return hour * 64 + (minutes * 64) / 60; // 64px per hour
};
```

## Getting Started Tips

1. **File structure** - Learn how folders map to URLs
2. **Database schema** - Understand table relationships
3. **SQL basics** - Practice SELECT, INSERT, UPDATE, DELETE
4. **Server vs Client** - Know when to use each component type
5. **State management** - Use Zustand for global state
6. **API routes** - Handle HTTP requests and database operations

## Debugging Tips

1. **Console.log** in Server Components for server debugging
2. **Browser DevTools** for Client Component debugging
3. **Network tab** for API request issues
4. **Database logs** for SQL query problems
5. **React DevTools** for component state inspection

---

This guide covers Next.js architecture and SQL patterns used in Eventrix. Start with the basics and gradually build your understanding of each concept!
