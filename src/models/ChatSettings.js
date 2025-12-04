import mongoose from "mongoose";
import {
  MESSAGING_ALLOWED_TO,
  TOGGLING_MEMBERS_ALLOWED_TO,
  DELETING_MESSAGE_ALLOWED_TO,
  CHANGING_SETTING_ALLOWED_TO,
  SHARING_CHAT_ALLOWED_TO,
  DELETING_CHAT_ALLOWED_TO,
  NAMING_MEMBER_ALLOWED_TO,
  ADDING_DESCRIPTION_ALLOWED_TO,
  NAMING_CHAT_ALLOWED_TO,
} from "../enums/chatEnums.js";

const chatSettingSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      index: true,
      required: true,
      unique: true,
    },
    messagingAllowedTo: {
      type: String,
      enum: MESSAGING_ALLOWED_TO,
      default: "ALL",
    },
    togglingMembersAllowedTo: {
      type: String,
      enum: TOGGLING_MEMBERS_ALLOWED_TO,
      default: "ALL",
    },
    deletingMessageAllowedTo: {
      type: String,
      enum: DELETING_MESSAGE_ALLOWED_TO,
      default: "ALL",
    },
    changingSettingAllowedTo: {
      type: String,
      enum: CHANGING_SETTING_ALLOWED_TO,
      default: "ADMIN",
    },
    sharingChatAllowedTo: {
      type: String,
      enum: SHARING_CHAT_ALLOWED_TO,
      default: "ALL",
    },
    deletingChatAllowedTo: {
      type: String,
      enum: DELETING_CHAT_ALLOWED_TO,
      default: "CREATOR",
    },
    namingMembersAllowedTo: {
      type: String,
      enum: NAMING_MEMBER_ALLOWED_TO,
      default: "ADMIN",
    },
    namingChatAllowedTo: {
      type: String,
      enum: NAMING_CHAT_ALLOWED_TO,
      default: "ADMIN",
    },
    addmingDescriptionAllowedTo: {
      type: String,
      enum: ADDING_DESCRIPTION_ALLOWED_TO,
      default: "ALL",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ChatSetting", chatSettingSchema);
