import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { events } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { eventId: string } },
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = params;
    const body = await request.json();

    // Verify the event exists and belongs to the user
    const existingEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!existingEvent.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the event
    const [updatedEvent] = await db
      .update(events)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 },
    );
  }
}
