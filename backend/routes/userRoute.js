import express from 'express';
import { getChannel, getuser } from '../controllers/userController.js';
import authenticateUser from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateUser, getuser);
router.get('/channel/:id', authenticateUser,getChannel );

export default router;