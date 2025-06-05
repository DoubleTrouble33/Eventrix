import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eventGuests, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
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

    // Update all unviewed invitations for this user to viewed
    await db
      .update(eventGuests)
      .set({
        viewed: true,
      })
      .where(
        and(
          eq(eventGuests.email, user[0].email),
          eq(eventGuests.viewed, false),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking invitations as viewed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
