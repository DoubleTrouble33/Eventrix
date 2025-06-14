"use client";

import { useState } from "react";
import { Button } from "./button";
import { UserMinus, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ContactHoverCardProps {
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: "active" | "pending" | "declined";
  };
  children: React.ReactNode;
  onRemove: (contactId: string) => void;
}

export function ContactHoverCard({
  contact,
  children,
  onRemove,
}: ContactHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(contact.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Error removing contact:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  const getActionText = () => {
    switch (contact.status) {
      case "active":
        return "Remove Friend";
      case "pending":
        return "Cancel Request";
      case "declined":
        return "Remove Contact";
      default:
        return "Remove";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="cursor-pointer transition-colors hover:text-blue-600"
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-64"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">
              {contact.firstName} {contact.lastName}
            </h4>
            <p className="text-muted-foreground text-sm">{contact.email}</p>
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  contact.status === "active"
                    ? "bg-green-100 text-green-800"
                    : contact.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {contact.status === "active"
                  ? "Active Friend"
                  : contact.status === "pending"
                    ? "Pending Request"
                    : "Declined"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving}
              className="flex w-full items-center gap-2"
            >
              {contact.status === "active" ? (
                <UserMinus className="h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isRemoving ? "Removing..." : getActionText()}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
