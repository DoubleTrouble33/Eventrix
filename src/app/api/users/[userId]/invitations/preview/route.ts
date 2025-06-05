import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eq, and } from "drizzle-orm";
import { eventGuests, users, events } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();
    if (!session || session.user.id !== params.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get preview of unread and unaccepted invitations with host information
    const result = await db
      .select({
        id: eventGuests.id,
        eventId: events.id,
        eventTitle: events.title,
        hostName: users.firstName,
        startTime: events.startTime,
        endTime: events.endTime,
        description: events.description,
        isRepeating: events.isRepeating,
        repeatDays: events.repeatDays,
        repeatEndDate: events.repeatEndDate,
      })
      .from(eventGuests)
      .innerJoin(events, eq(events.id, eventGuests.eventId))
      .innerJoin(users, eq(users.id, events.userId)) // Join with host's user record
      .where(
        and(
          eq(eventGuests.email, session.user.email), // Match guest's email
          eq(eventGuests.isAccepted, false), // Only unaccepted invitations
        ),
      )
      .limit(5) // Only get the 5 most recent invitations
      .execute();

    return NextResponse.json({ invitations: result });
  } catch (error) {
    console.error("Error getting invitation previews:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Mark invitations as viewed
export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();
    if (!session || session.user.id !== params.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark all unread invitations as viewed
    await db
      .update(eventGuests)
      .set({ viewed: true })
      .where(
        and(
          eq(eventGuests.email, session.user.email),
          eq(eventGuests.viewed, false),
        ),
      )
      .execute();

    return NextResponse.json({ message: "Invitations marked as viewed" });
  } catch (error) {
    console.error("Error marking invitations as viewed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
