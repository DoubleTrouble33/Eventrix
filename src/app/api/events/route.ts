import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { events, eventGuests } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
      categoryId,
      guests = [],
    } = data;

    console.log("Received event data:", data); // Debug log

    // Validate required fields
    if (!title || !startTime || !endTime || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    try {
      // Create the event
      const [event] = await db
        .insert(events)
        .values({
          title,
          description: description || "",
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          userId: session.user.id,
          isPublic,
          isRepeating,
          repeatDays: repeatDays || null,
          categoryId,
        })
        .returning();

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all events for the user
    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, session.user.id));

    // Get guests for all events
    const eventIds = userEvents.map((event) => event.id);
    const guests =
      eventIds.length > 0
        ? await db
            .select()
            .from(eventGuests)
            .where(eq(eventGuests.eventId, eventIds[0])) // TODO: Use in operator for multiple events
        : [];

    // Combine events with their guests
    const eventsWithGuests = userEvents.map((event) => ({
      ...event,
      guests: guests.filter((guest) => guest.eventId === event.id),
    }));

    return NextResponse.json({ events: eventsWithGuests });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
