import Video from "../models/videos.js"; // ✅ Import Video model
import User from "../models/User.js"; // Make sure to import this
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

// Get all videos with pagination
const getAllVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;     // current page number
    const limit = parseInt(req.query.limit) || 10;  // items per page
    const skip = (page - 1) * limit;                // how many to skip

    // Fetch total count for frontend (optional but useful)
    const totalVideos = await Video.countDocuments();

    // Fetch videos with pagination
    const videos = await Video.find()
      .sort({ createdAt: -1 })   // newest first
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      totalVideos,       // total videos in DB
      currentPage: page,
      totalPages: Math.ceil(totalVideos / limit),
      videos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVideoById = async (req, res) =>{
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId);

    if(!video){
      return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json(video);
  }
  catch(err){
    console.error("Error fetching video:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export const updateVideo = async (req, res) => {
  try {
    const videoId = req.params.id; // Consistent naming
    const { title, description, tags } = req.body;

    const video = await Video.findById(videoId); // Ensure the model name is correct

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own videos" });
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (tags) video.tags = tags.split(',');

    await video.save(); // Save the updated video

    res.status(200).json({ message: "Video updated successfully", video });
  } catch (err) {
    console.error("❌ Error updating video:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can delete only your own videos" });
    }

    await video.deleteOne();

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


export const likeVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    const videoId = req.params.id;

    if (!videoId || !userId) {
      return res.status(400).json({ message: "Video ID and User ID are required" });
    }

    const video = await Video.findById(videoId);
    const user = await User.findById(userId);

    if (!video || !user) {
      return res.status(404).json({ message: "Video or User not found" });
    }

    // Toggle like status on video
    if (video.likes.includes(userId)) {
      video.likes = video.likes.filter(id => id.toString() !== userId);
    } else {
      video.likes.push(userId);
      if(video.dislikes.includes(userId)){
        video.dislikes = video.dislikes.filter(id => id.toString() !== userId);
      }
    }

    // Toggle liked video on user
    if (user.likedVideos.includes(videoId)) {
      user.likedVideos = user.likedVideos.filter(id => id.toString() !== videoId);
    } else {
      user.likedVideos.push(videoId);
    }

    await video.save();
    await user.save();

    res.status(200).json({ message: "Like status updated", video });
  } catch (err) {
    console.error("Error liking video:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const dislikeVideo = async (req, res) =>{
  try{
    const userId = req.user.id;
    const videoId = req.params.id;

    if (!videoId || !userId) {
      return res.status(400).json({ message: "Video ID and User ID are required" });
    }

    const video = await Video.findById(videoId);
    const user = await User.findById(userId);

    if (!video || !user) {
      return res.status(404).json({ message: "Video or User not found" });
    }

    // Toggle dislike status on video
    if (video.dislikes.includes(userId)) {
      video.dislikes = video.dislikes.filter(id => id.toString() !== userId);
    } else {
      video.dislikes.push(userId);
      if(video.likes.includes(userId)){
        video.likes = video.likes.filter(id => id.toString() !== userId);
      }
    }
    await video.save(); 
    res.status(200).json({ message: "Dislike status updated", video });
  }catch(err){
    console.error("Error disliking video:", err);
    res.status(500).json({ message: "Server Error" });
  }
}





export default getAllVideos;

