"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();
  const today = new Date();
  const [user, setUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
  } | null>(null);

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

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUser(null);
        router.replace("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Function to style weekends
  const isDayWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="absolute inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-sm">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <Image
              src="/img/eventrix.svg"
              alt="Eventrix Logo"
              width={120}
              height={40}
              className="cursor-pointer transition-transform hover:scale-105"
            />
          </div>
          <div className="hidden space-x-4 lg:flex lg:flex-1 lg:justify-end">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus-visible:outline-none">
                    <Avatar className="cursor-pointer hover:opacity-80">
                      <AvatarImage src="/img/avatar-demo.png" />
                      <AvatarFallback>
                        {user
                          ? `${user.firstName[0]}${user.lastName[0]}`
                          : "AV"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => user && router.push(`/user/${user.id}`)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Log in <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => router.push("/register")}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <div className="relative isolate pt-18">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          ></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-10 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Seamless Event Planning & Scheduling
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Transform your event management experience with Eventrix. Our
              intuitive platform helps you plan, schedule, and organize events
              with precision and ease.
            </p>
          </div>
        </div>

        {/* Calendar and Preview Section */}
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left Side - Calendar */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200">
                <div className="mb-3 flex items-center gap-3 border-b pb-3">
                  <CalendarIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-medium text-gray-900">
                    Calendar Preview
                  </h3>
                </div>
                <div className="px-1.5">
                  <Calendar
                    mode="single"
                    selected={today}
                    className="w-full select-none"
                    modifiers={{ weekend: isDayWeekend }}
                    modifiersStyles={{
                      weekend: { color: "#60a5fa" },
                    }}
                    classNames={{
                      months: "flex flex-col space-y-4",
                      month: "space-y-3",
                      caption:
                        "flex justify-between pt-1 relative items-center",
                      caption_label: "text-sm font-medium text-gray-900",
                      nav: "flex items-center gap-1",
                      nav_button: cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      ),
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full",
                      head_cell:
                        "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-indigo-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 w-9",
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                      day_selected:
                        "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white rounded-full",
                      day_today: "bg-indigo-100 text-indigo-600 font-semibold",
                      day_outside: "text-gray-400 opacity-50",
                      day_disabled: "text-gray-400 opacity-50",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-white/80 shadow-lg">
                  <div className="text-center">
                    <CalendarIcon className="mx-auto mb-3 h-12 w-12 text-indigo-600" />
                    <p className="text-lg text-gray-600">
                      Dashboard Preview Coming Soon
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <Button
                    size="lg"
                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                    onClick={() =>
                      router.push(user ? "/dashboard" : "/register")
                    }
                  >
                    {user ? "Go to Dashboard" : "Get Started"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
