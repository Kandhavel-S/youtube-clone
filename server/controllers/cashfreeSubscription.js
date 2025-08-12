import { Cashfree } from 'cashfree-pg';
import crypto from 'crypto';
import Subscription from "../Modals/Subscription.js";
import User from "../Modals/Auth.js";
import { sendSubscriptionEmail } from "../utils/communicationUtils.js";

// Initialize Cashfree
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = process.env.CASHFREE_ENV === 'PROD' 
  ? 'production' 
  : 'sandbox';

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

// Get available subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = Object.keys(PLANS).map(key => ({
      id: key,
      ...PLANS[key],
      features: [
        `${PLANS[key].watchTimeLimit === -1 ? 'Unlimited' : PLANS[key].watchTimeLimit + ' minutes'} per video`,
        'HD Quality streaming',
        'Ad-free experience',
        `${key === 'gold' ? 'Priority' : 'Standard'} support`
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
      message: 'Failed to fetch subscription plans' 
    });
  }
};

// Create subscription order with Cashfree
export const createSubscriptionOrder = async (req, res) => {
  try {
    console.log('Creating Cashfree subscription order for user:', req.user._id);
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
    const orderId = `order_${Date.now()}_${userId}`;

    console.log('Plan details:', planDetails);
    console.log('Order ID:', orderId);

    // Create Cashfree order
    const orderRequest = {
      order_id: orderId,
      order_amount: planDetails.price,
      order_currency: 'INR',
      customer_details: {
        customer_id: userId.toString(),
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: req.user.mobile || '9999999999'
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/success?order_id=${orderId}`
      },
      order_note: `${planDetails.name} Plan Subscription`
    };

    console.log('Creating Cashfree order with request:', orderRequest);
    
    const response = await Cashfree.PGCreateOrder("2023-08-01", orderRequest);
    console.log('Cashfree order created:', response.data);

    // Create subscription record
    const subscription = new Subscription({
      userId,
      plan,
      amount: planDetails.price,
      cashfreeOrderId: orderId,
      status: 'created'
    });

    await subscription.save();
    console.log('Subscription record saved:', subscription._id);

    res.status(201).json({
      success: true,
      order: {
        order_id: orderId,
        payment_session_id: response.data.payment_session_id,
        order_status: response.data.order_status
      },
      plan: planDetails,
      subscriptionId: subscription._id
    });
  } catch (error) {
    console.error('Create Cashfree subscription order error:', error);
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
    console.log('Verifying Cashfree payment:', req.body);
    
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    // Get order details from Cashfree
    const response = await Cashfree.PGOrderFetchOrder("2023-08-01", order_id);
    console.log('Cashfree order details:', response.data);

    if (response.data.order_status !== 'PAID') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment not completed' 
      });
    }

    // Find subscription
    const subscription = await Subscription.findOne({ 
      cashfreeOrderId: order_id 
    });
    
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

    subscription.cashfreePaymentId = response.data.cf_order_id;
    subscription.status = 'paid';
    subscription.startDate = startDate;
    subscription.endDate = endDate;

    await subscription.save();
    console.log('Subscription updated with payment details');

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
    console.error('Cashfree payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: error.message 
    });
  }
};

// Get user subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('subscriptionPlan subscriptionExpiry subscriptionStatus');
    
    if (!user.subscriptionPlan) {
      return res.status(200).json({
        success: true,
        subscription: null
      });
    }

    // Check if subscription is expired
    const now = new Date();
    const isExpired = user.subscriptionExpiry && new Date(user.subscriptionExpiry) < now;
    
    if (isExpired) {
      // Update user subscription status to expired
      await User.findByIdAndUpdate(userId, {
        subscriptionPlan: 'free',
        subscriptionStatus: 'expired'
      });
      
      return res.status(200).json({
        success: true,
        subscription: {
          plan: 'free',
          status: 'expired',
          expiry: null,
          watchTimeLimit: 5,
          monthlyWatchTime: 0
        }
      });
    }

    const planDetails = PLANS[user.subscriptionPlan] || { watchTimeLimit: 5 };
    
    res.status(200).json({
      success: true,
      subscription: {
        plan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        expiry: user.subscriptionExpiry,
        watchTimeLimit: planDetails.watchTimeLimit,
        monthlyWatchTime: user.monthlyWatchTime || 0
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

// Update user's watch time (called when user watches videos)
export const updateWatchTime = async (req, res) => {
  try {
    const { duration } = req.body; // duration in minutes
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update monthly watch time
    const updatedWatchTime = (user.monthlyWatchTime || 0) + duration;
    await User.findByIdAndUpdate(userId, {
      monthlyWatchTime: updatedWatchTime
    });

    res.status(200).json({
      success: true,
      message: 'Watch time updated',
      monthlyWatchTime: updatedWatchTime
    });
  } catch (error) {
    console.error('Update watch time error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update watch time' 
    });
  }
};

// Cashfree webhook handler
export const handleWebhook = async (req, res) => {
  try {
    console.log('Cashfree webhook received:', req.body);
    
    const { type, data } = req.body;
    
    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order } = data;
      
      // Find and update subscription
      const subscription = await Subscription.findOne({ 
        cashfreeOrderId: order.order_id 
      });
      
      if (subscription && subscription.status !== 'paid') {
        // Activate subscription (similar to verifyPayment logic)
        const planDetails = PLANS[subscription.plan];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + planDetails.duration);

        subscription.status = 'paid';
        subscription.startDate = startDate;
        subscription.endDate = endDate;
        await subscription.save();

        // Update user
        await User.findByIdAndUpdate(subscription.userId, {
          subscriptionPlan: subscription.plan,
          subscriptionExpiry: endDate,
          subscriptionStatus: 'active'
        });

        console.log('Subscription activated via webhook:', subscription._id);
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
