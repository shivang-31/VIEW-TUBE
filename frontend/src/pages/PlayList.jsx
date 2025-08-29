import React, { useEffect, useState } from "react";

export const PlayList = () => {
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ loading state

  useEffect(() => {
    const fetchPlaylist = async () => {
       const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:3000/api/playlist/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
             "Authorization": `Bearer ${token}`,
          },
          credentials: "include", // send cookies if refresh token is httpOnly
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setPlaylist(data.playlist || []);
      } catch (error) {
        console.error("Failed to fetch playlist:", error);
      } finally {
        setLoading(false); // ✅ stop loading after fetch
      }
    };

    fetchPlaylist();
  }, []); // run once on mount

  return (
    <div>
      <h2>My Playlist</h2>
      {loading ? ( // ✅ show loading until data comes
        <p>Loading...</p>
      ) : playlist.length === 0 ? (
        <p>No playlist found.</p>
      ) : (
        <ul>
          {playlist.map((video) => (
            <li key={video._id}>{video.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
