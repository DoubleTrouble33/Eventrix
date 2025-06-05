import { db } from "@/db/drizzle";
import { events, users, eventGuests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

interface Event {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isPublic: boolean;
  categoryId: string;
  hostName?: string;
  hostId?: string;
}

interface PageProps {
  params: {
    userId: string;
  };
}

async function getUser(userId: string): Promise<User | null> {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!result[0]) return null;

  return {
    ...result[0],
    avatar: "/img/avatar-demo.png", // Default avatar
  };
}

async function getUserEvents(userId: string): Promise<Event[]> {
  const result = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      startTime: events.startTime,
      endTime: events.endTime,
      isPublic: events.isPublic,
      categoryId: events.categoryId,
    })
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(events.startTime);

  return result;
}

async function getEventInvitations(userId: string): Promise<Event[]> {
  // First get the user's email
  const user = await db
    .select({
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0]) return [];

  // Get events where the user is invited as a guest and hasn't accepted yet
  const invitedEvents = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      startTime: events.startTime,
      endTime: events.endTime,
      isPublic: events.isPublic,
      categoryId: events.categoryId,
      hostId: events.userId,
    })
    .from(events)
    .innerJoin(eventGuests, eq(events.id, eventGuests.eventId))
    .where(
      and(
        eq(eventGuests.email, user[0].email),
        eq(eventGuests.isAccepted, false),
      ),
    )
    .orderBy(events.startTime);

  // Get host names for each event
  const eventsWithHosts = await Promise.all(
    invitedEvents.map(async (event) => {
      const host = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, event.hostId))
        .limit(1);

      return {
        ...event,
        hostName: host[0]
          ? `${host[0].firstName} ${host[0].lastName}`
          : "Unknown Host",
      };
    }),
  );

  return eventsWithHosts;
}

export default async function UserProfilePage({ params }: PageProps) {
  const user = await getUser(params.userId);

  if (!user) {
    notFound();
  }

  const [events, invitations] = await Promise.all([
    getUserEvents(params.userId),
    getEventInvitations(params.userId),
  ]);

  return (
    <UserProfileClient user={user} events={events} invitations={invitations} />
  );
}
