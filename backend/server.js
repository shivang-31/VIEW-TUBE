import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from './routes/authroutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(express.json());    // <-- Move this BEFORE routes

app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
  res.send("ViewTube backend is running 🚀");
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT} `);
});
