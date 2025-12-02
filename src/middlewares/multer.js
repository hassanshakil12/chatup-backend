import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const basePath = process.cwd();
  const directories = [
    "uploads/profileImages",
    "uploads/coverImages",
    "uploads/temps",
  ];

  directories.forEach((dir) => {
    const fullPath = path.join(basePath, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
    }
  });
};

// Initialize directories on server start
createUploadDirectories();

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed."
      ),
      false
    );
  }
};

// File filter for documents (optional)
const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed."),
      false
    );
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/temp"; // Default temporary path

    // Determine destination based on upload type
    if (req.uploadType === "profileImage") {
      uploadPath = "uploads/profileImages";
    } else if (req.uploadType === "coverImage") {
      uploadPath = "uploads/coverImages";
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const fileExt = path.extname(file.originalname).toLowerCase();
    const filename = `${uniqueSuffix}${fileExt}`;

    // Store filename in request for later use
    req.generatedFilename = filename;

    cb(null, filename);
  },
});

// Image compression configuration (optional - using sharp)
const compressImage = async (filePath, maxWidth = 1200, quality = 80) => {
  try {
    const compressedPath = filePath.replace(/(\.[\w\d_-]+)$/i, "_compressed$1");

    await sharp
      .default(filePath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality })
      .png({ quality })
      .webp({ quality })
      .toFile(compressedPath);

    // Replace original with compressed version
    fs.unlinkSync(filePath);
    fs.renameSync(compressedPath, filePath);

    return true;
  } catch (error) {
    console.error("Image compression failed:", error);
    return false;
  }
};

// Configure multer instances for different upload types
export const uploadConfig = {
  profileImageUpload: multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024,
      files: 1,
    },
  }),

  coverImageUpload: multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  }),

  // For temporary uploads (will be processed/moved later)
  tempUpload: multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      // Accept both images and documents for temp
      if (
        imageFileFilter(req, file, (err, accept) => accept) ||
        documentFileFilter(req, file, (err, accept) => accept)
      ) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }),
};

// Middleware to set upload type
export const setUploadType = (type) => {
  return (req, res, next) => {
    req.uploadType = type;
    next();
  };
};

// File validation middleware
export const validateUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  next();
};

// File size formatter utility
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Cleanup old temporary files (run as cron job)
export const cleanupTempFiles = (maxAgeHours = 24) => {
  const tempPath = path.join(process.cwd(), "uploads/temp");
  const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;

  if (fs.existsSync(tempPath)) {
    fs.readdirSync(tempPath).forEach((file) => {
      const filePath = path.join(tempPath, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old temp file: ${file}`);
      }
    });
  }
};
