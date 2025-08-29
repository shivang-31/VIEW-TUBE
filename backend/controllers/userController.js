import User from '../models/User.js';
import Video from '../models/videos.js';


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


// export const updateUser = async (req, res) => {
//   try {
//     const updates = req.body;
//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       { $set: updates },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.status(200).json(user);
//   } catch (error) {
//     console.error('Error updating user:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
