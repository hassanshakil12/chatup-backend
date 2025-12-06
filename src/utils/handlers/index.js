import FriendList from "../../models/FriendList.js";
import FriendRequest from "../../models/FriendRequest.js";

export const apiResponse = ({
  res,
  status,
  isConsole = false,
  code = null,
  success = true,
  message = null,
  data = null,
}) => {
  if (isConsole) {
    console.log(`${code} - ${message}`);
  }
  return res.status(status).json({ success, message, data });
};

export const sanitizeUserData = (data, SENSITIVE_FIELDS) => {
  const sanitized = { ...data };

  // Remove sensitive fields
  SENSITIVE_FIELDS.forEach((field) => {
    delete sanitized[field];
  });

  // Remove any fields with 'token' in the name (safety catch)
  Object.keys(sanitized).forEach((key) => {
    if (key.toLowerCase().includes("token")) {
      delete sanitized[key];
    }
  });

  // Remove any fields with 'secret' in the name
  Object.keys(sanitized).forEach((key) => {
    if (key.toLowerCase().includes("secret")) {
      delete sanitized[key];
    }
  });

  return sanitized;
};

export const calculateUserProfileCompletion = (user) => {
  const completionFields = [
    { field: "email", weight: 10 },
    { field: "displayName", weight: 10 },
    { field: "phoneNumber", weight: 10 },
    { field: "birthDate", weight: 10 },
    { field: "gender", weight: 10 },
    { field: "profileImage", weight: 10 },
    { field: "coverImage", weight: 10 },
    { field: "bio", weight: 10 },
    { field: "website", weight: 10 },
    { field: "caption", weight: 10 },
  ];

  let completion = 0;
  completionFields.forEach(({ field, weight }) => {
    if (user[field]) {
      if (Array.isArray(user[field]) && user[field].length > 0) {
        completion += weight;
      } else if (!Array.isArray(user[field]) && user[field].toString().trim()) {
        completion += weight;
      }
    }
  });

  return Math.min(100, completion);
};

export const sanitizeUserEditableFields = (data, EDITABLE_FIELDS) => {
  // Handle null/undefined input
  if (!data || typeof data !== "object") {
    return {};
  }

  const sanitizedData = {};

  // Iterate through allowed fields and include only if they exist in data
  EDITABLE_FIELDS.forEach((field) => {
    if (data.hasOwnProperty(field)) {
      sanitizedData[field] = data[field];
    }
  });

  return sanitizedData;
};

export const handleAcceptFriendRequest = async (
  friendRequest,
  user,
  session
) => {
  // Check if users are already friends
  const areAlreadyFriends = await checkIfFriends(
    friendRequest.sender._id,
    user._id
  );

  if (areAlreadyFriends) {
    friendRequest.status = "accepted";
    friendRequest.acceptedAt = new Date();
    await friendRequest.save({ session });

    return {
      message: "You are already friends with this user",
      data: { requestId: friendRequest._id, alreadyFriends: true },
    };
  }

  // Update friend request
  friendRequest.status = "accepted";
  friendRequest.acceptedAt = new Date();
  await friendRequest.save({ session });

  // Create bidirectional friendship in FriendList
  await createBidirectionalFriendship(
    friendRequest.sender._id,
    user._id,
    session
  );

  // Create notification for sender
  await Notification.create(
    [
      {
        user: friendRequest.sender._id,
        type: "friend_request_accepted",
        title: "Friend Request Accepted",
        message: `${
          user.displayName || user.username
        } accepted your friend request`,
        data: {
          requestId: friendRequest._id,
          acceptorId: user._id,
        },
        actionUrl: `/profile/${user._id}`,
        isRead: false,
      },
    ],
    { session }
  );

  return {
    message: "Friend request accepted successfully",
    data: {
      request: {
        id: friendRequest._id,
        status: friendRequest.status,
        acceptedAt: friendRequest.acceptedAt,
        message: friendRequest.message,
      },
      friendship: {
        sender: {
          _id: friendRequest.sender._id,
          username: friendRequest.sender.username,
          displayName: friendRequest.sender.displayName,
          profileImage: friendRequest.sender.profileImage,
        },
        receiver: {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          profileImage: user.profileImage,
        },
        establishedAt: new Date(),
      },
    },
  };
};

export const handleRejectFriendRequest = async (
  friendRequest,
  user,
  session
) => {
  friendRequest.status = "rejected";
  friendRequest.rejectedAt = new Date();
  await friendRequest.save({ session });

  // Create notification for sender
  await Notification.create(
    [
      {
        user: friendRequest.sender._id,
        type: "friend_request_rejected",
        title: "Friend Request Declined",
        message: `${
          user.displayName || user.username
        } declined your friend request`,
        data: {
          requestId: friendRequest._id,
          rejectorId: user._id,
        },
        actionUrl: `/profile/${user._id}`,
        isRead: false,
      },
    ],
    { session }
  );

  return {
    message: "Friend request rejected",
    data: {
      requestId: friendRequest._id,
      status: friendRequest.status,
      rejectedAt: friendRequest.rejectedAt,
    },
  };
};

export const handleCancelFriendRequest = async (
  friendRequest,
  user,
  session
) => {
  friendRequest.status = "cancelled";
  friendRequest.cancelledAt = new Date();
  await friendRequest.save({ session });

  // Create notification for receiver
  await Notification.create(
    [
      {
        user: friendRequest.receiver._id,
        type: "friend_request_cancelled",
        title: "Friend Request Cancelled",
        message: `${
          user.displayName || user.username
        } cancelled their friend request`,
        data: {
          requestId: friendRequest._id,
          cancellerId: user._id,
        },
        isRead: false,
      },
    ],
    { session }
  );

  return {
    message: "Friend request cancelled",
    data: {
      requestId: friendRequest._id,
      status: friendRequest.status,
      cancelledAt: friendRequest.cancelledAt,
    },
  };
};

const createBidirectionalFriendship = async (
  userId1,
  userId2,
  session = null
) => {
  try {
    const options = session ? { session } : {};

    // Use bulk operations for better performance
    const bulkOps = [];

    // Add user2 to user1's friend list
    bulkOps.push({
      updateOne: {
        filter: { userId: userId1 },
        update: {
          $addToSet: {
            friends: {
              id: userId2,
              addedAt: new Date(),
            },
          },
        },
        upsert: true,
      },
    });

    // Add user1 to user2's friend list
    bulkOps.push({
      updateOne: {
        filter: { userId: userId2 },
        update: {
          $addToSet: {
            friends: {
              id: userId1,
              addedAt: new Date(),
            },
          },
        },
        upsert: true,
      },
    });

    await FriendList.bulkWrite(bulkOps, options);

    return true;
  } catch (error) {
    console.error("Error creating bidirectional friendship:", error);
    throw error;
  }
};

export const removeBidirectionalFriendship = async (
  userId1,
  userId2,
  session = null
) => {
  try {
    const options = session ? { session } : {};

    // Use bulk operations for better performance
    const bulkOps = [
      // Remove friend2 from user1's friend list
      {
        updateOne: {
          filter: { userId: userId1 },
          update: {
            $pull: {
              friends: { id: userId2 },
            },
          },
        },
      },
      // Remove user1 from friend2's friend list
      {
        updateOne: {
          filter: { userId: userId2 },
          update: {
            $pull: {
              friends: { id: userId1 },
            },
          },
        },
      },
    ];

    const result = await FriendList.bulkWrite(bulkOps, options);

    // If no documents were modified, check if friend lists exist
    if (result.modifiedCount === 0) {
      // Check if friend lists actually exist
      const [user1List, user2List] = await Promise.all([
        FriendList.findOne({ userId: userId1 }),
        FriendList.findOne({ userId: userId2 }),
      ]);

      if (!user1List || !user2List) {
        throw new Error("Friend lists not found for one or both users");
      }
    }

    return {
      removedFromUser1: result.modifiedCount >= 1,
      removedFromUser2: result.modifiedCount >= 2,
      totalRemoved: result.modifiedCount,
    };
  } catch (error) {
    console.error("Error removing bidirectional friendship:", error);
    throw error;
  }
};

export const updateRelatedFriendRequests = async (
  userId1,
  userId2,
  session = null
) => {
  try {
    const options = session ? { session } : {};

    // Find and update any pending friend requests between these users
    const updateResult = await FriendRequest.updateMany(
      {
        $or: [
          { sender: userId1, receiver: userId2 },
          { sender: userId2, receiver: userId1 },
        ],
        status: "PENDING",
      },
      {
        $set: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      },
      options
    );

    // Also update any accepted requests to mark them as ended
    await FriendRequest.updateMany(
      {
        $or: [
          { sender: userId1, receiver: userId2 },
          { sender: userId2, receiver: userId1 },
        ],
        status: "ACCEPTED",
      },
      {
        $set: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      },
      options
    );

    return updateResult;
  } catch (error) {
    console.error("Error updating related friend requests:", error);
    // Don't throw - this is non-critical
    return null;
  }
};
