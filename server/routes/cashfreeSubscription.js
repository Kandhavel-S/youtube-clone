import express from "express";
import { 
  getSubscriptionPlans, 
  createSubscriptionOrder, 
  verifyPayment, 
  getSubscriptionStatus, 
  updateWatchTime,
  handleWebhook
} from "../controllers/cashfreeSubscription.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get available subscription plans
router.get("/plans", getSubscriptionPlans);

// Protected routes (require authentication)
router.post("/create-order", auth, createSubscriptionOrder);
router.post("/verify-payment", auth, verifyPayment);
router.get("/status", auth, getSubscriptionStatus);
router.post("/update-watch-time", auth, updateWatchTime);

// Webhook route (no auth required)
router.post("/webhook", handleWebhook);

export default router;
