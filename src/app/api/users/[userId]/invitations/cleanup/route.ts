import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eventGuests, users, events } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();
    if (!session || session.user.id !== params.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;

    // Get user with notifications
    const user = await db
      .select({
        email: users.email,
        notifications: users.notifications,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentNotifications = user[0].notifications || [];
    const eventInvitations = currentNotifications.filter(
      (notification) => notification.type === "event_invitation",
    );

    if (eventInvitations.length === 0) {
      return NextResponse.json({ message: "No invitations to clean up" });
    }

    // Get all event IDs from notifications (filter out undefined)
    const eventIds = eventInvitations
      .map((inv) => inv.eventId)
      .filter((id): id is string => Boolean(id));

    if (eventIds.length === 0) {
      return NextResponse.json({ message: "No valid event IDs found" });
    }

    // Check which events the user has already accepted or are in their calendar
    const acceptedInvitations = await db
      .select({
        eventId: eventGuests.eventId,
        isAccepted: eventGuests.isAccepted,
      })
      .from(eventGuests)
      .where(
        and(
          eq(eventGuests.email, user[0].email),
          inArray(eventGuests.eventId, eventIds),
        ),
      );

    // Also check for events that no longer exist
    const existingEvents = await db
      .select({
        id: events.id,
      })
      .from(events)
      .where(inArray(events.id, eventIds));

    const existingEventIds = existingEvents.map((e) => e.id);
    const acceptedEventIds = acceptedInvitations
      .filter((inv) => inv.isAccepted)
      .map((inv) => inv.eventId);

    // Remove notifications for:
    // 1. Events that have been accepted
    // 2. Events that no longer exist
    const shouldRemoveEventIds = [
      ...acceptedEventIds,
      ...eventIds.filter((id) => !existingEventIds.includes(id)),
    ];

    const cleanedNotifications = currentNotifications.filter(
      (notification) =>
        !(
          notification.type === "event_invitation" &&
          notification.eventId &&
          shouldRemoveEventIds.includes(notification.eventId as string)
        ),
    );

    // Update user notifications
    await db
      .update(users)
      .set({ notifications: cleanedNotifications })
      .where(eq(users.id, userId));

    const removedCount =
      currentNotifications.length - cleanedNotifications.length;

    return NextResponse.json({
      success: true,
      removedCount,
      message: `Cleaned up ${removedCount} stale invitation notifications`,
    });
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
