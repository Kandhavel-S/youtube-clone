import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";
import { useTheme } from "@/components/ThemeProvider";
import { Suspense } from "react";

export default function Home() {
  const { theme } = useTheme();

  return (
    <main className={`flex-1 p-4 transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <CategoryTabs />
      <Suspense fallback={
        <div className={`text-center py-8 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Loading videos...
        </div>
      }>
        <Videogrid />
      </Suspense>
    </main>
  );
}
