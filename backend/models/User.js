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
  subscribers: {
    type: Number,
    default: 0,
  },
  subscribedTo: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
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
  watchhistory: [{
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
    },
    watchtime: {
      type: Date,
      default: Date.now,
    },
  }],
  videosuploaded:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    default: [],
  }]
});

export default mongoose.model('User', userSchema);