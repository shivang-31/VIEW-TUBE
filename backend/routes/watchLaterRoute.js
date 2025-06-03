import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import {
  saveVideoForLater,
  removeSavedVideo,
  getSavedVideos,
} from "../controllers/watchLaterController.js";

const router = express.Router();

// ➕ Save a video
router.post("/save/:videoId", authenticateUser, saveVideoForLater);

// ❌ Remove saved video
router.delete("/unsave/:videoId", authenticateUser, removeSavedVideo);

// 📄 Get saved videos
router.get("/saved", authenticateUser, getSavedVideos);

export default router;
