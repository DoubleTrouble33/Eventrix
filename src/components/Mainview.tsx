"use client";
import { useViewStore } from "@/lib/store";
import MonthView from "./MonthView";
import { SideBar } from "./sidebar/SideBar";
import WeekView from "./WeekView";
import DayView from "./DayView";

export default function MainView() {
  const { selectedView } = useViewStore();
  return (
    <div className="flex">
      <SideBar />
      <div className="w-full flex-1">
        {selectedView === "month" && <MonthView />}
        {selectedView === "week" && <WeekView />}
        {selectedView === "day" && <DayView />}
      </div>
    </div>
  );
}
