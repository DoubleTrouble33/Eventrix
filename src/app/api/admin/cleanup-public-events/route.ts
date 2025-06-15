import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Find all events with categoryId "public"
    const publicCategoryEvents = await db
      .select()
      .from(events)
      .where(eq(events.categoryId, "public"));

    if (publicCategoryEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No events with categoryId 'public' found",
        stats: {
          totalEvents: 0,
          updatedEvents: 0,
          errors: 0,
        },
      });
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (const event of publicCategoryEvents) {
      try {
        // Update the event to use "personal" as default category
        // You might want to change this to a different default category
        await db
          .update(events)
          .set({ categoryId: "personal" })
          .where(eq(events.id, event.id));

        updatedCount++;
      } catch (eventError) {
        console.error(`Error updating event ${event.id}:`, eventError);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Event categoryId cleanup completed",
      stats: {
        totalEvents: publicCategoryEvents.length,
        updatedEvents: updatedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("Error during event categoryId cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup event categoryIds",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
