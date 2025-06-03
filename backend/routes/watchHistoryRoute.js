import express from 'express';
import { getWatchHistory,deleteHistoryVideo,clearWatchHistory } from '../controllers/watchHistoryController.js';
import  authenticateUser  from "../middleware/authMiddleware.js";



const router = express.Router();

router.get('/', authenticateUser, getWatchHistory);
router.get('/:videoId', authenticateUser,deleteHistoryVideo );
router.get('/deleteAll', authenticateUser,clearWatchHistory );

export default router;