import LeftSide from "./Left-side";
import RightSide from "./Right-side";

export default function Header() {
  return (
    <div className="mx-3 flex items-center justify-between py-4">
      <LeftSide />
      <RightSide />
    </div>
  );
}
