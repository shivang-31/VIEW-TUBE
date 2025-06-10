import express from 'express';
import {
  createPlaylist,
  getUserPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistById,
  deletePlaylist
} from '../controllers/PlayListController.js';
import authenticateUser from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateUser, createPlaylist);
router.get('/me', authenticateUser, getUserPlaylists);
router.post('/add-video', authenticateUser, addVideoToPlaylist);
router.post('/remove-video', authenticateUser, removeVideoFromPlaylist);
router.get('/:id', authenticateUser, getPlaylistById);
router.delete('/:id', authenticateUser, deletePlaylist);

export default router;
