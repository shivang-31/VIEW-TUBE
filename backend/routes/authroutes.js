import express from 'express';
import { loginUser,registerUser } from '../controllers/authController.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// ✅ Login Route
router.post('/login', loginUser);
router.post('/register', registerUser);

export default router;

