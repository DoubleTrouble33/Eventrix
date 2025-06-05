import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName } = await req.json();

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate first name and last name
    const nameRegex = /^[A-Za-z]{1,30}$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      return NextResponse.json(
        {
          message:
            "Names must contain only letters and be between 1-30 characters",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate password
    if (password.length < 8 || password.length > 30) {
      return NextResponse.json(
        { message: "Password must be between 8 and 30 characters" },
        { status: 400 },
      );
    }
    if (!/(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)) {
      return NextResponse.json(
        { message: "Password must include at least one number and one symbol" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        firstName,
        lastName,
        password: hashedPassword,
      })
      .returning();

    // Generate JWT token
    const token = sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Create response with user data
    const response = NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      },
      { status: 201 },
    );

    // Set HTTP-only cookie with the token
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Error registering user" },
      { status: 500 },
    );
  }
}
