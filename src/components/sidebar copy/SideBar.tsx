"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useCategoryStore } from "@/lib/store";
import { EventPopover } from "../ui/event-popover";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useDateStore } from "@/lib/store";
import { Input } from "@/components/ui/input";

interface SideBarProps {
  className?: string; // Optional className prop for styling
}

const SideBar: React.FC<SideBarProps> = ({ className }) => {
  const [showEventPopover, setShowEventPopover] = useState(false);
  const [isCalendarsExpanded, setIsCalendarsExpanded] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const {
    initialized,
    categories,
    selectedCategory,
    selectCategory,
    addCategory,
    initialize,
  } = useCategoryStore();
  const { userSelectedDate } = useDateStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });
      setNewCategoryName("");
      setNewCategoryColor("#3B82F6");
      setShowNewCategory(false);
    }
  };

  // Mini calendar data
  const currentDate = dayjs();
  const daysInMonth = Array.from(
    { length: currentDate.daysInMonth() },
    (_, i) => i + 1,
  );
  const firstDayOfMonth = currentDate.startOf("month").day(); // 0 = Sunday
  const blanks = Array(firstDayOfMonth).fill(null);

  const weeks = [];
  const allDays = [...blanks, ...daysInMonth];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  // If store is not initialized yet, show loading state
  if (!initialized) {
    return (
      <aside className="flex h-screen w-64 flex-col border-r bg-white p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-full rounded bg-gray-200" />
          <div className="h-32 w-full rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-24 rounded bg-gray-200" />
            <div className="h-8 w-full rounded bg-gray-200" />
            <div className="h-8 w-full rounded bg-gray-200" />
            <div className="h-8 w-full rounded bg-gray-200" />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r bg-white p-4",
        className,
      )}
    >
      <div className="mb-6">
        <Button
          onClick={() => setShowEventPopover(true)}
          className="flex w-full items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </div>

      {/* Mini Calendar */}
      <div className="mb-6">
        <div className="mb-2 text-sm font-medium">
          {currentDate.format("MMMM YYYY")}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
            <div key={day} className="text-gray-500">
              {day}
            </div>
          ))}
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((day, dayIndex) => {
                if (day === null) return <div key={dayIndex} />;
                const isToday = currentDate.date() === day;
                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full",
                      isToday && "bg-blue-600 text-white",
                    )}
                  >
                    {day}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => setIsCalendarsExpanded(!isCalendarsExpanded)}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <span>My Calendars</span>
            {isCalendarsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewCategory(true)}
            className="h-6 px-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isCalendarsExpanded && (
          <div className="space-y-2">
            <button
              onClick={() => selectCategory(null)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-4 w-4 items-center justify-center rounded border border-gray-300">
                  {selectedCategory === null && (
                    <Check className="h-3 w-3 text-gray-600" />
                  )}
                </div>
                <span className="text-sm">All Categories</span>
              </div>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => selectCategory(category.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-4 w-4 items-center justify-center rounded border"
                    style={{
                      borderColor: category.color,
                      backgroundColor:
                        selectedCategory === category.id
                          ? category.color
                          : "transparent",
                    }}
                  >
                    {selectedCategory === category.id && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm">{category.name}</span>
                </div>
              </button>
            ))}

            {/* New Category Form */}
            {showNewCategory && (
              <form
                onSubmit={handleAddCategory}
                className="space-y-2 rounded-lg border p-2"
              >
                <Input
                  type="text"
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="text-sm"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="h-8 w-8"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewCategory(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {showEventPopover && (
        <EventPopover
          selectedDate={userSelectedDate}
          onClose={() => setShowEventPopover(false)}
        />
      )}
    </aside>
  );
};

export default SideBar;
