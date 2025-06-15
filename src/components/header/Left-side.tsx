"use client";

import { Menu, Globe2, Lock } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import {
  useDateStore,
  useToggleSideBarStore,
  useViewStore,
  usePublicPrivateToggleStore,
} from "@/lib/store";
import dayjs from "dayjs";

export default function LeftSide() {
  const todaysDate = dayjs();
  const { userSelectedDate, setDate, setMonth, selectedMonthIndex } =
    useDateStore();
  const { setSideBarOpen } = useToggleSideBarStore();
  const { selectedView } = useViewStore();
  const { isPublicView, toggleView } = usePublicPrivateToggleStore();

  const handleTodayClick = () => {
    switch (selectedView) {
      case "month":
        setMonth(dayjs().month());
        break;
      case "week":
        setDate(todaysDate);
        break;
      case "day":
        setDate(todaysDate);
        setMonth(dayjs().month());
        break;
      default:
        break;
    }
  };

  const handlePrevClick = () => {
    switch (selectedView) {
      case "month":
        setMonth(selectedMonthIndex - 1);
        break;
      case "week":
        setDate(userSelectedDate.subtract(1, "week"));
        break;
      case "day":
        setDate(userSelectedDate.subtract(1, "day"));
        break;
      default:
        break;
    }
  };

  const handleNextClick = () => {
    switch (selectedView) {
      case "month":
        setMonth(selectedMonthIndex + 1);
        break;
      case "week":
        setDate(userSelectedDate.add(1, "week"));
        break;
      case "day":
        setDate(userSelectedDate.add(1, "day"));
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center lg:flex">
        <Button
          variant="ghost"
          className="rounded-full p-2 text-gray-700 hover:cursor-pointer hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          onClick={() => setSideBarOpen()}
        >
          <Menu className="size-6"></Menu>
        </Button>

        <Link
          href="/"
          className="group relative mr-2 inline-block"
          style={{ borderRadius: "8px" }}
        >
          <Image
            src={"/img/Eventrix.svg"}
            width={100}
            height={50}
            alt="company logo"
            priority
            className="rounded-lg"
          />
          <span
            className="pointer-events-none absolute bottom-0 left-0 mt-1 h-[3px] w-full origin-left scale-x-0 bg-orange-500 transition-transform duration-300 group-hover:scale-x-100"
            aria-hidden="true"
          />
        </Link>

        <h1 className="text-xl text-gray-900 dark:text-white">Calendar</h1>
      </div>
      {/* Today Button */}
      <Button
        className="border-gray-300 text-gray-700 hover:cursor-pointer hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
        variant="outline"
        onClick={handleTodayClick}
      >
        Today
      </Button>
      {/* Navigation Controls */}
      <div className="flex items-center gap-3">
        <MdKeyboardArrowLeft
          className="size-6 cursor-pointer font-bold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          onClick={handlePrevClick}
        />
        <MdKeyboardArrowRight
          className="size-6 cursor-pointer font-bold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          onClick={handleNextClick}
        />
      </div>

      {/* Public/Private Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleView}
        className={`flex items-center gap-2 transition-colors ${
          isPublicView
            ? "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30"
            : "border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
        }`}
      >
        {isPublicView ? (
          <>
            <Globe2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-700 dark:text-green-300">
              PUBLIC
            </span>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-700 dark:text-blue-300">
              PRIVATE
            </span>
          </>
        )}
      </Button>

      {/* Current Month and Year Display */}
      <h1 className="hidden text-xl text-gray-900 lg:block dark:text-white">
        {dayjs(new Date(dayjs().year(), selectedMonthIndex)).format(
          "MMMM YYYY",
        )}
      </h1>
    </div>
  );
}
