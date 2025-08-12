import express from "express";
import {
  subscribeToChannel,
  unsubscribeFromChannel,
  checkSubscriptionStatus,
  getChannelSubscriberCount,
  getUserSubscriptions
} from "../controllers/channelSubscription.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Subscribe to a channel
router.post("/subscribe", auth, subscribeToChannel);

// Unsubscribe from a channel
router.delete("/unsubscribe/:channelId", auth, unsubscribeFromChannel);

// Check subscription status
router.get("/status/:channelId", auth, checkSubscriptionStatus);

// Get channel subscriber count
router.get("/count/:channelId", getChannelSubscriberCount);

// Get user's subscriptions
router.get("/user-subscriptions", auth, getUserSubscriptions);

export default router;
