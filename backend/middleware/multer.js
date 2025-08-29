import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedVideoExtensions = [".mp4", ".mov", ".avi", ".mkv"];
  const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "video") {
    allowedVideoExtensions.includes(ext) 
      ? cb(null, true)
      : cb(new Error("Only video files (MP4, MOV, AVI, MKV) are allowed"), false);
  } else if (file.fieldname === "thumbnail") {
    allowedImageExtensions.includes(ext)
      ? cb(null, true)
      : cb(new Error("Only image files (JPG, JPEG, PNG, GIF) are allowed"), false);
  }     
};

// Create the multer instance
const multerInstance = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter
});

// Named exports
export const uploadFiles = multerInstance.fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }
]);

export const checkFileUpload = (req, res, next) => {
  if (!req.files?.video?.[0] || !req.files?.thumbnail?.[0]) {
    return res.status(400).json({ 
      message: "Both video and thumbnail files are required" 
    });
  }
  next();
};

// Default export (the raw multer instance)
export default multerInstance;