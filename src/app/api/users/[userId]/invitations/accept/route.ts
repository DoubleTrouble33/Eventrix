import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eventGuests, users, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { eventId } = await request.json();
    const { userId } = await params;

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
      .where(eq(users.id, userId))
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

    // Remove the corresponding notification from user's notifications array
    const userWithNotifications = await db
      .select({
        notifications: users.notifications,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userWithNotifications[0]) {
      const currentNotifications = userWithNotifications[0].notifications || [];
      const updatedNotifications = currentNotifications.filter(
        (notification) =>
          !(
            notification.type === "event_invitation" &&
            notification.eventId === eventId
          ),
      );

      await db
        .update(users)
        .set({ notifications: updatedNotifications })
        .where(eq(users.id, userId));
    }

    // Get the user's current calendars
    const userWithCalendars = await db
      .select({
        calendars: users.calendars,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userWithCalendars[0]) {
      const currentCalendars = userWithCalendars[0].calendars || [];
      const eventCategoryId = event[0].categoryId;

      // Get the original calendar from the event creator
      const eventCreator = await db
        .select({
          calendars: users.calendars,
        })
        .from(users)
        .where(eq(users.id, event[0].userId))
        .limit(1);

      let creatorCalendar = null;
      if (eventCreator[0]?.calendars) {
        creatorCalendar = eventCreator[0].calendars.find(
          (cal: { id: string; name: string; color: string }) =>
            cal.id === eventCategoryId,
        );
      }

      // Check if user already has this exact calendar ID
      const hasExactCalendar = currentCalendars.some(
        (cal: { id: string }) => cal.id === eventCategoryId,
      );

      if (!hasExactCalendar && creatorCalendar) {
        // Check if user has a calendar with the same name (case-insensitive)
        const existingCalendarWithSameName = currentCalendars.find(
          (cal: { name: string }) =>
            cal.name.toLowerCase() === creatorCalendar.name.toLowerCase(),
        );

        if (existingCalendarWithSameName) {
          // User has a category with the same name - keep their existing color
          // Just update the ID to match the event's category ID for consistency
          const updatedCalendars = currentCalendars.map(
            (cal: {
              id: string;
              name: string;
              color: string;
              isDefault?: boolean;
            }) =>
              cal.name.toLowerCase() === creatorCalendar.name.toLowerCase()
                ? { ...cal, id: eventCategoryId }
                : cal,
          );

          await db
            .update(users)
            .set({
              calendars: updatedCalendars,
            })
            .where(eq(users.id, params.userId));
        } else {
          // User doesn't have a category with this name - create new one with creator's color
          const updatedCalendars = [
            ...currentCalendars,
            {
              id: eventCategoryId,
              name: creatorCalendar.name,
              color: creatorCalendar.color,
              isDefault: false,
            },
          ];

          await db
            .update(users)
            .set({
              calendars: updatedCalendars,
            })
            .where(eq(users.id, params.userId));
        }
      } else if (!hasExactCalendar) {
        // Fallback: Creator doesn't have the calendar, use default mappings
        let calendarName =
          eventCategoryId.charAt(0).toUpperCase() + eventCategoryId.slice(1);
        let calendarColor = "#6B7280"; // Default gray color

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

        // Check if user has a calendar with the same name
        const existingCalendarWithSameName = currentCalendars.find(
          (cal: { name: string }) =>
            cal.name.toLowerCase() === calendarName.toLowerCase(),
        );

        if (!existingCalendarWithSameName) {
          // Add the missing calendar
          const updatedCalendars = [
            ...currentCalendars,
            {
              id: eventCategoryId,
              name: calendarName,
              color: calendarColor,
              isDefault: false,
            },
          ];

          await db
            .update(users)
            .set({
              calendars: updatedCalendars,
            })
            .where(eq(users.id, params.userId));
        }
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
