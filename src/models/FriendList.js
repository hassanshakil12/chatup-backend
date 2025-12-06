import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const friendListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

friendListSchema.index({ userId: 1, "friends.friendId": 1 });

friendListSchema.methods.addFriend = function (friendId, options = {}) {
  const existingFriendIndex = this.friends.findIndex(
    (f) => f.id.toString() === friendId.toString()
  );

  if (existingFriendIndex === -1) {
    this.friends.push({
      id: friendId, // Changed from friendId to id
      nickName: options.nickName,
      addedAt: new Date(),
      chatColor: options.chatColor,
    });
    return true;
  }
  return false;
};

friendListSchema.methods.removeFriend = function (friendId) {
  const initialLength = this.friends.length;
  this.friends = this.friends.filter(
    (f) => f.id.toString() !== friendId.toString()
  );
  return this.friends.length < initialLength;
};

export default mongoose.model("FriendList", friendListSchema);
