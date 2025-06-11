import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { events, eventGuests } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, inArray, and } from "drizzle-orm";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { InferModel } from "drizzle-orm";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set the timezone to local
const localTimezone = dayjs.tz.guess();
dayjs.tz.setDefault(localTimezone);

// Define the type for event insertion
type NewEvent = InferModel<typeof events, "insert">;
type EventGuest = InferModel<typeof eventGuests, "select">;

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      title,
      description,
      startTime,
      endTime,
      isPublic = false,
      isRepeating = false,
      repeatDays,
      repeatEndDate,
      calendarId,
      guests = [],
    } = data;

    console.log("Received event data:", data); // Debug log

    // Validate required fields
    if (!title || !startTime || !endTime || !calendarId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    try {
      // Convert dates to UTC for storage
      const startTimeUTC = dayjs(startTime)
        .tz(localTimezone)
        .utc()
        .toISOString();
      const endTimeUTC = dayjs(endTime).tz(localTimezone).utc().toISOString();
      const repeatEndDateUTC = repeatEndDate
        ? dayjs(repeatEndDate).tz(localTimezone).utc().toISOString()
        : null;

      // Create the event with proper typing
      const newEvent: NewEvent = {
        title,
        description: description || "",
        startTime: new Date(startTimeUTC),
        endTime: new Date(endTimeUTC),
        userId: session.user.id,
        isPublic,
        isRepeating,
        repeatDays: repeatDays || null,
        repeatEndDate: repeatEndDateUTC ? new Date(repeatEndDateUTC) : null,
        categoryId: calendarId,
      };

      const [event] = await db.insert(events).values(newEvent).returning();

      console.log("Created event:", event); // Debug log

      // If there are guests, add them
      if (guests.length > 0) {
        await db.insert(eventGuests).values(
          guests.map((guest: { name: string; email: string }) => ({
            eventId: event.id,
            name: guest.name,
            email: guest.email,
          })),
        );
      }

      // Get the created event with its guests
      const [createdEvent] = await db
        .select()
        .from(events)
        .where(eq(events.id, event.id));

      const eventGuestsList =
        guests.length > 0
          ? await db
              .select()
              .from(eventGuests)
              .where(eq(eventGuests.eventId, event.id))
          : [];

      console.log("Returning event with guests:", {
        ...createdEvent,
        guests: eventGuestsList,
      }); // Debug log

      return NextResponse.json({
        event: {
          ...createdEvent,
          guests: eventGuestsList,
        },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save event to database" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session || !session.user?.id) {
      console.log("No authenticated session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching events for user:", session.user.id);

    try {
      // Get events where user is the creator
      const userEvents = await db
        .select()
        .from(events)
        .where(eq(events.userId, session.user.id));

      // Get events where user is an accepted guest
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

      // Combine both sets of events, removing duplicates
      const allEvents = [
        ...userEvents,
        ...guestEvents.map((e) => e.events),
      ].filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.id === event.id),
      );

      console.log("Found events:", allEvents);

      // Get guests for all events
      const eventIds = allEvents.map((event) => event.id);
      let guests: EventGuest[] = [];

      if (eventIds.length > 0) {
        try {
          guests = await db
            .select()
            .from(eventGuests)
            .where(inArray(eventGuests.eventId, eventIds));
          console.log("Successfully fetched guests:", guests);
        } catch (guestError) {
          console.error("Error fetching guests:", guestError);
          // Continue without guests rather than failing completely
          guests = [];
        }
      }

      // Convert dates to UTC and attach guests to their respective events
      const eventsWithUTC = allEvents.map((event) => ({
        ...event,
        startTime: dayjs(event.startTime).tz(localTimezone).utc().toISOString(),
        endTime: dayjs(event.endTime).tz(localTimezone).utc().toISOString(),
        repeatEndDate: event.repeatEndDate
          ? dayjs(event.repeatEndDate).tz(localTimezone).utc().toISOString()
          : null,
        guests: guests.filter((guest) => guest.eventId === event.id),
      }));

      console.log("Returning events with UTC dates:", eventsWithUTC);

      return NextResponse.json({ events: eventsWithUTC });
    } catch (dbError) {
      console.error("Database error details:", dbError);
      return NextResponse.json(
        { error: "Database error while fetching events" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in GET /api/events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    // First delete event guests
    await db.delete(eventGuests).where(eq(eventGuests.eventId, eventId));

    // Then delete the event
    await db.delete(events).where(eq(events.id, eventId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
