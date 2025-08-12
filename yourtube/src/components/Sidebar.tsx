import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  History,
  User,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "./ThemeProvider";

const Sidebar = () => {
  const { user } = useUser();
  const { theme } = useTheme();

  const [isdialogeopen, setisdialogeopen] = useState(false);
  return (
    <aside className={`w-64 border-r min-h-screen p-2 transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <nav className="space-y-1">
        <Link href="/">
          <Button 
            variant="ghost" 
            className={`w-full justify-start transition-colors ${
              theme === 'dark' 
                ? 'text-gray-200 hover:bg-gray-700 hover:text-white' 
                : 'text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5 mr-3" />
            Home
          </Button>
        </Link>
        <Link href="/explore">
          <Button 
            variant="ghost" 
            className={`w-full justify-start transition-colors ${
              theme === 'dark' 
                ? 'text-gray-200 hover:bg-gray-700 hover:text-white' 
                : 'text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Compass className="w-5 h-5 mr-3" />
            Explore
          </Button>
        </Link>
        <Link href="/groups">
          <Button 
            variant="ghost" 
            className={`w-full justify-start transition-colors ${
              theme === 'dark' 
                ? 'text-gray-200 hover:bg-gray-700 hover:text-white' 
                : 'text-gray-800 hover:bg-gray-100'
            }`}
          >
            <PlaySquare className="w-5 h-5 mr-3" />
            Groups
          </Button>
        </Link>

        {user && (
          <>
            <div className={`border-t pt-2 mt-2 ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <Link href="/history">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-200 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <History className="w-5 h-5 mr-3" />
                  History
                </Button>
              </Link>
              <Link href="/liked">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-200 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5 mr-3" />
                  Liked videos
                </Button>
              </Link>
              <Link href="/watch-later">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-200 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Clock className="w-5 h-5 mr-3" />
                  Watch later
                </Button>
              </Link>
              {user?.channelname ? (
                <Link href={`/channel/${user.id}`}>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-200 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-5 h-5 mr-3" />
                    Your channel
                  </Button>
                </Link>
              ) : (
                <div className="px-2 py-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className={`w-full transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-white hover:bg-gray-500' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => setisdialogeopen(true)}
                  >
                    Create Channel
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
    </aside>
  );
};

export default Sidebar;
