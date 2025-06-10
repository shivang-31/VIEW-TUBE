import mongoose from 'mongoose';

const videoWatchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  duration: { type: Number, required: true }, // Watched time in seconds
  watchedAt: { type: Date, default: Date.now }
});

export default mongoose.model('VideoWatch', videoWatchSchema);
