import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { events, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First get all events
    const allEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        startTime: events.startTime,
        endTime: events.endTime,
        userId: events.userId,
      })
      .from(events);

    // Then get all users to map names
    const allUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users);

    // Create a map of user IDs to names
    const userMap = new Map(
      allUsers.map((user) => [user.id, `${user.firstName} ${user.lastName}`]),
    );

    // Combine the data
    const eventsWithUserNames = allEvents.map((event) => ({
      ...event,
      userName: userMap.get(event.userId) || "Unknown",
    }));

    return NextResponse.json({ events: eventsWithUserNames });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
