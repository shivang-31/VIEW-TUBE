import express from "express";
import { uploadVideo , getVideoById ,updateVideo,deleteVideo , likeVideo , dislikeVideo, getSuggestedVideos } from "../controllers/videoController.js";
import multerInstance, { uploadFiles, checkFileUpload } from "../middleware/multer.js";
import authenticateUser from "../middleware/authMiddleware.js";
import  getAllVideos  from '../controllers/videoController.js';

const router = express.Router();

// Using the pre-configured uploadFiles middleware
router.post("/upload", 
  authenticateUser, 
  uploadFiles,  // Using the named export
  checkFileUpload, 
  uploadVideo
);

// List all videos
router.get('/', getAllVideos);

router.get('/:id', getVideoById);

router.put('/:id', authenticateUser, updateVideo);

router.delete('/:id', authenticateUser, deleteVideo);

router.put('/:id/like',authenticateUser,likeVideo);

router.put('/:id/dislike',authenticateUser,dislikeVideo);

router.get('/:videoId/suggestions',authenticateUser, getSuggestedVideos);


export default router;