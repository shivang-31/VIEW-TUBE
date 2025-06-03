import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscribedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Adds createdAt, updatedAt
);

// Prevent duplicate subscriptions
subscriptionSchema.index(
  { subscriber: 1, subscribedTo: 1 }, 
  { unique: true }
);

export default mongoose.models.Subscription || 
       mongoose.model("Subscription", subscriptionSchema);