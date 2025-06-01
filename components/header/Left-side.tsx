import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";

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
        <Image
          src={"/img/Eventrix-logo.svg"}
          width={150}
          height={50}
          alt="company logo"
        />
        <h1 className="text-xl">Calendar</h1>
      </div>
      {/* Today Button */}

      {/* Navigation Controls */}

      {/* Current Month and Year Display */}
    </div>
  );
}
