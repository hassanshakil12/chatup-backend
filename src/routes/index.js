import express from "express";

import authRoutes from "./auth/index.js";
import { apiResponse } from "../utils/handlers/index.js";

const router = express.Router();
router.use("/auth", authRoutes);

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
