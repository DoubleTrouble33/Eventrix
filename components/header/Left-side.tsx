import { Menu } from "lucide-react";
import { Button } from "../ui/button";

export default function LeftSide() {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center lg:flex">
        <Button variant="ghost" className="rounded-full p-2">
          <Menu className="size-6"></Menu>
        </Button>
      </div>
    </div>
  );
}
