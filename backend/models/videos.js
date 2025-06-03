import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true  // Added index for faster user-based queries
  },
  title: {
    type: String,
    required: true,
    text: true  // Enable text search
  },
  description: {
    type: String,
    text: true  // Enable text search
  },
  tags: {
    type: [String],
    index: true  // Added index for tag filtering
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnail: String,
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  views: {
    type: Number,
    default: 0,
    index: true  // Added index for popular videos sorting
  },
  duration: {  // New field recommended for search results
    type: Number,
    default: 0
  },
  visibility: {  // New field recommended
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  category: {  // New field recommended
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true  // Added index for sorting
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,  // Automatic createdAt/updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound text index for better search relevance
videoSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    title: 3,       // Title matches are 3x more important
    description: 1, // Description matches are standard
    tags: 2         // Tag matches are 2x more important
  },
  name: 'video_search_index'  // Custom index name
});

// Virtual for like count (avoids storing duplicate data)
videoSchema.virtual('likeCount').get(function() {
  return this.likes?.length || 0;
});

// Virtual for dislike count
videoSchema.virtual('dislikeCount').get(function() {
  return this.dislikes?.length || 0;
});

// Middleware to update timestamps
videoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Video", videoSchema);