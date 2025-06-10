import Video from "../models/videos.js";
import Comment from "../models/Comment.js";
import redisClient from "../utilities/redisClient.js";
import { ObjectId } from "mongodb";

export const createComment = async (req, res) => {
    try {
        const { videoId, text } = req.body;
        const userId = req.user.id;
        
        // Input validation
        if (!text || !ObjectId.isValid(videoId)) {
            return res.status(400).json({ message: "Invalid input data" });
        }

        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        const newComment = await Comment.create({
            videoId,
            userId,
            text
        });

        // Populate user details before emitting
        const populatedComment = await Comment.findById(newComment._id)
            .populate('userId', 'username avatar');

        // Emit real-time comment via WebSocket
        const io = req.app.get('io');
        io.to(videoId.toString()).emit('new_comment', populatedComment);

        // Invalidate comment cache for this video
        await redisClient.del(`comments:${videoId}`);

        res.status(201).json({
            success: true,
            comment: populatedComment
        });

    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const getComments = async (req, res) => {
    try {
        const { videoId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const cacheKey = `comments:${videoId}:page:${page}`;

        // Check Redis cache first
        const cachedComments = await redisClient.get(cacheKey);
        if (cachedComments) {
            return res.status(200).json(JSON.parse(cachedComments));
        }

        const comments = await Comment.find({ videoId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username avatar')
            .lean(); // Convert to plain JS object

        // Cache popular videos' comments for 15 minutes
        if (page === 1) {
            await redisClient.setEx(
                cacheKey,
                900, // 15 minutes
                JSON.stringify(comments)
            );
        }

        res.status(200).json({
            success: true,
            data: comments,
            pagination: {
                page,
                limit,
                total: await Comment.countDocuments({ videoId })
            }
        });

    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch comments"
        });
    }
}

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findOneAndDelete({
            _id: commentId,
            userId // Ensure only comment owner can delete
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found or unauthorized"
            });
        }

        // Emit deletion event via WebSocket
        const io = req.app.get('io');
        io.to(comment.videoId.toString()).emit('comment_deleted', commentId);

        // Invalidate cache
        await redisClient.del(`comments:${comment.videoId}`);

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}


/*Subscribe to comment events
socket.on('new_comment', (comment) => {
  // Add to UI if for current video
  if (comment.videoId === currentVideoId) {
    setComments(prev => [comment, ...prev]);
  }
});

socket.on('comment_deleted', (deletedId) => {
  // Remove from UI
  setComments(prev => prev.filter(c => c._id !== deletedId));
});*/