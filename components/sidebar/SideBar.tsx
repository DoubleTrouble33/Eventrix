import { cn } from "@/lib/utils";
import Create from "./Create";
import SideBarCalendar from "./SideBarCalendar";
import SearchUsers from "./SearchUsers";
import MyCalendars from "./MyCalendars";

export default function SideBar() {
  return (
    <aside
      className={cn(
        "hidden w-92 border-t px-2 py-3 transition-all duration-300 ease-in-out lg:block",
      )}
    >
      <Create />
      <SideBarCalendar />
      <SearchUsers />
      <MyCalendars />
    </aside>
  );
}
