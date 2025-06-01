import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";

export default function LeftSide() {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center lg:flex">
        <Button
          variant="ghost"
          className="rounded-full p-2 hover:cursor-pointer"
        >
          <Menu className="size-6"></Menu>
        </Button>
        <Link href="/" className="mr-2">
          <Image
            src={"/img/Eventrix-logo.svg"}
            width={150}
            height={50}
            alt="company logo"
          />
        </Link>

        <h1 className="text-xl">Calendar</h1>
      </div>
      {/* Today Button */}
      <Button className="hover:cursor-pointer" variant="outline">
        Today
      </Button>
      {/* Navigation Controls */}

      {/* Current Month and Year Display */}
    </div>
  );
}
