import express from "express";

import {
  loginUser,
  registerUser,
  resendOTP,
  verifyOTP,
  socialLogin,
} from "../../controllers/auth/index.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/resend-otp", resendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/social-login", socialLogin);

export default router;
