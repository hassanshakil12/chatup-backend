import fs from "fs/promises";
import path from "path";

import User from "../../models/User.js";

import {
  apiResponse,
  sanitizeUserData,
  sanitizeUserEditableFields,
} from "../../utils/handlers/index.js";
import {
  USER_SENSITIVE_FIELDS,
  USER_EDITABLE_FIELDS,
  USER_GENDERS,
} from "../../enums/userEnums.js";
import {
  EMAIL_VALIDATOR,
  DISPLAY_NAME_VALIDATOR,
  PHONE_NUMBER_VALIDATOR,
  USER_BIO_VALIDATOR,
  USER_CAPTION_VALIDATOR,
  USER_LINKS_VALIDATOR,
  validateBirthDate,
  validateAndSetLocation,
} from "../../utils/validators/index.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "USER") {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "User unauthorized to access",
      });
    }

    const profile = await User.findById(user._id).lean();
    if (!profile || profile.role !== "USER") {
      return apiResponse({
        res,
        status: 404,
        success: false,
        message: "User not found",
      });
    } else if (profile.isBlocked) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "User is blocked",
      });
    } else if (!profile.isVerified) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "User not verified",
      });
    } else if (!profile.isActive) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "User not active",
      });
    }

    const result = sanitizeUserData(profile, USER_SENSITIVE_FIELDS);
    if (!result) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Failed to sanitize data",
      });
    }

    return apiResponse({
      res,
      status: 200,
      success: true,
      message: "User profile fetched successfully",
      data: result,
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

export const uploadUserProfileImage = async (req, res) => {
  let previousImagePath = null;

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

    const file = req.file;

    if (!file) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "No file uploaded",
      });
    }

    // Store the current profile image path before updating
    if (user.profileImage) {
      // Extract filename from URL and construct full path
      const filename = path.basename(user.profileImage);
      previousImagePath = path.join(
        process.cwd(),
        "uploads",
        "profileImages",
        filename
      );
    }

    const imageUrl = `${process.env.BASE_URL}/uploads/profileImages/${file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { profileImage: imageUrl },
      { new: true }
    );

    if (!updatedUser) {
      if (file.path) {
        await fs.unlink(file.path);
      }
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Failed to upload profile image",
      });
    }

    if (previousImagePath) {
      try {
        await fs.unlink(previousImagePath);
        console.log(`Deleted previous profile image: ${previousImagePath}`);
      } catch (deleteError) {
        console.warn(`Could not delete previous image: ${deleteError.message}`);
      }
    }

    return apiResponse({
      res,
      status: 200,
      success: true,
      message: "Profile Image uploaded successfully",
      data: {
        user: updatedUser,
        imageUrl,
        previousImageDeleted: previousImagePath !== null,
      },
    });
  } catch (error) {
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded file:", cleanupError.message);
      }
    }

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

export const uploadUserCoverImage = async (req, res) => {
  let previousImagePath = null;

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

    const file = req.file;

    if (!file) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "No file uploaded",
      });
    }

    // Store the current profile image path before updating
    if (user.coverImage) {
      // Extract filename from URL and construct full path
      const filename = path.basename(user.coverImage);
      previousImagePath = path.join(
        process.cwd(),
        "uploads",
        "coverImages",
        filename
      );
    }

    const imageUrl = `${process.env.BASE_URL}/uploads/coverImages/${file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { coverImage: imageUrl },
      { new: true }
    );

    if (!updatedUser) {
      if (file.path) {
        await fs.unlink(file.path);
      }
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Failed to upload cover image",
      });
    }

    if (previousImagePath) {
      try {
        await fs.unlink(previousImagePath);
        console.log(`Deleted previous cover image: ${previousImagePath}`);
      } catch (deleteError) {
        console.warn(`Could not delete previous image: ${deleteError.message}`);
      }
    }

    return apiResponse({
      res,
      status: 200,
      success: true,
      message: "Cover Image uploaded successfully",
      data: {
        user: updatedUser,
        imageUrl,
        previousImageDeleted: previousImagePath !== null,
      },
    });
  } catch (error) {
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded file:", cleanupError.message);
      }
    }

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

export const editUserProfile = async (req, res) => {
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

    const data = sanitizeUserEditableFields(req.body, USER_EDITABLE_FIELDS);
    if (!data) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Field(s) are not allowed to edit",
      });
    }

    if (data.username) {
      data.username = data.username.toLowerCase();

      const existing = await User.findOne({
        username: data.username,
        _id: { $ne: user._id },
      }).lean();
      if (existing) {
        return apiResponse({
          res,
          status: 400,
          success: false,
          message: "Username already exists",
        });
      }
    }

    if (data.displayName) {
      data.displayName = data.displayName;
      if (!DISPLAY_NAME_VALIDATOR.test(data.displayName)) {
        return apiResponse({
          res,
          status: 400,
          success: false,
          message: "Display name must be between 3 to 50 letters",
        });
      }
    }

    if (data.phoneNumber) {
      data.phoneNumber = data.phoneNumber;
      if (!PHONE_NUMBER_VALIDATOR.test(data.phoneNumber)) {
        return apiResponse({
          res,
          status: 400,
          success: false,
          message: "Invalid Phone Number format",
        });
      }
    }

    if (data.bio) {
      data.bio = data.bio;
      if (!USER_BIO_VALIDATOR.test(data.bio)) {
        return apiResponse({
          res,
          status: 400,
          success: false,
          message: "Invalid Bio format",
        });
      }
    }

    if (data.caption) {
      data.caption = data.caption;
      if (!USER_CAPTION_VALIDATOR.test(data.caption)) {
        return apiResponse({
          res,
          status: 400,
          success: false,
          message: "Invalid caption format",
        });
      }
    }

    if (data.website) {
      data.website = data.website.toLowerCase();
      if (!USER_LINKS_VALIDATOR.test(data.website)) {
        return apiResponse({
          res,
          status: 400,
          success: false,
          message: "Invalid website format",
        });
      }
    }

    if (data.birthDate) {
      data.birthDate = data.birthDate;
      if (!validateBirthDate(data.birthDate)) {
        return apiResponse({
          res,
          status: 400,
          success: false,
          message: `Invalid birth date. Valid age is between ${process.env.MIN_AGE} - ${process.env.MAX_AGE}.`,
        });
      }
    }

    if (data.gender) {
      data.gender = data.gender.toUpperCase();
      if (!USER_GENDERS.includes(data.gender)) {
        return apiResponse({
          res,
          status: 400,
          success: false,
          message: `Invalid gender`,
        });
      }
    }

    if (data.location) {
      const { valid, message, location } = await validateAndSetLocation(
        data.location
      );
      if (!valid) {
        return apiResponse({
          res,
          status: 400,
          success: false,
          message,
        });
      }

      data.location = location;
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, data, {
      new: true,
    });
    if (!updatedUser) {
      return apiResponse({
        res,
        status: 400,
        success: false,
        message: "Failed to update user data",
      });
    }

    return apiResponse({
      res,
      status: 200,
      success: true,
      message: "User data updated successfully",
      data: updatedUser,
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
