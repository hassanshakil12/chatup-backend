import express from "express";

import { createDynamicLimiter } from "../../middlewares/rateLimiters.js";
import userAuth from "../../middlewares/userAuth.js";

import {
  getUserFriendList,
  getBlockedFriends,
  searchFriends,
  sendFriendRequest,
  updateFriendRequest,
  updateFriendSettings,
  removeFriend,
} from "../../controllers/friend/index.js";

const router = express.Router();

router.get(
  "/",
  createDynamicLimiter(1, 50, "Too many requests, please try again later"),
  userAuth,
  getUserFriendList
);
router.get(
  "/blocked",
  createDynamicLimiter(1, 50, "Too many requests, please try again later"),
  userAuth,
  getBlockedFriends
);
router.post(
  "/find",
  createDynamicLimiter(1, 50, "Too many requests, please try again later"),
  userAuth,
  searchFriends
);
router.post(
  "/request/:id",
  createDynamicLimiter(1, 10, "Too many requests, please try again later"),
  userAuth,
  sendFriendRequest
);
router.post(
  "/update-request/:id",
  createDynamicLimiter(1, 10, "Too many requests, please try again later"),
  userAuth,
  updateFriendRequest
);
router.post(
  "/update/:id",
  createDynamicLimiter(1, 20, "Too many requests, please try again later"),
  userAuth,
  updateFriendSettings
);
router.post(
  "/remove/:id",
  createDynamicLimiter(1, 20, "Too many requests, please try again later"),
  userAuth,
  removeFriend
);

export default router;
