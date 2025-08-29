import {SavedVideo} from "../models/Watchlater.js";

// POST /api/videos/save/:videoId
export const saveVideoForLater = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { videoId } = req.params;

    // Check if already saved
    const exists = await SavedVideo.findOne({ user: userId, video: videoId });
    if (exists) {
      return res.status(400).json({ message: "Video already saved" });
    }

    // Save new entry
    const saved = new SavedVideo({ user: userId, video: videoId });
    await saved.save();

    res.status(201).json({ message: "Video saved for later" });
  } catch (err) {
    console.error("Error saving video:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/videos/unsave/:videoId
export const removeSavedVideo = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { videoId } = req.params;

    await SavedVideo.findOneAndDelete({ user: userId, video: videoId });

    res.status(200).json({ message: "Video removed from saved list" });
  } catch (err) {
    console.error("Error removing saved video:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/videos/saved
export const getSavedVideos = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const savedVideos = await SavedVideo.find({ user: userId })
      .populate("video")
      .sort({ savedAt: -1 }); // Newest first

    res.status(200).json(savedVideos);
  } catch (err) {
    console.error("Error fetching saved videos:", err);
    res.status(500).json({ message: "Server error" });
  }
};

