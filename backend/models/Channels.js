import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // creates a unique index
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      required: true,
      default: 'public',
    },
    avatar: {
      type: String,
      default: '', // Cloudinary image URL
    },
    banner: {
      type: String,
      default: '', // Cloudinary banner URL
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Channel = mongoose.model('Channel', channelSchema);
export default Channel;