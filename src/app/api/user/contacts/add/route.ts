import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { verifyJwtToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
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

    const { targetEmail, targetName } = await request.json();

    if (!targetEmail || !targetName) {
      return NextResponse.json(
        { error: "Target email and name are required" },
        { status: 400 },
      );
    }

    // Get current user's data
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!currentUser[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get target user's data by email
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.email, targetEmail))
      .limit(1);

    if (!targetUser[0]) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Don't allow adding yourself
    if (currentUser[0].email === targetEmail) {
      return NextResponse.json(
        { error: "Cannot add yourself as contact" },
        { status: 400 },
      );
    }

    const currentUserContacts = currentUser[0].contacts || {
      organized: {},
      unorganized: {},
    };
    const targetUserContacts = targetUser[0].contacts || {
      organized: {},
      unorganized: {},
    };

    // Check if current user already has target as contact
    const existingContact = Object.values(
      currentUserContacts.unorganized || {},
    ).find((contact: any) => contact?.email === targetEmail);

    if (existingContact) {
      return NextResponse.json({
        message: "Contact already exists",
        status: existingContact.status,
        mutual: false,
      });
    }

    // Check if target user already has current user as contact (mutual detection)
    const mutualContact = Object.values(
      targetUserContacts.unorganized || {},
    ).find((contact: any) => contact?.email === currentUser[0].email);

    const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Split names for proper storage
    const targetNameParts = targetName.trim().split(" ");

    // Determine status based on mutual contact detection
    const isMutual = !!mutualContact;
    const contactStatus = isMutual ? "active" : "pending";

    // Create new contact for current user
    const newContactForCurrentUser = {
      firstName: targetNameParts[0] || "",
      lastName: targetNameParts.slice(1).join(" ") || "",
      email: targetEmail,
      avatar:
        targetUser[0].avatar ||
        `/avatars/avatar-${Math.floor(Math.random() * 10) + 1}.png`,
      status: contactStatus,
      addedAt: new Date().toISOString(),
    };

    // Update current user's contacts
    const updatedCurrentUserContacts = {
      ...currentUserContacts,
      unorganized: {
        ...currentUserContacts.unorganized,
        [contactId]: newContactForCurrentUser,
      },
    };

    // Save current user's updated contacts
    await db
      .update(users)
      .set({ contacts: updatedCurrentUserContacts })
      .where(eq(users.id, decoded.userId));

    // If mutual contact exists, update both users' contacts to active
    if (isMutual) {
      // Find the mutual contact ID in target user's contacts
      const mutualContactId = Object.keys(
        targetUserContacts.unorganized || {},
      ).find((id) => {
        const contact = (targetUserContacts.unorganized as any)?.[id];
        return contact?.email === currentUser[0].email;
      });

      if (mutualContactId) {
        // Update the existing mutual contact to active
        const updatedTargetUserContacts = {
          ...targetUserContacts,
          unorganized: {
            ...targetUserContacts.unorganized,
            [mutualContactId]: {
              ...(targetUserContacts.unorganized as any)[mutualContactId],
              status: "active",
            },
          },
        };

        await db
          .update(users)
          .set({ contacts: updatedTargetUserContacts })
          .where(eq(users.id, targetUser[0].id));
      }

      return NextResponse.json({
        message: "Mutual contact detected! Both contacts are now active.",
        status: "active",
        mutual: true,
      });
    } else {
      // No mutual contact - create a contact request notification for target user
      const targetUserNotifications = targetUser[0].notifications || [];
      const newNotification = {
        id: `contact_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "contact_request",
        fromUserId: currentUser[0].id,
        fromUserName: `${currentUser[0].firstName} ${currentUser[0].lastName}`,
        fromUserEmail: currentUser[0].email,
        fromUserAvatar: currentUser[0].avatar,
        message: `${currentUser[0].firstName} ${currentUser[0].lastName} wants to connect with you`,
        createdAt: new Date().toISOString(),
        viewed: false,
      };

      const updatedTargetUserNotifications = [
        ...targetUserNotifications,
        newNotification,
      ];

      // Update target user's notifications
      await db
        .update(users)
        .set({ notifications: updatedTargetUserNotifications })
        .where(eq(users.id, targetUser[0].id));

      return NextResponse.json({
        message: "Contact request sent successfully",
        status: "pending",
        mutual: false,
      });
    }
  } catch (error) {
    console.error("Error adding contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
