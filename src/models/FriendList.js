import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    nickName: {
      type: String,
      trim: true,
    },
    isMuted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    chatColor: {
      type: String,
      trim: true,
    },
  },
  { _id: false, timestamps: true }
);

const friendListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    friends: {
      type: [friendSchema],
      default: [],
      validate: {
        validator: function (arr) {
          // Ensure no duplicate friend IDs
          const ids = arr.map((f) => f.id.toString());
          return ids.length === new Set(ids).size;
        },
        message: "Duplicate friend IDs are not allowed",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("FriendList", friendListSchema);
