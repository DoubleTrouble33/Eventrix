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
