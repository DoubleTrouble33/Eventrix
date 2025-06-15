# 📅 Eventrix Calendar App - Complete Flow Explanation

## 🌟 What is Eventrix?

Eventrix is like a digital version of a wall calendar, but much smarter! Imagine having a calendar that not only shows your appointments but also:

- Lets you share events with friends and colleagues
- Remembers recurring events (like your weekly team meetings)
- Organizes your events by categories (work, personal, fitness, etc.)
- Allows you to invite people to your events
- Shows you what's happening in your day, week, or month at a glance

Think of it as your personal assistant that never forgets your schedule and helps you manage your time efficiently.

---

## 🏗️ How the App is Built (Technical Architecture)

### The Foundation

Eventrix is built like a modern house with different floors and rooms, each serving a specific purpose:

**🏠 The Structure (Tech Stack):**

- **Next.js**: The main framework - think of this as the house's blueprint and construction system
- **PostgreSQL**: The database - like a filing cabinet that stores all your events, user info, and settings
- **Drizzle ORM**: The translator between the app and database - like having a librarian who knows exactly where everything is stored
- **TypeScript**: The language that ensures everything is properly labeled and organized
- **Tailwind CSS**: The interior designer - makes everything look beautiful and consistent

---

## 🔐 The Security Guard (Authentication System)

### How Login Works

1. **Registration Process**:

   - When you first sign up, the app creates a unique ID for you (like getting a membership card)
   - Your password is scrambled (hashed) using bcrypt - imagine your password being turned into a secret code before storage
   - The system creates default calendars for you: "Personal" and "Work"

2. **Login Process**:

   - You enter your email and password
   - The system checks if the scrambled version of your password matches what's stored
   - If it matches, you get a "token" (like a temporary access badge) stored in your browser
   - This token proves you're allowed to use the app

3. **Protection Middleware**:
   - Every time you try to access a protected page (like your dashboard), a security guard (middleware) checks your token
   - No token = redirected to login page
   - Valid token = welcome to your calendar!

---

## 🏠 The Landing Page (First Impression)

When you first visit Eventrix, you see a welcoming page that:

### What Happens Behind the Scenes:

1. **User Detection**: The page immediately checks if you're already logged in
2. **Dynamic Navigation**:
   - Not logged in → Shows "Login" and "Register" buttons
   - Logged in → Shows your name, avatar, and profile dropdown
3. **Interactive Elements**: Features a demo calendar and engaging visuals to show what the app can do

### Key Functions:

```typescript
// Checks if user is logged in
const fetchUser = async () => {
  // Looks for cached user info first (for speed)
  // Then makes a secure request to verify current login status
};

// Handles logout
const handleLogout = async () => {
  // Clears your session token
  // Removes cached data
  // Redirects you back to the main page
};
```

---

## 📊 The Heart of the App (Dashboard)

The dashboard is where all the magic happens - it's like mission control for your schedule.

### The Main Components:

#### 1. **Header Component**

Think of this as your command center:

- Shows current date and time
- Has buttons to switch between Month, Week, and Day views
- Contains the "Create Event" button
- Shows your profile and logout options

#### 2. **MainView Component**

This is the actual calendar display that changes based on your selected view:

### The Three Views Explained:

#### 🗓️ **Month View** (`MonthView.tsx`)

- **What it shows**: A traditional calendar grid showing the entire month
- **How it works**: Creates a 6x7 grid (6 weeks × 7 days)
- **Special features**:
  - Highlights today's date
  - Shows events as small colored blocks
  - Weekends are subtly highlighted
  - Click any day to see detailed events

#### 📅 **Week View** (`WeekView.tsx`)

- **What it shows**: Seven columns, one for each day of the week
- **How it works**:
  - Divided into hourly time slots (like a planner)
  - Events appear as colored blocks spanning their duration
  - You can see exactly when events start and end
- **Functionality**: Drag and drop events to reschedule them

#### 📝 **Day View** (`DayView.tsx`)

- **What it shows**: Detailed view of a single day
- **How it works**: Shows hourly slots from morning to night
- **Best for**: Seeing detailed daily schedule and managing time conflicts

---

## 🎛️ State Management (The App's Memory System)

Eventrix uses something called "Zustand stores" - think of these as the app's memory banks that keep track of different types of information:

### 📚 **Main Memory Banks** (`store.ts`):

#### 1. **ViewStore** - Remembers Your Preferences

```typescript
// Remembers which view you prefer (month/week/day)
selectedView: "month" | "week" | "day";
```

#### 2. **DateStore** - Keeps Track of Time

```typescript
// Remembers what date you're looking at
userSelectedDate: Dayjs
// Keeps track of the current month being displayed
selectedMonthIndex: number
// Creates the month grid for display
twoDMonthArray: dayjs.Dayjs[][]
```

#### 3. **EventStore** - Manages All Your Events

```typescript
// Stores all your events
events: CalendarEventType[]
// Remembers which event you're currently viewing
selectedEvent: CalendarEventType | null
// Controls event detail popup
isEventSummaryOpen: boolean
```

#### 4. **CalendarStore** - Manages Categories

```typescript
// Your calendar categories (Personal, Work, etc.)
calendars: CalendarType[]
// Which categories are currently visible
selectedCalendars: string[]
```

---

## 📅 Event Management System

### How Events Work:

#### **Event Structure** (What Information Each Event Contains):

Every event in Eventrix is like a detailed appointment card with:

- **Basic Info**: Title, description, start/end times
- **Categorization**: Which calendar it belongs to (work, personal, etc.)
- **Repetition Rules**: Does it repeat? Which days? Until when?
- **Privacy**: Is it public (others can see) or private?
- **Guest List**: Who's invited to this event?

#### **Creating an Event**:

1. **User Action**: You click "Create Event" button
2. **Form Appears**: A detailed form opens asking for event details
3. **Data Processing**:
   - The app validates your input (ensures dates make sense)
   - Converts times to proper timezone format
   - Generates a unique ID for the event
4. **Database Storage**: Event gets saved to the PostgreSQL database
5. **UI Update**: The calendar immediately shows your new event

#### **Repeating Events** (The Smart Feature):

- **How it works**: Instead of creating 52 separate events for a weekly meeting, the app stores one event with repetition rules
- **Display Logic**: When showing the calendar, the app calculates where all the repeated instances should appear
- **Efficiency**: This saves database space and makes editing easier (change one, update all)

### **Event Provider** (`EventProvider.tsx`) - The Event Manager:

This component acts like a dedicated event coordinator:

```typescript
// Key responsibilities:
1. Fetches all your events from the database
2. Handles public vs private event display
3. Manages caching for better performance
4. Updates the calendar when events change
```

---

## 🏛️ Database Structure (Where Everything is Stored)

### **The Filing System** (`schema.ts`):

#### 1. **Users Table** - Your Personal File

```sql
- id: Your unique identifier (like a social security number)
- email: Your login credential
- firstName, lastName: Your name
- password: Your encrypted password
- avatar: Your profile picture
- calendars: Your personal calendar categories
- contacts: Your address book
- notifications: Your message inbox
```

#### 2. **Events Table** - Your Appointment Book

```sql
- id: Unique event identifier
- title, description: Event details
- startTime, endTime: When it happens
- userId: Who owns this event
- isPublic: Can others see it?
- isRepeating: Does it repeat?
- repeatDays: Which days does it repeat?
- categoryId: Which calendar does it belong to?
```

#### 3. **Event Guests Table** - The Guest List

```sql
- eventId: Which event this relates to
- email, name: Guest information
- isAccepted: Did they accept the invitation?
- viewed: Have they seen the invitation?
```

---

## 🔄 Data Flow (How Information Moves Through the App)

### **The Journey of Creating an Event**:

1. **User Interface** → User fills out event form
2. **Form Validation** → App checks if all required information is provided
3. **API Request** → Data is sent to `/api/events` endpoint
4. **Database Write** → Event is stored in PostgreSQL
5. **Response** → Database confirms successful save
6. **Store Update** → Event is added to the app's memory (Zustand store)
7. **UI Refresh** → Calendar display updates to show the new event

### **The Journey of Viewing Events**:

1. **Page Load** → Dashboard component mounts
2. **EventProvider** → Automatically fetches events
3. **API Call** → Requests events from `/api/events`
4. **Database Query** → Retrieves user's events from PostgreSQL
5. **Data Processing** → Converts database format to display format
6. **Store Population** → Events are loaded into EventStore
7. **Calendar Render** → MonthView/WeekView/DayView displays the events

---

## 🛡️ Security Features (Keeping Your Data Safe)

### **Multi-Layer Protection**:

1. **Authentication Middleware** (`middleware.ts`):

   - Guards all protected routes
   - Verifies your token on every request
   - Automatically redirects unauthorized users

2. **Password Security**:

   - Uses bcrypt to scramble passwords
   - Never stores plain text passwords
   - Adds "salt" to make passwords extra secure

3. **Session Management**:

   - JWT tokens for secure communication
   - Automatic logout on token expiration
   - Secure cookie handling

4. **Data Validation**:
   - All inputs are checked for proper format
   - SQL injection prevention through Drizzle ORM
   - Type safety with TypeScript

---

## 🎨 User Interface Magic (Making It Look Good)

### **Styling System**:

- **Tailwind CSS**: Provides consistent colors, spacing, and layouts
- **Shadcn/UI**: Pre-built components that look professional
- **Responsive Design**: Works perfectly on phones, tablets, and computers

### **Interactive Features**:

- **Drag & Drop**: Move events between time slots
- **Click Interactions**: Click events to see details
- **Smooth Animations**: Transitions between views
- **Loading States**: Shows progress while fetching data

---

## 🚀 Performance Optimizations (Making It Fast)

### **Speed Tricks**:

1. **Caching**:

   - Stores frequently accessed data in browser memory
   - Reduces server requests for better speed

2. **Lazy Loading**:

   - Only loads data when you need it
   - Doesn't fetch next month's events until you navigate there

3. **Optimistic Updates**:

   - Shows changes immediately, then syncs with server
   - Makes the app feel instantly responsive

4. **Server-Side Rendering**:
   - Pre-builds pages for faster initial load
   - Better for search engines

---

## 🔄 Real-World Usage Scenarios

### **Scenario 1: Planning Your Week**

1. Open Eventrix dashboard
2. Switch to Week View to see your upcoming schedule
3. Notice a gap on Wednesday afternoon
4. Click "Create Event" to schedule a dentist appointment
5. Set it as private (only you can see it)
6. Event immediately appears on your calendar

### **Scenario 2: Organizing a Team Meeting**

1. Create a new event titled "Weekly Standup"
2. Set it to repeat every Monday at 9 AM
3. Add team members as guests
4. Mark it as public so others can see
5. System sends invitations to all guests
6. Track who has accepted the invitation

### **Scenario 3: Managing Personal Time**

1. Use different calendar categories (Work, Personal, Fitness)
2. Color-code events for easy recognition
3. Toggle categories on/off to focus on specific types of events
4. Use Day View for detailed time management

---

## 🧩 Key Technical Functions Explained

### **Event Filtering** (`getEventsForDay`):

```typescript
// This function is like a smart assistant that:
// 1. Takes all your events
// 2. Finds which ones happen on a specific day
// 3. Includes repeated events that fall on that day
// 4. Returns a clean list for display
```

### **Calendar Navigation**:

```typescript
// Functions that handle moving between months/weeks/days
// Like having left/right arrows that intelligently
// calculate the next time period to show
```

### **Time Zone Handling**:

```typescript
// Ensures events appear at correct local times
// Handles daylight saving time changes
// Converts server time to your local time
```

---

## 🔧 Behind-the-Scenes Magic

### **Automatic Features You Don't See**:

1. **Data Synchronization**: Your events automatically sync across all your devices
2. **Conflict Detection**: Warns you about overlapping events
3. **Smart Defaults**: Suggests logical event times based on your patterns
4. **Error Recovery**: Gracefully handles network issues and retries failed operations
5. **Memory Management**: Automatically cleans up old data to keep the app fast

### **Developer Tools** (For Maintenance):

- **Database Migrations**: Updates database structure safely
- **Type Checking**: Prevents programming errors before they happen
- **Code Formatting**: Keeps code clean and readable
- **Testing Environment**: Allows safe testing of new features

---

## 🎯 Summary: The Complete Picture

Eventrix is essentially a sophisticated digital calendar that combines:

**For Users**:

- Easy event creation and management
- Multiple viewing options (month/week/day)
- Event sharing and collaboration
- Smart recurring event handling
- Beautiful, responsive interface

**For Developers**:

- Modern React-based architecture
- Type-safe database operations
- Secure authentication system
- Efficient state management
- Optimized performance patterns

**The Result**: A calendar app that's both powerful for advanced users and simple enough for anyone to use, with enterprise-level security and performance under the hood.

Think of Eventrix as your digital time management assistant that never sleeps, never forgets, and grows smarter with every interaction!
