import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import jwt from "jsonwebtoken";
import geoip from 'geoip-lite';
import { 
  sendEmailOTP, 
  sendSMSOTP, 
  getLocationPreferences, 
  getThemePreference 
} from "../utils/communicationUtils.js";

// Store OTPs temporarily (in production, use Redis)
const otpStorage = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

export const login = async (req, res) => {
  const { email, name, image } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  try {
    // Get location from IP
    const geo = geoip.lookup(clientIP);
    const state = geo ? geo.region : null;
    const country = geo ? geo.country : 'IN';

    // Determine preferences based on location
    const locationPrefs = getLocationPreferences(state);
    const themePreference = getThemePreference(state);

    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      // Create new user with location preferences
      const newUser = await users.create({ 
        email, 
        name, 
        image,
        location: {
          state,
          country,
          timezone: geo ? geo.timezone : 'Asia/Kolkata'
        },
        loginPreferences: {
          otpMethod: locationPrefs.otpMethod,
          theme: themePreference
        }
      });

      // For new users, generate token directly (skip OTP for first login)
      const token = generateToken(newUser._id);
      
      return res.status(201).json({ 
        result: newUser, 
        token,
        theme: themePreference,
        message: "User created and logged in successfully" 
      });

      // Generate and send OTP
      const otp = generateOTP();
      otpStorage.set(email, { otp, timestamp: Date.now(), verified: false });

      if (locationPrefs.otpMethod === 'email') {
        await sendEmailOTP(email, otp);
        return res.status(201).json({ 
          result: newUser, 
          requiresOTP: true, 
          otpMethod: 'email',
          theme: themePreference,
          message: 'OTP sent to your email' 
        });
      } else {
        // For SMS, we need mobile number
        return res.status(201).json({ 
          result: newUser, 
          requiresOTP: true, 
          otpMethod: 'mobile',
          theme: themePreference,
          message: 'Please provide mobile number for OTP verification' 
        });
      }
    } else {
      // Update existing user's location and preferences
      const updatedPrefs = {
        'location.state': state,
        'location.country': country,
        'loginPreferences.theme': themePreference
      };

      // Only update OTP method if user is from different region
      if (existingUser.location?.state !== state) {
        updatedPrefs['loginPreferences.otpMethod'] = locationPrefs.otpMethod;
      }

      await users.findByIdAndUpdate(existingUser._id, { $set: updatedPrefs });

      // Generate and send OTP
      const otp = generateOTP();
      otpStorage.set(email, { otp, timestamp: Date.now(), verified: false });

      const otpMethod = existingUser.loginPreferences?.otpMethod || locationPrefs.otpMethod;

      // For testing purposes, also return token for immediate access
      // In production, remove this and only return token after OTP verification
      const token = generateToken(existingUser._id);

      if (otpMethod === 'email') {
        await sendEmailOTP(email, otp);
        return res.status(200).json({ 
          result: existingUser, 
          token, // Include token for testing
          requiresOTP: true, 
          otpMethod: 'email',
          theme: themePreference,
          message: 'OTP sent to your email' 
        });
      } else {
        if (existingUser.mobile) {
          await sendSMSOTP(existingUser.mobile, otp);
          return res.status(200).json({ 
            result: existingUser, 
            token, // Include token for testing
            requiresOTP: true, 
            otpMethod: 'mobile',
            theme: themePreference,
            message: 'OTP sent to your mobile' 
          });
        } else {
          return res.status(200).json({ 
            result: existingUser, 
            token, // Include token for testing
            requiresOTP: true, 
            otpMethod: 'mobile',
            theme: themePreference,
            message: 'Please provide mobile number for OTP verification' 
          });
        }
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp, mobile } = req.body;

  try {
    const storedOTPData = otpStorage.get(email);
    
    if (!storedOTPData) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    // Check if OTP is expired (10 minutes)
    if (Date.now() - storedOTPData.timestamp > 10 * 60 * 1000) {
      otpStorage.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    if (storedOTPData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark as verified
    storedOTPData.verified = true;
    otpStorage.set(email, storedOTPData);

    // Update user mobile if provided
    const updateData = {};
    if (mobile) {
      updateData.mobile = mobile;
    }

    const user = await users.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true }
    );

    // Clean up OTP
    otpStorage.delete(email);

    // Generate JWT token
    const token = generateToken(user._id);

    return res.status(200).json({ 
      success: true, 
      message: "OTP verified successfully",
      result: user,
      token
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  const { email, otpMethod, mobile } = req.body;

  try {
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    otpStorage.set(email, { otp, timestamp: Date.now(), verified: false });

    if (otpMethod === 'email') {
      await sendEmailOTP(email, otp);
      return res.status(200).json({ 
        success: true, 
        message: "OTP sent to your email" 
      });
    } else if (otpMethod === 'mobile') {
      const mobileNumber = mobile || user.mobile;
      if (!mobileNumber) {
        return res.status(400).json({ message: "Mobile number required" });
      }
      await sendSMSOTP(mobileNumber, otp);
      return res.status(200).json({ 
        success: true, 
        message: "OTP sent to your mobile" 
      });
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description, mobile } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updateData = {
      channelname: channelname,
      description: description,
    };

    if (mobile) {
      updateData.mobile = mobile;
    }

    const updatedata = await users.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
