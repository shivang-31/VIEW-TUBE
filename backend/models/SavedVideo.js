import mongoose from "mongoose";

const savedVideoSchema = new mongoose.Schema({
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
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate saves (same user saving same video)
savedVideoSchema.index({ user: 1, video: 1 }, { unique: true });

export const SavedVideo = mongoose.model("SavedVideo", savedVideoSchema);
