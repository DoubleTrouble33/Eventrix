"use client";

import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { useDateStore, useToggleSideBarStore, useViewStore } from "@/lib/store";
import dayjs from "dayjs";
export default function LeftSide() {
  const todaysDate = dayjs();
  const { userSelectedDate, setDate, setMonth, selectedMonthIndex } =
    useDateStore();

  const { setSideBarOpen } = useToggleSideBarStore();

  const { selectedView } = useViewStore();

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
          className="rounded-full p-2 hover:cursor-pointer"
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

        <h1 className="text-xl">Calendar</h1>
      </div>
      {/* Today Button */}
      <Button
        className="hover:cursor-pointer"
        variant="outline"
        onClick={handleTodayClick}
      >
        Today
      </Button>
      {/* Navigation Controls */}
      <div className="flex items-center gap-3">
        <MdKeyboardArrowLeft
          className="size-6 cursor-pointer font-bold"
          onClick={handlePrevClick}
        />
        <MdKeyboardArrowRight
          className="size-6 cursor-pointer font-bold"
          onClick={handleNextClick}
        />
      </div>

      {/* Current Month and Year Display */}
      <h1 className="hidden text-xl lg:block">
        {dayjs(new Date(dayjs().year(), selectedMonthIndex)).format(
          "MMMM YYYY",
        )}
      </h1>
    </div>
  );
}
