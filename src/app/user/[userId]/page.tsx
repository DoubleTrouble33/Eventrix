import { sql } from "@/lib/db";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    userId: string;
  };
}

async function getUser(userId: string) {
  const result = await sql`
    SELECT id, email, "firstName", "lastName"
    FROM users
    WHERE id = ${userId}
  `;

  return result[0] || null;
}

export default async function UserProfilePage({ params }: PageProps) {
  const user = await getUser(params.userId);

  if (!user) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">User Profile</h1>

        <div className="space-y-4">
          <div className="flex items-center">
            <span className="w-32 font-semibold">Name:</span>
            <span>
              {user.firstName} {user.lastName}
            </span>
          </div>

          <div className="flex items-center">
            <span className="w-32 font-semibold">Email:</span>
            <span>{user.email}</span>
          </div>

          <div className="flex items-center">
            <span className="w-32 font-semibold">User ID:</span>
            <span className="font-mono text-sm">{user.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
