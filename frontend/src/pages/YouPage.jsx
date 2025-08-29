import React from "react";
import WatchHistory from "./WatchHistory";
import { PlayList } from "./PlayList";
function YouPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">You</h1>

      {/* History Section */}
      <WatchHistory />

      {/* Playlist Section */}
      <PlayList />
    </div>
  );
}

export default YouPage;
