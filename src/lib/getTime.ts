import dayjs from "dayjs";

// Checks if the given day is the current day
export const isCurrentDay = (day: dayjs.Dayjs) => {
  return day.isSame(dayjs(), "day");
};

// Generates a 5x7 matrix representing a month's calendar view
// Each box contains a dayjs object for that date
export const getMonth = (month = dayjs().month()) => {
  const year = dayjs().year();
  // Get the day of week (0-6) for the first day of the month
  const firstDayOfMonth = dayjs().set("month", month).startOf("month").day();

  // Start counter from negative to handle padding days before month start
  let dayCounter = -firstDayOfMonth;

  // Create 5 rows (weeks) of 7 days each
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 7 }, () => dayjs(new Date(year, month, ++dayCounter))),
  );
};

// Generates an array of 7 days starting from the given date's week
// Each day object contains the date, whether it's today, and the isCurrentDay function
export const getWeekDays = (date: dayjs.Dayjs) => {
  const startOfWeek = date.startOf("week");
  const weekDates = [];

  //loop through the 7 days of the week
  for (let i = 0; i < 7; i++) {
    const currentDate = startOfWeek.add(i, "day");
    weekDates.push({
      currentDate,
      today:
        currentDate.toDate().toDateString() === dayjs().toDate().toDateString(),
      isCurrentDay,
    });
  }
  return weekDates;
};

// Array of 24 dayjs objects representing each hour of the day
export const getHours = Array.from({ length: 24 }, (_, i) =>
  dayjs().startOf("day").add(i, "hour"),
);

// Helper function to calculate the top position of an event based on its start time
// Each hour takes 64px (h-16), so we calculate the position within that hour
export const calculateEventTop = (startTime: string): number => {
  const start = dayjs(startTime);
  const hour = start.hour();
  const minutes = start.minute();

  // Each hour is 64px tall, each minute is 64/60 px
  return hour * 64 + (minutes * 64) / 60;
};

// Helper function to calculate the height of an event based on its duration
export const calculateEventHeight = (
  startTime: string,
  endTime: string,
): number => {
  const start = dayjs(startTime);
  const end = dayjs(endTime);
  const durationInMinutes = end.diff(start, "minute");

  // Each minute is 64/60 px (since each hour is 64px)
  return Math.max((durationInMinutes * 64) / 60, 20); // Minimum height of 20px
};
