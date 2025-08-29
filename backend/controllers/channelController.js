import Channel from '../models/Channels.js';
import Video from '../models/videos.js';
import Subscription from '../models/Subscription.js';

// Create a new channel
export const createChannel = async (req, res) => {
  try {
    const { name,description } = req.body;

    // Check if channel name is already taken
    const existing = await Channel.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Channel name already exists' });
    }

    const channel = new Channel({
      name,
      description,
      owner:req.user.id
,
    });

    await channel.save();
    res.status(201).json({ success: true, channel });
  } catch (error) {
    console.error('Create Channel Error:', error);
    res.status(500).json({ message: 'Server error here problem' });
  }
};

// Get all channels of a user
export const getUserChannels = async (req, res) => {
  try {
    const userId = req.params.userId;
    const channels = await Channel.find({ owner: userId });
    res.status(200).json({ success: true, channels });
  } catch (error) {
    console.error('Get User Channels Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get channel details by ID + its videos
export const getChannelById = async (req, res) => {
  try {
    const channelId = req.params.id;

    const channel = await Channel.findById(channelId).populate('owner', '-password');
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const videos = await Video.find({ channelId });
    res.status(200).json({ success: true, channel, videos });
  } catch (error) {
    console.error('Get Channel Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update channel details (only owner)
export const updateChannel = async (req, res) => {
  try {
    const channelId = req.params.id;
    const channel = await Channel.findById(channelId);

    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    if (channel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this channel' });
    }

    const { name, description } = req.body;
    if (name) channel.name = name;
    if (description) channel.description = description;

    await channel.save();
    res.status(200).json({ success: true, channel });
  } catch (error) {
    console.error('Update Channel Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a channel (only owner)
export const deleteChannel = async (req, res) => {
  try {
    const channelId = req.params.id;
    const channel = await Channel.findById(channelId);

    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    if (channel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this channel' });
    }

    await channel.deleteOne();

    // Optionally: Delete all related videos and subscriptions
    await Video.deleteMany({ channelId });
    await Subscription.deleteMany({ channel: channelId });

    res.status(200).json({ success: true, message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Delete Channel Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
