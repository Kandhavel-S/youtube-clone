import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Twilio setup - lazy initialization
let twilioClient = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio credentials not found. SMS functionality will be disabled.');
      return null;
    }
    try {
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error.message);
      return null;
    }
  }
  return twilioClient;
};

// Send OTP via email
export const sendEmailOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'YouTube Clone - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff0000;">YouTube Clone</h2>
          <p>Your OTP for login verification is:</p>
          <h1 style="background-color: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent to email' };
  } catch (error) {
    console.error('Email OTP error:', error);
    return { success: false, message: 'Failed to send email OTP' };
  }
};

// Send OTP via SMS
export const sendSMSOTP = async (mobile, otp) => {
  try {
    const client = getTwilioClient();
    if (!client) {
      return { success: false, message: 'SMS service not available - Twilio not configured' };
    }

    const message = await client.messages.create({
      body: `Your YouTube Clone login OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile
    });

    return { success: true, message: 'OTP sent to mobile', messageId: message.sid };
  } catch (error) {
    console.error('SMS OTP error:', error);
    return { success: false, message: 'Failed to send SMS OTP' };
  }
};

// Determine location-based preferences
export const getLocationPreferences = (state) => {
  const southernStates = ['tamil nadu', 'kerala', 'karnataka', 'andhra pradesh', 'telangana'];
  const isSouthern = southernStates.includes(state?.toLowerCase());
  
  return {
    otpMethod: isSouthern ? 'email' : 'mobile', // Email for Southern states, SMS for others
    isSouthernState: isSouthern
  };
};

// Determine theme based on time and location
export const getThemePreference = (state) => {
  const currentHour = new Date().getHours();
  const southernStates = ['tamil nadu', 'kerala', 'karnataka', 'andhra pradesh', 'telangana'];
  const isSouthern = southernStates.includes(state?.toLowerCase());
  
  // White theme: 10 AM to 12 PM AND Southern states
  // Dark theme: Other times OR Other states
  if (currentHour >= 10 && currentHour < 12 && isSouthern) {
    return 'light';
  } else {
    return 'dark';
  }
};

// Send subscription confirmation email with invoice
export const sendSubscriptionEmail = async (email, subscriptionData) => {
  try {
    console.log('Sending subscription email to:', email);
    console.log('Subscription data:', subscriptionData);
    
    const { userName, plan, amount, invoiceNumber, startDate, endDate } = subscriptionData;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'YouTube Clone - Subscription Activated & Invoice',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ff0000; margin: 0;">YouTube Clone</h1>
            <h2 style="color: #333; margin: 10px 0;">Subscription Activated!</h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Dear ${userName},</strong></p>
            <p style="margin: 10px 0;">Thank you for upgrading to our ${plan} plan! Your subscription has been successfully activated.</p>
          </div>
          
          <div style="border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #28a745; margin-top: 0;">Invoice Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Invoice Number:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Plan:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${plan} Plan</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Amount Paid:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">₹${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Start Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${startDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>End Date:</strong></td>
                <td style="padding: 8px 0;">${endDate}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #1976d2; margin-top: 0;">What's Included in Your ${plan} Plan:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${plan === 'Bronze' ? '<li>Watch videos up to 7 minutes</li>' : ''}
              ${plan === 'Silver' ? '<li>Watch videos up to 10 minutes</li>' : ''}
              ${plan === 'Gold' ? '<li>Unlimited video watching</li>' : ''}
              <li>HD Quality streaming</li>
              <li>${plan === 'Gold' ? 'Priority' : 'Standard'} customer support</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              Thank you for choosing YouTube Clone!<br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    console.log('Sending email with options:', { from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject });
    await transporter.sendMail(mailOptions);
    console.log(`Subscription email sent successfully to ${email} for ${plan} plan`);
    return { success: true, message: 'Subscription email sent' };
  } catch (error) {
    console.error('Subscription email error:', error);
    return { success: false, message: 'Failed to send subscription email' };
  }
};
