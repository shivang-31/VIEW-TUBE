import Video from '../models/videos.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Channel from '../models/Channels.js';
import mongoose from 'mongoose';

// POST /api/subscriptions
export const createSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { channelId } = req.body; // Changed from creatorId to channelId
    const subscriberId = req.user._id;

    // Validation
    if (!channelId) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Channel ID is required' });
    }

    // Check if channel exists
    const channel = await Channel.findById(channelId).session(session);
    if (!channel) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Prevent subscribing to your own channel
    if (channel.user.equals(subscriberId)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Cannot subscribe to your own channel' });
    }

    // Check existing subscription
    const exists = await Subscription.exists({
      subscriberId,
      channelId // Changed from subscribedToId to channelId
    }).session(session);

    if (exists) {
      await session.abortTransaction();
      return res.status(409).json({ error: 'Already subscribed to this channel' });
    }

    // Transaction: Update user, channel and create subscription
    await User.findByIdAndUpdate(
      subscriberId,
      {
        $addToSet: { subscribedChannels: channelId }, // Changed from subscribedTo
        $inc: { subscribedCount: 1 }
      },
      { session }
    );

    const [subscription] = await Subscription.create(
      [{
        subscriberId,
        channelId, // Changed from subscribedToId
        subscribedAt: new Date()
      }],
      { session }
    );

    await Channel.findByIdAndUpdate(
      channelId,
      { $inc: { subscriberCount: 1 } }, // Update channel's subscriber count
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

    // Transaction: Update user and channel
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { subscribedChannels: subscription.channelId }, // Changed from subscribedTo
        $inc: { subscribedCount: -1 }
      },
      { session }
    );

    await Channel.findByIdAndUpdate(
      subscription.channelId, // Changed from subscribedToId
      { $inc: { subscriberCount: -1 } },
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
        .populate({
          path: 'channelId',
          select: 'name avatar user',
          populate: {
            path: 'user',
            select: 'username'
          }
        }),
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

// GET /api/channels/:id/subscribers
export const getChannelSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
      Subscription.find({ channelId: req.params.id })
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('subscriberId', 'username avatar'),
      Subscription.countDocuments({ channelId: req.params.id })
    ]);

    res.json({
      data: subscribers,
      pagination: {
        currentPage: +page,
        totalPages: Math.ceil(total / limit),
        totalSubscribers: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChannelInfo = async (req, res) => {
  try {
    const channelId = req.params.channelId;

    // 1️⃣ Fetch channel data
    const channel = await Channel.findById(channelId)
      .populate('user', 'username avatar');
    
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    // 2️⃣ Count subscribers
    const subscriberCount = await Subscription.countDocuments({ channelId });

    // 3️⃣ Fetch all videos from this channel
    const videos = await Video.find({ channelId })
      .sort({ createdAt: -1 })
      .select('_id title thumbnail views createdAt');

    res.json({
      channel: {
        ...channel.toObject(),
        subscriberCount
      },
      videos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubscriptionFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 1️⃣ Find all channels user subscribed to
    const subscriptions = await Subscription.find({ subscriberId: userId })
      .select('channelId');

    if (!subscriptions.length) {
      return res.json({
        videos: [],
        pagination: { currentPage: page, totalPages: 0, totalResults: 0 }
      });
    }

    // 2️⃣ Extract subscribed channel IDs
    const subscribedChannelIds = subscriptions.map(sub => sub.channelId);

    // 3️⃣ Fetch recent videos from these channels
    const videosPromise = Video.find({ channelId: { $in: subscribedChannelIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title thumbnail views createdAt channelId')
      .populate({
        path: 'channelId',
        select: 'name avatar user',
        populate: {
          path: 'user',
          select: 'username'
        }
      });

    const countPromise = Video.countDocuments({ 
      channelId: { $in: subscribedChannelIds } 
    });

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

export const getCreatorFollowers = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const followers = await Subscription.find({ channelId: creatorId })
      .populate("subscriberId", "username avatar");

    res.status(200).json({
      creatorId,
      totalFollowers: followers.length,
      followers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
