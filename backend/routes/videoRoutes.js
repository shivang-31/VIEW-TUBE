import express from "express";
import { uploadVideo } from "../controllers/videoController.js";
import upload, { checkFileUpload } from "../middleware/multer.js";
import authenticateUser from "../middleware/authMiddleware.js";  // ✅ No curly braces for default export
const router = express.Router();

router.post("/upload", authenticateUser, upload.single("video"), checkFileUpload, uploadVideo);

export default router;