"use client";

import { useState, useEffect } from "react";
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
  UserPlus,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { EventDetails } from "@/components/ui/event-details";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { ContactHoverCard } from "@/components/ui/contact-hover-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface ContactGroup {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
}

interface ContactData {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  status: string;
  addedAt: string;
}

interface GroupData {
  name: string;
  color: string;
  memberIds: string[];
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
  const searchParams = useSearchParams();

  // Get initial tab from URL query parameter
  const getInitialTab = () => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["events", "notifications", "contacts", "invite"].includes(tabParam)
    ) {
      return tabParam;
    }
    return "events";
  };

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

  // Group management state
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#3B82F6");
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupColor, setEditGroupColor] = useState("#3B82F6");

  // Contacts data from database
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Contact invitation state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

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

  // Filter contacts based on the selected filter and group
  const filteredContacts = (() => {
    let filtered = contacts;

    // Filter by status first
    if (contactFilter !== "all") {
      filtered = filtered.filter((contact) => contact.status === contactFilter);
    }

    // Then filter by selected group if any
    if (selectedGroup) {
      const group = groups.find((g) => g.id === selectedGroup);
      if (group) {
        filtered = filtered.filter((contact) =>
          group.memberIds.includes(contact.id),
        );
      }
    }

    return filtered;
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

  // Database functions
  const loadContacts = async () => {
    try {
      setIsLoadingContacts(true);
      const response = await fetch("/api/user/contacts", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }

      const data = await response.json();
      const contactsData = data.contacts || { organized: {}, unorganized: {} };

      // Convert unorganized contacts to Contact array
      const contactsArray: Contact[] = Object.entries(
        contactsData.unorganized || {},
      ).map(([id, contact]) => {
        const contactData = contact as ContactData;
        return {
          id,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          avatar: contactData.avatar,
          status: contactData.status as "active" | "pending" | "declined",
          addedAt: new Date(contactData.addedAt),
        };
      });

      // Convert organized groups to ContactGroup array
      const groupsArray: ContactGroup[] = Object.entries(
        contactsData.organized || {},
      ).map(([id, group]) => {
        const groupData = group as GroupData;
        return {
          id,
          name: groupData.name,
          color: groupData.color,
          memberIds: groupData.memberIds,
        };
      });

      setContacts(contactsArray);
      setGroups(groupsArray);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const saveContacts = async (
    updatedGroups?: ContactGroup[],
    updatedContacts?: Contact[],
  ) => {
    try {
      const currentContacts = updatedContacts || contacts;
      const currentGroups = updatedGroups || groups;

      // Convert contacts array back to database format
      const unorganized: { [key: string]: ContactData } = {};
      currentContacts.forEach((contact) => {
        unorganized[contact.id] = {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          avatar: contact.avatar,
          status: contact.status,
          addedAt: contact.addedAt.toISOString(),
        };
      });

      // Convert groups array back to database format
      const organized: { [key: string]: GroupData } = {};
      currentGroups.forEach((group) => {
        organized[group.id] = {
          name: group.name,
          color: group.color,
          memberIds: group.memberIds,
        };
      });

      console.log("Saving contacts to database:", { organized, unorganized });

      const response = await fetch("/api/user/contacts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contacts: {
            organized,
            unorganized,
          },
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Save failed:", errorData);
        throw new Error("Failed to save contacts");
      }

      console.log("Successfully saved contacts to database");
    } catch (error) {
      console.error("Error saving contacts:", error);
    }
  };

  // Load contacts on component mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Search for users to invite
  const searchUsers = async (query: string, showAll: boolean = false) => {
    if (!showAll && query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // If showAll is true or query is empty, search for all users
      const searchQuery = showAll && query.trim().length === 0 ? "*" : query;
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const users = await response.json();
        // Filter out current user but keep all others (including existing contacts)
        const filteredUsers = users.filter((u: User) => u.id !== user.id);
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add user as contact (simplified - just add to contacts without complex invitation system)
  const addUserAsContact = async (targetUser: User) => {
    setSendingInvite(targetUser.id);
    try {
      // Check if user is already a contact (prevent duplicates)
      const existingContact = contacts.find(
        (contact) => contact.email === targetUser.email,
      );
      if (existingContact) {
        console.log("User is already a contact, skipping addition");
        return;
      }

      // Create a new contact entry
      const newContact: Contact = {
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        avatar: targetUser.avatar || "/img/avatar-demo.png",
        status: "active", // Simplified - no pending status
        addedAt: new Date(),
      };

      // Add to contacts list
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);

      // Save to database
      await saveContacts(groups, updatedContacts);

      // Remove user from search results
      setSearchResults((prev) => prev.filter((u) => u.id !== targetUser.id));

      console.log("✅ Contact added successfully");
    } catch (error) {
      console.error("Error adding contact:", error);
    } finally {
      setSendingInvite(null);
    }
  };

  // Toggle invitation mode

  // Handle search input change with debouncing
  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, contacts]);

  // Helper function to check if user is already in contacts
  const isUserInContacts = (userId: string) => {
    // Find the user in search results to get their email
    const searchUser = searchResults.find((u) => u.id === userId);
    if (!searchUser) return false;

    // Check if this user's email is already in contacts
    const found = contacts.some(
      (contact) => contact.email === searchUser.email,
    );

    console.log("🔍 Contact check:", {
      searchingUserId: userId,
      searchUserEmail: searchUser.email,
      found: found,
    });

    return found;
  };

  // Helper function to get contact status
  const getContactStatus = (userId: string) => {
    // Find the user in search results to get their email
    const searchUser = searchResults.find((u) => u.id === userId);
    if (!searchUser) return null;

    // Find contact by email
    const contact = contacts.find((c) => c.email === searchUser.email);
    return contact?.status || null;
  };

  // Helper function to get the most recent groups for a contact
  const getContactRecentGroups = (contactId: string) => {
    // Find all groups that contain this contact
    const contactGroups = groups.filter((group) =>
      group.memberIds.includes(contactId),
    );

    // Return the last 3 groups (most recent additions)
    // Since we don't have timestamps for when users were added to groups,
    // we'll use the group creation order as a proxy
    return contactGroups.slice(-3).reverse();
  };

  // Group management functions
  const handleAddGroup = async () => {
    if (newGroupName.trim()) {
      const newGroup: ContactGroup = {
        id: Math.random().toString(36).substr(2, 9),
        name: newGroupName.trim(),
        color: newGroupColor,
        memberIds: [],
      };
      const updatedGroups = [...groups, newGroup];
      setGroups(updatedGroups);
      setNewGroupName("");
      setNewGroupColor("#3B82F6");
      setIsAddingGroup(false);

      // Save to database with updated groups
      await saveContacts(updatedGroups, contacts);
    }
  };

  const handleEditGroup = (group: ContactGroup) => {
    setEditingGroup(group.id);
    setEditGroupName(group.name);
    setEditGroupColor(group.color);
  };

  const handleSaveGroupEdit = async () => {
    if (editingGroup && editGroupName.trim()) {
      const updatedGroups = groups.map((group) =>
        group.id === editingGroup
          ? { ...group, name: editGroupName.trim(), color: editGroupColor }
          : group,
      );
      setGroups(updatedGroups);
      setEditingGroup(null);
      setEditGroupName("");
      setEditGroupColor("#3B82F6");

      // Save to database with updated groups
      await saveContacts(updatedGroups, contacts);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const updatedGroups = groups.filter((group) => group.id !== groupId);
    setGroups(updatedGroups);

    // If the deleted group was selected, clear selection
    if (selectedGroup === groupId) {
      setSelectedGroup(null);
    }

    // Save to database with updated groups
    await saveContacts(updatedGroups, contacts);
  };

  const handleAddToGroup = async (contactId: string, groupId: string) => {
    const updatedGroups = groups.map((group) => {
      if (group.id === groupId) {
        const isAlreadyInGroup = group.memberIds.includes(contactId);
        if (isAlreadyInGroup) {
          // Remove from group
          return {
            ...group,
            memberIds: group.memberIds.filter((id) => id !== contactId),
          };
        } else {
          // Add to group
          return { ...group, memberIds: [...group.memberIds, contactId] };
        }
      }
      return group;
    });

    setGroups(updatedGroups);

    // Save to database with updated groups
    await saveContacts(updatedGroups, contacts);
  };

  const handleRemoveContact = async (contactId: string) => {
    try {
      // Find the contact to get their email
      const contactToRemove = contacts.find(
        (contact) => contact.id === contactId,
      );
      if (!contactToRemove) {
        console.error("Contact not found");
        return;
      }

      // Call the mutual removal API
      const response = await fetch("/api/user/contacts/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactEmail: contactToRemove.email,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove contact");
      }

      // Remove contact from local state
      const updatedContacts = contacts.filter(
        (contact) => contact.id !== contactId,
      );

      // Also remove from any groups they might be in
      const updatedGroups = groups.map((group) => ({
        ...group,
        memberIds: group.memberIds.filter((id) => id !== contactId),
      }));

      setContacts(updatedContacts);
      setGroups(updatedGroups);

      // Save the updated groups to database
      await saveContacts(updatedGroups, updatedContacts);

      console.log(
        "✅ Contact removed from both users and all groups successfully",
      );
    } catch (error) {
      console.error("Error removing contact:", error);
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

                {/* Contact Groups Section - Only show when contacts tab is active */}
                {activeTab === "contacts" && (
                  <div className="border-t pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-medium">Contact Groups</h3>
                      {selectedGroup && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setSelectedGroup(null)}
                        >
                          Show All
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <div
                          key={group.id}
                          className={`flex items-center justify-between rounded-lg border p-2 transition-colors hover:bg-gray-50 ${
                            selectedGroup === group.id
                              ? "border-blue-200 bg-blue-50"
                              : ""
                          }`}
                        >
                          <div
                            className="flex flex-1 cursor-pointer items-center gap-2"
                            onClick={() =>
                              setSelectedGroup(
                                selectedGroup === group.id ? null : group.id,
                              )
                            }
                          >
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            {editingGroup === group.id ? (
                              <div className="flex flex-1 items-center gap-2">
                                <Input
                                  value={editGroupName}
                                  onChange={(e) =>
                                    setEditGroupName(e.target.value)
                                  }
                                  className="h-6 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <input
                                  type="color"
                                  value={editGroupColor}
                                  onChange={(e) =>
                                    setEditGroupColor(e.target.value)
                                  }
                                  className="h-6 w-6 cursor-pointer rounded border"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveGroupEdit();
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm font-medium">
                                {group.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              {group.memberIds.length}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-gray-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32">
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditGroup(group);
                                  }}
                                >
                                  <Pencil className="mr-2 h-3 w-3" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteGroup(group.id);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-3 w-3" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full justify-start"
                      onClick={() => setIsAddingGroup(!isAddingGroup)}
                    >
                      <Users className="mr-2 h-3 w-3" />
                      Add Group
                    </Button>
                    {isAddingGroup && (
                      <div className="mt-2 space-y-2 rounded-lg border p-2">
                        <Input
                          placeholder="Group name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={newGroupColor}
                            onChange={(e) => setNewGroupColor(e.target.value)}
                            className="h-6 w-6 cursor-pointer rounded border"
                          />
                          <Button
                            size="sm"
                            className="h-6 flex-1 text-xs"
                            onClick={handleAddGroup}
                          >
                            Create
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
            <Tabs
              value={activeTab}
              defaultValue="events"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-4">
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
                <TabsTrigger value="invite" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Users
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
                        <CardTitle>
                          {selectedGroup
                            ? `${groups.find((g) => g.id === selectedGroup)?.name} Group`
                            : "Your Contacts"}
                        </CardTitle>
                        <CardDescription>
                          {selectedGroup
                            ? `Members of the ${groups.find((g) => g.id === selectedGroup)?.name} group.`
                            : "People you can invite to events and collaborate with."}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
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
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {isLoadingContacts ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Loading contacts...</span>
                          </div>
                        ) : (
                          filteredContacts.map((contact) => (
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
                                  <ContactHoverCard
                                    contact={contact}
                                    onRemove={handleRemoveContact}
                                  >
                                    <h3 className="font-medium">
                                      {contact.firstName} {contact.lastName}
                                    </h3>
                                  </ContactHoverCard>
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
                                  {/* Recent Groups for this contact */}
                                  {(() => {
                                    const recentGroups = getContactRecentGroups(
                                      contact.id,
                                    );
                                    return recentGroups.length > 0 ? (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {recentGroups.map((group) => (
                                          <div
                                            key={group.id}
                                            className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs"
                                          >
                                            <div
                                              className="h-1.5 w-1.5 rounded-full"
                                              style={{
                                                backgroundColor: group.color,
                                              }}
                                            />
                                            <span className="font-medium">
                                              {group.name}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {contact.status === "active" && (
                                  <Select
                                    value="" // Always reset to empty to show placeholder
                                    onValueChange={(value) => {
                                      if (value.startsWith("group-")) {
                                        const groupId = value.replace(
                                          "group-",
                                          "",
                                        );
                                        handleAddToGroup(contact.id, groupId);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-[140px]">
                                      <SelectValue placeholder="Manage Groups" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {groups.map((group) => {
                                        const isInGroup =
                                          group.memberIds.includes(contact.id);
                                        return (
                                          <SelectItem
                                            key={group.id}
                                            value={`group-${group.id}`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="h-2 w-2 rounded-full"
                                                style={{
                                                  backgroundColor: group.color,
                                                }}
                                              />
                                              <span>
                                                {isInGroup
                                                  ? "Remove from"
                                                  : "Add to"}{" "}
                                                {group.name}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                      {groups.length === 0 && (
                                        <SelectItem value="no-groups" disabled>
                                          No groups available
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                )}
                                {contact.status === "pending" && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveContact(contact.id)
                                    }
                                  >
                                    Remove
                                  </Button>
                                )}
                                {contact.status === "declined" && (
                                  <>
                                    <Button variant="outline" size="sm">
                                      Resend Invite
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveContact(contact.id)
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        {!isLoadingContacts &&
                          filteredContacts.length === 0 && (
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
              <TabsContent value="invite">
                <Card>
                  <CardHeader>
                    <CardTitle>Invite Users</CardTitle>
                    <CardDescription>
                      Search for users and add them to your contacts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Input
                        placeholder="Search users by name or email... (Press Enter on empty field to see all users)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (searchQuery.trim() === "") {
                              searchUsers("", true);
                            } else {
                              searchUsers(searchQuery);
                            }
                          }
                        }}
                        className="w-full"
                      />
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {isSearching && (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span className="ml-2">Searching users...</span>
                            </div>
                          )}
                          {searchResults.map((searchUser) => (
                            <div
                              key={searchUser.id}
                              className="flex items-center justify-between rounded-lg border p-4"
                            >
                              <div className="flex items-center space-x-4">
                                <Image
                                  src={
                                    searchUser.avatar || "/img/avatar-demo.png"
                                  }
                                  alt={`${searchUser.firstName} ${searchUser.lastName}`}
                                  width={48}
                                  height={48}
                                  className="rounded-full object-cover"
                                />
                                <div>
                                  <h3 className="font-medium">
                                    {searchUser.firstName} {searchUser.lastName}
                                  </h3>
                                  <p className="text-muted-foreground text-sm">
                                    {searchUser.email}
                                  </p>
                                </div>
                              </div>
                              {(() => {
                                const contactStatus = getContactStatus(
                                  searchUser.id,
                                );
                                const isInContacts = isUserInContacts(
                                  searchUser.id,
                                );

                                if (isInContacts) {
                                  return (
                                    <div className="flex flex-col gap-1">
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          // Find the contact by email to get the correct contact ID
                                          const contact = contacts.find(
                                            (c) => c.email === searchUser.email,
                                          );
                                          if (contact)
                                            handleRemoveContact(contact.id);
                                        }}
                                        disabled={
                                          sendingInvite === searchUser.id
                                        }
                                      >
                                        Remove Contact
                                      </Button>
                                      <span className="text-muted-foreground text-xs capitalize">
                                        Status: {contactStatus}
                                      </span>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        addUserAsContact(searchUser)
                                      }
                                      disabled={sendingInvite === searchUser.id}
                                    >
                                      {sendingInvite === searchUser.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Adding...
                                        </>
                                      ) : (
                                        "Add Contact"
                                      )}
                                    </Button>
                                  );
                                }
                              })()}
                            </div>
                          ))}
                          {!isSearching &&
                            searchQuery &&
                            searchResults.length === 0 && (
                              <div className="text-muted-foreground py-8 text-center">
                                <p>
                                  No users found matching &quot;{searchQuery}
                                  &quot;
                                </p>
                              </div>
                            )}
                          {!searchQuery && searchResults.length === 0 && (
                            <div className="text-muted-foreground py-8 text-center">
                              <UserPlus className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
                              <p>Start typing to search for users...</p>
                              <p className="mt-2 text-sm">
                                💡 Tip: Press Enter on empty field to see all
                                users
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
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
