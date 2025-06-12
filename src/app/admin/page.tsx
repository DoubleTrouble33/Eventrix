"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCog, Calendar, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isBlocked: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  userId: string;
  userName: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      const response = await fetch("/api/auth/user");
      const data = await response.json();
      if (!data.user?.isAdmin) {
        router.push("/dashboard");
      } else {
        setIsAdmin(true);
        fetchUsers();
        fetchEvents();
      }
    };
    checkAdmin();
  }, [router]);

  const fetchUsers = async () => {
    const response = await fetch("/api/admin/users");
    const data = await response.json();
    setUsers(data.users);
  };

  const fetchEvents = async () => {
    const response = await fetch("/api/admin/events");
    const data = await response.json();
    setEvents(data.events);
  };

  const toggleUserBlock = async (userId: string, currentStatus: boolean) => {
    await fetch(`/api/admin/users/${userId}/toggle-block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !currentStatus }),
    });
    fetchUsers();
  };

  const deleteEvent = async (eventId: string) => {
    try {
      if (
        !confirm(
          "Are you sure you want to delete this event? This action cannot be undone.",
        )
      ) {
        return;
      }

      setDeletingEventId(eventId);
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      await fetchEvents();
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event. Please try again.");
    } finally {
      setDeletingEventId(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.lastName.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(eventSearch.toLowerCase()),
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Calendar
              </Button>
              <h1 className="text-2xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" className="gap-2">
              <UserCog className="h-4 w-4" />
              Users Management
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              Events Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-6 flex items-center gap-4">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                              user.isBlocked
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant={user.isBlocked ? "default" : "destructive"}
                            size="sm"
                            onClick={() =>
                              toggleUserBlock(user.id, user.isBlocked)
                            }
                          >
                            {user.isBlocked ? "Unblock" : "Block"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-6 flex items-center gap-4">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search events by title..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Start Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        End Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredEvents.map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(event.startTime).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(event.endTime).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteEvent(event.id)}
                            disabled={deletingEventId === event.id}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingEventId === event.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
