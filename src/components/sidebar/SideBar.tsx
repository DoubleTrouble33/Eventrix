"use client";

import { useEffect } from "react";
import { useCategoryStore, useToggleSideBarStore } from "@/lib/store";
import { LeftSide } from "./Left-side";

export function SideBar() {
  const { isSideBarOpen } = useToggleSideBarStore();
  const { categories, selectedCategories, setSelectedCategories } =
    useCategoryStore();

  // Set default selected categories on mount
  useEffect(() => {
    if (selectedCategories.length === 0 && categories.length > 0) {
      // Select all categories by default
      setSelectedCategories(categories.map((cat) => cat.id));
    }
  }, [categories, selectedCategories.length, setSelectedCategories]);

  return (
    <div
      className={`flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 ${
        isSideBarOpen ? "w-64" : "w-0 overflow-hidden"
      }`}
    >
      <div className="flex h-full">
        <LeftSide />
      </div>
    </div>
  );
}
