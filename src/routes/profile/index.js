import express from "express";

import userAuth from "../../middlewares/userAuth.js";
import {
  userProfileLimiter,
  createDynamicLimiter,
} from "../../middlewares/rateLimiters.js";
import {
  uploadConfig,
  setUploadType,
  validateUpload,
} from "../../middlewares/multer.js";
import { virusScanMiddleware } from "../../middlewares/virusScan.js";

import {
  getUserProfile,
  uploadUserProfileImage,
} from "../../controllers/profile/index.js";

const router = express.Router();

router.get("/me", userProfileLimiter, userAuth, getUserProfile);
router.post(
  "/upload/profile-image",
  createDynamicLimiter(
    1,
    3,
    "Too many upload requests, please try again later"
  ),
  userAuth,
  setUploadType("profileImage"),
  uploadConfig.profileImageUpload.single("profileImage"),
  validateUpload,
  virusScanMiddleware,
  uploadUserProfileImage
);

export default router;
