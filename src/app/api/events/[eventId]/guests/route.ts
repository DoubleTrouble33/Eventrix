import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eventGuests, events } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } },
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    // Verify that the event exists and belongs to the user
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, params.eventId))
      .limit(1);

    if (!event[0]) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to modify this event" },
        { status: 403 },
      );
    }

    // Add the guest
    const [guest] = await db
      .insert(eventGuests)
      .values({
        eventId: params.eventId,
        name,
        email,
        isAccepted: false,
        viewed: false,
      })
      .returning();

    return NextResponse.json({ guest });
  } catch (error) {
    console.error("Error adding guest:", error);
    return NextResponse.json({ error: "Failed to add guest" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } },
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the event
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, params.eventId))
      .limit(1);

    if (!event[0]) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get all guests for the event
    const guests = await db
      .select()
      .from(eventGuests)
      .where(eq(eventGuests.eventId, params.eventId));

    return NextResponse.json({ guests });
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json(
      { error: "Failed to fetch guests" },
      { status: 500 },
    );
  }
}
