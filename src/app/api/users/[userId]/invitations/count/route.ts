import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eventGuests, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
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

    // Get the viewed parameter from the URL
    const url = new URL(request.url);
    const viewedParam = url.searchParams.get("viewed");

    // Build the where conditions
    const conditions = [
      eq(eventGuests.email, user[0].email),
      eq(eventGuests.isAccepted, false),
    ];

    // Add viewed condition if specified
    if (viewedParam !== null) {
      conditions.push(eq(eventGuests.viewed, viewedParam === "true"));
    }

    // Count invitations
    const result = await db
      .select({
        count: eventGuests.id,
      })
      .from(eventGuests)
      .where(and(...conditions))
      .groupBy(eventGuests.id);

    return NextResponse.json({ count: result.length });
  } catch (error) {
    console.error("Error getting invitations count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
