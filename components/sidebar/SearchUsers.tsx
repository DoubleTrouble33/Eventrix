import { HiOutlineUsers } from "react-icons/hi";
import { Input } from "../ui/input";

export default function SearchUsers() {
  return (
    <div className="relative">
      <HiOutlineUsers className="absolute top-3 left-2.5 h-4 w-4 text-slate-600" />
      <Input
        type="search"
        placeholder="Search for people"
        className="focus-visible:ring-ring w-full rounded-lg border-0 bg-slate-100 pl-7 placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
      />
    </div>
  );
}
