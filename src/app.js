import express from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors';
import { ApiError } from './utils/ApiError.js';
const app=express();
app.use(cors({
    origin:['https://stream-hub-frontend.vercel.app','http://localhost:5173'],
    credentials:true
}));
// http://localhost:5173
//https://stream-hub-frontend.vercel.app
app.use(express.json({limit:"16Kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static('public'));
app.use(cookieParser());

//routes
import userRouter from './routes/user.routes.js'
import vidioRouter from './routes/vidio.routes.js'
import likeRouter from './routes/like.routes.js'
import commentRouter from './routes/comment.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import healthcheckRouter from './routes/healthcheck.routes.js'
app.use("/api/v1/users",userRouter);
app.use("/api/v1/vidios",vidioRouter);
app.use("/api/v1/likes",likeRouter);
app.use("/api/v1/subscriptions",subscriptionRouter);
app.use("/api/v1/comments",commentRouter);
app.use("/api/v1/tweets",tweetRouter);
app.use("/api/v1/playlist",playlistRouter);
app.use("/api/v1/dashboard",dashboardRouter);
app.use("/api/v1/healthcheck",healthcheckRouter);

// Global error handler - must be after all routes
app.use((err, req, res, next) => {
    // If it's an ApiError, use its properties
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            data: err.data,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    // For other errors, return a generic 500 error
    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: [],
        data: null,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

export {app};