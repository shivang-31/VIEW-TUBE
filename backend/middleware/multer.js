import multer from "multer";
import path from "path";

// ✅ Use memory storage for direct Cloudinary upload
const storage = multer.memoryStorage();

// ✅ Improved file filter with structured error handling
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".mp4", ".mov", ".avi", ".mkv"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true); // ✅ Accept file
  } else {
    req.fileValidationError = "Only video files are allowed"; // ✅ Custom validation message
    cb(null, false); // ❌ Reject file
  }
};

// ✅ Configure multer with memory storage and file limits
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter,
});

// ✅ Middleware to check if a file is present before processing
 export const checkFileUpload = (req, res, next) => {
  console.log("checkFileUpload middleware - req.file:", req.file);
  if (!req.file) {
    return res.status(400).json({ message: req.fileValidationError || "Video file is required" });
  }
  next();
};

export default upload;