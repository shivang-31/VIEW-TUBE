// models/Playlist.js
import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Playlist", playlistSchema);
