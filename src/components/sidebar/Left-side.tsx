"use client";

import { useState } from "react";
import { useCalendarStore } from "@/lib/store";
import { Button } from "../ui/button";
import {
  ChevronDown,
  ChevronUp,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { useDateStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LeftSide() {
  const {
    calendars,
    addCalendar,
    selectedCalendars,
    toggleCalendar,
    deleteCalendar,
    updateCalendar,
    setSelectedCalendars,
  } = useCalendarStore();
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarColor, setNewCalendarColor] = useState("#000000");
  const [editingCalendar, setEditingCalendar] = useState<{
    id: string;
    name: string;
    color: string;
  } | null>(null);
  const { currentDate } = useDateStore();

  const handleAddCalendar = () => {
    if (newCalendarName.trim()) {
      addCalendar({ name: newCalendarName.trim(), color: newCalendarColor });
      setNewCalendarName("");
      setNewCalendarColor("#000000");
      setIsAddingCalendar(false);
    }
  };

  const handleEditCalendar = (calendar: {
    id: string;
    name: string;
    color: string;
  }) => {
    setEditingCalendar(calendar);
  };

  const handleSaveEdit = () => {
    if (editingCalendar && editingCalendar.name.trim()) {
      updateCalendar(editingCalendar.id, {
        name: editingCalendar.name.trim(),
        color: editingCalendar.color,
      });
      setEditingCalendar(null);
    }
  };

  const handleCalendarClick = (e: React.MouseEvent, calendarId: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCalendar(calendarId);
  };

  // Generate calendar grid
  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = currentDate.startOf("month").day();
  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDayOfMonth + 1;
    return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
  });

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Calendars</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedCalendars.length === calendars.length) {
                  // If all are selected, deselect all
                  setSelectedCalendars([]);
                } else {
                  // Otherwise, select all
                  setSelectedCalendars(calendars.map((cal) => cal.id));
                }
              }}
              className="text-xs"
            >
              {selectedCalendars.length === calendars.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
          <div className="space-y-2">
            {calendars.map((calendar) => (
              <div
                key={calendar.id}
                className={cn(
                  "flex items-center justify-between rounded-lg p-2",
                  selectedCalendars.includes(calendar.id)
                    ? "bg-gray-100"
                    : "hover:bg-gray-100",
                )}
              >
                <div
                  className="flex flex-1 cursor-pointer items-center gap-2"
                  onClick={(e) => handleCalendarClick(e, calendar.id)}
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: calendar.color }}
                  />
                  {editingCalendar?.id === calendar.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editingCalendar.name}
                        onChange={(e) =>
                          setEditingCalendar({
                            ...editingCalendar,
                            name: e.target.value,
                          })
                        }
                        className="h-6 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="color"
                        value={editingCalendar.color}
                        onChange={(e) =>
                          setEditingCalendar({
                            ...editingCalendar,
                            color: e.target.value,
                          })
                        }
                        className="h-6 w-6 cursor-pointer rounded border"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        size="sm"
                        className="h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit();
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <span>{calendar.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedCalendars.includes(calendar.id) && (
                    <Check className="h-4 w-4" />
                  )}
                  {!calendar.isDefault && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCalendar(calendar);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCalendar(calendar.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setIsAddingCalendar(!isAddingCalendar)}
          >
            {isAddingCalendar ? (
              <ChevronUp className="mr-2 h-4 w-4" />
            ) : (
              <ChevronDown className="mr-2 h-4 w-4" />
            )}
            Add Calendar
          </Button>
          {isAddingCalendar && (
            <div className="mt-2 space-y-2 rounded-lg border p-2">
              <Input
                placeholder="Calendar name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCalendarColor}
                  onChange={(e) => setNewCalendarColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleAddCalendar}
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mini Calendar */}
        <div className="mt-4">
          <div className="mb-2">
            <h3 className="text-sm font-medium">
              {currentDate.format("MMMM YYYY")}
            </h3>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="py-1 font-medium text-gray-500">
                {day}
              </div>
            ))}
            {days.map((day, index) => (
              <div
                key={index}
                className={cn(
                  "cursor-pointer rounded py-1 hover:bg-gray-100",
                  day === currentDate.date() && "bg-blue-100",
                )}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
