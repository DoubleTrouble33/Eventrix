import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.error("No token found in cookies");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "No token provided" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      console.error("Invalid token or missing userId:", decoded);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      });

      if (!user) {
        console.error("User not found:", decoded.userId);
        return new Response(
          JSON.stringify({ error: "Not Found", details: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      // Clean up old "Public Events" calendar from previous implementation
      let calendars = user.calendars || [];
      const hasOldPublicCalendar = calendars.some((cal) => cal.id === "public");

      if (hasOldPublicCalendar) {
        // Remove the old public calendar
        calendars = calendars.filter((cal) => cal.id !== "public");

        // Update the user's calendars in the database
        try {
          await db
            .update(users)
            .set({ calendars })
            .where(eq(users.id, decoded.userId));
          console.log("Removed old public calendar for user:", decoded.userId);
        } catch (updateError) {
          console.error("Error removing old public calendar:", updateError);
          // Continue anyway, just return the filtered calendars
        }
      }

      return new Response(JSON.stringify({ calendars }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({
          error: "Database Error",
          details:
            dbError instanceof Error
              ? dbError.message
              : "Failed to fetch calendars",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    console.error("Error fetching calendars:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.error("No token found in cookies");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "No token provided" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      console.error("Invalid token or missing userId:", decoded);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const { calendars } = await request.json();
    if (!calendars || !Array.isArray(calendars)) {
      console.error("Invalid calendars data:", calendars);
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          details: "Invalid calendars data",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("Updating calendars for user:", decoded.userId);
    console.log("Calendars data:", JSON.stringify(calendars, null, 2));

    try {
      // Update the calendars directly without checking user existence first
      const [updatedUser] = await db
        .update(users)
        .set({ calendars })
        .where(eq(users.id, decoded.userId))
        .returning();

      if (!updatedUser) {
        console.error("Failed to update user:", decoded.userId);
        return new Response(
          JSON.stringify({
            error: "Not Found",
            details: "User not found",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      console.log("Successfully updated calendars for user:", decoded.userId);
      return new Response(
        JSON.stringify({ calendars: updatedUser.calendars }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({
          error: "Database Error",
          details:
            dbError instanceof Error
              ? dbError.message
              : "Failed to update calendars",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    console.error("Error updating calendars:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
