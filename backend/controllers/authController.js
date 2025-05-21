import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config(); // 📦 Load environment variables from .env

// =======================================
// ✅ REGISTER USER CONTROLLER
// =======================================
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 🚫 Check for missing fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // 🔍 Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔐 Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧾 Create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // 💾 Save user to DB
    await newUser.save();

    // ✅ Respond with success
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// =======================================
// ✅ LOGIN USER CONTROLLER
// =======================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🚫 Check for missing credentials
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // 🔍 Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // 🎟 Generate Access Token (short-lived)
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // 🔁 Generate Refresh Token (long-lived)
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // 🍪 Set Refresh Token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // ❗ Use true only in production (HTTPS)
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // ✅ Send Access Token + user info
    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
