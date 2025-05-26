import express from "express";
import { uploadVideo } from "../controllers/videoController.js";
import multerInstance, { uploadFiles, checkFileUpload } from "../middleware/multer.js";
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();

// Using the pre-configured uploadFiles middleware
router.post("/upload", 
  authenticateUser, 
  uploadFiles,  // Using the named export
  checkFileUpload, 
  uploadVideo
);

export default router;