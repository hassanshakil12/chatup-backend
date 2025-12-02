import express from "express";

import { apiResponse } from "../utils/handlers/index.js";

import authRoutes from "./auth/index.js";
import profileRoutes from "./profile/index.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);

router.get("/", (req, res) => {
  try {
    apiResponse({
      res,
      status: 200,
      success: true,
      message: "🚀 Welcome to the Chat Up API",
      data: {
        version: "1.0.0",
        documentation: "https://chatup.docs.apiary.io/",
      },
    });
  } catch (error) {
    apiResponse({
      res,
      status: 500,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  }
});

export default router;
