// src/pages/Home.jsx
import { useEffect, useState } from "react";
import VideoCard from "../Component/VideoCard";

const Home = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    async function fetchVideos() {
      try {
        console.log("Fetching videos...");
        const response = await fetch(
          "http://localhost:3000/api/videos?page=1&limit=10"
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log(data.videos);

        setVideos(data.videos); // ✅ FIXED
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      }
    }

    fetchVideos();
  }, []);

  return (
   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
  {videos.length > 0 ? (
    videos.map((video) => (
      <VideoCard
        key={video._id}
        videoId={video._id}
        title={video.title}
        thumbnail={video.thumbnail}
      />
    ))
  ) : (
    <p className="text-gray-400">No videos found.</p>
  )}
</div>

  );
};

export default Home;
