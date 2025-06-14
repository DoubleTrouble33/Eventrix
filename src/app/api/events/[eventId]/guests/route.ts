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

    // Verify that the event exists
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, params.eventId))
      .limit(1);

    if (!event[0]) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is the event creator OR an accepted participant OR it's a public event
    const isCreator = event[0].userId === session.user.id;
    const isPublicEvent = event[0].isPublic;

    let isAcceptedParticipant = false;
    if (!isCreator && !isPublicEvent) {
      // Check if user is an accepted participant (only needed for private events)
      const userAsGuest = await db
        .select()
        .from(eventGuests)
        .where(eq(eventGuests.eventId, params.eventId))
        .limit(100); // Get all guests to check

      // Find current user in guest list and check if they're accepted
      const currentUserGuest = userAsGuest.find(
        (guest) => guest.email === session.user?.email && guest.isAccepted,
      );

      isAcceptedParticipant = !!currentUserGuest;
    }

    // Allow if: creator, accepted participant, or public event
    if (!isCreator && !isAcceptedParticipant && !isPublicEvent) {
      return NextResponse.json(
        { error: "Not authorized to modify this event" },
        { status: 403 },
      );
    }

    // Check if the user is trying to join themselves to a public event
    const isJoiningPublicEvent = isPublicEvent && email === session.user.email;

    // Check if guest already exists
    const existingGuest = await db
      .select()
      .from(eventGuests)
      .where(eq(eventGuests.eventId, params.eventId))
      .limit(100);

    const guestExists = existingGuest.find((guest) => guest.email === email);

    if (guestExists) {
      return NextResponse.json(
        { error: "User is already a participant" },
        { status: 400 },
      );
    }

    // Add the guest (auto-accept if joining a public event)
    const [guest] = await db
      .insert(eventGuests)
      .values({
        eventId: params.eventId,
        name,
        email,
        isAccepted: isJoiningPublicEvent ? true : false, // Auto-accept public event joins
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

    // Check if user is the event creator OR an accepted participant OR it's a public event
    const isCreator = event[0].userId === session.user.id;
    const isPublicEvent = event[0].isPublic;

    let isAcceptedParticipant = false;
    if (!isCreator && !isPublicEvent) {
      // Get all guests for the event
      const allGuests = await db
        .select()
        .from(eventGuests)
        .where(eq(eventGuests.eventId, params.eventId));

      // Find current user in guest list and check if they're accepted
      const currentUserGuest = allGuests.find(
        (guest) => guest.email === session.user?.email && guest.isAccepted,
      );

      isAcceptedParticipant = !!currentUserGuest;

      if (isAcceptedParticipant) {
        // Return the guests we already fetched
        return NextResponse.json({ guests: allGuests });
      }
    }

    // Allow viewing if: creator, accepted participant, or public event
    if (!isCreator && !isAcceptedParticipant && !isPublicEvent) {
      return NextResponse.json(
        { error: "Not authorized to view this event's guests" },
        { status: 403 },
      );
    }

    // Get all guests for the event (for creators)
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
