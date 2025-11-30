import express from "express";
import mongoose from "mongoose";
import { apiResponse } from "./utils/handlers/index.js";

const app = express();

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
      console: true,
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
      console: true,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  }
});

export default app;
