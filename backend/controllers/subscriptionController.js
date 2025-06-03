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