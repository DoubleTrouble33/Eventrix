import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    // Get the token from cookies
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    // Verify the token
    const payload = await verifyJwtToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    // Fetch user data from database using Drizzle
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
