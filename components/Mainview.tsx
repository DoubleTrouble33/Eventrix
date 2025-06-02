import MonthView from "./MonthView";
import SideBar from "./sidebar/SideBar";

export default function MainView() {
  return (
    <div className="flex">
      <SideBar />

      <div className="w-full flex-1"></div>
      <MonthView />
    </div>
  );
}
