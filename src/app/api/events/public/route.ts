import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { events, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all public events with creator information
    const publicEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        startTime: events.startTime,
        endTime: events.endTime,
        userId: events.userId,
        isPublic: events.isPublic,
        isRepeating: events.isRepeating,
        repeatDays: events.repeatDays,
        repeatEndDate: events.repeatEndDate,
        categoryId: events.categoryId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorEmail: users.email,
      })
      .from(events)
      .leftJoin(users, eq(events.userId, users.id))
      .where(eq(events.isPublic, true));

    // Transform the data to match the expected format
    const formattedEvents = publicEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      userId: event.userId,
      isPublic: event.isPublic,
      isRepeating: event.isRepeating,
      repeatDays: event.repeatDays,
      repeatEndDate: event.repeatEndDate,
      categoryId: event.categoryId, // Keep original category
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      creatorName: `${event.creatorFirstName} ${event.creatorLastName}`,
      creatorEmail: event.creatorEmail,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error("Error fetching public events:", error);
    return NextResponse.json(
      { error: "Failed to fetch public events" },
      { status: 500 },
    );
  }
}
