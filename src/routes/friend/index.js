import express from "express";

import { createDynamicLimiter } from "../../middlewares/rateLimiters.js";
import userAuth from "../../middlewares/userAuth.js";

import {
  getUserFriendList,
  getBlockedFriends,
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

export default router;
