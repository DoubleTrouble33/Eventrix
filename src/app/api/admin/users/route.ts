import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isBlocked: users.isBlocked,
        isAdmin: users.isAdmin,
      })
      .from(users);

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
