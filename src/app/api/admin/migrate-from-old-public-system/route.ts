import { NextResponse } from "next/server";

export async function POST() {
  try {
    const results = {
      calendarsCleanup: null as Record<string, unknown> | null,
      eventsCleanup: null as Record<string, unknown> | null,
      success: true,
      errors: [] as string[],
    };

    // Step 1: Clean up public calendars from users
    try {
      const calendarsResponse = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/cleanup-public-calendars`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (calendarsResponse.ok) {
        results.calendarsCleanup = await calendarsResponse.json();
      } else {
        throw new Error(
          `Calendars cleanup failed: ${calendarsResponse.status}`,
        );
      }
    } catch (error) {
      const errorMsg = `Calendars cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
      results.success = false;
    }

    // Step 2: Clean up events with categoryId "public"
    try {
      const eventsResponse = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/cleanup-public-events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (eventsResponse.ok) {
        results.eventsCleanup = await eventsResponse.json();
      } else {
        throw new Error(`Events cleanup failed: ${eventsResponse.status}`);
      }
    } catch (error) {
      const errorMsg = `Events cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
      results.success = false;
    }

    return NextResponse.json({
      success: results.success,
      message: results.success
        ? "Migration from old public calendar system completed successfully"
        : "Migration completed with some errors",
      results: {
        calendarsCleanup: results.calendarsCleanup,
        eventsCleanup: results.eventsCleanup,
        errors: results.errors,
      },
      summary: {
        totalErrors: results.errors.length,
        hasCalendarsCleanup: !!results.calendarsCleanup,
        hasEventsCleanup: !!results.eventsCleanup,
      },
    });
  } catch (error) {
    console.error("Error during migration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
