import mongoose from "mongoose";

const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },
  // Location and login preferences
  location: {
    state: { type: String },
    country: { type: String, default: 'India' },
    timezone: { type: String }
  },
  loginPreferences: {
    otpMethod: { type: String, enum: ['email', 'mobile'], default: 'email' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  // Contact info for OTP
  mobile: { type: String },
  // Subscription information
  subscriptionPlan: { 
    type: String, 
    enum: ['free', 'bronze', 'silver', 'gold'], 
    default: 'free' 
  },
  subscriptionExpiry: { type: Date },
  subscriptionStatus: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled'], 
    default: 'active' 
  },
  // Video watch time tracking
  monthlyWatchTime: { type: Number, default: 0 }, // in minutes
  lastWatchReset: { type: Date, default: Date.now },
  // Groups functionality
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  groupsCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
});

export default mongoose.model("user", userschema);
