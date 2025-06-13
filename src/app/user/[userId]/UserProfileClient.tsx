"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EventDetails } from "@/components/ui/event-details";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  isRepeating?: boolean;
  repeatEndDate?: Date | null;
  userId: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  status: "active" | "pending" | "declined";
  addedAt: Date;
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
  const [userData, setUserData] = useState(user);
  const [isAddingEvent, setIsAddingEvent] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<"all" | "created" | "invited">(
    "all",
  );
  const [contactFilter, setContactFilter] = useState<
    "all" | "active" | "pending" | "declined"
  >("all");

  // Dummy contacts data for UI demonstration
  const [contacts] = useState<Contact[]>([
    {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      avatar: "/img/avatar-demo.png",
      status: "active",
      addedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      avatar:
        "/avatars/avatar-aec0cc4b-2077-4821-920a-b28403ed7799-1749145483983-722039292.jpeg",
      status: "active",
      addedAt: new Date("2024-02-10"),
    },
    {
      id: "3",
      firstName: "Mike",
      lastName: "Johnson",
      email: "mike.johnson@example.com",
      avatar:
        "/avatars/avatar-aec0cc4b-2077-4821-920a-b28403ed7799-1749145390867-883170595.jpeg",
      status: "pending",
      addedAt: new Date("2024-03-05"),
    },
    {
      id: "4",
      firstName: "Sarah",
      lastName: "Wilson",
      email: "sarah.wilson@example.com",
      avatar: "/img/avatar-demo.png",
      status: "active",
      addedAt: new Date("2024-02-28"),
    },
    {
      id: "5",
      firstName: "Alex",
      lastName: "Brown",
      email: "alex.brown@example.com",
      avatar: "/img/avatar-demo.png",
      status: "declined",
      addedAt: new Date("2024-01-20"),
    },
    {
      id: "6",
      firstName: "Emma",
      lastName: "Davis",
      email: "emma.davis@example.com",
      avatar:
        "/avatars/avatar-aec0cc4b-2077-4821-920a-b28403ed7799-1749145483983-722039292.jpeg",
      status: "pending",
      addedAt: new Date("2024-03-10"),
    },
  ]);

  // Filter events based on the selected filter
  const filteredEvents = (() => {
    if (eventFilter === "created") {
      return events.filter((event) => event.userId === user.id);
    }
    if (eventFilter === "invited") {
      return [
        ...events.filter((event) => event.userId !== user.id),
        ...invitations,
      ];
    }
    // For "all", combine both events and invitations
    return [...events, ...invitations];
  })();

  // Filter contacts based on the selected filter
  const filteredContacts = (() => {
    if (contactFilter === "all") {
      return contacts;
    }
    return contacts.filter((contact) => contact.status === contactFilter);
  })();

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
      console.error("Error accepting invitation:", error);
    } finally {
      setIsAddingEvent(null);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      setIsEditing(false);
      window.location.reload(); // Force a full page refresh to get the new data
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Clear cached user data from sessionStorage
        sessionStorage.removeItem("user");
        router.replace("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAvatarChange = (newAvatarUrl: string) => {
    setUserData((prev) => ({ ...prev, avatar: newAvatarUrl }));
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
                <AvatarUpload
                  currentAvatar={userData.avatar}
                  onAvatarChange={handleAvatarChange}
                />
                <CardTitle className="mt-4">
                  {userData.firstName} {userData.lastName}
                </CardTitle>
                <CardDescription>{userData.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userData.createdAt && (
                  <p>
                    Created:{" "}
                    {new Date(userData.createdAt).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      timeZone: "UTC",
                    })}
                  </p>
                )}
                {userData.updatedAt && (
                  <p>
                    Last updated:{" "}
                    {new Date(userData.updatedAt).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      timeZone: "UTC",
                    })}
                  </p>
                )}
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
                        value={userData.firstName}
                        onChange={(e) =>
                          setUserData({
                            ...userData,
                            firstName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Last Name</label>
                      <Input
                        value={userData.lastName}
                        onChange={(e) =>
                          setUserData({
                            ...userData,
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
                      value={userData.email}
                      onChange={(e) =>
                        setUserData({ ...userData, email: e.target.value })
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

            {/* Events, Notifications, and Contacts */}
            <Tabs defaultValue="events" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
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
                <TabsTrigger
                  value="contacts"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Contacts
                </TabsTrigger>
              </TabsList>
              <TabsContent value="events">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Your Events</CardTitle>
                        <CardDescription>
                          Events you&apos;ve created or are participating in.
                        </CardDescription>
                      </div>
                      <Select
                        value={eventFilter}
                        onValueChange={(value: "all" | "created" | "invited") =>
                          setEventFilter(value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter events" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Events</SelectItem>
                          <SelectItem value="created">
                            Created Events
                          </SelectItem>
                          <SelectItem value="invited">
                            Invited Events
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {filteredEvents.map((event) => (
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
                                  {new Date(event.startTime).toLocaleDateString(
                                    "en-GB",
                                    {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                      timeZone: "UTC",
                                    },
                                  )}
                                  at{" "}
                                  {new Date(event.startTime).toLocaleTimeString(
                                    "en-GB",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                      timeZone: "UTC",
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
                        {filteredEvents.length === 0 && (
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
                                  {new Date(event.startTime).toLocaleDateString(
                                    "en-GB",
                                    {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                      timeZone: "UTC",
                                    },
                                  )}
                                  at{" "}
                                  {new Date(event.startTime).toLocaleTimeString(
                                    "en-GB",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                      timeZone: "UTC",
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
                                  Invitation accepted!
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
                                      Accepting...
                                    </>
                                  ) : (
                                    "Accept Invitation"
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
              <TabsContent value="contacts">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Your Contacts</CardTitle>
                        <CardDescription>
                          People you can invite to events and collaborate with.
                        </CardDescription>
                      </div>
                      <Select
                        value={contactFilter}
                        onValueChange={(
                          value: "all" | "active" | "pending" | "declined",
                        ) => setContactFilter(value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter contacts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Contacts</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {filteredContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between rounded-lg border p-4"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <Image
                                  src={contact.avatar}
                                  alt={`${contact.firstName} ${contact.lastName}`}
                                  width={48}
                                  height={48}
                                  className="rounded-full object-cover"
                                />
                                <div
                                  className={`absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white ${
                                    contact.status === "active"
                                      ? "bg-green-500"
                                      : contact.status === "pending"
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                />
                              </div>
                              <div>
                                <h3 className="font-medium">
                                  {contact.firstName} {contact.lastName}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                  {contact.email}
                                </p>
                                <div className="text-muted-foreground mt-1 flex items-center text-xs">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                      contact.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : contact.status === "pending"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {contact.status === "active"
                                      ? "Active"
                                      : contact.status === "pending"
                                        ? "Pending"
                                        : "Declined"}
                                  </span>
                                  <span className="ml-2">
                                    Added{" "}
                                    {contact.addedAt.toLocaleDateString(
                                      "en-GB",
                                      {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      },
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {contact.status === "active" && (
                                <Select>
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Actions" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* Options will be filled later */}
                                  </SelectContent>
                                </Select>
                              )}
                              {contact.status === "declined" && (
                                <>
                                  <Button variant="outline" size="sm">
                                    Resend Invite
                                  </Button>
                                  <Button variant="destructive" size="sm">
                                    Remove
                                  </Button>
                                </>
                              )}
                              {/* Pending contacts have no actions */}
                            </div>
                          </div>
                        ))}
                        {filteredContacts.length === 0 && (
                          <div className="text-muted-foreground py-8 text-center">
                            <Users className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
                            <p>No contacts yet.</p>
                            <Button variant="link" className="mt-2">
                              Add your first contact
                            </Button>
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
