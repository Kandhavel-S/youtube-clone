import ChannelSubscription from "../Modals/ChannelSubscription.js";

// Subscribe to a channel
export const subscribeToChannel = async (req, res) => {
  try {
    const { channelId, channelName } = req.body;
    const subscriberId = req.user._id;

    // Check if already subscribed
    const existingSubscription = await ChannelSubscription.findOne({
      subscriberId,
      channelId
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "Already subscribed to this channel"
      });
    }

    // Create new subscription
    const subscription = new ChannelSubscription({
      subscriberId,
      channelId,
      channelName
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      message: "Successfully subscribed to channel",
      subscription
    });
  } catch (error) {
    console.error("Subscribe to channel error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to subscribe to channel"
    });
  }
};

// Unsubscribe from a channel
export const unsubscribeFromChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    const subscription = await ChannelSubscription.findOneAndDelete({
      subscriberId,
      channelId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully unsubscribed from channel"
    });
  } catch (error) {
    console.error("Unsubscribe from channel error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unsubscribe from channel"
    });
  }
};

// Check if user is subscribed to a channel
export const checkSubscriptionStatus = async (req, res) => {
  try {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    const subscription = await ChannelSubscription.findOne({
      subscriberId,
      channelId
    });

    res.status(200).json({
      success: true,
      isSubscribed: !!subscription
    });
  } catch (error) {
    console.error("Check subscription status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check subscription status"
    });
  }
};

// Get channel subscriber count
export const getChannelSubscriberCount = async (req, res) => {
  try {
    const { channelId } = req.params;

    const count = await ChannelSubscription.countDocuments({ channelId });

    res.status(200).json({
      success: true,
      subscriberCount: count
    });
  } catch (error) {
    console.error("Get subscriber count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get subscriber count"
    });
  }
};

// Get user's subscriptions
export const getUserSubscriptions = async (req, res) => {
  try {
    const subscriberId = req.user._id;

    const subscriptions = await ChannelSubscription.find({ subscriberId })
      .sort({ subscribedAt: -1 });

    res.status(200).json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error("Get user subscriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user subscriptions"
    });
  }
};
