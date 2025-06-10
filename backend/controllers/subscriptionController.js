import Video from '../models/videos.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// POST /api/subscriptions
export const createSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { creatorId } = req.body;
    const subscriberId = req.user._id;

    // Validation
    if (!creatorId) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Creator ID is required' });
    }

    if (subscriberId.equals(creatorId)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Cannot subscribe to yourself' });
    }

    // Check existing subscription
    const exists = await Subscription.exists({
      subscriberId,
      subscribedToId: creatorId
    }).session(session);

    if (exists) {
      await session.abortTransaction();
      return res.status(409).json({ error: 'Already subscribed' });
    }

    // Transaction: Update both user docs and create subscription
    await User.findByIdAndUpdate(
      subscriberId,
      {
        $addToSet: { subscribedTo: { creatorId, subscribedAt: new Date() } },
        $inc: { subscribedCount: 1 }
      },
      { session }
    );

    const [subscription] = await Subscription.create(
      [{
        subscriberId,
        subscribedToId: creatorId,
        subscribedAt: new Date()
      }],
      { session }
    );

    await User.findByIdAndUpdate(
      creatorId,
      { $inc: { followerCount: 1 } },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json(subscription);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// DELETE /api/subscriptions/:id
export const deleteSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      subscriberId: req.user._id
    }).session(session);

    if (!subscription) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Transaction: Update both user docs
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { subscribedTo: { creatorId: subscription.subscribedToId } },
        $inc: { subscribedCount: -1 }
      },
      { session }
    );

    await User.findByIdAndUpdate(
      subscription.subscribedToId,
      { $inc: { followerCount: -1 } },
      { session }
    );

    await session.commitTransaction();
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// GET /api/subscriptions/me
export const getUserSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      Subscription.find({ subscriberId: req.user._id })
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('subscribedToId', 'username avatar'),
      Subscription.countDocuments({ subscriberId: req.user._id })
    ]);

    res.json({
      data: subscriptions,
      pagination: {
        currentPage: +page,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/creators/:id/followers
export const getCreatorFollowers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      Subscription.find({ subscribedToId: req.params.id })
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('subscriberId', 'username avatar'),
      Subscription.countDocuments({ subscribedToId: req.params.id })
    ]);

    res.json({
      data: followers,
      pagination: {
        currentPage: +page,
        totalPages: Math.ceil(total / limit),
        totalFollowers: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChannelInfo = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1️⃣ Fetch user public data
    const user = await User.findById(userId).select('_id username avatar');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 2️⃣ Count subscribers
    const subscriberCount = await Subscription.countDocuments({ subscribedToId: userId });

    // 3️⃣ Fetch all videos uploaded by this user
    const videos = await Video.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('_id title thumbnail views createdAt');

    res.json({
      user,
      subscriberCount,
      videos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubscriptionFeed = async (req, res) => {
  try {
    const userId = req.user._id;               // Logged in user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 1️⃣ Find all channels user subscribed to
    const subscriptions = await Subscription.find({ subscriberId: userId }).select('subscribedToId');

    if (!subscriptions.length) {
      return res.json({
        videos: [],
        pagination: { currentPage: page, totalPages: 0, totalResults: 0 }
      });
    }

    // 2️⃣ Extract subscribed channel IDs
    const subscribedChannelIds = subscriptions.map(sub => sub.subscribedToId);

    // 3️⃣ Fetch recent videos uploaded by these channels
    const videosPromise = Video.find({ user: { $in: subscribedChannelIds } })
      .sort({ createdAt: -1 })      // Newest first
      .skip(skip)
      .limit(limit)
      .select('_id title thumbnail views createdAt user')
      .populate('user', 'username avatar'); // Show uploader info

    // 4️⃣ Count total videos for pagination
    const countPromise = Video.countDocuments({ user: { $in: subscribedChannelIds } });

    const [videos, total] = await Promise.all([videosPromise, countPromise]);

    res.json({
      videos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

