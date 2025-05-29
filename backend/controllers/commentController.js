import Video from "../models/videos.js";  // Changed import name to uppercase
import Comment from "../models/Comment.js";

export const createComment = async (req, res) => {
    try {
        const { videoId, text } = req.body;  // Changed from 'comment' to 'text'
        const video = await Video.findById(videoId);  // Changed variable name
        
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }
        
        // Corrected to use uppercase Comment
        const newComment = new Comment({
            videoId,
            userId: req.user.id,
            text  // Changed from 'comment' to 'text'
        });

        await newComment.save();
        res.status(201).json({ 
            message: "Comment created successfully", 
            comment: newComment 
        });
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message  // Added error details
        });
    }
}

export const getComments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const vidComments = await Comment.find({ 
            videoId: req.params.videoId 
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        
        res.status(200).json(vidComments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ 
            message: "Server error",
            error: error.message  // Added error details
        });
    }
}

export const deleteComment = async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const comment = await Comment.findById(commentId);
        
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        
        await comment.deleteOne();
        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
        console.error("Error deleting comment:", err);
        res.status(500).json({ 
            message: "Server error",
            error: err.message  // Added error details
        });
    }
}