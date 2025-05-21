import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config(); // Load env variables (like JWT_SECRET)

// ================================
// REGISTER USER CONTROLLER
// ================================
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user instance with hashed password
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save user to DB
    await newUser.save();

    // Respond with success message
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ================================
// LOGIN USER CONTROLLER
// ================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields (optional but recommended)
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare provided password with hashed password in DB
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token with user ID as payload, expires in 7 days
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return token and user info (excluding password)
    res.status(200).json({
      token,
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
