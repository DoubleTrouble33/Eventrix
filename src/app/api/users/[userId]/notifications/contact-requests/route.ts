import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { verifyJwtToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
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

    // Verify the user is requesting their own notifications
    if (decoded.userId !== params.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user's notifications
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const notifications = user[0].notifications || [];
    const contactRequests = notifications.filter(
      (notification) => notification.type === "contact_request",
    );

    return NextResponse.json({
      contactRequests,
      count: contactRequests.length,
    });
  } catch (error) {
    console.error("Error fetching contact requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
