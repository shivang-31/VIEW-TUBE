import Video from "../models/videos.js";
import User from "../models/User.js";
import Channel from "../models/Channels.js";
import cloudinary from "cloudinary";
import dotenv from "dotenv";
import { Readable } from "stream";
import WatchHistory from "../models/watchHistory.js";
import videoDailyviews from "../models/videoDailyviews.js";
import getTodayDateString from "../utilities/dateutility.js";
import redisClient from '../utilities/redisClient.js';

dotenv.config();

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function for Cloudinary uploads
const streamUpload = (buffer, resourceType) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { resource_type: resourceType, folder: `viewtube/${resourceType}s` },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// VIDEO CONTROLLERS

export const uploadVideo = async (req, res) => {
  try {
    const { title, description, tags, channelId } = req.body;
    const videoFile = req.files["video"]?.[0];
    const thumbnailFile = req.files["thumbnail"]?.[0];

    // Validation
    if (!title || !videoFile || !thumbnailFile || !channelId) {
      return res.status(400).json({ 
        message: "Title, video, thumbnail, and channelId are required" 
      });
    }
    console.log("Channel ID:", req.body.channelId, "User ID:", req.user.id);

    // Channel verification
    const channel = await Channel.findOne({ 
      _id: req.body.channelId, 
      owner: req.user.id 
    });
    if (!channel) {
      return res.status(403).json({ 
        message: "Channel not found or unauthorized" 
      });
    }

    // Upload media
    const [videoUpload, thumbnailUpload] = await Promise.all([
      streamUpload(videoFile.buffer, "video"),
      streamUpload(thumbnailFile.buffer, "image")
    ]);

    // Create video
    const newVideo = new Video({
      title,
      description,
      tags: Array.isArray(tags) ? tags : tags?.split(",") || [],
      videoUrl: videoUpload.secure_url,
      thumbnail: thumbnailUpload.secure_url,
      userId: req.user.id,
      channelId,
      visibility: "public" // default
    });

    await newVideo.save();

    // Update channel's video count
    await Channel.findByIdAndUpdate(channelId, {
      $inc: { videoCount: 1 }
    });

    res.status(201).json({ 
      message: "Video uploaded successfully!", 
      video: newVideo 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId)
      .populate('userId', 'username avatar')
      .populate('channelId', 'name avatar');

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Record view
    const dateStr = getTodayDateString();
    await videoDailyviews.findOneAndUpdate(
      { video: videoId, date: dateStr },
      { $inc: { viewCount: 1 } },
      { upsert: true, new: true }
    );

    // Update video's view count
    await Video.findByIdAndUpdate(videoId, {
      $inc: { views: 1 }
    });

    // Add to watch history if authenticated
    if (req.user) {
      await WatchHistory.findOneAndUpdate(
        { user: req.user.id, video: videoId },
        { $set: { watchedAt: new Date(), channelId: video.channelId } },
        { upsert: true }
      );
    }

    res.status(200).json(video);
  } catch (err) {
    console.error("Error fetching video:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVideosByChannel = async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const [videos, totalVideos] = await Promise.all([
      Video.find({ channelId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username avatar'),
      Video.countDocuments({ channelId })
    ]);

    res.status(200).json({
      channel: {
        _id: channel._id,
        name: channel.name,
        avatar: channel.avatar
      },
      videos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalVideos / limit),
        totalVideos
      }
    });
  } catch (err) {
    console.error("Error fetching channel videos:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const { title, description, tags, visibility } = req.body;
    const thumbnailFile = req.files["thumbnail"]?.[0];

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Authorization - either video owner or channel owner
    const isVideoOwner = video.userId.toString() === req.user.id;
    const isChannelOwner = await Channel.exists({
      _id: video.channelId,
      user: req.user.id
    });

    if (!isVideoOwner && !isChannelOwner) {
      return res.status(403).json({ 
        message: "Unauthorized to update this video" 
      });
    }

    // Update fields
    if (title) video.title = title;
    if (description) video.description = description;
    if (tags) video.tags = Array.isArray(tags) ? tags : tags.split(',');
    if (visibility) video.visibility = visibility;

    // Update thumbnail if provided
    if (thumbnailFile) {
      const thumbnailUpload = await streamUpload(thumbnailFile.buffer, "image");
      video.thumbnail = thumbnailUpload.secure_url;
    }

    await video.save();
    res.status(200).json({ message: "Video updated", video });
  } catch (err) {
    console.error("Error updating video:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Authorization - either video owner or channel owner
    const isVideoOwner = video.userId.toString() === req.user.id;
    const isChannelOwner = await Channel.exists({
      _id: video.channelId,
      user: req.user.id
    });

    if (!isVideoOwner && !isChannelOwner) {
      return res.status(403).json({ 
        message: "Unauthorized to delete this video" 
      });
    }

    // Delete from Cloudinary (optional - you might want to keep files)
    // await cloudinary.v2.uploader.destroy(video.videoUrl);
    // await cloudinary.v2.uploader.destroy(video.thumbnail);

    await video.deleteOne();

    // Update channel's video count
    await Channel.findByIdAndUpdate(video.channelId, {
      $inc: { videoCount: -1 }
    });

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// DISCOVERY & RECOMMENDATIONS

export const getTrendingVideos = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 30);
    const cacheKey = `trending:v3:${days}d`;
    
    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.status(200).json(JSON.parse(cached));

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const trending = await videoDailyviews.aggregate([
      { 
        $match: { 
          date: { 
            $gte: startDate.toISOString().split('T')[0], 
            $lte: endDate.toISOString().split('T')[0] 
          } 
        } 
      },
      { 
        $group: { 
          _id: "$video", 
          totalViews: { $sum: "$viewCount" },
          latestViewDate: { $max: "$date" }
        } 
      },
      { $sort: { totalViews: -1, latestViewDate: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "videos",
          let: { videoId: "$_id" },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ["$_id", "$$videoId"] },
                visibility: "public" 
              } 
            },
            { 
              $project: { 
                title: 1, 
                thumbnail: 1, 
                duration: 1, 
                userId: 1, 
                views: 1, 
                createdAt: 1, 
                channelId: 1,
                likeCount: { $size: "$likes" } 
              } 
            }
          ],
          as: "videoData"
        }
      },
      { $unwind: "$videoData" },
      {
        $lookup: {
          from: "users",
          localField: "videoData.userId",
          foreignField: "_id",
          as: "creator",
          pipeline: [{ $project: { username: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: "channels",
          localField: "videoData.channelId",
          foreignField: "_id",
          as: "channel",
          pipeline: [{ $project: { name: 1, avatar: 1 } }]
        }
      },
      { $unwind: "$creator" },
      { $unwind: "$channel" },
      {
        $project: {
          video: {
            _id: "$_id",
            title: "$videoData.title",
            thumbnail: "$videoData.thumbnail",
            duration: "$videoData.duration",
            views: "$videoData.views",
            likes: "$videoData.likeCount",
            createdAt: "$videoData.createdAt"
          },
          creator: {
            _id: "$videoData.userId",
            username: "$creator.username",
            avatar: "$creator.avatar"
          },
          channel: {
            _id: "$videoData.channelId",
            name: "$channel.name",
            avatar: "$channel.avatar"
          },
          trendingMetrics: {
            periodViews: "$totalViews",
            latestViewDate: "$latestViewDate"
          }
        }
      }
    ]);

    // Cache for 15 minutes
    await redisClient.setEx(cacheKey, 900, JSON.stringify(trending));

    res.status(200).json(trending);
  } catch (err) {
    console.error("Error fetching trending videos:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSuggestedVideos = async (req, res) => {
  try {
    const { videoId } = req.params;
    const currentVideo = await Video.findById(videoId)
      .populate('channelId', 'name');

    if (!currentVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    const searchWords = currentVideo.title.split(' ').slice(0, 3).join('|');
    const channelId = currentVideo.channelId?._id;

    const suggestions = await Video.aggregate([
      {
        $match: {
          _id: { $ne: currentVideo._id },
          visibility: "public",
          $or: [
            { title: { $regex: searchWords, $options: 'i' } },
            { tags: { $in: currentVideo.tags } },
            ...(channelId ? [{ channelId }] : [])
          ]
        }
      },
      { $sample: { size: 10 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "creator",
          pipeline: [{ $project: { username: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: "channels",
          localField: "channelId",
          foreignField: "_id",
          as: "channel",
          pipeline: [{ $project: { name: 1, avatar: 1 } }]
        }
      },
      { $unwind: "$creator" },
      { $unwind: "$channel" },
      {
        $project: {
          _id: 1,
          title: 1,
          thumbnail: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          likeCount: { $size: "$likes" },
          creator: {
            _id: "$userId",
            username: "$creator.username",
            avatar: "$creator.avatar"
          },
          channel: {
            _id: "$channelId",
            name: "$channel.name",
            avatar: "$channel.avatar"
          }
        }
      }
    ]);

    res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Error getting suggestions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Additional utility controllers
export const getVideoStats = async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if user owns the video or the channel
    const isOwner = video.userId.toString() === req.user.id;
    const isChannelOwner = await Channel.exists({
      _id: video.channelId,
      user: req.user.id
    });

    if (!isOwner && !isChannelOwner) {
      return res.status(403).json({ 
        message: "Unauthorized to view these stats" 
      });
    }

    // Get view data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const dailyViews = await videoDailyviews.find({
      video: videoId,
      date: { $gte: dateStr }
    }).sort({ date: 1 });

    res.status(200).json({
      totalViews: video.views,
      likes: video.likes.length,
      dislikes: video.dislikes.length,
      dailyViews
    });
  } catch (err) {
    console.error("Error getting video stats:", err);
    res.status(500).json({ message: "Server error" });
  }
};

 const getAllVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [videos, totalVideos] = await Promise.all([
      Video.find({ visibility: "public" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username avatar')
        .populate('channelId', 'name avatar'),
      Video.countDocuments({ visibility: "public" })
    ]);

    res.status(200).json({
      totalVideos,
      currentPage: page,
      totalPages: Math.ceil(totalVideos / limit),
      videos
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const dislikeVideo = async (req, res) => {
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

    // Toggle dislike status on video
    if (video.dislikes.includes(userId)) {
      video.dislikes = video.dislikes.filter(id => id.toString() !== userId);
    } else {
      video.dislikes.push(userId);
      // If previously liked, remove from likes
      video.likes = video.likes.filter(id => id.toString() !== userId);
    }

    await video.save();
    res.status(200).json({ message: "Dislike status updated", video });
  } catch (err) {
    console.error("Error disliking video:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const likeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const userId = req.user.id;

    // Remove dislike if present
    video.dislikes = video.dislikes.filter((id) => id.toString() !== userId);

    // Toggle like
    if (video.likes.includes(userId)) {
      video.likes = video.likes.filter((id) => id.toString() !== userId);
    } else {
      video.likes.push(userId);
    }

    await video.save();
    res.status(200).json({ message: "Like status updated", likes: video.likes.length });
  } catch (err) {
    console.error("Error liking video:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getsearchVideos = async (req, res) => {
  try {
    const searchTerm = req.query.q || "";
    
    const videos = await Video.find({
      visibility: "public",
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { tags: { $in: [searchTerm.toLowerCase()] } }
      ]
    }).limit(20);

    res.status(200).json({ videos });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export default getAllVideos;

