import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { verifyJwtToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is accepting their own contact request
    if (decoded.userId !== params.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    // Get current user's data
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const notifications = currentUser[0].notifications || [];
    const contactRequest = notifications.find(
      (notification) =>
        notification.id === notificationId &&
        notification.type === "contact_request",
    );

    if (!contactRequest) {
      return NextResponse.json(
        { error: "Contact request not found" },
        { status: 404 },
      );
    }

    // Get the requester user's data
    const requesterUser = await db
      .select()
      .from(users)
      .where(eq(users.id, contactRequest.fromUserId!))
      .limit(1);

    if (!requesterUser[0]) {
      return NextResponse.json(
        { error: "Requester user not found" },
        { status: 404 },
      );
    }

    // Add contacts to both users
    const currentUserContacts = currentUser[0].contacts || {
      organized: {},
      unorganized: {},
    };
    const requesterUserContacts = requesterUser[0].contacts || {
      organized: {},
      unorganized: {},
    };

    const contactId1 = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add requester to current user's contacts
    const newContactForCurrentUser = {
      firstName: requesterUser[0].firstName,
      lastName: requesterUser[0].lastName,
      email: requesterUser[0].email,
      avatar:
        requesterUser[0].avatar ||
        `/avatars/avatar-${Math.floor(Math.random() * 10) + 1}.png`,
      status: "active" as const,
      addedAt: new Date().toISOString(),
    };

    // Add current user to requester's contacts (update existing pending contact to active)
    const requesterContactId = Object.keys(
      requesterUserContacts.unorganized || {},
    ).find((id) => {
      const contact = (requesterUserContacts.unorganized as any)?.[id];
      return contact?.email === currentUser[0].email;
    });

    const updatedCurrentUserContacts = {
      ...currentUserContacts,
      unorganized: {
        ...currentUserContacts.unorganized,
        [contactId1]: newContactForCurrentUser,
      },
    };

    let updatedRequesterUserContacts = requesterUserContacts;
    if (requesterContactId) {
      // Update existing contact to active
      updatedRequesterUserContacts = {
        ...requesterUserContacts,
        unorganized: {
          ...requesterUserContacts.unorganized,
          [requesterContactId]: {
            ...(requesterUserContacts.unorganized as any)[requesterContactId],
            status: "active",
          },
        },
      };
    }

    // Remove the notification from current user's notifications
    const updatedNotifications = notifications.filter(
      (notification) => notification.id !== notificationId,
    );

    // Update both users in the database
    await Promise.all([
      db
        .update(users)
        .set({
          contacts: updatedCurrentUserContacts,
          notifications: updatedNotifications,
        })
        .where(eq(users.id, params.userId)),
      db
        .update(users)
        .set({ contacts: updatedRequesterUserContacts })
        .where(eq(users.id, contactRequest.fromUserId!)),
    ]);

    return NextResponse.json({
      message: "Contact request accepted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error accepting contact request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
