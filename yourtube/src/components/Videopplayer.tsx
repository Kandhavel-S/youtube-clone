"use client";

import { useRef, useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";
import Link from "next/link";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();
  const [subscription, setSubscription] = useState<any>(null);
  const [watchTime, setWatchTime] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !subscription) return;

    const handleTimeUpdate = () => {
      const currentTime = Math.floor(videoElement.currentTime / 60); // Convert to minutes
      const timeDiff = currentTime - lastUpdateTime;
      
      if (timeDiff >= 1) { // Update every minute
        setWatchTime(prev => prev + timeDiff);
        setLastUpdateTime(currentTime);
        
        // Update watch time on server
        updateWatchTime(timeDiff);
        
        // Check if user has reached their limit
        if (subscription.watchTimeLimit > 0) {
          const totalWatchTime = subscription.monthlyWatchTime + watchTime + timeDiff;
          if (totalWatchTime >= subscription.watchTimeLimit) {
            setIsBlocked(true);
            videoElement.pause();
            toast.error('You have reached your monthly watch time limit. Please upgrade your plan.');
          }
        }
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [subscription, watchTime, lastUpdateTime]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axiosInstance.get('/subscription/status');
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const updateWatchTime = async (minutes: number) => {
    try {
      await axiosInstance.post('/subscription/watch-time', {
        videoId: video._id,
        watchTime: minutes
      });
    } catch (error) {
      console.error('Error updating watch time:', error);
    }
  };

  if (isBlocked) {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-white p-8">
          <h3 className="text-xl font-bold mb-4">Watch Time Limit Reached</h3>
          <p className="mb-4">You've reached your monthly watch time limit.</p>
          <p className="mb-6">Upgrade to continue watching unlimited content!</p>
          <Link href="/subscription">
            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">
              Upgrade Plan
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster={`/placeholder.svg?height=480&width=854`}
      >
        <source
          src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${video?.filepath}`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
