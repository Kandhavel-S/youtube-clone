# YouTube Clone Deployment Guide

## Frontend (Already Deployed)
✅ **Live URL**: https://yourtube-a8hdpmdtq-kandhavel-s-projects.vercel.app

## Backend Deployment on Render

### 1. Setup Render Account
- Go to [render.com](https://render.com)
- Sign up/Login with GitHub

### 2. Create Web Service
- Click "New" → "Web Service"
- Connect your GitHub account
- Select `youtube-clone` repository
- Choose `server` folder as root directory

### 3. Service Configuration
- **Name**: `youtube-backend`
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### 4. Environment Variables
Add these environment variables in Render dashboard:

```env
# Database
DB_URL=your_mongodb_connection_string

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Email
EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password

# JWT
JWT_SECRET=your_jwt_secret_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Firebase
FIREBASE_API_KEY=your_firebase_api_key

# Cashfree
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=sandbox

# Server
NODE_ENV=production
PORT=10000
```

### 5. Deploy
- Click "Create Web Service"
- Wait for deployment to complete
- Your backend will be available at: `https://your-service-name.onrender.com`

### 6. Update Frontend Environment
After backend deployment, update frontend environment variables:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com
```

## Features Included

### ✅ Complete YouTube Clone Features
- User Authentication (JWT + Firebase)
- Video Upload & Streaming
- Comments System
- Like/Dislike System
- Watch Later & History
- Search Functionality

### ✅ Subscription System
- **Bronze Plan**: ₹99/month - 720p quality + ads
- **Silver Plan**: ₹199/month - 1080p quality + limited ads
- **Gold Plan**: ₹299/month - 4K quality + no ads
- Dual Payment Gateway: Razorpay & Cashfree

### ✅ Location-Based Features
- **OTP Verification**: 
  - Southern Indian states → Email OTP
  - Other states → SMS OTP
- **Dynamic Theming**: Location-based UI themes

### ✅ Groups Feature
- Create & Join Groups
- Group Video Sharing
- Group Discussions

### ✅ Technical Stack
- **Backend**: Node.js, Express, MongoDB, JWT
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Payment**: Razorpay + Cashfree
- **SMS**: Twilio
- **Email**: Nodemailer
- **Storage**: Multer for video files

## Cashfree Business Verification

### Required Documents
1. **PAN Card** (Business/Individual)
2. **Bank Account Details** 
3. **GST Certificate** (if applicable)
4. **Business License** (if applicable)
5. **Address Proof**

### Integration Benefits
- Lower transaction fees (1.75% vs Razorpay's 2%)
- Better success rates
- Advanced fraud protection
- Real-time settlements

## Support

For deployment issues or questions:
1. Check Render logs for errors
2. Verify all environment variables
3. Ensure MongoDB connection is working
4. Test API endpoints after deployment

## Live Application
- **Frontend**: https://yourtube-a8hdpmdtq-kandhavel-s-projects.vercel.app
- **Backend**: Will be available after Render deployment
