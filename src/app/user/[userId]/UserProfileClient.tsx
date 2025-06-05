"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Calendar,
  User,
  LogOut,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EventDetails } from "@/components/ui/event-details";

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

interface UserProfileClientProps {
  user: User;
  events: Event[];
  invitations: Event[];
}

export default function UserProfileClient({
  user,
  events,
  invitations: initialInvitations,
}: UserProfileClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [isAddingEvent, setIsAddingEvent] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const handleAddToCalendar = async (event: Event) => {
    try {
      setIsAddingEvent(event.id);
      setAddSuccess(null);

      // Mark the invitation as accepted
      const acceptResponse = await fetch(
        `/api/users/${user.id}/invitations/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: event.id,
          }),
          credentials: "include",
        },
      );

      if (!acceptResponse.ok) {
        throw new Error("Failed to accept invitation");
      }

      // Add the event to the user's calendar
      const copyResponse = await fetch("/api/events/copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          categoryId: event.categoryId,
        }),
        credentials: "include",
      });

      if (!copyResponse.ok) {
        throw new Error("Failed to add event to calendar");
      }

      // Remove the invitation from the list
      setInvitations((current) => current.filter((inv) => inv.id !== event.id));

      // Show success message
      setAddSuccess(event.id);

      // Clear success message after 2 seconds and refresh the page
      setTimeout(() => {
        setAddSuccess(null);
        router.refresh(); // This will trigger a server-side rerender
      }, 2000);
    } catch (error) {
      console.error("Error adding event to calendar:", error);
    } finally {
      setIsAddingEvent(null);
    }
  };

  const handleSaveChanges = async () => {
    // TODO: Implement save changes logic
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        router.replace("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="mr-8">
            <Image
              src="/img/Eventrix.svg"
              alt="Eventrix Logo"
              width={120}
              height={40}
              className="cursor-pointer transition-transform hover:scale-105"
            />
          </Link>
          <div className="ml-auto flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => router.push("/dashboard")}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8">
        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          {/* Profile Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback>
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute right-0 bottom-0 h-8 w-8 rounded-full"
                    onClick={() => {
                      /* TODO: Implement avatar change */
                    }}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="mt-4">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Member since</span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Last updated</span>
                    <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant={isEditing ? "destructive" : "secondary"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and email address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">First Name</label>
                      <Input
                        value={editedUser.firstName}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            firstName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Last Name</label>
                      <Input
                        value={editedUser.lastName}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            lastName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={editedUser.email}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser, email: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  {isEditing && (
                    <Button onClick={handleSaveChanges} className="w-full">
                      Save Changes
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Events and Notifications */}
            <Tabs defaultValue="events" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Your Events
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
              </TabsList>
              <TabsContent value="events">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Events</CardTitle>
                    <CardDescription>
                      Events you&apos;ve created or are participating in.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {events.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between rounded-lg border p-4"
                          >
                            <div>
                              <h3 className="font-medium">{event.title}</h3>
                              {event.description && (
                                <p className="text-muted-foreground text-sm">
                                  {event.description}
                                </p>
                              )}
                              <div className="text-muted-foreground mt-1 text-sm">
                                <p>
                                  {new Date(
                                    event.startTime,
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(event.startTime).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </p>
                                <p>
                                  {event.isPublic
                                    ? "Public Event"
                                    : "Private Event"}{" "}
                                  • {event.categoryId}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEvent(event)}
                            >
                              View Details
                            </Button>
                          </div>
                        ))}
                        {events.length === 0 && (
                          <div className="text-muted-foreground py-8 text-center">
                            <p>No events found.</p>
                            <Button
                              variant="link"
                              className="mt-2"
                              onClick={() => router.push("/dashboard")}
                            >
                              Create your first event
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Invitations</CardTitle>
                    <CardDescription>
                      Events you&apos;ve been invited to participate in.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {invitations.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-start justify-between rounded-lg border p-4"
                          >
                            <div className="space-y-1">
                              <h3 className="font-medium">{event.title}</h3>
                              {event.description && (
                                <p className="text-muted-foreground text-sm">
                                  {event.description}
                                </p>
                              )}
                              <div className="text-muted-foreground text-xs">
                                <p>
                                  {new Date(
                                    event.startTime,
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(event.startTime).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </p>
                                <p>
                                  {event.isPublic
                                    ? "Public Event"
                                    : "Private Event"}{" "}
                                  • {event.categoryId}
                                </p>
                                <p className="mt-1 font-medium">
                                  Invited by: {event.hostName}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEvent(event)}
                              >
                                View Details
                              </Button>
                              {addSuccess === event.id ? (
                                <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">
                                  Added to calendar!
                                </div>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAddToCalendar(event)}
                                  disabled={isAddingEvent === event.id}
                                >
                                  {isAddingEvent === event.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Adding...
                                    </>
                                  ) : (
                                    "Add to Calendar"
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        {invitations.length === 0 && (
                          <div className="text-muted-foreground py-8 text-center">
                            <p>No pending invitations.</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
