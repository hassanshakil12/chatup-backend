import mongoose from "mongoose";
import { USER_GENDERS, USER_AUTH_TYPES } from "../enums/userEnums.js";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: "USER",
      index: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    profileImage: {
      type: String,
      trim: true,
      default: `${process.env.BASE_URL}/uploads/defaults/default_profile_image.jpg`,
    },
    coverImage: {
      type: String,
      trim: true,
      default: `${process.env.BASE_URL}/uploads/defaults/default_profile_image.jpg`,
    },
    caption: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
        index: "2dsphere",
      },
      address: {
        type: String,
        trim: true,
      },
    },
    website: {
      type: String,
      trim: true,
    },
    birthDate: {
      type: Date,
      index: true,
    },
    gender: {
      type: String,
      enum: USER_GENDERS,
      trim: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastLogin: {
      type: Date,
    },
    userDeviceToken: {
      type: String,
    },
    userSocialToken: {
      type: String,
    },
    userAuthType: {
      type: String,
      enum: USER_AUTH_TYPES,
    },
    uniqueProvideId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
