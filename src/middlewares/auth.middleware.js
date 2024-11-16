import { ApiError } from "../utils/ApiError";
import { asyncHandler} from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
export const verifyToken=asyncHandler(async(req,res,next)=>{
    try {
        const token=req.cookie?.accessToken||req.header("Authorization")?.replace("Bearer ","");
    if(!token){
        throw new ApiError(401,"unAuthorized request");
    }
    const decodedToken=jwt.verify(token,"danish-bhai-jinda-hote-na");
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
    if(!user){
    throw new ApiError(401,"INvalid Access Token");
    }
    req.user=user;
    next();
    } catch (error) {
        throw new ApiError(401,error?.messege||"Invalid access token");
    }
})