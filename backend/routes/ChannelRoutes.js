import express from 'express';
import {
  createChannel,
  getChannelById,
  getUserChannels,
  updateChannel,
  deleteChannel,
} from '../controllers/channelController.js';
import authenticateUser from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateUser, createChannel); // Create new channel
router.get('/:id', getChannelById); // Get a specific channel by ID
router.get('/user/:userId', getUserChannels); // Get all channels of a user
router.patch('/:id', authenticateUser, updateChannel); // Update a channel
router.delete('/:id', authenticateUser, deleteChannel); // Delete a channel

export default router;
