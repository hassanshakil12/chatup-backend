import express from "express";
import mongoose from "mongoose";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { fileURLToPath } from "url";

import { globalLimiter } from "./middlewares/rateLimiters.js";

import { apiResponse } from "./utils/handlers/index.js";
import routes from "./routes/index.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(globalLimiter);

app.use("/api", routes);

app.get("/health", async (req, res) => {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
    };

    // Test database with actual query
    let dbHealth = { status: "unknown", latency: null };

    try {
      const startTime = Date.now();
      // Ping the database to test connection
      await mongoose.connection.db.admin().ping();
      const latency = Date.now() - startTime;

      dbHealth = {
        status: "connected",
        latency: `${latency}ms`,
        readyState: mongoose.connection.readyState,
      };
    } catch (dbError) {
      dbHealth = {
        status: "disconnected",
        error: dbError.message,
        readyState: mongoose.connection.readyState,
      };
      healthCheck.success = false;
    }

    healthCheck.database = dbHealth;
    healthCheck.server = {
      status: "running",
      memory: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      uptime: `${process.uptime().toFixed(2)}s`,
    };

    const statusCode = healthCheck.success ? 200 : 503;
    apiResponse({
      res,
      status: statusCode,
      success: true,
      message: "All systems operational",
      data: healthCheck,
    });
  } catch (error) {
    apiResponse({
      res,
      status: 500,
      isConsole: true,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  }
});

app.get("/", (req, res) => {
  try {
    apiResponse({
      res,
      status: 200,
      success: true,
      message: "Chat Up backend is running...",
      data: {
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        author: "Muhammad Hassan",
        repository: {
          type: "git",
          url: "https://github.com/hassanshakil12/chatup-backend.git",
        },
      },
    });
  } catch (error) {
    apiResponse({
      res,
      status: 500,
      isConsole: true,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  }
});

export default app;
