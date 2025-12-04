import mongoose from "mongoose";
import {
  MESSAGE_CATEGORIES,
  MESSAGE_MEDIA_CATEGORIES,
  LOCATION_CATEGORIES,
} from "../enums/messageEnums.js";

const mediaSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: MESSAGE_MEDIA_CATEGORIES,
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: LOCATION_CATEGORIES,
      required: true,
      index: true,
    },
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
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      index: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    category: {
      type: String,
      enum: MESSAGE_CATEGORIES,
      default: "TEXT",
    },
    text: {
      type: String,
      trim: true,
    },
    media: {
      type: [mediaSchema],
    },
    voice: {
      type: String,
      trim: true,
    },
    location: locationSchema,
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
