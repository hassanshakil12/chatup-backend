import mongoose from "mongoose";
import { CHAT_CATEGORIES } from "../enums/chatEnums.js";

const memberSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    nickName: {
      type: String,
      trim: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { _id: false, timestamps: true }
);

const adminSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    nickName: {
      type: String,
      trim: true,
    },
  },
  { _id: false, timestamps: true }
);

const premiumSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    nickName: {
      type: String,
      trim: true,
    },
  },
  { _id: false, timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
      unique: true,
    },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    settings: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSetting",
      index: true,
      unique: true,
      sparse: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    admins: {
      type: [adminSchema],
      default: [],
    },
    premiums: {
      type: [premiumSchema],
      default: [],
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    category: {
      type: String,
      enum: CHAT_CATEGORIES,
      index: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-validation hook for INDIVIDUAL chat constraints
chatSchema.pre("validate", function (next) {
  if (this.category === "INDIVIDUAL") {
    // Maximum 2 members
    if (this.members.length > 2) {
      return next(new Error("INDIVIDUAL chat can have maximum 2 members"));
    }

    // Maximum 1 admin
    if (this.admins.length > 1) {
      return next(new Error("INDIVIDUAL chat can have maximum 1 admin"));
    }
  }
  next();
});

// Pre-save hook to sync admins into members
chatSchema.pre("save", function (next) {
  const memberMap = new Map(this.members.map((m) => [m.id.toString(), m]));

  // Add/update admins in members array
  this.admins.forEach((admin) => {
    const adminId = admin.id.toString();
    if (memberMap.has(adminId)) {
      memberMap.get(adminId).isAdmin = true;
    } else {
      memberMap.set(adminId, {
        id: admin.id,
        nickName: admin.nickName || "",
        isAdmin: true,
      });
    }
  });

  this.members = Array.from(memberMap.values());
  next();
});

export default mongoose.model("Chat", chatSchema);
