import mongoose from "mongoose";

import User from "../../models/User.js";
import FriendList from "../../models/FriendList.js";
import FriendRequest from "../../models/FriendRequest.js";

import {
  apiResponse,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  handleCancelFriendRequest,
  removeBidirectionalFriendship,
  updateRelatedFriendRequests,
} from "../../utils/handlers/index.js";
import { validateIfFriends } from "../../utils/validators/index.js";

export const getUserFriendList = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "USER") {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "User unauthorized to access",
      });
    }

    const data = await FriendList.findOne({ userId: user._id }).lean();
    if (!data) {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "Friend list not found",
      });
    }

    return apiResponse({
      res,
      status: 200,
      success: true,
      message: "Friend list fetched successfully",
      data: data.friends,
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

export const getBlockedFriends = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "USER") {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "User unauthorized to access",
      });
    }

    const data = await FriendList.findOne({ userId: user._id }).lean();
    if (!data) {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "Friend list not found",
      });
    }

    const blockedFriends = data.friends.filter((friend) => friend.isBlocked);

    return apiResponse({
      res,
      status: 200,
      success: true,
      message: "Blocked friends fetched successfully",
      data: blockedFriends,
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

export const searchFriends = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "USER") {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "User unauthorized to access",
      });
    }
    const { search } = req.query;
    if (!search.trim()) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "No user found",
      });
    }
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

export const sendFriendRequest = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "USER") {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "User unauthorized to access",
      });
    }

    const { id } = req.params;
    const { message } = req.body;

    const receiverId = id?.trim();
    if (!receiverId || !mongoose.isValidObjectId(receiverId)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Valid user ID is required",
      });
    }

    if (user._id.toString() === receiverId) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Cannot send friend request to yourself",
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "User not found",
      });
    }

    if (receiver.isBlocked) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Cannot send request to blocked user",
      });
    }

    if (message !== undefined) {
      const trimmedMessage = message?.trim() || "";

      if (trimmedMessage.length > 0) {
        if (trimmedMessage.length > 500) {
          return apiResponse({
            res,
            status: 400,
            success: false,
            message: "Message must not exceed 500 characters",
          });
        }
      }
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: user._id, receiver: receiverId },
        { sender: receiverId, receiver: user._id },
      ],
      status: { $in: ["PENDING", "ACCEPTED"] },
    });

    if (existingRequest) {
      let message = "";
      if (existingRequest.status === "PENDING") {
        if (existingRequest.sender.toString() === user._id.toString()) {
          message = "Friend request already sent";
        } else {
          message = "This user has already sent you a friend request";
        }
      } else if (existingRequest.status === "ACCEPTED") {
        message = "You are already friends with this user";
      }

      return apiResponse({
        res,
        status: 400,
        success: false,
        message,
        data: { existingRequestId: existingRequest._id },
      });
    }

    const areAlreadyFriends = await validateIfFriends(user._id, receiverId);
    if (areAlreadyFriends) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "You are already friends with this user",
      });
    }

    const request = await FriendRequest.create({
      sender: user._id,
      receiver: receiverId,
      message: message?.trim() || "",
    });
    if (!request) {
      return apiResponse({
        res,
        status: 500,
        success: false,
        message: "Failed to send friend request",
      });
    }

    return apiResponse({
      res,
      status: 201,
      success: true,
      message: "Friend request sent successfully",
      data: request,
    });
  } catch (error) {
    console.error("Send friend request error:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Friend request already exists",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }

    return apiResponse({
      res,
      status: 500,
      isConsole: true,
      code: "SERVER_ERROR",
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "An error occurred while sending friend request"
          : error.message,
    });
  }
};

export const updateFriendRequest = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "USER") {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "User unauthorized to access",
      });
    }

    const { id } = req.params;
    const { action } = req.body;

    const requestId = id?.trim();
    if (!requestId || !mongoose.isValidObjectId(requestId)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Valid request ID is required",
      });
    }

    const validActions = ["accept", "reject", "cancel"];
    if (!action || !validActions.includes(action.toLowerCase())) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: `Action must be one of: ${validActions.join(", ")}`,
      });
    }

    const friendRequest = await FriendRequest.findById(requestId)
      .populate(
        "sender",
        "username displayName profileImage isBlocked isActive"
      )
      .populate(
        "receiver",
        "username displayName profileImage isBlocked isActive"
      );

    if (!friendRequest) {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "Friend request not found",
      });
    }

    if (
      friendRequest.sender.isBlocked ||
      !friendRequest.sender.isActive ||
      friendRequest.receiver.isBlocked ||
      !friendRequest.receiver.isActive
    ) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Cannot process request with inactive or blocked users",
      });
    }

    const isSender =
      friendRequest.sender._id.toString() === user._id.toString();
    const isReceiver =
      friendRequest.receiver._id.toString() === user._id.toString();

    if (action === "cancel" && !isSender) {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "Only the sender can cancel a friend request",
      });
    }

    if ((action === "accept" || action === "reject") && !isReceiver) {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "Only the receiver can accept or reject a friend request",
      });
    }

    // Check request status
    if (friendRequest.status !== "pending") {
      const statusMessages = {
        accepted: "Friend request already accepted",
        rejected: "Friend request already rejected",
        cancelled: "Friend request already cancelled",
      };

      return apiResponse({
        res,
        status: 400,
        success: false,
        message:
          statusMessages[friendRequest.status] ||
          "Request is no longer pending",
        data: { currentStatus: friendRequest.status },
      });
    }

    // Start database transaction for data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let result = {};

      switch (action.toLowerCase()) {
        case "accept":
          result = await handleAcceptFriendRequest(
            friendRequest,
            user,
            session
          );
          break;
        case "reject":
          result = await handleRejectFriendRequest(
            friendRequest,
            user,
            session
          );
          break;
        case "cancel":
          result = await handleCancelFriendRequest(
            friendRequest,
            user,
            session
          );
          break;
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return apiResponse({
        res,
        status: 200,
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (transactionError) {
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
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

export const updateFriendSettings = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "USER") {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "User unauthorized to access",
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const friendId = id?.trim();
    if (!friendId || !mongoose.isValidObjectId(friendId)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Valid friend ID is required",
      });
    }

    // Check if they are friends
    const areFriends = await validateIfFriends(user._id, friendId);
    if (!areFriends) {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "User is not in your friend list",
      });
    }

    // Find user's friend list
    const friendList = await FriendList.findOne({ userId: user._id });
    if (!friendList) {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "Friend list not found",
      });
    }

    // Find the friend in the list
    const friendIndex = friendList.friends.findIndex(
      (f) => f.id.toString() === friendId.toString()
    );
    if (friendIndex === -1) {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "Friend not found in your list",
      });
    }

    // Validate allowed updates
    const allowedUpdates = ["nickName", "isMuted", "chatColor", "isBlocked"];
    const updateKeys = Object.keys(updates);

    const isValidUpdate = updateKeys.every((key) =>
      allowedUpdates.includes(key)
    );
    if (!isValidUpdate) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: `Only ${allowedUpdates.join(", ")} can be updated`,
      });
    }

    // Apply updates
    updateKeys.forEach((key) => {
      friendList.friends[friendIndex][key] = updates[key];
    });

    await friendList.save();

    return apiResponse({
      res,
      status: 200,
      success: true,
      message: "Friend settings updated successfully",
      data: {
        friend: friendList.friends[friendIndex],
      },
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

export const removeFriend = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "USER") {
      return apiResponse({
        res,
        status: 403,
        success: false,
        message: "User unauthorized to access",
      });
    }

    const { id } = req.params;

    const friendId = id?.trim();
    if (!friendId || !mongoose.isValidObjectId(friendId)) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Valid friend ID is required",
      });
    }

    // Prevent removing yourself
    if (user._id.toString() === friendId) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Cannot remove yourself as a friend",
      });
    }

    // Check if friend exists as a user
    const friendUser = await User.findById(friendId).select(
      "_id username displayName profileImage isBlocked isActive"
    );
    if (!friendUser) {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "User not found",
      });
    }

    if (friendUser.isBlocked || !friendUser.isActive) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Cannot remove inactive or blocked user",
      });
    }

    // Start database transaction for data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const areFriends = await validateIfFriends(user._id, friendId);
      if (!areFriends) {
        return apiResponse({
          res,
          status: 400,
          success: false,
          message: "User is not in your friend list",
        });
      }

      // Remove friend from both users' friend lists
      const removalResult = await removeBidirectionalFriendship(
        user._id,
        friendId,
        session
      );

      // Update related friend requests (optional - archive them)
      await updateRelatedFriendRequests(user._id, friendId, session);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return apiResponse({
        res,
        status: 200,
        success: true,
        message: "Friend removed successfully",
        data: {
          removedFriend: {
            _id: friendUser._id,
            username: friendUser.username,
            displayName: friendUser.displayName,
            profileImage: friendUser.profileImage,
          },
          removalDetails: removalResult,
          timestamp: new Date(),
        },
      });
    } catch (transactionError) {
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
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
