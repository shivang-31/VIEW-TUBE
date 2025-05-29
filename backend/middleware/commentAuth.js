import Comment from "../models/Comment.js";
import { body } from 'express-validator';

// Validation middleware
export const validateComment = [
  body('text')  // Changed from 'comment' to 'text' to match your schema
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ max: 1000 }).withMessage('Comment must be ≤ 1000 chars')
    .escape() // XSS protection
];

// Authorization middleware
export const commentAuth = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId || req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if current user is the comment author
    if (comment.userId.toString() !== req.user.id.toString()) {  // Changed from 'user' to 'userId'
      return res.status(403).json({ 
        message: "Unauthorized - You can only modify your own comments" 
      });
    }
    
    // Attach the comment to the request for later use
    req.comment = comment;
    next();
  } catch (err) {
    console.error("Authorization error:", err);
    res.status(500).json({ 
      message: "Server error during authorization",
      error: err.message 
    });
  }
};