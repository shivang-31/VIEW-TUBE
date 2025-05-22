import { registerUser } from '../controllers/authController.js';
import express from 'express';
import { loginUser } from '../controllers/authController.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

const router = express.Router();

// ✅ Login Route
router.post('/login', loginUser);
router.post('/register', registerUser);

export default router;

