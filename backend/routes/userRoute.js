import express from 'express';
import { getuser } from '../controllers/userController.js';
import authenticateUser from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateUser, getuser);

export default router;