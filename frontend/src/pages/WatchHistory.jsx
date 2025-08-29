import { useEffect, useState } from "react";
import VideoCard from "../Component/VideoCard";

export default function WatchHistory() {
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchHistory = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/history", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          credentials: "include", // send cookies if needed
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (Array.isArray(data.history)) setWatchHistory(data.history);
        else console.error("Unexpected watch history format:", data);

      } catch (err) {
        console.error("Failed to fetch watch history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchHistory();
  }, []);

  return (
    <div>
      <h2>Watch History</h2>
      {loading ? (
        <p>Loading...</p>
      ) : watchHistory.length === 0 ? (
        <p>No watch history found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {watchHistory.map((video) => (
            <li key={video._id}>
              <VideoCard
                videoId={video._id}
                title={video.title}
                thumbnail={video.thumbnail}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
