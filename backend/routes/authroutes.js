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

// ✅ Refresh Token Route
router.post('/refresh', (req, res) => {
  const token = req.cookies.refreshToken; // 🍪 Get refresh token from cookies

  if (!token) {
    return res.status(401).json({ message: 'No refresh token found' });
  }

  try {
    // 🔐 Verify the refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

    // ♻️ Generate new access token
    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.ACCESS_SECRET, {
      expiresIn: '15m',
    });

    // ✅ Return new access token
    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

export default router;

