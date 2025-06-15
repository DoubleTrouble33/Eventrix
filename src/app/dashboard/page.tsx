"use client";

import Header from "@/components/header/Header";
import MainView from "@/components/MainView";
import { useEffect } from "react";
import { useCategoryStore, useThemeStore } from "@/lib/store";
import { EventProvider } from "@/components/EventProvider";

export default function DashboardPage() {
  const { categories, selectedCategories } = useCategoryStore();
  const { isDarkMode } = useThemeStore();

  // Ensure store is properly initialized
  useEffect(() => {
    if (categories === undefined || selectedCategories === undefined) {
      useCategoryStore.setState({
        categories: [
          { id: "personal", name: "Personal", color: "#3B82F6" },
          { id: "work", name: "Work", color: "#10B981" },
          { id: "fitness", name: "Fitness", color: "#EF4444" },
        ],
        selectedCategories: [],
      });
    }
  }, [categories, selectedCategories]);

  return (
    <EventProvider>
      <div className={isDarkMode ? "dark" : ""}>
        <div className="min-h-screen bg-white transition-colors duration-200 dark:bg-gray-900">
          <Header />
          <MainView />
        </div>
      </div>
    </EventProvider>
  );
}
