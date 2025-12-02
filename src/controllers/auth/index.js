import mongoose from "mongoose";

import User from "../../models/User.js";

import OTPService from "../../services/otp.js";
import { sendEmailDirect } from "../../services/email.js";

import { apiResponse } from "../../utils/handlers/index.js";
import { generateAuthToken } from "../../utils/generators/index.js";
import { USER_GENDERS, USER_EMAIL_TYPES } from "../../enums/userEnums.js";

export const loginUser = async (req, res) => {
  try {
    const email = req.body.email.tolowerCase();

    if (!email || !email.trim()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Email is required",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Invalid email format",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "User not found",
      });
    } else if (user.isBlocked) {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "User is blocked",
      });
    }

    const otpServiceInstance = new OTPService();
    const result = await otpServiceInstance.createOTP(user.email, "SIGNIN");
    if (!result.success) {
      return apiResponse({
        res,
        status: 500,
        success: false,
        message: "Failed to generate OTP",
      });
    }

    const emailSent = await sendEmailDirect({
      to: user.email,
      subject: "User Verification OTP",
      template: "verificationOTP",
      context: {
        code: result.otp,
        username: user.username,
        expiryTime: new Date(result.expiresAt).toLocaleTimeString(),
        supportEmail: process.env.SUPPORT_EMAIL,
      },
    });
    if (!emailSent.success) {
      return apiResponse({
        res,
        status: 500,
        success: false,
        message: "Failed to send email",
      });
    }

    return apiResponse({
      res,
      status: 200,
      success: true,
      message: `OTP sent to ${email} successfully`,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: 500,
      isConsole: true,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  }
};

export const registerUser = async (req, res) => {
  try {
    let { username, displayName, email, birthDate, gender } = req.body;

    username = username.toLowerCase();
    if (!username || !username.trim()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Username is required",
      });
    } else if (username.length < 3 || username.length > 30) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Username must be between 3 and 30 characters",
      });
    }
    if (!/^(?![0-9])(?=.*[a-z])[a-z0-9_.]{3,30}$/.test(username)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message:
          "Username must not start with a number, must contain at least one letter, 3-30 characters, and can only contain lowercase letters, numbers, underscores, and dots",
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return apiResponse({
        res,
        status: 409,
        success: false,
        message: "Username already in use",
      });
    }

    if (!displayName || !displayName.trim()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Display name is required",
      });
    } else if (displayName.length < 3 || displayName.length > 50) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Display name must be between 3 and 50 characters",
      });
    } else if (!/^[a-zA-Z ]{3,50}$/.test(displayName)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message:
          "Display name can only contain letters and spaces, 3-50 characters",
      });
    }

    email = email.toLowerCase();
    if (!email || !email.trim()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Email is required",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Invalid email format",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return apiResponse({
        res,
        status: 409,
        success: false,
        message: "Email already in use",
      });
    }

    birthDate = new Date(birthDate);
    if (isNaN(birthDate.getTime())) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Invalid birth date",
      });
    } else if (birthDate > new Date()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Birth date cannot be in the future",
      });
    } else if (birthDate < new Date("1900-01-01")) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Birth date is too far in the past",
      });
    } else if (new Date().getFullYear() - birthDate.getFullYear() < 13) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "You must be at least 13 years old to register",
      });
    }

    if (!gender || !gender.trim()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Gender is required",
      });
    } else if (!USER_GENDERS.includes(gender)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Invalid gender value",
      });
    }

    const OTPServiceInstance = new OTPService();
    const otpData = await OTPServiceInstance.createOTP(email, "SIGNUP", {
      username,
      displayName,
      email,
      birthDate,
      gender,
      userAuthType: "EMAIL",
    });
    if (!otpData.success) {
      return apiResponse({
        res,
        status: 500,
        success: false,
        message: "Failed to generate OTP",
      });
    }

    const emailSent = await sendEmailDirect({
      to: email,
      subject: "User Verification OTP",
      template: "verificationOTP",
      context: {
        code: otpData.otp,
        username,
        expiryTime: new Date(otpData.expiresAt).toLocaleTimeString(),
        supportEmail: process.env.SUPPORT_EMAIL,
      },
    });
    if (!emailSent.success) {
      return apiResponse({
        res,
        status: 500,
        success: false,
        message: "Failed to send OTP email",
      });
    }

    return apiResponse({
      res,
      status: 201,
      success: true,
      message: `OTP sent to ${email} successfully`,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: 500,
      isConsole: true,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { identifier, type } = req.query;

    if (!identifier || !identifier.trim()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Identifier is required",
      });
    } else if (!type || !type.trim()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "OTP type is required",
      });
    } else if (!USER_EMAIL_TYPES.includes(type)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Invalid OTP type",
      });
    }

    const otpServiceInstance = new OTPService();
    const result = await otpServiceInstance.resendOTP(identifier, type);
    if (!result.success) {
      return apiResponse({
        res,
        status: 500,
        success: false,
        message: "Failed to resend OTP",
      });
    }

    const emailSent = await sendEmailDirect({
      to: identifier,
      subject: "Resent OTP Verification",
      template: "verificationOTP",
      context: {
        code: result.otp,
        expiryTime: new Date(result.expiresAt).toLocaleTimeString(),
        username: result.username,
        supportEmail: process.env.SUPPORT_EMAIL,
      },
    });
    if (!emailSent.success) {
      return apiResponse({
        res,
        status: 500,
        success: false,
        message: "Failed to send OTP email",
      });
    }

    return apiResponse({
      res,
      status: 200,
      success: true,
      message: `OTP resent to ${identifier} successfully`,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: 500,
      isConsole: true,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { identifier, type } = req.query;
    let { otp } = req.body;

    // otp = Number(otp)
    if (!identifier || !identifier.trim()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Identifier is required",
      });
    } else if (!type || !type.trim()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "OTP type is required",
      });
    } else if (!USER_EMAIL_TYPES.includes(type)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Invalid OTP type",
      });
    } else if (!otp) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "OTP is required",
      });
    } else if (!/^\d{6}$/.test(otp)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "OTP must be a 6-digit number",
      });
    }

    const otpServiceInstance = new OTPService();
    const result = await otpServiceInstance.verifyOTP(identifier, type, otp);
    if (!result.success) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: result.message,
      });
    } else if (result.type !== type) {
      return apiResponse({
        res,
        status: 200,
        success: true,
        message: "OTP verified successfully",
        data: result.data,
      });
    }

    let user;
    let successMsg;
    if (result.type === "SIGNUP") {
      user = new User(result.data);
      await user.save();
      if (!user) {
        return apiResponse({
          res,
          status: 500,
          success: false,
          message: "Failed to create user",
        });
      }
      successMsg = "User registered and OTP verified successfully";
    } else if (result.type === "SIGNIN") {
      user = await User.findOne({ email: identifier });
      if (!user) {
        return apiResponse({
          res,
          status: 404,
          success: false,
          message: "User not found",
        });
      }
      successMsg = "OTP verified successfully";
    }

    const authToken = generateAuthToken({
      userId: user._id,
      role: user.role,
    });
    if (!authToken) {
      return apiResponse({
        res,
        status: 500,
        success: false,
        message: "Failed to generate auth token",
      });
    }

    return apiResponse({
      res,
      status: 201,
      success: true,
      message: successMsg,
      data: { user: user, authToken },
    });
  } catch (error) {
    return apiResponse({
      res,
      status: 500,
      isConsole: true,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  }
};

export const socialLogin = async (req, res) => {
  try {
  } catch (error) {
    return apiResponse({
      res,
      status: 500,
      isConsole: true,
      code: "SERVER_ERROR",
      success: false,
      message: error.message,
    });
  }
};
