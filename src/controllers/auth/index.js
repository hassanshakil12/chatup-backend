import mongoose from "mongoose";

import User from "../../models/User.js";

import { apiResponse } from "../../utils/handlers/index.js";
import { generateAuthToken } from "../../utils/generators/index.js";

export const loginUser = async (req, res) => {
  const session = mongoose.startSession();
  try {
    await session.startTransaction();

    const email = req.body.email.tolowerCase();

    if (!email.trim()) {
      await session.abortTransaction();
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Email is required",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await session.abortTransaction();
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Invalid email format",
      });
    }

    const user = await User.findOne({ email }).session(session);
    if (!user) {
      await session.abortTransaction();
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "User not found",
      });
    } else if (user.isBlocked) {
      await session.abortTransaction();
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "User is blocked",
      });
    }

    

    await session.commitTransaction();
    return apiResponse({
      res,
      status: 200,
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    apiResponse({
      res,
      status: 500,
      console: true,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};

export const registerUser = async (req, res) => {
  const session = mongoose.startSession();
  try {
    session.startTransaction();
    const { username, displayName, email, birthDate } = req.body;

    // Registration logic goes here
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    apiResponse({
      res,
      status: 500,
      console: true,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};
