"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

const categories = [
  "All",
  "Music",
  "Gaming",
  "Movies",
  "News",
  "Sports",
  "Technology",
  "Comedy",
  "Education",
  "Science",
  "Travel",
  "Food",
  "Fashion",
];

export default function CategoryTabs() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { theme } = useTheme();

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant={activeCategory === category ? "default" : "secondary"}
          className={`whitespace-nowrap transition-colors ${
            activeCategory === category
              ? theme === 'dark' 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-black text-white hover:bg-gray-800'
              : theme === 'dark'
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
