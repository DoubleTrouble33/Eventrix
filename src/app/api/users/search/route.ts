import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { ilike, or, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || (query.length < 2 && query !== "*")) {
      return NextResponse.json([]);
    }

    // Get current user to exclude from results
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    // Search users by first name, last name, or email
    // If query is "*", return all users
    const searchResults = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        avatar: users.avatar,
      })
      .from(users)
      .where(
        query === "*"
          ? undefined // No where clause - return all users
          : or(
              ilike(users.firstName, `%${query}%`),
              ilike(users.lastName, `%${query}%`),
              ilike(users.email, `%${query}%`),
            ),
      )
      .limit(query === "*" ? 50 : 10); // Show more users when showing all

    // Filter out the current user
    const filteredResults = searchResults.filter(
      (user) => user.id !== currentUser[0]?.id,
    );

    return NextResponse.json(filteredResults);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 },
    );
  }
}
