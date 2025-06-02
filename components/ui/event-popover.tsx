import { useState } from "react";
import { useEventStore } from "@/lib/store";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";
import { Button } from "./button";
import { X } from "lucide-react";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

interface EventPopoverProps {
  selectedDate: dayjs.Dayjs;
  onClose: () => void;
}

export function EventPopover({ selectedDate, onClose }: EventPopoverProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { events, setEvents, closePopover } = useEventStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    const newEvent = {
      id: nanoid(),
      title: title.trim(),
      description: description.trim(),
      date: selectedDate,
    };

    setEvents([...events, newEvent]);
    closePopover();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-lg font-semibold">
          Create Event: {selectedDate.format("MMMM D, YYYY")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium">
              Event Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              className="w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium">
              Description
            </label>
            <ScrollArea className="h-32 w-full rounded-md border">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter event description"
                className="min-h-[8rem] w-full resize-none border-0 p-4 focus:outline-none"
              />
            </ScrollArea>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 