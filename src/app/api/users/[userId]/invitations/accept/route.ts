import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eventGuests, users, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    // Get the user's email
    const user = await db
      .select({
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the event details to check its category and creator
    const event = await db
      .select({
        categoryId: events.categoryId,
        userId: events.userId,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event[0]) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Update the invitation to accepted
    const result = await db
      .update(eventGuests)
      .set({
        isAccepted: true,
      })
      .where(
        and(
          eq(eventGuests.email, user[0].email),
          eq(eventGuests.eventId, eventId),
        ),
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    // Get the user's current calendars
    const userWithCalendars = await db
      .select({
        calendars: users.calendars,
      })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    if (userWithCalendars[0]) {
      const currentCalendars = userWithCalendars[0].calendars || [];
      const eventCategoryId = event[0].categoryId;

      // Check if user already has this calendar
      const hasCalendar = currentCalendars.some(
        (cal: { id: string }) => cal.id === eventCategoryId,
      );

      if (!hasCalendar) {
        // Get the original calendar color from the event creator
        const eventCreator = await db
          .select({
            calendars: users.calendars,
          })
          .from(users)
          .where(eq(users.id, event[0].userId))
          .limit(1);

        let calendarName =
          eventCategoryId.charAt(0).toUpperCase() + eventCategoryId.slice(1);
        let calendarColor = "#6B7280"; // Default gray color

        // Find the matching calendar from the event creator
        if (eventCreator[0]?.calendars) {
          const creatorCalendar = eventCreator[0].calendars.find(
            (cal: { id: string; name: string; color: string }) =>
              cal.id === eventCategoryId,
          );

          if (creatorCalendar) {
            calendarName = creatorCalendar.name;
            calendarColor = creatorCalendar.color;
          } else {
            // Fallback to default mappings if creator doesn't have the calendar
            const defaultCalendarMap: {
              [key: string]: { name: string; color: string };
            } = {
              work: { name: "Work", color: "#10B981" },
              personal: { name: "Personal", color: "#3B82F6" },
              fitness: { name: "Fitness", color: "#EF4444" },
              health: { name: "Health", color: "#F59E0B" },
              public: { name: "Public Events", color: "#4CAF50" },
            };

            const defaultCalendar = defaultCalendarMap[eventCategoryId];
            if (defaultCalendar) {
              calendarName = defaultCalendar.name;
              calendarColor = defaultCalendar.color;
            }
          }
        }

        // Add the missing calendar to user's calendars with synchronized color
        const updatedCalendars = [
          ...currentCalendars,
          {
            id: eventCategoryId,
            name: calendarName,
            color: calendarColor,
            isDefault: false,
          },
        ];

        // Update user's calendars in the database
        await db
          .update(users)
          .set({
            calendars: updatedCalendars,
          })
          .where(eq(users.id, params.userId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
