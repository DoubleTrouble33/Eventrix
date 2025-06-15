import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

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

    // Get the viewed parameter from the URL
    const { searchParams } = new URL(request.url);
    const viewed = searchParams.get("viewed");

    // Get the user's notifications
    const notifications = user[0].notifications || [];

    // Filter notifications based on the viewed parameter
    const filteredNotifications = notifications.filter(
      (notification) =>
        notification.type === "event_invitation" &&
        (viewed === null || notification.viewed === (viewed === "true")),
    );

    return NextResponse.json({ count: filteredNotifications.length });
  } catch (error) {
    console.error("Error getting invitation count:", error);
    return NextResponse.json(
      { error: "Failed to get invitation count" },
      { status: 500 },
    );
  }
}
