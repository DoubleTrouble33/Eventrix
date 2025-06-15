import LeftSide from "./Left-side";
import RightSide from "./Right-side";

export default function Header() {
  return (
    <div className="mx-3 flex items-center justify-between border-b border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900">
      <LeftSide />
      <RightSide />
    </div>
  );
}
