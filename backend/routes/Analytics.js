import express from 'express';
import { logVideoWatch, getVideoAnalytics } from '../controllers/analyticsController.js';
import  authenticateUser  from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/watch', authenticateUser, logVideoWatch);
// routes/analytics.js
router.get('/video/:id', authenticateUser, getVideoAnalytics);


export default router;
