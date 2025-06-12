import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { events } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: { eventId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = params;

    await db.delete(events).where(eq(events.id, eventId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
