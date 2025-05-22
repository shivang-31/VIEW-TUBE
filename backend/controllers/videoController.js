import Video from "../models/Videos.js";
import cloudinary from "cloudinary";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Helper function to upload video using buffer
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { resource_type: "video", folder: "viewtube/videos" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // ✅ Convert buffer into readable stream before upload
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream); // ✅ Upload via stream
  });
};

// ✅ Upload Video Controller
export const uploadVideo = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    const { title, description, tags } = req.body;
    const videoFile = req.file;

    if (!videoFile || !title) {
      return res.status(400).json({ message: "Title and video are required" });
    }

    // ✅ Upload video to Cloudinary using buffer
    const videoUpload = await streamUpload(videoFile.buffer);
    console.log("Uploaded Video URL:", videoUpload.secure_url);

    // 💾 Save to DB
    const newVideo = new Video({
      user: req.user.id,
      title,
      description,
      tags: Array.isArray(tags) ? tags : tags?.split(",") || [],
      videoUrl: videoUpload.secure_url,
      thumbnail: "", // ✅ Placeholder for future thumbnail logic
    });

    await newVideo.save();
    res.status(201).json({ message: "Video uploaded successfully!", video: newVideo });

  } catch (error) {
    console.error("Video Upload Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};