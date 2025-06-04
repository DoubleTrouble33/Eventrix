import jwt from "jsonwebtoken";

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
