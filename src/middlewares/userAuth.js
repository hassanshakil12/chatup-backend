import jwt from "jsonwebtoken";
import { apiResponse } from "../utils/handlers/index.js";
import User from "../models/User.js";

const userAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return apiResponse({
        res,
        status: 401,
        success: false,
        message: "Authorization header is required",
      });
    }

    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return apiResponse({
        res,
        status: 401,
        success: false,
        message: "Token format should be: Bearer <token>",
      });
    }

    const token = parts[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"], // Specify allowed algorithms
        ignoreExpiration: false, // Explicitly don't ignore expiration
      });
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return apiResponse({
          res,
          status: 401,
          success: false,
          message: "Token has expired. Please login again.",
        });
      } else if (jwtError.name === "JsonWebTokenError") {
        return apiResponse({
          res,
          status: 401,
          success: false,
          message: "Invalid token",
        });
      }
      throw jwtError;
    }

    if (!decoded._id) {
      return apiResponse({
        res,
        status: 401,
        success: false,
        message: "Invalid token payload",
      });
    }

    const user = await User.findById(decoded._id).lean();

    if (!user) {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "Please login to proceed",
      });
    }

    if (user.isBlocked) {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "Your account has been blocked. Please contact support.",
      });
    }

    if (!user.isVerified) {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "Please verify your email to access this resource",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Log the error for debugging
    console.error("Authentication error:", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      endpoint: req.originalUrl,
      method: req.method,
    });

    return apiResponse({
      res,
      status: 500,
      isConsole: true,
      code: "SERVER_ERROR",
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message,
    });
  }
};

export default userAuth;
