import express from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors';
const app=express();
app.use(cors({
    origin:'*'
}));
app.use(express.json({limit:"16Kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
export {app};