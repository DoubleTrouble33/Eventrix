import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user: session.user });
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
