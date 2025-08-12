import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "./ThemeProvider";
import axiosInstance from "@/lib/axiosinstance";

const VideoInfo = ({ video }: any) => {
  const { user } = useUser();
  const { theme } = useTheme();
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

 
  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
  }, [video]);

  useEffect(() => {
    const handleviews = async () => {
      if (user) {
        try {
          return await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } catch (error) {
          return console.log(error);
        }
      } else {
        return await axiosInstance.post(`/history/views/${video?._id}`);
      }
    };
    handleviews();
  }, [user]);

  // Fetch subscription status and subscriber count
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        // Get subscriber count
        const countRes = await axiosInstance.get(`/channel-subscription/count/${video.videochanel}`);
        if (countRes.data.success) {
          setSubscriberCount(countRes.data.subscriberCount);
        }

        // Check if user is subscribed (only if user is logged in)
        if (user) {
          const statusRes = await axiosInstance.get(`/channel-subscription/status/${video.videochanel}`);
          if (statusRes.data.success) {
            setIsSubscribed(statusRes.data.isSubscribed);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    };

    if (video.videochanel) {
      fetchSubscriptionData();
    }
  }, [video.videochanel, user]);

  const handleSubscribe = async () => {
    if (!user) {
      alert("Please login to subscribe to channels");
      return;
    }

    try {
      if (isSubscribed) {
        // Unsubscribe
        const res = await axiosInstance.delete(`/channel-subscription/unsubscribe/${video.videochanel}`);
        if (res.data.success) {
          setIsSubscribed(false);
          setSubscriberCount(prev => prev - 1);
        }
      } else {
        // Subscribe
        const res = await axiosInstance.post("/channel-subscription/subscribe", {
          channelId: video.videochanel,
          channelName: video.videochanel
        });
        if (res.data.success) {
          setIsSubscribed(true);
          setSubscriberCount(prev => prev + 1);
        }
      }
    } catch (error: any) {
      console.error("Error handling subscription:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  };
  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.liked) {
        if (isLiked) {
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        } else {
          setlikes((prev: any) => prev + 1);
          setIsLiked(true);
          if (isDisliked) {
            setDislikes((prev: any) => prev - 1);
            setIsDisliked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleWatchLater = async () => {
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleDislike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (!res.data.liked) {
        if (isDisliked) {
          setDislikes((prev: any) => prev - 1);
          setIsDisliked(false);
        } else {
          setDislikes((prev: any) => prev + 1);
          setIsDisliked(true);
          if (isLiked) {
            setlikes((prev: any) => prev - 1);
            setIsLiked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="space-y-4">
      <h1 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        {video.videotitle}
      </h1>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video.videochanel[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {video.videochanel}
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {subscriberCount.toLocaleString()} subscribers
            </p>
          </div>
          <Button 
            className={`ml-4 ${
              isSubscribed 
                ? (theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white')
                : (theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white')
            }`}
            onClick={handleSubscribe}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-full`}>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full"
              onClick={handleLike}
            >
              <ThumbsUp
                className={`w-5 h-5 mr-2 ${
                  isLiked ? (theme === 'dark' ? "fill-white text-white" : "fill-black text-black") : ""
                }`}
              />
              {likes.toLocaleString()}
            </Button>
            <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full"
              onClick={handleDislike}
            >
              <ThumbsDown
                className={`w-5 h-5 mr-2 ${
                  isDisliked ? (theme === 'dark' ? "fill-white text-white" : "fill-black text-black") : ""
                }`}
              />
              {dislikes.toLocaleString()}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-full ${
              isWatchLater ? "text-primary" : ""
            }`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-full`}
          >
            <Share className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-full`}
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-full`}
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-4`}>
        <div className={`flex gap-4 text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
          <span>{video.views.toLocaleString()} views</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
        </div>
        <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          <p>
            Sample video description. This would contain the actual video
            description from the database.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={`mt-2 p-0 h-auto font-medium ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'}`}
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default VideoInfo;
