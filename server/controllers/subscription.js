import Razorpay from 'razorpay';
import crypto from 'crypto';
import Subscription from "../Modals/Subscription.js";
import User from "../Modals/Auth.js";
import { sendSubscriptionEmail } from "../utils/communicationUtils.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription plans configuration
const PLANS = {
  bronze: { 
    name: 'Bronze', 
    price: 10, 
    duration: 30, // 30 days
    watchTimeLimit: 7 // 7 minutes per video
  },
  silver: { 
    name: 'Silver', 
    price: 50, 
    duration: 30, 
    watchTimeLimit: 10 // 10 minutes per video
  },
  gold: { 
    name: 'Gold', 
    price: 100, 
    duration: 30, 
    watchTimeLimit: -1 // unlimited
  }
};

// Create subscription order
export const createSubscriptionOrder = async (req, res) => {
  try {
    console.log('Creating subscription order for user:', req.user._id);
    console.log('Request body:', req.body);
    
    const { plan } = req.body;
    const userId = req.user._id;

    if (!PLANS[plan]) {
      console.log('Invalid plan requested:', plan);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid subscription plan' 
      });
    }

    const planDetails = PLANS[plan];
    const amount = planDetails.price * 100; // Convert to paise

    console.log('Plan details:', planDetails);
    console.log('Amount in paise:', amount);

    // Check if Razorpay is properly initialized
    if (!razorpay) {
      console.error('Razorpay not initialized');
      return res.status(500).json({ 
        success: false, 
        message: 'Payment service not available' 
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        plan: plan
      }
    };

    console.log('Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order);

    // Create subscription record
    const subscription = new Subscription({
      userId,
      plan,
      amount: planDetails.price,
      razorpayOrderId: order.id,
      status: 'created'
    });

    await subscription.save();
    console.log('Subscription record saved:', subscription._id);

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      plan: planDetails,
      subscriptionId: subscription._id
    });
  } catch (error) {
    console.error('Create subscription order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create subscription order',
      error: error.message 
    });
  }
};

// Verify payment and activate subscription
export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      subscriptionId 
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment signature' 
      });
    }

    // Find subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found' 
      });
    }

    // Update subscription with payment details
    const planDetails = PLANS[subscription.plan];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + planDetails.duration);

    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.razorpaySignature = razorpay_signature;
    subscription.status = 'paid';
    subscription.startDate = startDate;
    subscription.endDate = endDate;

    await subscription.save();

    // Update user subscription
    const user = await User.findByIdAndUpdate(subscription.userId, {
      subscriptionPlan: subscription.plan,
      subscriptionExpiry: endDate,
      subscriptionStatus: 'active'
    }, { new: true });

    console.log('User updated:', user.email, 'Plan:', subscription.plan);

    // Send confirmation email with invoice
    try {
      const emailResult = await sendSubscriptionEmail(user.email, {
        userName: user.name,
        plan: planDetails.name,
        amount: subscription.amount,
        invoiceNumber: subscription.invoiceNumber,
        startDate: startDate.toDateString(),
        endDate: endDate.toDateString()
      });
      console.log('Email sending result:', emailResult);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        plan: subscription.plan,
        startDate,
        endDate,
        invoiceNumber: subscription.invoiceNumber
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed' 
    });
  }
};

// Get user subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if subscription is expired
    if (user.subscriptionExpiry && new Date() > user.subscriptionExpiry) {
      await User.findByIdAndUpdate(userId, {
        subscriptionPlan: 'free',
        subscriptionStatus: 'expired'
      });
      user.subscriptionPlan = 'free';
      user.subscriptionStatus = 'expired';
    }

    // Reset monthly watch time if needed (reset every month)
    const now = new Date();
    const lastReset = new Date(user.lastWatchReset);
    const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                      (now.getMonth() - lastReset.getMonth());

    if (monthsDiff >= 1) {
      await User.findByIdAndUpdate(userId, {
        monthlyWatchTime: 0,
        lastWatchReset: now
      });
      user.monthlyWatchTime = 0;
    }

    const planDetails = PLANS[user.subscriptionPlan] || { 
      name: 'Free', 
      watchTimeLimit: 5 // 5 minutes for free plan
    };

    res.status(200).json({
      success: true,
      subscription: {
        plan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        expiry: user.subscriptionExpiry,
        watchTimeLimit: planDetails.watchTimeLimit,
        monthlyWatchTime: user.monthlyWatchTime
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get subscription status' 
    });
  }
};

// Update watch time
export const updateWatchTime = async (req, res) => {
  try {
    const { videoId, watchTime } = req.body; // watchTime in minutes
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get plan limits
    const planDetails = PLANS[user.subscriptionPlan] || { watchTimeLimit: 5 };
    
    // Check if user has reached their limit
    if (planDetails.watchTimeLimit > 0) { // -1 means unlimited
      const newWatchTime = user.monthlyWatchTime + watchTime;
      
      await User.findByIdAndUpdate(userId, {
        monthlyWatchTime: newWatchTime
      });

      res.status(200).json({
        success: true,
        watchTimeUsed: newWatchTime,
        watchTimeLimit: planDetails.watchTimeLimit,
        hasReachedLimit: newWatchTime >= planDetails.watchTimeLimit
      });
    } else {
      // Unlimited plan
      res.status(200).json({
        success: true,
        watchTimeUsed: 0,
        watchTimeLimit: -1,
        hasReachedLimit: false
      });
    }
  } catch (error) {
    console.error('Update watch time error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update watch time' 
    });
  }
};

// Get available plans
export const getPlans = async (req, res) => {
  try {
    const plans = Object.keys(PLANS).map(key => ({
      id: key,
      name: PLANS[key].name,
      price: PLANS[key].price,
      duration: PLANS[key].duration,
      watchTimeLimit: PLANS[key].watchTimeLimit,
      features: [
        `${PLANS[key].watchTimeLimit === -1 ? 'Unlimited' : PLANS[key].watchTimeLimit + ' minutes'} per video`,
        'HD Quality',
        key === 'gold' ? 'Priority Support' : 'Standard Support'
      ]
    }));

    res.status(200).json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get plans' 
    });
  }
};
