"use client";

import Header from "@/components/header/Header";
import MainView from "@/components/Mainview";
import { useEffect } from "react";
import { useCategoryStore } from "@/lib/store";

export default function Home() {
  const { categories, selectedCategory } = useCategoryStore();

  // Ensure store is properly initialized
  useEffect(() => {
    if (categories === undefined || selectedCategory === undefined) {
      useCategoryStore.setState({
        categories: [
          { id: "personal", name: "Personal", color: "#3B82F6" },
          { id: "work", name: "Work", color: "#10B981" },
          { id: "fitness", name: "Fitness", color: "#EF4444" },
        ],
        selectedCategory: null,
      });
    }
  }, [categories, selectedCategory]);

  return (
    <div className="">
      <Header />
      <MainView />
    </div>
  );
}
