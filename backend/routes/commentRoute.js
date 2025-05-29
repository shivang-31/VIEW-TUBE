import express from 'express';
import { validationResult } from 'express-validator'; // Make sure to import validationResult
import { createComment, deleteComment, getComments } from '../controllers/commentController.js';
import authenticateUser from '../middleware/authMiddleware.js';
import { commentAuth, validateComment } from '../middleware/commentAuth.js';

const router = express.Router();

router.post('/',
  authenticateUser,
  validateComment,
  (req, res, next) => {  // Added next parameter for proper middleware chaining
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    createComment(req, res, next); // Pass next to createComment
  }
);

router.get('/:videoId', getComments);
router.delete('/:commentId', authenticateUser, commentAuth, deleteComment);

export default router;