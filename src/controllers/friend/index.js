import User from "../../models/User.js";
import FriendList from "../../models/FriendList.js";

import { apiResponse } from "../../utils/handlers/index.js";

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
