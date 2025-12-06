import geocoder from "../../config/geocoder.js";

import FriendList from "../../models/FriendList.js";

export const USERNAME_VALIDATOR = /^(?![0-9])(?=.*[a-z])[a-z0-9_.]{3,30}$/;
export const DISPLAY_NAME_VALIDATOR = /^[a-zA-Z ]{3,50}$/;
export const EMAIL_VALIDATOR =
  /^(?:[a-zA-Z0-9_'^&amp;+{}~.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
export const PHONE_NUMBER_VALIDATOR = /^\+?[1-9]\d{1,14}$/;
export const USER_BIO_VALIDATOR = /^[\p{L}\p{N}\p{P}\p{S}\p{Zs}]{1,300}$/u;
export const USER_CAPTION_VALIDATOR = /^[\p{L}\p{N}\p{S}\p{P}\p{Zs}]{1,100}$/u;
export const USER_LINKS_VALIDATOR =
  /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;

export const validateBirthDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  const today = new Date();
  const year = date.getFullYear();

  // Age limits
  const age = today.getFullYear() - year;

  if (age < Number(process.env.MIN_AGE)) return false;
  if (age > Number(process.env.MAX_AGE)) return false;

  if (date > today) return false;

  return true;
};

export const validateAndSetLocation = async (location) => {
  if (!location || typeof location !== "object")
    return { valid: false, message: "Location is required" };

  const { type, coordinates } = location;

  // Check type
  if (type !== "Point")
    return { valid: false, message: "Location type must be 'Point'" };

  // Check coordinates
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return {
      valid: false,
      message: "Coordinates must be an array of [longitude, latitude]",
    };
  }

  const [lng, lat] = coordinates;

  if (typeof lng !== "number" || typeof lat !== "number") {
    return { valid: false, message: "Coordinates must be numbers" };
  }

  if (lng < -180 || lng > 180)
    return { valid: false, message: "Longitude must be between -180 and 180" };
  if (lat < -90 || lat > 90)
    return { valid: false, message: "Latitude must be between -90 and 90" };

  // Reverse geocode to get the address
  try {
    const res = await geocoder.reverse({ lat, lon: lng });
    location.address =
      res && res.length > 0 ? res[0].formattedAddress : "Unknown location";
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    location.address = "Unknown location";
  }

  return { valid: true, location };
};

export const validateIfFriends = async (userId1, userId2) => {
  try {
    const result = await FriendList.aggregate([
      {
        $match: {
          $or: [
            {
              userId: new mongoose.Types.ObjectId(userId1),
              "friends.friendId": new mongoose.Types.ObjectId(userId2),
            },
            {
              userId: new mongoose.Types.ObjectId(userId2),
              "friends.friendId": new mongoose.Types.ObjectId(userId1),
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    return result.length > 0 && result[0].count === 2;
  } catch (error) {
    console.error("Error checking friendship:", error);
    return false;
  }
};

// Get mutual friends
export const getMutualFriends = async (userId1, userId2) => {
  try {
    const [user1List, user2List] = await Promise.all([
      FriendList.findOne({ userId: userId1 }).populate(
        "friends.friendId",
        "username displayName profileImage"
      ),
      FriendList.findOne({ userId: userId2 }).populate(
        "friends.friendId",
        "username displayName profileImage"
      ),
    ]);

    if (!user1List || !user2List) return [];

    const user1FriendIds = user1List.friends.map((f) =>
      f.friendId._id.toString()
    );
    const user2FriendIds = user2List.friends.map((f) =>
      f.friendId._id.toString()
    );

    const mutualIds = user1FriendIds.filter((id) =>
      user2FriendIds.includes(id)
    );

    return mutualIds;
  } catch (error) {
    console.error("Error getting mutual friends:", error);
    return [];
  }
};
