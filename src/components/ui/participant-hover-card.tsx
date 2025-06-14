"use client";

import { useState } from "react";
import { Button } from "./button";
import { UserPlus, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ParticipantHoverCardProps {
  participant: {
    name: string;
    email: string;
    isAccepted: boolean;
  };
  children: React.ReactNode;
  currentUserEmail?: string;
}

export function ParticipantHoverCard({
  participant,
  children,
  currentUserEmail,
}: ParticipantHoverCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Don't show hover effect if this is the current user
  const isCurrentUser =
    currentUserEmail && participant.email === currentUserEmail;

  const handleAddContact = async () => {
    if (!participant.email) {
      console.error("Cannot add contact without email");
      return;
    }

    setIsAdding(true);
    try {
      // Get current contacts
      const contactsResponse = await fetch("/api/user/contacts", {
        credentials: "include",
      });

      if (!contactsResponse.ok) {
        throw new Error("Failed to get contacts");
      }

      const contactsData = await contactsResponse.json();
      const currentContacts = contactsData.contacts || {
        organized: {},
        unorganized: {},
      };

      // Check if contact already exists
      const existingContact = Object.values(
        currentContacts.unorganized || {},
      ).find(
        (contact) => (contact as { email: string }).email === participant.email,
      );

      if (existingContact) {
        setIsAdded(true);
        return;
      }

      // Generate a unique ID for the new contact
      const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Split the participant name into first and last name
      const nameParts = participant.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Add new contact to unorganized contacts
      const newContact = {
        firstName,
        lastName,
        email: participant.email,
        avatar: `/avatars/avatar-${Math.floor(Math.random() * 10) + 1}.png`,
        status: "pending" as const,
        addedAt: new Date().toISOString(),
      };

      const updatedContacts = {
        ...currentContacts,
        unorganized: {
          ...currentContacts.unorganized,
          [contactId]: newContact,
        },
      };

      // Save updated contacts
      const saveResponse = await fetch("/api/user/contacts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contacts: updatedContacts,
        }),
        credentials: "include",
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save contact");
      }

      setIsAdded(true);
    } catch (error) {
      console.error("Error adding contact:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // If this is the current user, just return the children without hover effect
  if (isCurrentUser) {
    return <>{children}</>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="cursor-pointer"
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{participant.name}</h4>
            <p className="text-muted-foreground text-sm">{participant.email}</p>
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  participant.isAccepted
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {participant.isAccepted ? "Accepted" : "Pending"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdded ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Added to contacts
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddContact}
                disabled={isAdding}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {isAdding ? "Adding..." : "Add to Contacts"}
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
