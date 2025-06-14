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
      const response = await fetch("/api/user/contacts/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetEmail: participant.email,
          targetName: participant.name,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message === "Contact already exists") {
          setIsAdded(true);
          return;
        }
        throw new Error(data.error || "Failed to add contact");
      }

      setIsAdded(true);

      // Show different messages based on the response
      if (data.mutual) {
        console.log(
          "🎉 Mutual contact detected! Both contacts are now active.",
        );
      } else {
        console.log("📤 Contact request sent successfully");
      }

      // Refresh the page after a short delay to show the updated contact list
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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
                Contact request sent!
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
                {isAdding ? "Sending..." : "Add to Contacts"}
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
