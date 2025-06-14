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
  userId: string;
  isPublic: boolean;
  isRepeating: boolean;
  repeatDays: number[] | null;
  repeatEndDate: Date | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PageProps {
  params: Promise<{ userId: string }>;
}

async function getUser(userId: string): Promise<User | null> {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      avatar: users.avatar,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!result[0]) return null;

  return {
    ...result[0],
    avatar: result[0].avatar || "/img/avatar-demo.png", // Use default avatar if null
  };
}

async function getUserEvents(userId: string): Promise<Event[]> {
  // First get the user's email for guest event queries
  const user = await db
    .select({
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0]) return [];

  // Get events where user is the creator
  const createdEvents = await db
    .select()
    .from(events)
    .where(eq(events.userId, userId));

  // Get events where user is an accepted guest
  const guestEvents = await db
    .select()
    .from(events)
    .innerJoin(eventGuests, eq(events.id, eventGuests.eventId))
    .where(
      and(
        eq(eventGuests.email, user[0].email),
        eq(eventGuests.isAccepted, true),
      ),
    );

  // Combine both sets of events, removing duplicates
  const allEvents = [
    ...createdEvents,
    ...guestEvents.map((e) => e.events),
  ].filter(
    (event, index, self) => index === self.findIndex((e) => e.id === event.id),
  );

  return allEvents;
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

  // Get events where the user is invited as a guest AND hasn't accepted yet
  const result = await db
    .select({
      event: events,
    })
    .from(eventGuests)
    .innerJoin(events, eq(eventGuests.eventId, events.id))
    .where(
      and(
        eq(eventGuests.email, user[0].email),
        eq(eventGuests.isAccepted, false),
      ),
    );

  return result.map((r) => r.event);
}

export default async function UserProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const user = await getUser(userId);

  if (!user) {
    notFound();
  }

  const [userEvents, invitations] = await Promise.all([
    getUserEvents(userId),
    getEventInvitations(userId),
  ]);

  return (
    <UserProfileClient
      user={user}
      events={userEvents}
      invitations={invitations}
    />
  );
}
