"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useViewStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { User, LogOut, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Invitation {
  id: string;
  eventTitle: string;
  hostName: string;
  viewed: boolean;
}

export default function RightSide() {
  const { setView } = useViewStore();
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  } | null>(null);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

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
      }
    };

    fetchUser();
  }, []);

  // Fetch invitations count and preview
  useEffect(() => {
    const fetchInvitations = async () => {
      if (!user) return;

      try {
        // Fetch count of unviewed invitations
        const countResponse = await fetch(
          `/api/users/${user.id}/invitations/count?viewed=false`,
          {
            credentials: "include",
          },
        );
        const countData = await countResponse.json();
        setUnviewedCount(countData.count);

        // Fetch preview of invitations
        const previewResponse = await fetch(
          `/api/users/${user.id}/invitations/preview`,
          {
            credentials: "include",
          },
        );
        const previewData = await previewResponse.json();
        setInvitations(previewData.invitations);
      } catch (error) {
        console.error("Error fetching invitations:", error);
      }
    };

    // Fetch initially and then every minute
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
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

      // Update the unviewed count to 0 since we just viewed them all
      setUnviewedCount(0);

      // Refetch invitations preview to get updated data
      const previewResponse = await fetch(
        `/api/users/${user.id}/invitations/preview`,
        {
          credentials: "include",
        },
      );
      const previewData = await previewResponse.json();
      setInvitations(previewData.invitations);
    } catch (error) {
      console.error("Error marking invitations as viewed:", error);
    }
  };

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
            className="relative"
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
        <DropdownMenuContent align="end" className="w-64">
          {invitations.length > 0 ? (
            <>
              {invitations.map((invitation) => (
                <DropdownMenuItem
                  key={invitation.id}
                  className="cursor-pointer"
                  onClick={() => goToProfile(true)}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {invitation.eventTitle}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Invited by {invitation.hostName}
                    </p>
                  </div>
                </DropdownMenuItem>
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
            <div className="p-4 text-center text-sm text-gray-500">
              No new notifications
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-12 w-12 rounded-full">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={user?.avatar || "/img/avatar-demo.png"}
                alt={`${user?.firstName} ${user?.lastName}`}
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/img/avatar-demo.png";
                }}
              />
              <AvatarFallback>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuItem onClick={() => goToProfile()}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
