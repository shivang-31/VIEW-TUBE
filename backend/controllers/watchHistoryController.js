import WatchHistory from "../models/watchHistory.js";

export const getWatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await WatchHistory.find({ user: userId })
      .sort({ watchedAt: -1 })
      .populate("video");

    res.status(200).json({ history });
  } catch (err) {
    console.error("Error getting watch history:", err);
    res.status(500).json({ message: "Server error" });
  }
};



export const deleteHistoryVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    const videoId = req.params.videoId;

    await WatchHistory.findOneAndDelete({ user: userId, video: videoId });

    res.status(200).json({ message: "Deleted video from watch history" });
  } catch (err) {
    console.error("Error deleting from watch history:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const clearWatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    await WatchHistory.deleteMany({ user: userId });

    res.status(200).json({ message: "Watch history cleared" });
  } catch (err) {
    console.error("Error clearing watch history:", err);
    res.status(500).json({ message: "Server error" });
  }
};

