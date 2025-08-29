import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true // Improves query performance
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true // Improves query performance
    },
    notificationPreference: {
      type: String,
      enum: ["all", "highlights", "none"],
      default: "all"
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
      index: true // Helps with sorting
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for unique subscriptions
subscriptionSchema.index(
  { subscriber: 1, channel: 1 },
  { unique: true, name: "unique_subscription" }
);

// Index for channel-focused queries
subscriptionSchema.index(
  { channel: 1, subscribedAt: -1 },
  { name: "channel_subscribers" }
);

// Virtual for subscriber count (can be used in aggregations)
subscriptionSchema.virtual('subscriberCount', {
  ref: 'Subscription',
  localField: 'channel',
  foreignField: 'channel',
  count: true
});

// Middleware to update counters
subscriptionSchema.post('save', async function(doc) {
  await mongoose.model('Channel').findByIdAndUpdate(doc.channel, {
    $inc: { subscriberCount: 1 }
  });
  
  await mongoose.model('User').findByIdAndUpdate(doc.subscriber, {
    $inc: { subscriptionCount: 1 },
    $addToSet: { subscribedChannels: doc.channel }
  });
});

subscriptionSchema.post('remove', async function(doc) {
  await mongoose.model('Channel').findByIdAndUpdate(doc.channel, {
    $inc: { subscriberCount: -1 }
  });
  
  await mongoose.model('User').findByIdAndUpdate(doc.subscriber, {
    $inc: { subscriptionCount: -1 },
    $pull: { subscribedChannels: doc.channel }
  });
});

// Static method for bulk operations
subscriptionSchema.statics = {
  async getSubscriberCount(channelId) {
    return this.countDocuments({ channel: channelId });
  },
  
  async getSubscribedChannels(userId) {
    return this.find({ subscriber: userId })
      .populate('channel', 'name avatar subscriberCount')
      .sort('-subscribedAt');
  }
};

// Query helper for filtering
subscriptionSchema.query.bySubscriber = function(userId) {
  return this.where({ subscriber: userId });
};

subscriptionSchema.query.byChannel = function(channelId) {
  return this.where({ channel: channelId });
};

export default mongoose.models?.Subscription || 
       mongoose.model("Subscription", subscriptionSchema);