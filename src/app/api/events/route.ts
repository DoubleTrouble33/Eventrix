import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { events, eventGuests, users } from "@/db/schema";
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

    // Validate required fields
    if (!title || !startTime || !endTime || !calendarId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    try {
      // Get user's calendars
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id));

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Validate that the calendar exists in user's calendars
      const userCalendars = user.calendars || [];
      const calendarExists = userCalendars.some((cal) => cal.id === calendarId);

      if (!calendarExists) {
        return NextResponse.json(
          { error: "Invalid calendar ID" },
          { status: 400 },
        );
      }

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
        calendarId: calendarId,
        categoryId: calendarId, // Keep this for backward compatibility
      };

      const [event] = await db.insert(events).values(newEvent).returning();

      // If there are guests, add them and create notifications
      if (guests.length > 0) {
        // Create event guest entries
        await db.insert(eventGuests).values(
          guests.map((guest: { name: string; email: string }) => ({
            eventId: event.id,
            name: guest.name,
            email: guest.email,
          })),
        );

        // Get host user's name for notifications
        const [hostUser] = await db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.id, session.user.id));

        const hostName = hostUser
          ? `${hostUser.firstName} ${hostUser.lastName}`
          : "Someone";

        // Create notifications for each guest
        for (const guest of guests) {
          // Find the user by email to add notification to their notifications array
          const guestUser = await db
            .select({
              id: users.id,
              notifications: users.notifications,
            })
            .from(users)
            .where(eq(users.email, guest.email))
            .limit(1);

          if (guestUser[0]) {
            // User exists, add notification
            const currentNotifications = guestUser[0].notifications || [];
            const newNotification = {
              id: `event_invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: "event_invitation" as const,
              fromUserId: session.user.id,
              fromUserName: hostName,
              fromUserEmail: session.user.email,
              eventId: event.id,
              eventTitle: title,
              hostName: hostName,
              message: `${hostName} invited you to "${title}"`,
              createdAt: new Date().toISOString(),
              viewed: false,
            };

            const updatedNotifications = [
              ...currentNotifications,
              newNotification,
            ];

            await db
              .update(users)
              .set({ notifications: updatedNotifications })
              .where(eq(users.id, guestUser[0].id));
          }
        }
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Get events where user is the creator (with reasonable limit)
      const userEvents = await db
        .select()
        .from(events)
        .where(eq(events.userId, session.user.id))
        .limit(100) // Limit to 100 events to reduce data transfer
        .orderBy(events.createdAt);

      // Get events where user is an accepted guest (with limit)
      const guestEvents = await db
        .select()
        .from(events)
        .innerJoin(eventGuests, eq(events.id, eventGuests.eventId))
        .where(
          and(
            eq(eventGuests.email, session.user.email),
            eq(eventGuests.isAccepted, true),
          ),
        )
        .limit(50); // Limit guest events

      // Combine both sets of events, removing duplicates
      const allEvents = [
        ...userEvents,
        ...guestEvents.map((e) => e.events),
      ].filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.id === event.id),
      );

      // Get guests for all events
      const eventIds = allEvents.map((event) => event.id);
      let guests: EventGuest[] = [];

      if (eventIds.length > 0) {
        try {
          guests = await db
            .select()
            .from(eventGuests)
            .where(inArray(eventGuests.eventId, eventIds));
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
        calendarId: event.calendarId || event.categoryId, // Ensure calendarId is included
        guests: guests.filter((guest) => guest.eventId === event.id),
      }));

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
