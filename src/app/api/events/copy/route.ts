import { db } from "@/db/drizzle";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Get the current user from the session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the event ID and category from the request
    const { eventId, categoryId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    // Get the original event
    const originalEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!originalEvent[0]) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Create a new event for the current user
    const newEvent = await db
      .insert(events)
      .values({
        title: originalEvent[0].title,
        description: originalEvent[0].description,
        startTime: originalEvent[0].startTime,
        endTime: originalEvent[0].endTime,
        userId: session.user.id,
        isPublic: false, // Make it private by default
        isRepeating: originalEvent[0].isRepeating,
        repeatDays: originalEvent[0].repeatDays,
        repeatEndDate: originalEvent[0].repeatEndDate,
        categoryId: categoryId || originalEvent[0].categoryId,
      })
      .returning();

    return NextResponse.json({ event: newEvent[0] });
  } catch (error) {
    console.error("Error copying event:", error);
    return NextResponse.json(
      { error: "Failed to copy event" },
      { status: 500 },
    );
  }
}
