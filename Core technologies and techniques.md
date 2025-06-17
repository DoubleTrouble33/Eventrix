# Next.js Architecture Guide for Eventrix Calendar App

Welcome to this comprehensive guide explaining the Next.js concepts and architecture used in the Eventrix calendar application. This guide is designed for beginners who want to understand how modern Next.js applications work.

## Table of Contents

- [Overview](#overview)
- [App Router Structure](#app-router-structure)
- [State Management with Zustand](#state-management-with-zustand)
- [API Routes](#api-routes)
- [Authentication & Middleware](#authentication--middleware)
- [Layout System](#layout-system)
- [Client vs Server Components](#client-vs-server-components)
- [Utility Functions](#utility-functions)
- [Key Patterns & Best Practices](#key-patterns--best-practices)

## Overview

Eventrix is built using **Next.js 14** with the **App Router** architecture. It's a full-stack calendar application that demonstrates modern React patterns, server-side rendering, and API design.

### Tech Stack:

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Zustand** - State management library
- **Drizzle ORM** - Database management
- **Tailwind CSS** - Styling
- **Day.js** - Date manipulation

## App Router Structure

Next.js 13+ uses a file-based routing system called "App Router". Here's how it works:

### Directory Structure Explanation

```
src/app/
├── layout.tsx          # Root layout (applies to all pages)
├── page.tsx           # Home page (/)
├── dashboard/
│   └── page.tsx       # Dashboard page (/dashboard)
├── login/
│   └── page.tsx       # Login page (/login)
└── api/               # API routes
    ├── auth/
    │   └── user/
    │       └── route.ts   # GET /api/auth/user
    └── events/
        └── route.ts       # Event API endpoints
```

### Key Concepts:

1. **`page.tsx`** - Creates a route and renders the UI
2. **`layout.tsx`** - Shared UI that wraps multiple pages
3. **`route.ts`** - API endpoints (server-side functions)
4. **Dynamic routes** - Use `[param]` for dynamic segments

### Example: Dashboard Page

```typescript
// src/app/dashboard/page.tsx
"use client"; // Makes this a Client Component

import Header from "@/components/header/Header";
import MainView from "@/components/MainView";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <MainView />
    </div>
  );
}
```

## State Management with Zustand

Zustand is a lightweight state management library that's simpler than Redux. It provides global state that can be accessed from any component.

### Store Structure

The app uses multiple stores for different concerns:

```typescript
// src/lib/store.ts

// 1. View Store - Manages calendar view (month/week/day)
interface ViewStoreType {
  selectedView: string;
  setView: (value: string) => void;
}

// 2. Date Store - Manages selected dates and month data
interface DateStoreType {
  userSelectedDate: Dayjs;
  setDate: (value: Dayjs) => void;
  twoDMonthArray: dayjs.Dayjs[][]; // 2D array for month view
  selectedMonthIndex: number;
  setMonth: (index: number) => void;
}

// 3. Event Store - Manages calendar events
interface EventStore {
  events: CalendarEventType[];
  setEvents: (events: CalendarEventType[]) => void;
  addEvent: (event: CalendarEventType) => void;
  updateEvent: (event: CalendarEventType) => void;
  deleteEvent: (eventId: string) => void;
}
```

### How to Use Zustand Stores

```typescript
// In any component
import { useViewStore, useEventStore } from "@/lib/store";

function MyComponent() {
  // Access state and actions
  const { selectedView, setView } = useViewStore();
  const { events, addEvent } = useEventStore();

  const handleViewChange = () => {
    setView("week"); // Updates global state
  };

  return (
    <div>
      <p>Current view: {selectedView}</p>
      <button onClick={handleViewChange}>Switch to Week View</button>
    </div>
  );
}
```

### Store Features

1. **Persistence** - Some stores persist data to localStorage
2. **DevTools** - Integration with Redux DevTools for debugging
3. **Type Safety** - Full TypeScript support

## API Routes

API Routes in Next.js are server-side functions that handle HTTP requests. They're located in the `app/api/` directory.

### Basic API Route Structure

```typescript
// src/app/api/auth/user/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// GET /api/auth/user
export async function GET() {
  try {
    const session = await auth(); // Server-side authentication

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/auth/user
export async function POST(request: Request) {
  const body = await request.json();
  // Handle POST request
}
```

### HTTP Methods Supported

- `GET` - Retrieve data
- `POST` - Create new data
- `PUT` - Update existing data
- `DELETE` - Delete data
- `PATCH` - Partial updates

### Dynamic API Routes

```typescript
// src/app/api/events/[eventId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { eventId: string } },
) {
  const eventId = params.eventId; // Access dynamic segment
  // Fetch specific event
}
```

## Authentication & Middleware

### Middleware

Middleware runs before every request and can redirect, rewrite, or modify requests.

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has("token");
  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register";

  // Protect dashboard routes
  if (!isAuthenticated && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next(); // Continue to the requested page
}

// Configure which routes middleware applies to
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|img).*)"],
};
```

### Authentication System

```typescript
// src/lib/auth.ts
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function auth() {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Get user from database
    const user = await getUserFromDatabase(decoded.userId);

    return { user };
  } catch (error) {
    return null;
  }
}
```

## Layout System

Layouts define shared UI that persists across multiple pages.

### Root Layout

```typescript
// src/app/layout.tsx
import { CalendarProvider } from "@/components/CalendarProvider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CalendarProvider>
          {children}           {/* Page content goes here */}
          <Toaster />         {/* Global toast notifications */}
        </CalendarProvider>
      </body>
    </html>
  );
}
```

### Layout Hierarchy

- Root layout applies to all pages
- Nested layouts can be created for specific sections
- Layouts can fetch data and pass it to children

## Client vs Server Components

Next.js 13+ introduces a new paradigm with Server and Client Components:

### Server Components (Default)

- Render on the server
- Can access databases directly
- Smaller bundle size
- Cannot use browser APIs or event handlers

```typescript
// This is a Server Component by default
export default async function ServerPage() {
  // Can fetch data directly on the server
  const events = await fetchEventsFromDatabase();

  return <div>{events.map(event => ...)}</div>;
}
```

### Client Components

- Render in the browser
- Can use React hooks, event handlers, browser APIs
- Must be marked with `"use client"`

```typescript
// src/app/dashboard/page.tsx
"use client"; // This directive makes it a Client Component

import { useState, useEffect } from "react";
import { useThemeStore } from "@/lib/store";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode } = useThemeStore(); // Zustand hooks work here

  useEffect(() => {
    // Browser APIs and side effects work here
    setIsLoading(false);
  }, []);

  return <div>Dashboard content</div>;
}
```

### When to Use Each:

- **Server Components**: Data fetching, static content, SEO-important content
- **Client Components**: Interactive UI, state management, browser APIs

## Utility Functions

The app includes several utility functions for complex operations:

### Date Manipulation

```typescript
// src/lib/getTime.ts

// Generates a 5x7 matrix for month calendar view
export const getMonth = (month = dayjs().month()) => {
  const year = dayjs().year();
  const firstDayOfMonth = dayjs().set("month", month).startOf("month").day();
  let dayCounter = -firstDayOfMonth;

  // Create 5 weeks × 7 days grid
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 7 }, () => dayjs(new Date(year, month, ++dayCounter))),
  );
};

// Calculate event positioning on calendar
export const calculateEventTop = (startTime: string): number => {
  const start = dayjs(startTime);
  const hour = start.hour();
  const minutes = start.minute();

  // Each hour = 64px, each minute = 64/60 px
  return hour * 64 + (minutes * 64) / 60;
};
```

### Event Filtering

```typescript
// Filter events for a specific day
export const getEventsForDay = (
  events: CalendarEventType[],
  date: dayjs.Dayjs,
) => {
  return events.filter((event) => {
    const eventDate = dayjs(event.startTime);
    return eventDate.isSame(date, "day");
  });
};
```

## Key Patterns & Best Practices

### 1. Provider Pattern

```typescript
// src/components/CalendarProvider.tsx
"use client";

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { setCalendars } = useCalendarStore();

  useEffect(() => {
    // Initialize data on app start
    fetch("/api/user/calendars")
      .then(response => response.json())
      .then(data => setCalendars(data.calendars));
  }, []);

  return <>{children}</>;
}
```

### 2. Error Handling in API Routes

```typescript
export async function GET() {
  try {
    // API logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### 3. Type Safety

```typescript
// Define clear interfaces for data structures
export interface CalendarEventType {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  userId: string;
  isPublic: boolean;
  guests?: GuestType[];
}
```

### 4. Separation of Concerns

- **Components**: UI logic only
- **API Routes**: Server-side business logic
- **Stores**: Client-side state management
- **Utilities**: Pure functions for data manipulation

### 5. Progressive Enhancement

- Server Components for initial render
- Client Components for interactivity
- Middleware for request-level logic

## Common Next.js Concepts Explained

### Hydration

When a Server Component renders HTML and sends it to the browser, React "hydrates" it by attaching event listeners and making it interactive.

### Route Handlers

API Routes that handle HTTP requests. They replace the old `pages/api` directory approach.

### File-based Routing

The file structure in the `app` directory directly maps to URL routes:

- `app/page.tsx` → `/`
- `app/dashboard/page.tsx` → `/dashboard`
- `app/user/[id]/page.tsx` → `/user/123`

### Metadata API

```typescript
export const metadata: Metadata = {
  title: "EventriX",
  description: "Calendar app that schedules events and much more!",
};
```

## Getting Started Tips

1. **Start with the file structure** - Understand how URLs map to files
2. **Learn the difference** between Server and Client Components
3. **Use TypeScript** - It helps catch errors early
4. **Follow the data flow** - API → Store → Component
5. **Practice with small features** - Add a simple component or API route

## Debugging Tips

1. **Use console.log** in Server Components for server-side debugging
2. **Use browser DevTools** for Client Component debugging
3. **Check the Network tab** for API call issues
4. **Use React DevTools** to inspect component state
5. **Enable Zustand DevTools** to track state changes

---

This guide covers the fundamental concepts used in the Eventrix app. As you work with the codebase, refer back to these patterns and gradually build your understanding of each concept. Remember that Next.js is powerful because it combines the best of server-side and client-side rendering - take time to understand when and why to use each approach.
