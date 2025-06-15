import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    // Get all users who have calendars
    const allUsers = await db
      .select({
        id: users.id,
        calendars: users.calendars,
      })
      .from(users)
      .where(sql`${users.calendars} IS NOT NULL`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const user of allUsers) {
      try {
        const calendars = user.calendars || [];
        const hasPublicCalendar = calendars.some(
          (cal: { id: string }) => cal.id === "public",
        );

        if (hasPublicCalendar) {
          // Remove the public calendar
          const cleanedCalendars = calendars.filter(
            (cal: { id: string }) => cal.id !== "public",
          );

          // Update the user
          await db
            .update(users)
            .set({ calendars: cleanedCalendars })
            .where(sql`${users.id} = ${user.id}`);

          updatedCount++;
        }
      } catch (userError) {
        console.error(`Error cleaning user ${user.id}:`, userError);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Public calendar cleanup completed",
      stats: {
        totalUsers: allUsers.length,
        updatedUsers: updatedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("Error during public calendar cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup public calendars",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
