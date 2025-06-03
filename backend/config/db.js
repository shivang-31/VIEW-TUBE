import mongoose from "mongoose";
import dotenv from "dotenv";
import Video from "../models/videos.js"; // ✅ Import your Video model

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // ✅ Create text index after DB connects
    await Video.collection.createIndex({ title: "text", description: "text" });
    console.log("✅ Text index created on Video collection");

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
