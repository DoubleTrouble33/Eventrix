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
  hostName?: string;
  hostId?: string;
}

interface ContactRequest {
  id: string;
  type: "contact_request";
  fromUserId?: string;
  fromUserName?: string;
  fromUserEmail?: string;
  fromUserAvatar?: string;
  message: string;
  createdAt: string;
  viewed: boolean;
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
  // Include host information by joining with the users table
  const result = await db
    .select({
      event: events,
      host: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      },
    })
    .from(eventGuests)
    .innerJoin(events, eq(eventGuests.eventId, events.id))
    .innerJoin(users, eq(events.userId, users.id))
    .where(
      and(
        eq(eventGuests.email, user[0].email),
        eq(eventGuests.isAccepted, false),
      ),
    );

  return result.map((r) => ({
    ...r.event,
    hostId: r.host.id,
    hostName: `${r.host.firstName} ${r.host.lastName}`,
  }));
}

async function getContactRequests(userId: string) {
  // Get the user's notifications
  const user = await db
    .select({
      notifications: users.notifications,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0]) return [];

  const notifications = user[0].notifications || [];

  // Filter to only contact requests and cast to proper type
  return notifications.filter(
    (notification): notification is ContactRequest =>
      notification.type === "contact_request",
  );
}

export default async function UserProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const user = await getUser(userId);

  if (!user) {
    notFound();
  }

  const [userEvents, invitations, contactRequests] = await Promise.all([
    getUserEvents(userId),
    getEventInvitations(userId),
    getContactRequests(userId),
  ]);

  return (
    <UserProfileClient
      user={user}
      events={userEvents}
      invitations={invitations}
      contactRequests={contactRequests}
    />
  );
}
