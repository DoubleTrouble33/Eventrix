import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { verifyJwtToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is declining their own contact request
    if (decoded.userId !== params.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    // Get current user's data
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const notifications = currentUser[0].notifications || [];
    const contactRequest = notifications.find(
      (notification) =>
        notification.id === notificationId &&
        notification.type === "contact_request",
    );

    if (!contactRequest) {
      return NextResponse.json(
        { error: "Contact request not found" },
        { status: 404 },
      );
    }

    // Remove the notification from current user's notifications
    const updatedNotifications = notifications.filter(
      (notification) => notification.id !== notificationId,
    );

    // Update user's notifications in the database
    await db
      .update(users)
      .set({ notifications: updatedNotifications })
      .where(eq(users.id, params.userId));

    return NextResponse.json({
      message: "Contact request declined successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error declining contact request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
