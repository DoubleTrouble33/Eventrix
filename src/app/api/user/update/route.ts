import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";
import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PUT(request: Request) {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Verify the token
    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await request.json();
    const { firstName, lastName, email } = body;

    // Validate input
    if (!firstName || !lastName || !email) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    // Update user in database
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, decoded.userId))
      .returning();

    if (!updatedUser) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Generate new token with updated email
    const newToken = sign(
      { userId: updatedUser.id, email: updatedUser.email },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Create response with updated user data
    const response = NextResponse.json(updatedUser);

    // Set new token in cookie
    response.cookies.set({
      name: "token",
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 },
    );
  }
}
