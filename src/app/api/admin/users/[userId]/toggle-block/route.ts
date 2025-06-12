import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;
    const { isBlocked } = await request.json();

    await db.update(users).set({ isBlocked }).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error toggling user block status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
