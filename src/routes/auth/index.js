import express from "express";

import userAuth from "../../middlewares/userAuth.js";
import { authLimiter } from "../../middlewares/rateLimiters.js";

import {
  loginUser,
  registerUser,
  resendOTP,
  verifyOTP,
  socialLogin,
  logoutUser,
} from "../../controllers/auth/index.js";

const router = express.Router();

router.post("/login", authLimiter, loginUser);
router.post("/register", authLimiter, registerUser);
router.post("/resend-otp", authLimiter, resendOTP);
router.post("/verify-otp", authLimiter, verifyOTP);
router.post("/social-login", authLimiter, socialLogin);
router.post("/logout", authLimiter, userAuth, logoutUser);

export default router;
