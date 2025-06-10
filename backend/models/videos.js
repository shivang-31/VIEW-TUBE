import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    text: true
  },
  description: {
    type: String,
    text: true
  },
  tags: {
    type: [String],
    index: true
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
    index: true
  },
  duration: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public',
    index: true
  },
  category: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound text index
videoSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    title: 3,
    tags: 2,
    description: 1
  },
  name: 'video_search_index'
});

// Virtual fields
videoSchema.virtual('likeCount').get(function () {
  return this.likes?.length || 0;
});

videoSchema.virtual('dislikeCount').get(function () {
  return this.dislikes?.length || 0;
});

// Middleware
videoSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Video = mongoose.model("Video", videoSchema);
export default Video;
