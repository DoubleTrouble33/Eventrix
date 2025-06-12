import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Add the new columns if they don't exist
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;`,
    );
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;`,
    );

    // Update the specified users to be admins
    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.email, "one@gmail.com"));

    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.email, "antatoni2@abv.bg"));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating schema:", error);
    return NextResponse.json(
      { error: "Failed to update schema" },
      { status: 500 },
    );
  }
}
