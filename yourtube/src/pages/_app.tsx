import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { useRouter } from "next/router";

function AppContent({ Component, pageProps }: { Component: any; pageProps: any }) {
  const router = useRouter();
  const { theme } = useTheme();
  
  // Pages that don't need sidebar (like standalone groups pages)
  const fullPageRoutes = ['/groups'];
  const isFullPage = fullPageRoutes.includes(router.pathname);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'dark bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <title>Your-Tube Clone</title>
      <Toaster />
      
      {isFullPage ? (
        // Full page layout for groups
        <Component {...pageProps} />
      ) : (
        // Default layout with header and sidebar
        <>
          <Header />
          <div className="flex">
            <Sidebar />
            <Component {...pageProps} />
          </div>
        </>
      )}
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ThemeProvider>
        <AppContent Component={Component} pageProps={pageProps} />
      </ThemeProvider>
    </UserProvider>
  );
}
