import User from '../models/User.js';
import Video from '../models/videos.js';

export const getChannel = async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Fetch user info (excluding password)
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Fetch all videos uploaded by this user
    const videos = await Video.find({ userId: user._id });

    // 3. Send both user & their videos
    res.status(200).json({
      user,
      videos,
    });
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getuser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};