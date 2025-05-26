import Video from "../models/videos.js"; // ✅ Import Video model
import cloudinary from "cloudinary";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Helper function to upload file using buffer (supports both video & thumbnail)
const streamUpload = (buffer, resourceType) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { resource_type: resourceType, folder: `viewtube/${resourceType}s` },
      (error, result) => {
        if (error) {
          console.error(`Cloudinary ${resourceType} Upload Error:`, error);
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

// ✅ Updated Upload Video Controller (Handles Video & Thumbnail)
export const uploadVideo = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Uploaded Files:", req.files);

    const { title, description, tags } = req.body;
    const videoFile = req.files["video"][0];
    const thumbnailFile = req.files["thumbnail"][0];

    if (!videoFile || !thumbnailFile || !title) {
      return res.status(400).json({ message: "Title, video, and thumbnail are required" });
    }

    // ✅ Upload video to Cloudinary
    const videoUpload = await streamUpload(videoFile.buffer, "video");
    console.log("Uploaded Video URL:", videoUpload.secure_url);

    // ✅ Upload thumbnail to Cloudinary
    const thumbnailUpload = await streamUpload(thumbnailFile.buffer, "image");
    console.log("Uploaded Thumbnail URL:", thumbnailUpload.secure_url);

    // 💾 Save to DB
    const newVideo = new Video({
      user: req.user.id,
      title,
      description,
      tags: Array.isArray(tags) ? tags : tags?.split(",") || [],
      videoUrl: videoUpload.secure_url,
      thumbnail: thumbnailUpload.secure_url, // ✅ Save thumbnail URL
    });

    await newVideo.save();
    res.status(201).json({ message: "Video & Thumbnail uploaded successfully!", video: newVideo });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};