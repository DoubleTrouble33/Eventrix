"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEventStore } from "@/lib/store";
import { CalendarEventType } from "@/types/calendar";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategoryStore } from "@/lib/store";

interface EventPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventPopover({ open, onOpenChange }: EventPopoverProps) {
  const { addEvent } = useEventStore();
  const { categories } = useCategoryStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>();
  const [categoryId, setCategoryId] = useState<string>("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && date && categoryId && startTime && endTime) {
      const newEvent: CalendarEventType = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        date: format(date, "yyyy-MM-dd"),
        startTime,
        endTime,
        categoryId,
      };
      addEvent(newEvent);
      onOpenChange(false);
      setTitle("");
      setDate(undefined);
      setCategoryId("");
      setStartTime("");
      setEndTime("");
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="hidden">
          <Calendar className="mr-2 h-4 w-4" />
          Pick a date
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Event Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Create Event
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
