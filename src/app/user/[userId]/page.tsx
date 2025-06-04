import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import UserProfileClient from "./UserProfileClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PageProps {
  params: {
    userId: string;
  };
}

async function getUser(userId: string): Promise<User | null> {
  const result = await sql`
    SELECT 
      id, 
      email, 
      first_name as "firstName", 
      last_name as "lastName",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM users
    WHERE id = ${userId}
  `;

  if (!result[0]) return null;

  return {
    id: result[0].id,
    email: result[0].email,
    firstName: result[0].firstName,
    lastName: result[0].lastName,
    createdAt: result[0].createdAt,
    updatedAt: result[0].updatedAt,
    avatar: "/img/avatar-demo.png", // Set default avatar here
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const user = await getUser(params.userId);

  if (!user) {
    notFound();
  }

  return <UserProfileClient user={user} />;
}
