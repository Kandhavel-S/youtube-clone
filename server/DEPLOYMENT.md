# YouTube Clone Backend - Render Deployment

## 🚀 Deployment Steps

### 1. Prepare Your Repository
- Make sure your code is pushed to GitHub
- Ensure all dependencies are listed in package.json
- Environment variables are documented in .env.example

### 2. Deploy to Render

1. **Sign up/Login to Render**: Go to [render.com](https://render.com)
2. **Connect GitHub**: Link your GitHub account
3. **Create New Web Service**: Click "New" → "Web Service"
4. **Select Repository**: Choose your YouTube Clone repository
5. **Configure Service**:
   - Name: `youtube-clone-backend`
   - Environment: `Node`
   - Region: `Oregon` (or your preference)
   - Branch: `main` (or your default branch)
   - Build Command: `npm install`
   - Start Command: `npm start`

### 3. Environment Variables

Set these environment variables in Render Dashboard:

#### Required Variables:
```bash
NODE_ENV=production
PORT=10000
DB_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
```

#### Email Configuration:
```bash
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

#### Payment Gateway:
```bash
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

#### Optional (Twilio SMS):
```bash
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

#### Firebase:
```bash
FIREBASE_API_KEY=your_firebase_api_key
```

### 4. MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (free tier available)
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get connection string and add to `DB_URL`

### 5. Update Frontend

Once deployed, update your frontend's environment variables:
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-name.onrender.com
```

### 6. Testing

Your backend will be available at:
```
https://your-service-name.onrender.com
```

Test endpoints:
- Health check: `GET /`
- Plans: `GET /subscription/plans`

### 📝 Important Notes

- Render free tier sleeps after 15 minutes of inactivity
- First request after sleep may take 30+ seconds (cold start)
- Consider upgrading to paid tier for production use
- Set up proper CORS origins for security
- Use strong JWT secrets (32+ characters)
- Enable MongoDB IP whitelisting for security

### 🔧 Troubleshooting

1. **Build Fails**: Check Node.js version compatibility
2. **Cannot Connect to DB**: Verify MongoDB connection string
3. **CORS Errors**: Update CORS origins in index.js
4. **Environment Variables**: Double-check all required vars are set

### 📞 Support

If you encounter issues, check:
- Render logs in dashboard
- MongoDB Atlas logs
- Network connectivity
- Environment variable spelling
