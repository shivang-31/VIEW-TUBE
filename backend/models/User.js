import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: '',
  },
  subscribedTo: [{
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    }
  }],
  subscribedCount: {  // Fixed casing (camelCase)
    type: Number,
    default: 0
  },
  followerCount: {    // 👈 Missing in your original schema!
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    default: [],
  }],
  videosUploaded: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    default: [],
  }]
}, { timestamps: true }); // Adds createdAt/updatedAt automatically

export default mongoose.model('User', userSchema);