import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eventGuests, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const { eventId } = await request.json();
    const { userId } = params;

    console.log("Decline invitation request:", { eventId, userId });

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

    console.log("Found user:", user[0].email);

    // Delete the invitation (declining means removing it)
    const result = await db
      .delete(eventGuests)
      .where(
        and(
          eq(eventGuests.email, user[0].email),
          eq(eventGuests.eventId, eventId),
        ),
      )
      .returning();

    console.log("Delete result:", result);

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

      console.log("Updating notifications:", {
        before: currentNotifications.length,
        after: updatedNotifications.length,
      });

      await db
        .update(users)
        .set({ notifications: updatedNotifications })
        .where(eq(users.id, userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error declining invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
