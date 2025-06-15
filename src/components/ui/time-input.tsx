"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface TimeInputProps {
  value: string; // Format: "HH:MM"
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  required?: boolean;
}

export function TimeInput({
  value,
  onChange,
  className,
  id,
  required,
}: TimeInputProps) {
  // Parse current value
  const { hours, minutes } = useMemo(() => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      return {
        hours: h.padStart(2, "0"),
        minutes: m.padStart(2, "0"),
      };
    }
    return { hours: "00", minutes: "00" };
  }, [value]);

  // Handle hour change
  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minutes}`);
  };

  // Handle minute change
  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hours}:${newMinute}`);
  };

  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  // Generate minute options (00, 05, 10, ..., 55)
  const minuteOptions = Array.from({ length: 12 }, (_, i) =>
    (i * 5).toString().padStart(2, "0"),
  );

  return (
    <div className={`flex gap-2 ${className}`} id={id}>
      <Select
        value={hours}
        onValueChange={handleHourChange}
        required={required}
      >
        <SelectTrigger className="w-20 text-gray-900 dark:text-white">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hourOptions.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="flex items-center text-lg font-medium text-gray-900 dark:text-white">
        :
      </span>

      <Select
        value={minutes}
        onValueChange={handleMinuteChange}
        required={required}
      >
        <SelectTrigger className="w-20 text-gray-900 dark:text-white">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((minute) => (
            <SelectItem key={minute} value={minute}>
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
