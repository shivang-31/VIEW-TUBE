import express from 'express';
import {
  createSubscription,
  deleteSubscription,
  getUserSubscriptions,
  getCreatorFollowers,
  getChannelInfo,
  getSubscriptionFeed
} from '../controllers/subscriptionController.js';
import authenticateUser from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/subscriptions
router.post('/',authenticateUser , createSubscription);

// DELETE /api/subscriptions/:id
router.delete('/:id', authenticateUser, deleteSubscription);

// GET /api/subscriptions/me
router.get('/me', authenticateUser, getUserSubscriptions);

// GET /api/creators/:id/followers
router.get('/creators/:id/followers', getCreatorFollowers);

router.get('/channel/:userId', getChannelInfo);

// Protect route with authentication middleware
router.get('/subscriptions/feed', authenticateUser, getSubscriptionFeed);



export default router;