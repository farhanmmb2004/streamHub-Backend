import express from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors';
const app=express();
app.use(cors({
    origin:'*'
}));
app.use(express.json({limit:"16Kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static('public'));
app.use(cookieParser());

//routes
import userRouter from './routes/user.routes.js'
import vidioRouter from './routes/vidio.routes.js'
import likeRouter from './routes/like.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
app.use("/api/v1/users",userRouter);
app.use("/api/v1/vidios",vidioRouter);
app.use("/api/v1/likes",likeRouter);
app.use("/api/v1/subscriptions",subscriptionRouter);
export {app};