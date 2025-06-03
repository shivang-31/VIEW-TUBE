import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  watchedAt: {
    type: Date,
    default: Date.now,
  },
});

// Optional: index for fast lookups
watchHistorySchema.index({ user: 1, watchedAt: -1 });

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
export default WatchHistory;
