import mongoose from "mongoose";

const channelSubscriptionSchema = mongoose.Schema({
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  channelId: {
    type: String, // Channel name/ID
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only subscribe to a channel once
channelSubscriptionSchema.index({ subscriberId: 1, channelId: 1 }, { unique: true });

export default mongoose.model("ChannelSubscription", channelSubscriptionSchema);
