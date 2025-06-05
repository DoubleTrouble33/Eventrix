import { NextResponse } from "next/server";
import { db } from "@/db";
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get preview of unread invitations with host information
    const result = await db
      .select({
        id: eventGuests.id,
        eventTitle: events.title,
        hostName: users.firstName,
      })
      .from(eventGuests)
      .innerJoin(events, eq(events.id, eventGuests.eventId))
      .innerJoin(users, eq(users.id, events.userId)) // Join with host's user record
      .where(
        and(
          eq(eventGuests.email, session.user.email), // Match guest's email
          eq(eventGuests.viewed, false), // Only unread invitations
        ),
      )
      .limit(5) // Only get the 5 most recent invitations
      .execute();

    return NextResponse.json({ invitations: result });
  } catch (error) {
    console.error("Error getting invitation previews:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
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
      return new NextResponse("Unauthorized", { status: 401 });
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

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    console.error("Error marking invitations as viewed:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
