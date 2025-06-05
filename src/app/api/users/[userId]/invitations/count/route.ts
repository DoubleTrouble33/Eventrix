import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eq, and } from "drizzle-orm";
import { eventGuests } from "@/db/schema";
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

    // Get count of unread invitations
    const result = await db
      .select({ id: eventGuests.id })
      .from(eventGuests)
      .where(
        and(
          eq(eventGuests.email, session.user.email),
          eq(eventGuests.viewed, false),
        ),
      )
      .execute();

    return NextResponse.json({ count: result.length });
  } catch (error) {
    console.error("Error getting invitation count:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
