import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export async function verifyJwtToken(
  token: string,
): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

export async function auth() {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    // Verify the token
    const decoded = await verifyJwtToken(token);
    if (!decoded) {
      return null;
    }

    // Get user from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar,
        isAdmin: users.isAdmin,
        isBlocked: users.isBlocked,
      })
      .from(users)
      .where(eq(users.id, decoded.userId));

    if (!user) {
      return null;
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      },
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}
