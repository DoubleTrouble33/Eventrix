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
      .where(eq(users.id, params.userId))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
