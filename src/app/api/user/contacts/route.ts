import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth";
import type { UserContactsType } from "@/types/calendar";

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

      return new Response(JSON.stringify({ contacts: user.contacts }), {
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
              : "Failed to fetch contacts",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    console.error("Error fetching contacts:", error);
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

    const { contacts }: { contacts: UserContactsType } = await request.json();
    if (!contacts || typeof contacts !== "object") {
      console.error("Invalid contacts data:", contacts);
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          details: "Invalid contacts data",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("Updating contacts for user:", decoded.userId);
    console.log("Contacts data:", JSON.stringify(contacts, null, 2));

    try {
      // Update the contacts directly without checking user existence first
      const [updatedUser] = await db
        .update(users)
        .set({ contacts })
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

      console.log("Successfully updated contacts for user:", decoded.userId);
      return new Response(JSON.stringify({ contacts: updatedUser.contacts }), {
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
              : "Failed to update contacts",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    console.error("Error updating contacts:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
