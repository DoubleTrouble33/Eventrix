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
import { Bell, Calendar, User, LogOut, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfileClientProps {
  user: User;
}

export default function UserProfileClient({ user }: UserProfileClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  // Dummy data for notifications and events (you can replace these with real data later)
  const notifications = [
    { id: 1, message: "New event invitation", time: "2 hours ago" },
    { id: 2, message: "Event reminder: Team Meeting", time: "1 day ago" },
    { id: 3, message: "Your event was updated", time: "2 days ago" },
  ];

  const events = [
    { id: 1, title: "Team Meeting", date: "2024-03-20", time: "10:00 AM" },
    { id: 2, title: "Project Review", date: "2024-03-22", time: "2:00 PM" },
    { id: 3, title: "Client Call", date: "2024-03-25", time: "11:00 AM" },
  ];

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
                              <div className="text-muted-foreground mt-1 text-sm">
                                <p>{event.date}</p>
                                <p>{event.time}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      Stay updated with your event invitations and updates.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="flex items-start justify-between rounded-lg border p-4"
                          >
                            <div className="space-y-1">
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-muted-foreground text-xs">
                                {notification.time}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              Mark as Read
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
