"use clinet";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useTheme } from "./ThemeProvider";

const videos = "/video/vdo.mp4";
export default function VideoCard({ video }: any) {
  const { theme } = useTheme();
  
  return (
    <Link href={`/watch/${video?._id}`} className="group">
      <div className="space-y-3">
        <div className={`relative aspect-video rounded-lg overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <video
            src={`${process.env.BACKEND_URL}/${video?.filepath}`}
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
            10:24
          </div>
        </div>
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback>{video?.videochanel[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-sm line-clamp-2 group-hover:text-blue-600 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {video?.videotitle}
            </h3>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {video?.videochanel}
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {video?.views.toLocaleString()} views •{" "}
              {formatDistanceToNow(new Date(video?.createdAt))} ago
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
