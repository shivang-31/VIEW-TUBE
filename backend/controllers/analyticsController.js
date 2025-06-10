import VideoWatch from "../models/VideoWatch.js";
export const logVideoWatch = async (req, res) => {
  try {
    const { videoId, duration } = req.body;

    if (!videoId || !duration || duration <= 0) {
      return res.status(400).json({ error: "Invalid data" });
    }

    await VideoWatch.create({
      user: req.user._id,
      video: videoId,
      duration
    });

    res.status(201).json({ message: "Watch session logged." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/analytics/video/:id
export const getVideoAnalytics = async (req, res) => {
  try {
    const videoId = req.params.id;

    const [totalWatches, totalDuration, uniqueUsers] = await Promise.all([
      VideoWatch.countDocuments({ video: videoId }),
      VideoWatch.aggregate([
        { $match: { video: mongoose.Types.ObjectId(videoId) } },
        { $group: { _id: null, total: { $sum: "$duration" } } }
      ]),
      VideoWatch.distinct("user", { video: videoId })
    ]);

    res.json({
      videoId,
      totalViewsLogged: totalWatches,
      totalWatchTime: totalDuration[0]?.total || 0,
      uniqueViewers: uniqueUsers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

