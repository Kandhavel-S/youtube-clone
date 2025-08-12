import express from "express";
import {
  createSubscriptionOrder,
  verifyPayment,
  getSubscriptionStatus,
  updateWatchTime,
  getPlans
} from "../controllers/subscription.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get available plans (public route)
router.get("/plans", getPlans);

// Protected routes
router.post("/create-order", auth, createSubscriptionOrder);
router.post("/verify-payment", auth, verifyPayment);
router.get("/status", auth, getSubscriptionStatus);
router.post("/watch-time", auth, updateWatchTime);

export default router;
