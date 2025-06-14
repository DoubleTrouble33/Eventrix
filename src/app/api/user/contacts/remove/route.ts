import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { verifyJwtToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactEmail } = await request.json();

    if (!contactEmail) {
      return NextResponse.json(
        { error: "Contact email is required" },
        { status: 400 },
      );
    }

    // Get current user's data
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get target user's data by email
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.email, contactEmail))
      .limit(1);

    if (!targetUser[0]) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    const currentUserContacts = currentUser[0].contacts || {
      organized: {},
      unorganized: {},
    };
    const targetUserContacts = targetUser[0].contacts || {
      organized: {},
      unorganized: {},
    };

    // Remove contact from current user's contacts
    const updatedCurrentUserContacts = {
      ...currentUserContacts,
      unorganized: Object.fromEntries(
        Object.entries(currentUserContacts.unorganized || {}).filter(
          ([_, contact]) => (contact as any)?.email !== contactEmail,
        ),
      ),
    };

    // Remove current user from target user's contacts
    const updatedTargetUserContacts = {
      ...targetUserContacts,
      unorganized: Object.fromEntries(
        Object.entries(targetUserContacts.unorganized || {}).filter(
          ([_, contact]) => (contact as any)?.email !== currentUser[0].email,
        ),
      ),
    };

    // Update both users' contacts in the database
    await Promise.all([
      db
        .update(users)
        .set({ contacts: updatedCurrentUserContacts })
        .where(eq(users.id, decoded.userId)),
      db
        .update(users)
        .set({ contacts: updatedTargetUserContacts })
        .where(eq(users.id, targetUser[0].id)),
    ]);

    return NextResponse.json({
      message: "Contact removed successfully from both users",
      success: true,
    });
  } catch (error) {
    console.error("Error removing contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
