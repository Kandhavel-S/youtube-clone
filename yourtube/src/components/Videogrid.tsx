import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";
import { useTheme } from "./ThemeProvider";

const Videogrid = () => {
  const { theme } = useTheme();
  const [videos, setvideo] = useState<any>(null);
  const [loading, setloading] = useState(true);
  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        setvideo(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, []);

  // const videos = [
  //   {
  //     _id: "1",
  //     videotitle: "Amazing Nature Documentary",
  //     filename: "nature-doc.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/vdo.mp4",
  //     filesize: "908KB",
  //     videochanel: "Nature Channel",
  //     Like: 1250,
  //     views: 45000,
  //     uploader: "nature_lover",
  //     createdAt: new Date().toISOString(),
  //   }
  // ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {loading ? (
        <div className={`col-span-full text-center py-8 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Loading...
        </div>
      ) : (
        videos?.map((video: any) => <Videocard key={video._id} video={video} />)
      )}
    </div>
  );
};

export default Videogrid;
