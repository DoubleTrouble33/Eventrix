import { Fragment } from "react";
import MonthViewBox from "./MonthViewBox";
import { useDateStore } from "@/lib/store";

export default function MonthView() {
  const { twoDMonthArray } = useDateStore();
  return (
    <section className="grid grid-cols-7 grid-rows-5 lg:h-[100vh]">
      {twoDMonthArray.map((row, index) => (
        <Fragment key={index}>
          {row.map((day, i) => (
            <MonthViewBox key={i} day={day} rowIndex={index} />
          ))}
        </Fragment>
      ))}
    </section>
  );
}
