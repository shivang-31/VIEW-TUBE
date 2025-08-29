import mongoose from 'mongoose';

const videoDailyViewsSchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  date: {
    type: String, // Format: "YYYY-MM-DD"
    required: true
  },
  viewCount: {
    type: Number,
    default: 1
  }
});

// Indexes
videoDailyViewsSchema.index({ video: 1, date: -1 });
videoDailyViewsSchema.index({ date: 1, viewCount: -1 });

const VideoDailyViews = mongoose.model('VideoDailyViews', videoDailyViewsSchema);
export default VideoDailyViews;
