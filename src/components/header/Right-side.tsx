"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useViewStore, useThemeStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Bell,
  Shield,
  Check,
  X,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Invitation {
  id: string;
  eventId: string;
  eventTitle: string;
  hostName: string;
  viewed: boolean;
}

interface ContactRequest {
  id: string;
  type: "contact_request";
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  fromUserAvatar: string;
  message: string;
  createdAt: string;
  viewed: boolean;
}

export default function RightSide() {
  const { setView } = useViewStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
    isAdmin?: boolean;
  } | null>(null);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Function to fetch notifications manually
  const fetchNotifications = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      // Fetch count of unviewed invitations
      const countResponse = await fetch(
        `/api/users/${user.id}/invitations/count?viewed=false`,
        {
          credentials: "include",
        },
      );
      const countData = await countResponse.json();

      // Fetch contact requests
      const contactRequestsResponse = await fetch(
        `/api/users/${user.id}/notifications/contact-requests`,
        {
          credentials: "include",
        },
      );
      const contactRequestsData = await contactRequestsResponse.json();

      // Calculate total unviewed count
      const totalUnviewedCount =
        countData.count +
        (contactRequestsData?.filter((req: ContactRequest) => !req.viewed)
          .length || 0);
      setUnviewedCount(totalUnviewedCount);

      // Fetch preview of invitations
      const previewResponse = await fetch(
        `/api/users/${user.id}/invitations/preview`,
        {
          credentials: "include",
        },
      );
      const previewData = await previewResponse.json();
      setInvitations(previewData || []);
      setContactRequests(contactRequestsData || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch notifications initially when user is loaded
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      // Clear cached user data from sessionStorage
      sessionStorage.removeItem("user");
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const goToProfile = (openNotifications = false) => {
    if (user) {
      router.push(
        `/user/${user.id}${openNotifications ? "?tab=notifications" : ""}`,
      );
    }
  };

  const markInvitationsAsViewed = async () => {
    if (!user) return;

    try {
      // Mark all unviewed invitations as viewed
      await fetch(`/api/users/${user.id}/invitations/mark-viewed`, {
        method: "POST",
        credentials: "include",
      });

      // Refresh notifications to get updated counts and data
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking invitations as viewed:", error);
    }
  };

  const handleAcceptInvitation = async (eventId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}/invitations/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to accept invitation");
      }

      // Refresh notifications to update counts and lists
      await fetchNotifications();

      // Refresh the page to update the calendar events
      window.location.reload();
    } catch (error) {
      console.error("Error accepting invitation:", error);
    }
  };

  const handleDeclineInvitation = async (eventId: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `/api/users/${user.id}/invitations/decline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId }),
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to decline invitation");
      }

      // Refresh notifications to update counts and lists
      await fetchNotifications();
    } catch (error) {
      console.error("Error declining invitation:", error);
    }
  };

  const handleAcceptContactRequest = async (notificationId: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `/api/users/${user.id}/notifications/contact-requests/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationId }),
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to accept contact request");
      }

      // Refresh notifications to update counts and lists
      await fetchNotifications();
    } catch (error) {
      console.error("Error accepting contact request:", error);
    }
  };

  const handleDeclineContactRequest = async (notificationId: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `/api/users/${user.id}/notifications/contact-requests/decline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationId }),
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to decline contact request");
      }

      // Refresh notifications to update counts and lists
      await fetchNotifications();
    } catch (error) {
      console.error("Error declining contact request:", error);
    }
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex items-center gap-4">
      <Select onValueChange={setView}>
        <SelectTrigger className="w-24 focus-visible:ring-0 focus-visible:ring-offset-0">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="day">Day</SelectItem>
        </SelectContent>
      </Select>

      <DropdownMenu onOpenChange={(open) => open && markInvitationsAsViewed()}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            onClick={(e) => e.preventDefault()}
          >
            <Bell className="h-5 w-5" />
            {unviewedCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unviewedCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          {/* Refresh Button */}
          <div className="border-b p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2"
              onClick={fetchNotifications}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh notifications"}
            </Button>
          </div>

          {invitations?.length > 0 || contactRequests?.length > 0 ? (
            <>
              {/* Contact Requests */}
              {contactRequests?.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-2 border-b p-3 last:border-b-0"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Contact Request</p>
                    <p className="text-muted-foreground text-xs">
                      {request.fromUserName} wants to connect with you
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptContactRequest(request.id);
                      }}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeclineContactRequest(request.id);
                      }}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}

              {/* Event Invitations */}
              {invitations?.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col gap-2 border-b p-3 last:border-b-0"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {invitation.eventTitle}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Invited by {invitation.hostName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptInvitation(invitation.eventId);
                      }}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeclineInvitation(invitation.eventId);
                      }}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-center"
                onClick={() => goToProfile(true)}
              >
                View all notifications
              </DropdownMenuItem>
            </>
          ) : (
            <div className="text-muted-foreground p-4 text-center text-sm">
              No new notifications
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="relative text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      {user?.isAdmin && (
        <Button
          variant="ghost"
          className="gap-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
          onClick={() => router.push("/admin")}
        >
          <Shield className="h-4 w-4" />
          Admin Dashboard
        </Button>
      )}

      <div className="flex items-center gap-2">
        {user && (
          <span
            className={`text-sm font-medium ${user.isAdmin ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}
          >
            {user.firstName} {user.lastName}
            {user.isAdmin && (
              <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400"></span>
            )}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => goToProfile()}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
