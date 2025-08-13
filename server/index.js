import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import grouproutes from "./routes/group.js";
import channelSubscriptionroutes from "./routes/channelSubscription.js";
import subscriptionroutes from "./routes/subscription.js";
dotenv.config();
const app = express();
import path from "path";

// Trust proxy for getting real IP addresses
app.set('trust proxy', true);

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.vercel.app', // Replace with your actual frontend URL
    'https://youtube-clone-frontend.vercel.app' // Add your deployed frontend URL here
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join("uploads")));
app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/group", grouproutes);
app.use("/channel-subscription", channelSubscriptionroutes);
app.use("/subscription", subscriptionroutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;
mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((error) => {
    console.log(error);
  });
