import mongoose from "mongoose";
import { FRIEND_REQUEST_STATUS } from "../enums/requestEnums.js";

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    status: {
      type: String,
      enum: FRIEND_REQUEST_STATUS,
      required: true,
      default: "PENDING",
      index: true,
    },
    message: {
      type: String,
      trim: true,
    },
    acceptedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("FriendRequest", friendRequestSchema);
