import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eq, and } from "drizzle-orm";
import { eventGuests, users } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  context: { params: { userId: string } },
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;

    // Verify the user is requesting their own invitations
    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the user's notifications
    const notifications = user[0].notifications || [];

    // Filter notifications to only include event invitations
    const invitations = notifications.filter(
      (notification) => notification.type === "event_invitation",
    );

    // Sort invitations by createdAt (newest first)
    invitations.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Return only the first 5 invitations
    return NextResponse.json(invitations.slice(0, 5));
  } catch (error) {
    console.error("Error getting invitation preview:", error);
    return NextResponse.json(
      { error: "Failed to get invitation preview" },
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
