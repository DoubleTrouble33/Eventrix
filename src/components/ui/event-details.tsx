import { X, Globe2, Lock, Clock, Tag, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import dayjs from "dayjs";

interface EventDetailsProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    isPublic: boolean;
    categoryId: string;
    hostName?: string;
    hostId?: string;
    isRepeating?: boolean;
    repeatEndDate?: Date;
  };
  onClose: () => void;
}

export function EventDetails({ event, onClose }: EventDetailsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* Header with gradient background */}
        <div className="relative rounded-t-xl bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-1.5 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-2xl font-semibold tracking-tight">
            {event.title}
          </h2>
          {event.hostName && (
            <p className="mt-2 text-sm text-white/80">
              Hosted by {event.hostName}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
              {event.isRepeating ? (
                <Repeat className="mt-0.5 h-5 w-5 text-gray-500" />
              ) : (
                <Clock className="mt-0.5 h-5 w-5 text-gray-500" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">Date & Time</h3>
                <p className="text-sm text-gray-600">
                  {event.isRepeating ? (
                    <>
                      {dayjs(event.startTime).format("MMMM D")} -{" "}
                      {dayjs(event.repeatEndDate).format("MMMM D, YYYY")}
                      <br />
                      {dayjs(event.startTime).format("h:mm A")} -{" "}
                      {dayjs(event.endTime).format("h:mm A")}
                    </>
                  ) : (
                    <>
                      {dayjs(event.startTime).format("MMMM D, YYYY")}
                      <br />
                      {dayjs(event.startTime).format("h:mm A")} -{" "}
                      {dayjs(event.endTime).format("h:mm A")}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Category */}
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
              <Tag className="mt-0.5 h-5 w-5 text-gray-500" />
              <div>
                <h3 className="font-medium text-gray-900">Category</h3>
                <p className="text-sm text-gray-600">{event.categoryId}</p>
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
              {event.isPublic ? (
                <Globe2 className="mt-0.5 h-5 w-5 text-gray-500" />
              ) : (
                <Lock className="mt-0.5 h-5 w-5 text-gray-500" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">Visibility</h3>
                <p className="text-sm text-gray-600">
                  {event.isPublic
                    ? "Public Event - Anyone can find this event"
                    : "Private Event - Only invited guests can see this event"}
                </p>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="rounded-lg bg-gray-50 p-3">
                <h3 className="mb-2 font-medium text-gray-900">Description</h3>
                <ScrollArea className="h-24">
                  <p className="text-sm leading-relaxed text-gray-600">
                    {event.description}
                  </p>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white transition-transform hover:scale-105 hover:shadow-md"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
