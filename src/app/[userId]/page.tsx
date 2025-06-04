"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

// Dummy data for now
const dummyUser = {
  id: "123",
  email: "john.doe@example.com",
  username: "johndoe",
  firstName: "John",
  lastName: "Doe",
  avatar: "/img/avatar-demo.png",
  notifications: [
    { id: 1, message: "New event invitation", time: "2 hours ago" },
    { id: 2, message: "Event reminder: Team Meeting", time: "1 day ago" },
    { id: 3, message: "Your event was updated", time: "2 days ago" },
  ],
  events: [
    { id: 1, title: "Team Meeting", date: "2024-03-20", time: "10:00 AM" },
    { id: 2, title: "Project Review", date: "2024-03-22", time: "2:00 PM" },
    { id: 3, title: "Client Call", date: "2024-03-25", time: "11:00 AM" },
  ],
};

export default function UserProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(dummyUser);

  const handleSaveChanges = () => {
    // TODO: Implement save changes logic
    setIsEditing(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Link href="/">
          <Image
            src="/img/Eventrix.svg"
            alt="Eventrix Logo"
            width={120}
            height={40}
            className="cursor-pointer transition-transform hover:scale-105"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col pt-24">
        {/* Top Section - User Info */}
        <div className="mb-12 w-full border-b border-gray-200 p-6">
          <div className="mx-auto max-w-2xl rounded-lg bg-gray-200 p-8">
            <div className="mb-8 flex flex-col items-center">
              <div className="relative mb-4">
                <Image
                  src={userData.avatar}
                  alt="Profile"
                  width={150}
                  height={150}
                  className="rounded-full border-4 border-white shadow-lg"
                  priority
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-0 bottom-0 rounded-full"
                  onClick={() => {
                    /* TODO: Implement avatar change */
                  }}
                >
                  Change
                </Button>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {userData.firstName} {userData.lastName}
              </h1>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={userData.email}
                    onChange={(e) =>
                      setUserData({ ...userData, email: e.target.value })
                    }
                    disabled={!isEditing}
                    className="flex-1 bg-white"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={userData.username}
                    onChange={(e) =>
                      setUserData({ ...userData, username: e.target.value })
                    }
                    disabled={!isEditing}
                    className="flex-1 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <Input
                    value={userData.firstName}
                    onChange={(e) =>
                      setUserData({ ...userData, firstName: e.target.value })
                    }
                    disabled={!isEditing}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <Input
                    value={userData.lastName}
                    onChange={(e) =>
                      setUserData({ ...userData, lastName: e.target.value })
                    }
                    disabled={!isEditing}
                    className="bg-white"
                  />
                </div>
              </div>

              {isEditing && (
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Notifications and Events */}
        <div className="flex flex-1 justify-center">
          <div className="flex w-full max-w-6xl gap-8">
            {/* Left Column - Notifications */}
            <div className="w-1/2 rounded-lg bg-gray-200 p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Notifications
              </h2>
              <ScrollArea className="h-[calc(100vh-24rem)]">
                <div className="space-y-4">
                  {userData.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-lg bg-white p-4 shadow-sm transition-all hover:bg-gray-50"
                    >
                      <p className="text-sm text-gray-900">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {notification.time}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right Column - Events */}
            <div className="w-1/2 rounded-lg bg-gray-200 p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Your Events
              </h2>
              <ScrollArea className="h-[calc(100vh-24rem)]">
                <div className="space-y-4">
                  {userData.events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg bg-white p-4 shadow-sm transition-all hover:bg-gray-50"
                    >
                      <h3 className="font-medium text-gray-900">
                        {event.title}
                      </h3>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>{event.date}</p>
                        <p>{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
